// ============================================
// 360⁰ Marketplace - Main Server
// Production Ready for Kyrgyzstan Launch
// ============================================

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { defaultLimiter } from './middleware/rateLimit';

// Import API routes
import authRoutes from './api/v1/auth';
import businessRoutes from './api/v1/business';
import chatRoutes from './api/v1/chat';
import listingsRoutes from './api/v1/listings';
import moderationRoutes from './api/v1/moderation';
import promoteRoutes from './api/v1/promote';
import videoSlideshowRoutes from './api/v1/video-slideshow';

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

const requiredEnvVars = [
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// ============================================
// CREATE EXPRESS APP
// ============================================

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req: any, res, next) => {
  (req as any).id = Math.random().toString(36).substr(2, 9);
  next();
});

// Request logging
app.use((req: any, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${(req as any).method} ${(req as any).path} - ${res.statusCode} - ${duration}ms - ${(req as any).ip}`);
  });
  
  next();
});

// ============================================
// RATE LIMITING
// ============================================

// Apply default rate limiting to all routes
app.use(defaultLimiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    }
  });
});

// ============================================
// API ROUTES
// ============================================

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingsRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/promote', promoteRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/video', videoSlideshowRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🚀 360⁰ Marketplace API Server Started');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔒 Security: Enabled`);
  console.log(`📊 Rate Limiting: Enabled`);
  console.log(`🗄️ Database: Supabase`);
  console.log(`📱 Market: Kyrgyzstan`);
  console.log(`🏷️ Categories: Cars, Horses, Real Estate`);
  console.log('=====================================');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
