// backend/api/consents.ts
import express from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  acceptConsents,
  ensureConsentRecord,
  getActiveConsent,
  hasActiveConsents,
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

    const hasConsents = await hasActiveConsents(userId);
    return res.json({
      success: true,
      data: { hasConsents },
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

    const consent = await getActiveConsent(userId);
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

router.post('/initialize', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован',
        code: 'NOT_AUTHENTICATED',
      });
    }

    await ensureConsentRecord(userId, {
      ip_address: req.body?.ip_address,
      user_agent: req.body?.user_agent,
    });

    return res.json({
      success: true,
      data: { initialized: true },
    });
  } catch (error) {
    console.error('[ConsentsAPI] initialize error:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось подготовить согласия',
      code: 'CONSENT_INITIALIZE_FAILED',
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
      terms_version = '1.0',
      privacy_version = '1.0',
      consent_version = '1.0',
      ip_address,
      user_agent,
      marketing_accepted,
      notifications_accepted,
    } = req.body ?? {};

    const consent = await acceptConsents(userId, {
      terms_version,
      privacy_version,
      consent_version,
      ip_address,
      user_agent,
      marketing_accepted,
      notifications_accepted,
    });

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

    await revokeConsents(userId, req.body?.reason);
    return res.json({
      success: true,
      data: { revoked: true },
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
