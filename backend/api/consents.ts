// backend/api/consents.ts
import express from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  acceptConsents,
  getUserConsent,
  hasValidConsents,
  requireReconsentIfNeeded,
  revokeConsents,
} from '../services/consentsService.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/status', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const hasConsents = await hasValidConsents(userId);
    const requiresReconsent = await requireReconsentIfNeeded(userId);
    
    return res.json({
      success: true,
      data: { 
        hasConsents,
        requiresReconsent,
      },
    });
  } catch (error) {
    console.error('[ConsentsAPI] status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось проверить согласия',
      code: 'CONSENT_STATUS_FAILED',
    });
  }
});

router.get('/details', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const consent = await getUserConsent(userId);
    return res.json({
      success: true,
      data: {
        consent,
      },
    });
  } catch (error) {
    console.error('[ConsentsAPI] details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось получить данные согласий',
      code: 'CONSENT_DETAILS_FAILED',
    });
  }
});

router.post('/accept', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const {
      marketing_accepted,
      notifications_accepted,
    } = req.body ?? {};

    // IP и User-Agent берутся автоматически из req (защита от подделки)
    const consent = await acceptConsents(
      userId,
      {
        marketing_accepted,
        notifications_accepted,
      },
      req // Передаём Express request для безопасного получения IP/UA
    );

    return res.json({
      success: true,
      data: { consent },
    });
  } catch (error) {
    console.error('[ConsentsAPI] accept error:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось сохранить согласия',
      code: 'CONSENT_ACCEPT_FAILED',
    });
  }
});

router.post('/revoke', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const { reason, partial } = req.body ?? {};
    
    // Поддержка частичного отзыва (marketing или notifications)
    await revokeConsents(userId, reason, partial);
    
    return res.json({
      success: true,
      data: { 
        revoked: true,
        partial: partial || null,
      },
    });
  } catch (error) {
    console.error('[ConsentsAPI] revoke error:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось отозвать согласия',
      code: 'CONSENT_REVOKE_FAILED',
    });
  }
});

export default router;
