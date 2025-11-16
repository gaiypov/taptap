// ============================================
// Error Codes
// ============================================

export const ERROR_CODES = {
  // Authentication
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CODE: 'INVALID_CODE',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Business logic
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  INVALID_CODE: 'Invalid verification code',
  VALIDATION_ERROR: 'Validation error',
  INVALID_INPUT: 'Invalid input',
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  UNAUTHORIZED: 'Unauthorized access',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error',
  EXTERNAL_SERVICE_ERROR: 'External service error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  OPERATION_NOT_ALLOWED: 'Operation not allowed',
};

