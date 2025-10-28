// backend/api/auth.ts
import express from 'express';
import { requestSmsCode, verifySmsCode, VERIFICATION_CODE_LENGTH } from '../services/authService.js';
import { getSmsStatus } from '../services/smsService.js';

const router = express.Router();

router.get('/sms-status', (_req, res) => {
  const status = getSmsStatus();
  return res.json({
    success: true,
    data: {
      status,
      codeLength: VERIFICATION_CODE_LENGTH,
    },
  });
});

router.post('/request-code', async (req, res) => {
  try {
    const { phone } = req.body ?? {};

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать номер телефона',
        code: 'MISSING_PHONE',
      });
    }

    const result = await requestSmsCode(phone);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Не удалось отправить SMS',
        code: 'REQUEST_CODE_FAILED',
        warning: result.warning,
        codeLength: VERIFICATION_CODE_LENGTH,
        ...(result.testCode ? { testCode: result.testCode } : {}),
      });
    }

    return res.json({
      success: true,
      data: {
        warning: result.warning,
        codeLength: VERIFICATION_CODE_LENGTH,
        ...(result.testCode ? { testCode: result.testCode } : {}),
      },
    });
  } catch (error) {
    console.error('[AuthAPI] request-code unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка при отправке кода',
      code: 'REQUEST_CODE_FAILED',
    });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body ?? {};

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать номер телефона и код',
        code: 'MISSING_CREDENTIALS',
      });
    }

    const result = await verifySmsCode(phone, code);

    if (!result.success || !result.user || !result.token) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Неверный код',
        code: 'INVALID_CODE',
        codeLength: VERIFICATION_CODE_LENGTH,
      });
    }

    return res.json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        codeLength: VERIFICATION_CODE_LENGTH,
      },
    });
  } catch (error) {
    console.error('[AuthAPI] verify-code unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка при проверке кода',
      code: 'VERIFY_CODE_FAILED',
    });
  }
});

export default router;
