// SMS Auth API — Production Ready Kyrgyzstan 2025
// Защита от спама • Rate limiting • Безопасная валидация • RLS-ready

import express from 'express';
import { z } from 'zod';
import { asyncHandler, BadRequestError } from '../../middleware/errorHandler';
import { authenticateToken } from '../../middleware/auth'; // если нужно для каких-то роутов
import { requestSmsCode, verifySmsCode, VERIFICATION_CODE_LENGTH } from '../../../services/authService';
import { getSmsStatus } from '../../../services/smsService';
import { defaultLimiter, createRateLimiter } from '../../middleware/rateLimit';
import { appLogger } from '../../utils/logger';

const router = express.Router();

// ============================================
// Глобальные схемы валидации
// ============================================

const phoneSchema = z.string()
  .min(9, 'Номер слишком короткий')
  .max(15, 'Номер слишком длинный')
  .regex(/^996\d{9}$/, 'Номер должен быть в формате 996XXXXXXXXX (без + и пробелов)');

const requestCodeSchema = z.object({
  phone: phoneSchema,
});

const verifyCodeSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(VERIFICATION_CODE_LENGTH, `Код должен быть из ${VERIFICATION_CODE_LENGTH} цифр`),
});

// ============================================
// Статус SMS-провайдера
// ============================================

router.get('/sms-status', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: getSmsStatus(),
      codeLength: VERIFICATION_CODE_LENGTH,
    },
  });
});

// ============================================
// Жёсткий rate-limiter на запрос кода
// 3 запроса в минуту с одного IP + 10 в час на один номер
// ============================================

const requestCodeLimiter = createRateLimiter(
  60_000,     // 1 минута
  3,          // максимум 3 запроса
  'Слишком много попыток. Подождите 1 минуту',
  (req) => `reqcode_ip:${req.ip}`
);

const phoneDailyLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 час
  10,
  'Слишком много SMS на этот номер. Попробуйте позже',
  (req) => {
    const phone = (req.body as any)?.phone;
    return phone ? `reqcode_phone:${phone}` : req.ip;
  }
);

// ============================================
// POST /request-code
// ============================================

router.post(
  '/request-code',
  requestCodeLimiter,
  phoneDailyLimiter,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const parseResult = requestCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      appLogger.warn('Invalid phone format', { ip: req.ip, body: req.body });
      throw new BadRequestError('Неверный формат номера телефона');
    }

    const { phone } = parseResult.data;

    // Нормализуем номер (на всякий случай)
    const normalizedPhone = phone.replace(/\D/g, '').replace(/^8/, '996');

    appLogger.info('SMS code requested', { phone: normalizedPhone, ip: req.ip });

    const result = await requestSmsCode(normalizedPhone);

    if (!result.success) {
      appLogger.warn('SMS request failed', { phone: normalizedPhone, error: result.error });

      // В development даже при ошибке возвращаем testCode если есть
      if (process.env.NODE_ENV === 'development' && result.testCode) {
        return res.json({
          success: true,
          data: {
            warning: result.warning || 'SMS провайдер не настроен, используйте testCode',
            testCode: result.testCode,
          },
        });
      }

      return res.status(429).json({
        success: false,
        error: result.error || 'Не удалось отправить SMS',
        code: 'SMS_SEND_FAILED',
        warning: result.warning,
        retryAfter: 60,
      });
    }

    // В development ВСЕГДА возвращаем testCode
    const responseData: any = {
      warning: result.warning,
    };
    
    if (process.env.NODE_ENV === 'development') {
      responseData.testCode = result.testCode || '111111'; // Fallback если нет кода
      appLogger.info('SMS code (dev)', { phone: normalizedPhone, testCode: responseData.testCode });
    }

    res.json({
      success: true,
      data: responseData,
    });
  })
);

// ============================================
// POST /verify-code
// ============================================

// Лимитер на верификацию — 10 попыток в минуту на номер
const verifyCodeLimiter = createRateLimiter(
  60_000,
  10,
  'Слишком много попыток ввода кода',
  (req) => `verify:${(req.body as any)?.phone || req.ip}`
);

router.post(
  '/verify-code',
  verifyCodeLimiter,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const parseResult = verifyCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.format();
      const errorMessages = Object.values(errors)
        .map((e: any) => {
          if (Array.isArray(e)) {
            return e;
          }
          if (e && typeof e === 'object' && '_errors' in e) {
            return e._errors;
          }
          return [];
        })
        .flat()
        .filter(Boolean);
      throw new BadRequestError('Неверные данные: ' + errorMessages.join(', '));
    }

    const { phone, code } = parseResult.data;
    const normalizedPhone = phone.replace(/\D/g, '').replace(/^8/, '996');

    appLogger.info('SMS code verification attempt', { phone: normalizedPhone, ip: req.ip });

    const result = await verifySmsCode(normalizedPhone, code.trim());

    if (!result.success) {
      appLogger.warn('SMS verification failed', {
        phone: normalizedPhone,
        codeLength: code.length,
        error: result.error,
        ip: req.ip,
      });

      // Специальный код для брутфорса — чтобы фронт мог показать "заблокировано"
      if (result.error?.includes('заблокирован')) {
        return res.status(403).json({
          success: false,
          error: result.error,
          code: 'PHONE_BLOCKED',
        });
      }

      return res.status(400).json({
        success: false,
        error: result.error || 'Неверный код',
        code: 'INVALID_CODE',
        attemptsLeft: result.attemptsLeft,
      });
    }

    if (!result.user) {
      appLogger.error('SMS verification successful but user is missing', { phone: normalizedPhone });
      return res.status(500).json({
        success: false,
        error: 'Ошибка при создании пользователя',
        code: 'USER_CREATION_FAILED',
      });
    }

    appLogger.info('SMS verification successful', { userId: result.user.id, phone: normalizedPhone });

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        isNewUser: result.isNewUser,
      },
    });
  })
);

export default router;
