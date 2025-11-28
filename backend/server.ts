// backend/server.ts — ФИНАЛЬНЫЙ ПРОДАКШЕН-СЕРВЕР 360AutoMVP 2025

import 'dotenv/config'; // ← ЭТО ВАЖНО! Загружаем .env ПЕРВЫМ делом

import compression from 'compression';
import cors from 'cors';
import { randomUUID } from 'crypto';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { createServer } from 'http';

import { errorHandler, notFoundHandler } from './src/middleware/errorHandler';
import { defaultLimiter } from './src/middleware/rateLimit';

import authRoutes from './src/api/v1/auth';
import videoRoutes from './api/video';
import videoYandexRoutes from './api/video-yandex';
import legacyAuthRoutes from './api/auth';
import smsRoutes from './api/sms';
import listingsRoutes from './api/listings';
import { startBackupScheduler } from './services/backup/backupScheduler';

const app = express();
const server = createServer(app);

// === 1. TRUST PROXY (обязательно для Cloudflare!) ===
app.set('trust proxy', 1);

// === 2. SECURITY ===
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://*.supabase.co',
          'wss://*.supabase.co',
          'https://api.360auto.kg',
        ],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// === 3. CORS ===
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8081'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

// === 4. MIDDLEWARE ===
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.id = randomUUID();
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.id?.slice(0, 8) || 'unknown'}] ${req.method} ${req.originalUrl} → ${_res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// === 5. ROUTES ===
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

app.use(defaultLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/video', videoRoutes); // Legacy api.video (for migration period)
app.use('/api/video-yandex', videoYandexRoutes); // New Yandex Cloud Video
app.use('/api/auth', legacyAuthRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/listings', listingsRoutes); // Listing CRUD operations

// === 6. ERROR HANDLING ===
app.use('*', notFoundHandler);
app.use(errorHandler);

// === 7. START ===
const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 360AutoMVP API Server STARTED');
  console.log(`🌍 Port: ${PORT}`);
  console.log(`🔒 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Market: Kyrgyzstan 2025`);
  console.log('=====================================');
  
  // Start backup scheduler in production
  if (process.env.NODE_ENV === 'production') {
    try {
      startBackupScheduler();
      console.log('✅ Backup scheduler started');
    } catch (error) {
      console.error('⚠️ Failed to start backup scheduler:', error);
    }
  }
});

// === 8. GRACEFUL SHUTDOWN ===
const shutdown = (signal: string) => {
  console.log(`\n🛑 ${signal} — shutting down...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⏰ Force exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});
