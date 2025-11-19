// backend/api/auth.ts
import express from 'express';
import { requestSmsCode, VERIFICATION_CODE_LENGTH, verifySmsCode } from '../services/authService';
import { getSmsStatus } from '../services/smsService';

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
      console.error('[AuthAPI] Missing phone in request');
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать номер телефона',
        code: 'MISSING_PHONE',
      });
    }

    // Нормализуем номер телефона (убираем все нецифровые символы, заменяем 8 на 996, добавляем +)
    let normalizedPhone = phone.replace(/\D/g, '').replace(/^8/, '996');
    if (!normalizedPhone.startsWith('996')) {
      normalizedPhone = `996${normalizedPhone}`;
    }
    if (normalizedPhone.length === 12) {
      normalizedPhone = `+${normalizedPhone}`;
    }
    console.log('[AuthAPI] Request code for phone:', { originalPhone: phone, normalizedPhone });

    // Передаем нормализованный номер в authService
    const result = await requestSmsCode(normalizedPhone);

    // В production НЕ возвращаем testCode (только реальная SMS)
    // testCode возвращается только в development или если явно включен EXPOSE_TEST_SMS_CODE
    const shouldExposeTestCode = process.env.NODE_ENV === 'development' || process.env.EXPOSE_TEST_SMS_CODE === 'true';
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Не удалось отправить SMS',
        code: 'REQUEST_CODE_FAILED',
        warning: result.warning,
        codeLength: VERIFICATION_CODE_LENGTH,
        ...(shouldExposeTestCode && result.testCode ? { testCode: result.testCode } : {}),
      });
    }

    return res.json({
      success: true,
      data: {
        warning: result.warning,
        codeLength: VERIFICATION_CODE_LENGTH,
        ...(shouldExposeTestCode && result.testCode ? { testCode: result.testCode } : {}),
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

    // Нормализуем номер телефона (убираем все нецифровые символы, заменяем 8 на 996, добавляем +)
    let normalizedPhone = phone.replace(/\D/g, '').replace(/^8/, '996');
    if (!normalizedPhone.startsWith('996')) {
      normalizedPhone = `996${normalizedPhone}`;
    }
    if (normalizedPhone.length === 12) {
      normalizedPhone = `+${normalizedPhone}`;
    }
    console.log('[AuthAPI] verify-code called', { originalPhone: phone, normalizedPhone, code });

    const result = await verifySmsCode(normalizedPhone, code.trim());

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
