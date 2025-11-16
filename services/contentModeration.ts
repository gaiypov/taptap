// services/contentModeration.ts
import Constants from 'expo-constants';

// Google Cloud Vision API
const GOOGLE_VISION_API_KEY = 
  Constants.expoConfig?.extra?.GOOGLE_VISION_API_KEY || 
  process.env.GOOGLE_VISION_API_KEY || 
  '';

export interface ModerationResult {
  isApproved: boolean;
  needsReview: boolean;
  reasons: string[];
  confidence: {
    safe: number;
    adult: number;
    violence: number;
    racy: number;
  };
}

/**
 * Проверяет изображение на неподобающий контент через Google Vision API
 */
export async function moderateImage(imageBase64: string): Promise<ModerationResult> {
  try {
    if (!GOOGLE_VISION_API_KEY) {
      console.warn('Google Vision API key not configured - skipping moderation');
      // В режиме разработки без ключа - отправляем на ручную модерацию
      return {
        isApproved: false,
        needsReview: true,
        reasons: ['API ключ не настроен - требуется ручная проверка'],
        confidence: { safe: 0, adult: 0, violence: 0, racy: 0 },
      };
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [
                { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const safeSearch = data.responses[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      throw new Error('No safe search results');
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
    
    // Автоматическое отклонение
    if (scores.adult >= 4 || scores.violence >= 4) {
      reasons.push('Обнаружен неподобающий контент');
      return {
        isApproved: false,
        needsReview: false,
        reasons,
        confidence: {
          safe: 100 - ((scores.adult + scores.violence) * 10),
          adult: scores.adult * 20,
          violence: scores.violence * 20,
          racy: scores.racy * 20,
        },
      };
    }

    // Требуется ручная модерация
    if (scores.adult >= 3 || scores.violence >= 3 || scores.racy >= 4) {
      reasons.push('Требуется ручная проверка модератором');
      return {
        isApproved: false,
        needsReview: true,
        reasons,
        confidence: {
          safe: 70,
          adult: scores.adult * 20,
          violence: scores.violence * 20,
          racy: scores.racy * 20,
        },
      };
    }

    // Одобрено
    return {
      isApproved: true,
      needsReview: false,
      reasons: [],
      confidence: {
        safe: 95,
        adult: scores.adult * 20,
        violence: scores.violence * 20,
        racy: scores.racy * 20,
      },
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // В случае ошибки API - отправляем на ручную модерацию
    return {
      isApproved: false,
      needsReview: true,
      reasons: ['Ошибка автоматической проверки'],
      confidence: { safe: 0, adult: 0, violence: 0, racy: 0 },
    };
  }
}

/**
 * Конвертирует текстовую оценку в число (1-5)
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
 * Модерирует видео по нескольким ключевым кадрам
 */
export async function moderateVideo(videoFrames: string[]): Promise<ModerationResult> {
  // Проверяем каждый кадр
  const results = await Promise.all(
    videoFrames.map(frame => moderateImage(frame))
  );

  // Если хотя бы один кадр отклонен - отклоняем всё видео
  const rejected = results.find(r => !r.isApproved && !r.needsReview);
  if (rejected) {
    return rejected;
  }

  // Если хотя бы один требует проверки - отправляем на модерацию
  const needsReview = results.find(r => r.needsReview);
  if (needsReview) {
    return needsReview;
  }

  // Все кадры одобрены
  const avgConfidence = results.reduce((acc, r) => ({
    safe: acc.safe + r.confidence.safe,
    adult: acc.adult + r.confidence.adult,
    violence: acc.violence + r.confidence.violence,
    racy: acc.racy + r.confidence.racy,
  }), { safe: 0, adult: 0, violence: 0, racy: 0 });

  return {
    isApproved: true,
    needsReview: false,
    reasons: [],
    confidence: {
      safe: avgConfidence.safe / results.length,
      adult: avgConfidence.adult / results.length,
      violence: avgConfidence.violence / results.length,
      racy: avgConfidence.racy / results.length,
    },
  };
}

/**
 * Извлекает ключевые кадры из base64 видео (моковая функция)
 * TODO: Реализовать через ffmpeg или другую библиотеку
 */
export async function extractKeyFrames(videoUri: string, count: number = 5): Promise<string[]> {
  // Пока возвращаем пустой массив
  // В реальной реализации здесь будет извлечение кадров из видео
  console.log(`Extracting ${count} key frames from ${videoUri}`);
  return [];
}

