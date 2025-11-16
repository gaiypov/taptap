// backend/middleware/errorHandler.ts
import { PostgrestError } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

// ============================================
// ERROR TYPES
// ============================================

export interface AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
  details?: any;
}

export class CustomError extends Error implements AppError {
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

// ============================================
// SPECIFIC ERROR CLASSES
// ============================================

export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', true, details);
  }
}

export class ExternalServiceError extends CustomError {
  constructor(service: string, message: string, details?: any) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, details);
  }
}

// ============================================
// ERROR HANDLING FUNCTIONS
// ============================================

export function handleZodError(error: ZodError): AppError {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new ValidationError('Validation failed', details);
}

export function handleSupabaseError(error: PostgrestError): AppError {
  switch (error.code) {
    case '23505': // Unique constraint violation
      return new ConflictError('Resource already exists');
    case '23503': // Foreign key constraint violation
      return new ValidationError('Referenced resource does not exist');
    case '23502': // Not null constraint violation
      return new ValidationError('Required field is missing');
    case '42501': // Insufficient privilege
      return new AuthorizationError('Insufficient database privileges');
    case '42P01': // Undefined table
      return new DatabaseError('Database table not found');
    default:
      return new DatabaseError(`Database error: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
  }
}

export function handleJWTError(error: Error): AppError {
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token has expired');
  }
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }
  
  return new AuthenticationError('Token validation failed');
}

export function handleMulterError(error: any): AppError {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ValidationError('File size too large');
    case 'LIMIT_FILE_COUNT':
      return new ValidationError('Too many files');
    case 'LIMIT_UNEXPECTED_FILE':
      return new ValidationError('Unexpected file field');
    case 'LIMIT_PART_COUNT':
      return new ValidationError('Too many parts');
    case 'LIMIT_FIELD_KEY':
      return new ValidationError('Field name too long');
    case 'LIMIT_FIELD_VALUE':
      return new ValidationError('Field value too long');
    case 'LIMIT_FIELD_COUNT':
      return new ValidationError('Too many fields');
    default:
      return new ValidationError('File upload error');
  }
}

// ============================================
// MAIN ERROR HANDLER MIDDLEWARE
// ============================================

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let appError: AppError;

  // Convert known error types to AppError
  if (error instanceof CustomError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else if (error.name === 'PostgrestError') {
    appError = handleSupabaseError(error as any);
  } else if (error.name === 'JsonWebTokenError' || 
             error.name === 'TokenExpiredError' || 
             error.name === 'NotBeforeError') {
    appError = handleJWTError(error);
  } else if (error.name === 'MulterError') {
    appError = handleMulterError(error);
  } else {
    // Unknown error - log it and return generic error
    console.error('Unknown error:', error);
    appError = new CustomError(
      'Internal server error',
      500,
      'INTERNAL_ERROR',
      false
    );
  }

  // Log error details
  const requestId = (req as any).requestId;
  console.error(`[${requestId}] Error:`, {
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    stack: appError.stack,
    details: appError.details,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Send error response
  const response: any = {
    success: false,
    error: appError.message,
    code: appError.code,
    requestId,
  };

  // Include details in development
  if (process.env.NODE_ENV === 'development') {
    response.details = appError.details;
    response.stack = appError.stack;
  }

  // Include details for validation errors
  if (appError instanceof ValidationError && appError.details) {
    response.details = appError.details;
  }

  res.status(appError.statusCode).json(response);
}

// ============================================
// ASYNC ERROR WRAPPER
// ============================================

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================
// NOT FOUND HANDLER
// ============================================

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
}

// ============================================
// REQUEST VALIDATION HELPERS
// ============================================

export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

export function validateUUID(uuid: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuid || !uuidRegex.test(uuid)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validatePhoneNumber(phone: string): void {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
  
  if (!phone || !phoneRegex.test(phone)) {
    throw new ValidationError('Invalid phone number format');
  }
}

// ============================================
// BUSINESS LOGIC VALIDATION
// ============================================

export function validateBusinessLimits(
  tier: string,
  currentCount: number,
  maxCount: number | 'unlimited'
): void {
  if (maxCount === 'unlimited') {
    return;
  }
  
  if (currentCount >= maxCount) {
    throw new ConflictError(
      `Maximum limit of ${maxCount} reached for ${tier} tier`
    );
  }
}

export function validateListingOwnership(
  listing: any,
  userId: string,
  businessId?: string
): void {
  if (listing.seller_id !== userId) {
    // Check if user is business owner or team member
    if (!businessId || listing.business_id !== businessId) {
      throw new AuthorizationError('You do not have permission to access this listing');
    }
  }
}

export function validateModerationStatus(status: string): void {
  const validStatuses = ['pending', 'approved', 'rejected'];
  
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid moderation status: ${status}`);
  }
}

// ============================================
// RATE LIMITING HELPERS
// ============================================

export function createRateLimitError(
  limit: number,
  windowMs: number,
  remaining: number
): RateLimitError {
  const resetTime = new Date(Date.now() + windowMs);
  
  return new RateLimitError(
    `Rate limit exceeded. Limit: ${limit} requests per ${windowMs / 1000} seconds. ` +
    `Remaining: ${remaining}. Reset at: ${resetTime.toISOString()}`
  );
}

// ============================================
// EXPORT ALL ERROR CLASSES AND FUNCTIONS
// ============================================

// All error classes are already exported above

