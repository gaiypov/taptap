// services/aiHorse.ts — AI-АНАЛИЗ ЛОШАДЕЙ УРОВНЯ TIKTOK + APPLE 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИОНУ ЛОШАДЕЙ

import { HorseAIAnalysis, HorseDetails } from '@/types';
import { analyzeWithClaude } from './ai/claude';
import { analyzeWithGoogleVision } from './ai/google';
import { analyzeWithOpenAI } from './ai/openai';
import { AI_CONFIG, checkAPIKeys, logAPICost, selectAvailableAI } from './ai/config';
import { TEST_CONFIG, canMakeRequest, getCachedAnalysis, incrementRequestCount, setCachedAnalysis } from './ai/testMode';
import { extractKeyFrames, validateVideo } from './video';
import { appLogger } from '@/utils/logger';

const HORSE_BREEDS = [
  'Ахалтекинская',
  'Арабская',
  'Киргизская',
  'Карабаирская',
  'Орловская рысистая',
  'Английская верховая',
  'Фризская',
  'Тракененская',
  'Донская',
  'Кабардинская',
  'Якутская',
  'Башкирская',
  'Першеронская',
  'Шайр',
  'Клейдесдаль',
] as const;

const MASTI = [
  'гнедая',
  'вороная',
  'рыжая',
  'серая',
  'пегая',
  'буланая',
  'соловая',
  'чалая',
  'игреневая',
  'каурая',
] as const;

const HORSE_ANALYSIS_PROMPT = `
Ты — эксперт по лошадям из Центральной Азии.

Проанализируй видео/изображения лошади и верни СТРОГО JSON без лишнего текста:

{
  "is_horse": true/false,
  "confidence": 0.00-1.00,
  "breed": "Ахалтекинская" или "Неизвестная",
  "color": "гнедая" или "вороная" и т.д.,
  "age_years": 1-30,
  "height_cm": 130-190,
  "gender": "жеребец" | "кобыла" | "мерин",
  "temperament": "спокойный" | "активный" | "горячий",
  "body_condition_score": 1-9,
  "conformation": "отличная" | "хорошая" | "средняя" | "плохая",
  "visible_defects": ["хромота", "шрамы на ногах"] или [],
  "quality_score": 0.00-1.00,
  "tags": ["породистая", "спортивная", "рабочая"],
  "issues": ["плохое освещение", "лошадь не в кадре"] или []
}

Правила:
- Если это явно НЕ лошадь — {"is_horse": false, "confidence": 0.1, "reason": "причина"}
- Порода — только из известных (Ахалтекинская, Арабская, Киргизская и т.д.)
- Масть — только правильные термины
- BCS (Body Condition Score) — 1 (истощённая) до 9 (ожирение)
- Конформация — стати лошади
`;

export async function analyzeHorseVideo(
  videoUri: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<HorseAIAnalysis> {
  try {
    if (!canMakeRequest()) {
      appLogger.warn('[AI Horse] Daily limit reached — using mock');
      return runMockAnalysis(onProgress);
    }

    const selectedAI = selectAvailableAI();
    appLogger.info('[AI Horse] Using provider', { provider: selectedAI });

    onProgress?.('Извлечение кадров...', 15);
    const frames = await extractKeyFrames(videoUri, { maxFrames: 5 });

    onProgress?.('Проверка качества...', 30);
    const quality = await validateVideo(frames[0].uri);
    if (!quality.isValid) {
      return {
        is_horse: false,
        confidence: 0,
        reason: quality.issues.join(', '),
      };
    }

    onProgress?.('AI анализ...', 60);
    let result: HorseAIAnalysis;

    if (selectedAI === 'claude' && TEST_CONFIG.ENABLE_CLAUDE) {
      // Передаем промпт как второй параметр
      const aiResult = await analyzeWithClaude(
        frames.map((f) => f.base64),
        HORSE_ANALYSIS_PROMPT,
        {
          temperature: 0.3,
        }
      );
      // Парсим результат и адаптируем к HorseAIAnalysis
      result = parseHorseAIResponse(aiResult);
      logAPICost('claude', frames.length);
    } else if (selectedAI === 'openai' && TEST_CONFIG.ENABLE_OPENAI) {
      const aiResult = await analyzeWithOpenAI(frames.map((f) => f.base64), 'full_analysis', {
        temperature: 0.3,
      });
      result = parseHorseAIResponse(aiResult);
      logAPICost('openai', frames.length);
    } else {
      result = await runMockAnalysis(onProgress);
    }

    incrementRequestCount();
    setCachedAnalysis(videoUri, result);

    onProgress?.('Готово!', 100);
    return result;
  } catch (error: any) {
    appLogger.error('[AI Horse] Analysis failed', { error });
    return {
      is_horse: false,
      confidence: 0,
      reason: 'Ошибка анализа',
    };
  }
}

/**
 * Парсинг ответа AI и адаптация к HorseAIAnalysis
 */
function parseHorseAIResponse(aiResult: any): HorseAIAnalysis {
  try {
    // Если результат уже в правильном формате
    if (aiResult && typeof aiResult === 'object' && 'is_horse' in aiResult) {
      // Адаптируем age_years -> estimated_age, height_cm -> estimated_height
      const adapted: HorseAIAnalysis = {
        is_horse: aiResult.is_horse ?? false,
        confidence: aiResult.confidence ?? 0,
        breed: aiResult.breed,
        color: aiResult.color,
        estimated_age:
          aiResult.age_years !== undefined
            ? aiResult.age_years < 5
              ? 'young'
              : aiResult.age_years > 15
                ? 'old'
                : 'adult'
            : aiResult.estimated_age,
        estimated_height: aiResult.height_cm ?? aiResult.estimated_height,
        visible_defects: aiResult.visible_defects,
        quality_score: aiResult.quality_score,
        tags: aiResult.tags,
        issues: aiResult.issues,
        temperament: aiResult.temperament,
        condition: aiResult.condition,
        body_condition_score: aiResult.body_condition_score,
        conformation: aiResult.conformation,
        reason: aiResult.reason,
      };
      return adapted;
    }

    // Если результат - строка, пытаемся распарсить JSON
    if (typeof aiResult === 'string') {
      let jsonStr = aiResult.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      const parsed = JSON.parse(jsonStr);
      return parseHorseAIResponse(parsed);
    }

    // Fallback
    return {
      is_horse: false,
      confidence: 0,
      reason: 'Неверный формат ответа AI',
    };
  } catch (error) {
    appLogger.error('[AI Horse] Failed to parse AI response', { error });
    return {
      is_horse: false,
      confidence: 0,
      reason: 'Ошибка парсинга ответа AI',
    };
  }
}

async function runMockAnalysis(
  onProgress?: (stage: string, progress: number) => void
): Promise<HorseAIAnalysis> {
  const steps = [
    { stage: 'Извлечение кадров...', progress: 20 },
    { stage: 'Проверка качества...', progress: 40 },
    { stage: 'Определение породы...', progress: 70 },
    { stage: 'Оценка стати...', progress: 90 },
    { stage: 'Готово!', progress: 100 },
  ];

  for (const step of steps) {
    onProgress?.(step.stage, step.progress);
    await new Promise((r) => setTimeout(r, 600));
  }

  return {
    is_horse: true,
    confidence: 0.96,
    breed: 'Ахалтекинская',
    color: 'гнедая',
    estimated_age: 'adult',
    estimated_height: 165,
    temperament: 'спокойный',
    body_condition_score: 6,
    conformation: 'отличная',
    visible_defects: [],
    quality_score: 0.94,
    tags: ['породистая', 'спортивная', 'здоровая'],
    issues: [],
  };
}

export const aiHorse = {
  analyzeHorseVideo,
  quickIdentifyHorse: async (uri: string) => {
    const frames = await extractKeyFrames(uri, { maxFrames: 1 });
    const result = await analyzeHorseVideo(uri);
    return { isHorse: result.is_horse, confidence: result.confidence ?? 0 };
  },
  convertToDetails: (analysis: HorseAIAnalysis, userInput: Partial<HorseDetails> = {}): HorseDetails => {
    // Адаптируем gender из "жеребец" | "кобыла" | "мерин" в "stallion" | "mare" | "gelding"
    let gender: 'stallion' | 'mare' | 'gelding' | string = userInput.gender || 'mare';
    if (!userInput.gender && (analysis as any).gender) {
      const aiGender = (analysis as any).gender;
      if (aiGender === 'жеребец') gender = 'stallion';
      else if (aiGender === 'мерин') gender = 'gelding';
      else if (aiGender === 'кобыла') gender = 'mare';
    }

    // Адаптируем age_years -> age
    let age = userInput.age;
    if (!age && (analysis as any).age_years) {
      age = (analysis as any).age_years;
    } else if (!age && analysis.estimated_age) {
      age = analysis.estimated_age === 'young' ? 2 : analysis.estimated_age === 'old' ? 15 : 7;
    }

    // Адаптируем height_cm -> height
    let height = userInput.height;
    if (!height && (analysis as any).height_cm) {
      height = (analysis as any).height_cm;
    } else if (!height && analysis.estimated_height) {
      height = analysis.estimated_height;
    }

    return {
      breed: userInput.breed || analysis.breed || 'Неизвестная',
      age: age || 7,
      gender,
      color: userInput.color || analysis.color || 'Не определена',
      height: height || 160,
      training: userInput.training || 'basic',
      purpose: userInput.purpose || 'riding',
      pedigree: userInput.pedigree ?? false,
      health_certificate: userInput.health_certificate ?? false,
      vaccinations: userInput.vaccinations,
      achievements: userInput.achievements,
    };
  },
};

export default aiHorse;
