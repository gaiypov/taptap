// ============================================
// 360⁰ Marketplace - Error Handler Middleware
// Production Ready for Kyrgyzstan Launch
// ============================================

import { NextFunction, Request, Response } from 'express';

export class CustomError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', true);
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true);
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, originalError?: any) {
    super(message, 500, 'DATABASE_ERROR', true, originalError);
  }
}

export class ExternalServiceError extends CustomError {
  constructor(service: string, message: string, originalError?: any) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, originalError);
  }
}

// ============================================
// ASYNC HANDLER WRAPPER
// ============================================

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================
// ERROR HANDLER MIDDLEWARE
// ============================================

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle known error types
  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.code,
      details: error.details
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      details: 'Token is invalid'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_EXPIRED',
      details: 'Token has expired'
    });
  }

  // Handle database errors
  if (error.name === 'PostgresError') {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      details: 'Database operation failed'
    });
  }

  // Handle rate limit errors
  if (error.message.includes('Too Many Requests')) {
    return res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      details: 'Too many requests, please try again later'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    details: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message
  });
}

// ============================================
// NOT FOUND HANDLER
// ============================================

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    details: `Route ${req.method} ${req.path} not found`
  });
}

// ============================================
// AUDIT LOGGING
// ============================================

export function auditLog(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any
) {
  console.log('AUDIT:', {
    userId,
    action,
    resourceType,
    resourceId,
    details,
    timestamp: new Date().toISOString()
  });
}
