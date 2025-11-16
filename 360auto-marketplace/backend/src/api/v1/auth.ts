// ============================================
// 360⁰ Marketplace - Authentication API
// Production Ready for Kyrgyzstan Launch
// ============================================

import { ApiResponse } from '@shared/types';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { sendVerificationCodeSms } from '../../../../backend/services/smsService';
import { asyncHandler, auditLog, CustomError } from '../../middleware/errorHandler';
import { authLimiter } from '../../middleware/rateLimit';
import { requestSmsCodeSchema, validateBody, verifySmsCodeSchema } from '../../middleware/validate';
import { supabase } from '../../services/supabaseClient';

const router = Router();

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for production');
}

const JWT_SECRET = process.env.JWT_SECRET;

// ============================================
// REQUEST SMS CODE
// ============================================

router.post('/request-code', 
  authLimiter,
  validateBody(requestSmsCodeSchema),
  asyncHandler(async (req, res) => {
    const { phone } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, phone')
      .eq('phone', phone)
      .single();

    // Generate verification code
    const { data: code } = await supabase
      .rpc('create_verification_code', { p_phone: phone });

    if (!code) {
      throw new CustomError('Failed to generate verification code', 500, 'CODE_GENERATION_FAILED');
    }

    // Send SMS via external service
    const smsResult = await sendVerificationCodeSms(phone, code);
    
    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error);
      // Continue anyway - code is in database
      // In production, consider throwing error
    }
    
    // Log code only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`SMS Code for ${phone}: ${code}`);
      if (smsResult.testCode) {
        console.log(`Test code: ${smsResult.testCode}`);
      }
    }

    auditLog(null, 'sms_code_requested', 'verification_code', phone);

    res.json({
      success: true,
      data: {
        phone,
        message: 'Verification code sent successfully'
      }
    } as ApiResponse<{ phone: string; message: string }>);
  })
);

// ============================================
// VERIFY SMS CODE
// ============================================

router.post('/verify-code',
  authLimiter,
  validateBody(verifySmsCodeSchema),
  asyncHandler(async (req, res) => {
    const { phone, code, name, age, consent_offer_agreement, consent_personal_data_processing } = req.body;

    // Verify SMS code
    const { data: isValid } = await supabase
      .rpc('verify_sms_code', { p_phone: phone, p_code: code });

    if (!isValid) {
      throw new CustomError('Invalid verification code', 400, 'INVALID_CODE');
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, phone, name, age')
      .eq('phone', phone)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id;
      const { error } = await supabase
        .from('users')
        .update({ name, age, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        throw new CustomError('Failed to update user', 500, 'USER_UPDATE_FAILED', true, error);
      }
    } else {
      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          phone,
          name,
          age
        })
        .select('id')
        .single();

      if (error) {
        throw new CustomError('Failed to create user', 500, 'USER_CREATION_FAILED', true, error);
      }

      userId = newUser.id;
      isNewUser = true;
    }

    // Grant consents
    await supabase.rpc('grant_user_consent', {
      p_user_id: userId,
      p_consent_type: 'offer_agreement',
      p_ip_address: req.ip,
      p_user_agent: req.get('User-Agent'),
      p_version: '1.0'
    });

    await supabase.rpc('grant_user_consent', {
      p_user_id: userId,
      p_consent_type: 'personal_data_processing',
      p_ip_address: req.ip,
      p_user_agent: req.get('User-Agent'),
      p_version: '1.0'
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        role: 'user',
        phone
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    auditLog(userId, 'user_authenticated', 'user', userId, { isNewUser });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          phone,
          name,
          age,
          isNewUser
        }
      }
    } as ApiResponse<{ token: string; user: { id: string; phone: string; name: string; age: number; isNewUser: boolean } }>);
  })
);

// ============================================
// REFRESH TOKEN
// ============================================

router.post('/refresh',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new CustomError('Refresh token required', 401, 'REFRESH_TOKEN_REQUIRED');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Verify user still exists
      const { data: user } = await supabase
        .from('users')
        .select('id, phone, name, age')
        .eq('id', decoded.userId)
        .single();

      if (!user) {
        throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Generate new token
      const newToken = jwt.sign(
        {
          userId: user.id,
          role: 'user',
          phone: user.phone
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          token: newToken,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            age: user.age
          }
        }
      });
    } catch (error) {
      throw new CustomError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  })
);

// ============================================
// VALIDATE TOKEN
// ============================================

router.post('/validate',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.json({
        success: false,
        error: 'Token required'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Verify user still exists
      const { data: user } = await supabase
        .from('users')
        .select('id, phone, name')
        .eq('id', decoded.userId)
        .single();

      if (!user) {
        return res.json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          userId: decoded.userId,
          role: decoded.role
        }
      });
    } catch (error) {
      res.json({
        success: false,
        error: 'Invalid token'
      });
    }
  })
);

// ============================================
// LOGOUT
// ============================================

router.post('/logout',
  asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    // We could implement a token blacklist here if needed

    auditLog(req.user?.id || null, 'user_logged_out', 'user', req.user?.id || 'unknown');

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  })
);

export default router;
