// backend/middleware/auth.ts
import { NextFunction, Request, Response } from 'express';
import logger from '../src/utils/logger';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: string;
  };
  validatedData?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Токен доступа не предоставлен',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role
    };
    next();
  } catch (error) {
    logger.error('Token verification error:', { error });
    return res.status(403).json({
      success: false,
      error: 'Недействительный токен доступа',
      code: 'INVALID_TOKEN'
    });
  }
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: 'Недостаточно прав доступа',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET!) as any;
      req.user = {
        id: decoded.id,
        phone: decoded.phone,
        role: decoded.role
      };
    } catch (error) {
      // Игнорируем ошибку для опциональной аутентификации
      logger.warn('Optional auth failed:', { error });
    }
  }

  next();
}
