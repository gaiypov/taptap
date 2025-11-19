// ============================================
// 360⁰ Marketplace - Authentication Middleware
// Production Ready for Kyrgyzstan Launch
// ============================================

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for production');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    phone: string;
    business_tier?: string;
  };
  validatedData?: any;
  validatedQuery?: any;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'ACCESS_TOKEN_REQUIRED',
      details: 'Authorization header with Bearer token is required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_TOKEN',
        details: 'Token is invalid or expired'
      });
    }

    req.user = decoded as { id: string; role: string; phone: string };
    next();
  });
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        details: 'User must be authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        details: `Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = undefined;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = undefined;
    } else {
      req.user = decoded as { id: string; role: string; phone: string };
    }
    next();
  });
}
