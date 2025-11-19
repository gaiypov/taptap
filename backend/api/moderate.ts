// backend/api/moderate.ts
// МОДЕРАЦИЯ КОНТЕНТА — API ключи ТОЛЬКО здесь!
import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;

if (!GOOGLE_VISION_API_KEY) {
  console.warn('⚠️  GOOGLE_VISION_API_KEY не настроен — модерация будет недоступна');
  console.warn('   Добавьте в backend/.env: GOOGLE_VISION_API_KEY=your_key_here');
  console.warn('   Получите ключ на https://console.cloud.google.com/\n');
}

/**
 * Конвертирует текстовую оценку Google Vision в число (0-5)
 */
function getLikelihoodScore(likelihood: string): number {
  const scores: { [key: string]: number } = {
    UNKNOWN: 0,
    VERY_UNLIKELY: 1,
    UNLIKELY: 2,
    POSSIBLE: 3,
    LIKELY: 4,
    VERY_LIKELY: 5,
  };
  return scores[likelihood] || 0;
}

/**
 * POST /api/moderate/image
 * Модерирует изображение через Google Vision API
 * API ключ хранится ТОЛЬКО на бэкенде!
 */
router.post('/image', async (req: Request, res: Response) => {
  try {
    if (!GOOGLE_VISION_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Content moderation service not configured',
        result: {
          isApproved: false,
          needsReview: true,
          reasons: ['Сервис модерации не настроен'],
          confidence: { safe: 0, adult: 0, violence: 0, racy: 0 },
        },
      });
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'imageBase64 is required',
      });
    }

    // Извлекаем base64 из data URL если нужно
    const base64Content = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    // Вызываем Google Vision API (ключ ТОЛЬКО здесь!)
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: base64Content },
            features: [
              { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 секунд
      }
    );

    const safeSearch = response.data.responses[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      throw new Error('No safe search results from Google Vision');
    }

    // Конвертируем текстовые значения в числа
    const scores = {
      adult: getLikelihoodScore(safeSearch.adult),
      violence: getLikelihoodScore(safeSearch.violence),
      racy: getLikelihoodScore(safeSearch.racy),
      medical: getLikelihoodScore(safeSearch.medical),
      spoof: getLikelihoodScore(safeSearch.spoof),
    };

    const reasons: string[] = [];
    
    // Автоматическое отклонение (VERY_LIKELY или LIKELY для adult/violence)
    if (scores.adult >= 4 || scores.violence >= 4) {
      reasons.push('Обнаружен неподобающий контент');
      return res.json({
        success: true,
        result: {
          isApproved: false,
          needsReview: false,
          reasons,
          confidence: {
            safe: Math.max(0, 100 - ((scores.adult + scores.violence) * 10)),
            adult: scores.adult * 20,
            violence: scores.violence * 20,
            racy: scores.racy * 20,
          },
        },
      });
    }

    // Требуется ручная модерация (POSSIBLE для adult/violence или LIKELY для racy)
    if (scores.adult >= 3 || scores.violence >= 3 || scores.racy >= 4) {
      reasons.push('Требуется ручная проверка модератором');
      return res.json({
        success: true,
        result: {
          isApproved: false,
          needsReview: true,
          reasons,
          confidence: {
            safe: 70,
            adult: scores.adult * 20,
            violence: scores.violence * 20,
            racy: scores.racy * 20,
          },
        },
      });
    }

    // Одобрено
    return res.json({
      success: true,
      result: {
        isApproved: true,
        needsReview: false,
        reasons: [],
        confidence: {
          safe: 95,
          adult: scores.adult * 20,
          violence: scores.violence * 20,
          racy: scores.racy * 20,
        },
      },
    });

  } catch (error: any) {
    console.error('[Moderation API] Error moderating image:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      
      return res.status(status).json({
        success: false,
        error: message || 'Failed to moderate image',
        result: {
          isApproved: false,
          needsReview: true,
          reasons: ['Ошибка автоматической проверки'],
          confidence: { safe: 0, adult: 0, violence: 0, racy: 0 },
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to moderate image',
      result: {
        isApproved: false,
        needsReview: true,
        reasons: ['Ошибка автоматической проверки'],
        confidence: { safe: 0, adult: 0, violence: 0, racy: 0 },
      },
    });
  }
});

export default router;

