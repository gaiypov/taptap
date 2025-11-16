// backend/server.ts
import compression from 'compression';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';
import express from 'express';
import rateLimitMiddleware from 'express-rate-limit';
import helmet from 'helmet';
import analyzeRoutes from './api/analyze.js';
import authRoutes from './api/auth.js';
import businessRoutes from './api/business.js';
import chatRoutes from './api/chat.js';
import consentRoutes from './api/consents.js';
import listingsRoutes from './api/listings.js';
import promotionRoutes from './api/promotions.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Загружаем переменные окружения
config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'your-secret-key') {
  throw new Error('JWT_SECRET must be configured with a secure value');
}

const app = express();
const PORT = process.env.PORT || 3001;

// ==============================================
// MIDDLEWARE
// ==============================================

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Безопасность
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, origin ?? allowedOrigins[0]);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    credentials: true,
  })
);

// Парсинг JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// Request ID
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  res.setHeader('x-request-id', requestId);
  (req as express.Request & { requestId?: string }).requestId = requestId;
  res.locals.requestId = requestId;
  next();
});

// Rate limiting
const limiter = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP за 15 минут
  message: {
    success: false,
      error: 'Слишком много запросов с этого IP, попробуйте позже',
      code: 'RATE_LIMIT_EXCEEDED'
    }
});
app.use('/api/', limiter);

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${(req as any).requestId}] ${req.method} ${req.path}`);
  next();
});

// ==============================================
// ROUTES
// ==============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Analysis API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api', analyzeRoutes);

// ==============================================
// ERROR HANDLING
// ==============================================

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==============================================
// SERVER START
// ==============================================

app.listen(PORT, () => {
  console.log(`🚀 AI Analysis API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
