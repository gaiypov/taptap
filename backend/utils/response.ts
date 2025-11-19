// backend/utils/response.ts
// Общий модуль для единообразных ответов API

import express from 'express';

// ============================================
// TYPES
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  requestId?: string;
  [key: string]: unknown; // Для дополнительных полей (extras)
}

// ============================================
// HELPERS
// ============================================

/**
 * Получить requestId из запроса
 */
export function getRequestId(req: express.Request): string | undefined {
  return (req as express.Request & { requestId?: string }).requestId;
}

/**
 * Отправить успешный ответ
 */
export function sendSuccess<T>(
  res: express.Response,
  data: T,
  options?: {
    status?: number;
    message?: string;
    requestId?: string;
  }
): express.Response<ApiSuccessResponse<T>> {
  const { status = 200, message, requestId } = options || {};
  return res.status(status).json({
    success: true,
    data,
    ...(message && { message }),
    ...(requestId && { requestId }),
  });
}

/**
 * Отправить ошибку (единый формат для всех API)
 */
export function sendError(
  res: express.Response,
  options: {
    status?: number;
    error: string;
    code: string;
    requestId?: string;
    extras?: Record<string, unknown>;
  }
): express.Response<ApiErrorResponse> {
  const { status = 500, error, code, requestId, extras = {} } = options;
  return res.status(status).json({
    success: false,
    error,
    code,
    ...(requestId && { requestId }),
    ...extras,
  });
}

