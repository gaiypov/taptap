// ============================================
// 360⁰ Marketplace - Rate Limiting Middleware
// Production Ready for Kyrgyzstan Launch
// ============================================

import rateLimit from 'express-rate-limit';

// ============================================
// RATE LIMITERS
// ============================================

// Auth rate limiter (stricter for SMS)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    details: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Default rate limiter
export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    details: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Analysis rate limiter (for AI/video processing)
export const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 analysis requests per hour
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    details: 'Too many analysis requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    details: 'Too many uploads, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Chat rate limiter
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    details: 'Too many messages, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// ============================================
// CUSTOM RATE LIMITER CREATOR
// ============================================

export function createRateLimiter(
  windowMs: number,
  max: number | ((req: any) => number),
  message: string,
  keyGenerator?: (req: any) => string
) {
  return rateLimit({
    windowMs,
    max: typeof max === 'function' ? max : max,
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      details: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skip: (req) => {
      // Skip rate limiting in development
      return process.env.NODE_ENV === 'development';
    }
  });
}
