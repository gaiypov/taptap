// backend/api/sms.ts
// Эндпоинт для прямой отправки SMS (используется services/sms.ts)
import express from 'express';
import { sendSms, getSmsStatus } from '../services/smsService';

const router = express.Router();

// POST /api/sms/send
// Отправляет SMS на указанный номер
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body ?? {};

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать номер телефона и сообщение',
        code: 'MISSING_PARAMS',
      });
    }

    console.log('[SMS API] Sending SMS', { phone, messageLength: message.length });

    const result = await sendSms(phone, message);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Не удалось отправить SMS',
        code: 'SMS_SEND_FAILED',
        warning: result.warning,
      });
    }

    return res.json({
      success: true,
      data: {
        warning: result.warning,
        messageId: result.messageId,
      },
    });
  } catch (error) {
    console.error('[SMS API] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка при отправке SMS',
      code: 'SMS_SEND_ERROR',
    });
  }
});

// GET /api/sms/status
// Возвращает статус SMS-провайдера
router.get('/status', async (_req, res) => {
  try {
    const status = await getSmsStatus();
    
    return res.json({
      success: true,
      data: {
        status,
      },
    });
  } catch (error) {
    console.error('[SMS API] Status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка при получении статуса',
    });
  }
});

export default router;

