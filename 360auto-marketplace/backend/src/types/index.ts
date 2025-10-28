// ============================================
// Backend Types Index
// ============================================

// Re-export ALL types from shared (single source of truth)
export * from '../../../shared/src/types';

// Export backend-specific types (not in shared)
export * from './backend-specific';
export * from './compression';
export * from './express';

// Backend-specific error types
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}
