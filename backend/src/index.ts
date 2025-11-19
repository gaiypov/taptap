// ============================================
// 360⁰ Marketplace - Main Server (v1.0.0)
// Production Ready — Kyrgyzstan Launch 2025
// ============================================

/// <reference path="../types/express.d.ts" />

// Загружаем переменные окружения ПЕРВЫМ делом (ДО всех импортов!)
import { config } from 'dotenv';

import compression from 'compression';
import cors from 'cors';
import { randomUUID } from 'crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { createServer, type Server } from 'http';

// Middleware & handlers
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { defaultLimiter } from './middleware/rateLimit';

// API Routes
import authRoutes from './api/v1/auth';
// import businessRoutes from './api/v1/business'; // Временно отключено
// import chatRoutes from './api/v1/chat'; // Временно отключено
// import listingsRoutes from './api/v1/listings'; // Временно отключено
// import moderationRoutes from './api/v1/moderation'; // Временно отключено
// import promoteRoutes from './api/v1/promote'; // Временно отключено

// Legacy routes for backward compatibility
import legacyAuthRoutes from '../api/auth';
import videoRoutes from '../api/video';
config();

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

const requiredEnvVars = [
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  // 'SUPABASE_ANON_KEY', // Опционально, можно использовать из app.json
] as const;

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value) {
    console.error(`❌ Missing environment variable: ${envVar}`);
    console.error(`   Please set a valid value in backend/.env`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn(`   ⚠️  Continuing in development mode, but some features may not work`);
    }
  }
}

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
const server: Server = createServer(app);

// Важно: доверяем прокси (Cloudflare, Nginx, Traefik и т.д.)
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // React/Next/Vite требуют
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS с защитой от пробелов и пустых значений
const rawOrigins = process.env.ALLOWED_ORIGINS;
const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:8080'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID + продвинутое логирование
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.id = randomUUID();
  const start = Date.now();
  
  _res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = _res;
    console.log(`${req.id?.slice(0, 8)} | ${method} ${originalUrl} | ${statusCode} | ${duration}ms | ${ip}`);
  });
  
  next();
});

// ============================================
// HEALTH CHECK (до rate-limiter'а!)
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      commit: process.env.GIT_COMMIT || 'local',
    },
  });
});

// ============================================
// RATE LIMITING (после health)
// ============================================

app.use(defaultLimiter);

// ============================================
// API ROUTES v1
// ============================================

app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/listings', listingsRoutes); // Временно отключено
// app.use('/api/v1/business', businessRoutes); // Временно отключено
// app.use('/api/v1/chat', chatRoutes); // Временно отключено
// app.use('/api/v1/promote', promoteRoutes); // Временно отключено
// app.use('/api/v1/moderation', moderationRoutes); // Временно отключено

// Legacy routes for backward compatibility
app.use('/api/auth', legacyAuthRoutes);
app.use('/api/video', videoRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use('*', notFoundHandler);
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, () => {
  console.log('🚀 360⁰ Marketplace API Server Started');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Listening on port: ${PORT}`);
  console.log(`🔒 Security: Helmet + CORS + Rate Limit`);
  console.log(`🗄️ Database: Supabase`);
  console.log(`📱 Market: Kyrgyzstan Launch Ready`);
  console.log('=====================================');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 ${signal} received — starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed successfully');
    process.exit(0);
  });
  
  // Принудительный выход через 10 сек, если висит
  setTimeout(() => {
    console.error('⏰ Force shutdown after 10s');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Глобальные краши
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

export default app;
