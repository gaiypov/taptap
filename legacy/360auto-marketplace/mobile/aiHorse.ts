// services/aiHorse.ts
import type { HorseAIAnalysis, HorseDetails } from '@/types';
import { analyzeWithClaude } from './ai/claude';
import { AI_CONFIG, checkAPIKeys, logAPICost, selectAvailableAI } from './ai/config';
import { analyzeWithGoogleVision } from './ai/google';
import { analyzeWithOpenAI } from './ai/openai';
import { TEST_CONFIG, canMakeRequest, getCachedAnalysis, incrementRequestCount, setCachedAnalysis } from './ai/testMode';
import { extractFramesFromVideo, imageUriToBase64, validateVideoQuality as validateVideoQualityUtil } from './video';

/**
 * Промпт для анализа лошадей
 */
const HORSE_ANALYSIS_PROMPT = `
Проанализируй это видео/изображение лошади и верни СТРОГО JSON в следующем формате (без комментариев):

{
  "is_horse": true/false,
  "confidence": 0.95,
  "breed": "Ахалтекинская" или "Неизвестная",
  "color": "гнедая/вороная/серая/рыжая/пегая/буланая/соловая",
  "estimated_age": "young/adult/old",
  "estimated_height": 150-170,
  "visible_defects": ["хромота", "шрамы"] или [],
  "quality_score": 0.85,
  "tags": ["спортивная", "породистая", "здоровая"],
  "issues": ["плохое качество видео", "лошадь не в кадре"],
  "temperament": "спокойная/активная/нервная",
  "condition": "excellent/good/fair/poor",
  "body_condition_score": 5,
  "conformation": "отличная/хорошая/удовлетворительная/плохая"
}

Критерии оценки:
1. Четко видна лошадь целиком (тело, ноги, голова)
2. Лошадь стоит или двигается
3. Видео не менее 30 секунд (если видео)
4. Качество HD
5. Нет NSFW контента
6. Оценка экстерьера (конформация)
7. Оценка упитанности (BCS - Body Condition Score от 1 до 9)

Породы для распознавания (примеры):
- Ахалтекинская
- Арабская
- Русская верховая
- Орловская рысистая
- Тракененская
- Фризская
- Американская чистокровная
- Аппалуза
- Донская
- Кабардинская
- Якутская
- Башкирская
- Неизвестная (если не можешь определить)

Масти (цвета):
- Гнедая (коричневое тело, черные грива и хвост)
- Вороная (полностью черная)
- Рыжая (рыжее тело, грива и хвост того же цвета)
- Серая (белая или серая)
- Пегая (пятнистая, черно-белая или бело-рыжая)
- Буланая (желтовато-золотистая с черными отметинами)
- Соловая (золотисто-желтая с белой гривой)

Если это НЕ лошадь или видео плохого качества:
{
  "is_horse": false,
  "confidence": 0.XX,
  "reason": "причина отказа"
}
`;

/**
 * Анализ лошади по видео
 */
export async function analyzeHorseVideo(
  videoUri: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<HorseAIAnalysis> {
  try {
    // Проверяем лимиты тестирования
    if (!canMakeRequest()) {
      console.log('⚠️ Daily limit reached, using cached result');
      const cached = getCachedAnalysis(videoUri);
      if (cached) return cached as HorseAIAnalysis;
    }
    
    // Проверяем доступность API
    const availableKeys = checkAPIKeys();
    console.log('🔑 Available APIs:', availableKeys);
    
    const selectedAI = selectAvailableAI();
    console.log(`🤖 Using AI: ${selectedAI}`);
    
    // Если нет ключей - используем mock
    if (selectedAI === 'mock' || AI_CONFIG.USE_MOCK) {
      console.log('⚠️ Running in MOCK mode for horse');
      return await runMockHorseAnalysis(onProgress);
    }
    
    // Извлекаем кадры
    onProgress?.('Извлечение кадров...', 10);
    const maxFrames = TEST_CONFIG.USE_SINGLE_IMAGE ? 1 : AI_CONFIG.MAX_IMAGES_PER_ANALYSIS;
    const frames = await extractFramesFromVideo(videoUri, maxFrames);
    
    // Проверяем качество видео
    onProgress?.('Проверка качества...', 20);
    const qualityCheck = await validateVideoQualityUtil(frames[0].base64);
    if (!qualityCheck.isValid || qualityCheck.score < 0.5) {
      return {
        is_horse: false,
        confidence: 0,
        reason: qualityCheck.issues.join(', '),
        issues: qualityCheck.issues,
      };
    }
    
    // Основной анализ через выбранный AI
    onProgress?.('AI анализ лошади...', 50);
    let aiResult: HorseAIAnalysis;
    
    const frameBase64s = frames.map(frame => frame.base64);
    
    if (selectedAI === 'claude' && TEST_CONFIG.ENABLE_CLAUDE) {
      aiResult = await analyzeHorseWithClaude(frameBase64s);
      logAPICost('claude', frames.length);
    } else if (selectedAI === 'openai' && TEST_CONFIG.ENABLE_OPENAI) {
      aiResult = await analyzeHorseWithOpenAI(frameBase64s);
      logAPICost('openai', frames.length);
    } else if (selectedAI === 'google' && TEST_CONFIG.ENABLE_GOOGLE) {
      aiResult = await analyzeHorseWithGoogle(frames[0].base64);
      logAPICost('google', 1);
    } else {
      console.log('⚠️ No enabled AI providers, using mock');
      return await runMockHorseAnalysis(onProgress);
    }
    
    // Кешируем результат
    incrementRequestCount();
    setCachedAnalysis(videoUri, aiResult);
    
    onProgress?.('Готово!', 100);
    return aiResult;
    
  } catch (error) {
    console.error('❌ Horse analysis error:', error);
    throw error;
  }
}

/**
 * Анализ с помощью Claude
 */
async function analyzeHorseWithClaude(frames: string[]): Promise<HorseAIAnalysis> {
  try {
    const result = await analyzeWithClaude(frames, {
      temperature: 0.3,
    } as any);
    
    // Парсим JSON ответ
    const parsed = parseAIResponse(result.aiAnalysis?.features?.join(' ') || '{}');
    return parsed;
  } catch (error) {
    console.error('Claude horse analysis error:', error);
    throw error;
  }
}

/**
 * Анализ с помощью OpenAI
 */
async function analyzeHorseWithOpenAI(frames: string[]): Promise<HorseAIAnalysis> {
  try {
    const result = await analyzeWithOpenAI(frames, 'full_analysis' as any, {
    } as any);
    
    const parsed = parseAIResponse(result.aiAnalysis?.features?.join(' ') || '{}');
    return parsed;
  } catch (error) {
    console.error('OpenAI horse analysis error:', error);
    throw error;
  }
}

/**
 * Анализ с помощью Google Vision
 */
async function analyzeHorseWithGoogle(frameBase64: string): Promise<HorseAIAnalysis> {
  try {
    const result = await analyzeWithGoogleVision(frameBase64, 'full');
    
    // Google Vision не умеет распознавать породы лошадей напрямую,
    // поэтому делаем базовый анализ
    const labels = result.labels || [];
    const isHorse = labels.some((label: string) => 
      label.toLowerCase().includes('horse') || 
      label.toLowerCase().includes('equine') ||
      label.toLowerCase().includes('лошад')
    );
    
    if (!isHorse) {
      return {
        is_horse: false,
        confidence: 0.1,
        reason: 'Не обнаружена лошадь на изображении',
      };
    }
    
    return {
      is_horse: true,
      confidence: 0.7,
      breed: 'Неизвестная',
      color: 'Не определена',
      estimated_age: 'adult',
      quality_score: result.qualityScore || 0.7,
      tags: labels.slice(0, 5),
    };
  } catch (error) {
    console.error('Google Vision horse analysis error:', error);
    throw error;
  }
}

/**
 * Парсинг JSON ответа от AI
 */
function parseAIResponse(response: string): HorseAIAnalysis {
  try {
    // Убираем markdown если есть
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return {
      is_horse: false,
      confidence: 0,
      reason: 'Ошибка парсинга ответа AI',
    };
  }
}

/**
 * Mock анализ для тестирования
 */
async function runMockHorseAnalysis(
  onProgress?: (stage: string, progress: number) => void
): Promise<HorseAIAnalysis> {
  const steps = [
    { stage: 'Извлечение кадров...', progress: 20 },
    { stage: 'Проверка качества...', progress: 40 },
    { stage: 'AI анализ лошади...', progress: 70 },
    { stage: 'Определение породы...', progress: 85 },
    { stage: 'Готово!', progress: 100 },
  ];
  
  for (const step of steps) {
    onProgress?.(step.stage, step.progress);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return {
    is_horse: true,
    confidence: 0.95,
    breed: 'Ахалтекинская',
    color: 'гнедая',
    estimated_age: 'adult',
    estimated_height: 160,
    visible_defects: [],
    quality_score: 0.9,
    tags: ['породистая', 'здоровая', 'хорошо сложена'],
    issues: [],
  };
}

/**
 * Быстрая идентификация (только проверка, что это лошадь)
 */
export async function quickIdentifyHorse(imageUri: string): Promise<{ isHorse: boolean; confidence: number }> {
  try {
    const base64 = await imageUriToBase64(imageUri);
    const selectedAI = selectAvailableAI();
    
    if (selectedAI === 'mock' || AI_CONFIG.USE_MOCK) {
      return { isHorse: true, confidence: 0.95 };
    }
    
    // Простой анализ через Google Vision (быстрее всего)
    if (TEST_CONFIG.ENABLE_GOOGLE) {
      const result = await analyzeWithGoogleVision(base64, 'full' as any);
      const labels = result.labels || [];
      const isHorse = labels.some((label: string) => 
        label.toLowerCase().includes('horse') || 
        label.toLowerCase().includes('equine')
      );
      return { isHorse, confidence: isHorse ? 0.8 : 0.2 };
    }
    
    // Fallback на полный анализ
    const fullResult = await analyzeHorseVideo(imageUri);
    return { isHorse: fullResult.is_horse, confidence: fullResult.confidence };
    
  } catch (error) {
    console.error('Quick identify horse error:', error);
    return { isHorse: false, confidence: 0 };
  }
}

/**
 * Конвертация HorseAIAnalysis в HorseDetails для сохранения в БД
 */
export function convertHorseAnalysisToDetails(
  analysis: HorseAIAnalysis,
  userInput: Partial<HorseDetails>
): HorseDetails {
  return {
    breed: userInput.breed || analysis.breed || 'Неизвестная',
    age: userInput.age || (analysis.estimated_age === 'young' ? 2 : analysis.estimated_age === 'old' ? 15 : 7),
    gender: userInput.gender || 'mare',
    color: userInput.color || analysis.color || 'Не определена',
    height: userInput.height || analysis.estimated_height || 160,
    training: userInput.training || 'untrained',
    purpose: userInput.purpose || 'riding',
    pedigree: userInput.pedigree ?? false,
    health_certificate: userInput.health_certificate ?? false,
    vaccinations: userInput.vaccinations,
    achievements: userInput.achievements,
  };
}

/**
 * Валидация качества видео лошади
 */
export async function validateHorseVideoQuality(videoUri: string): Promise<{
  isGoodQuality: boolean;
  score: number;
  issues: string[];
}> {
  try {
    const frames = await extractFramesFromVideo(videoUri, 1);
    if (frames.length === 0) {
      return {
        isGoodQuality: false,
        score: 0,
        issues: ['Не удалось извлечь кадры из видео'],
      };
    }
    
    const qualityCheck = await validateVideoQualityUtil(frames[0].base64);
    
    // Дополнительная проверка на наличие лошади
    const horseCheck = await quickIdentifyHorse(videoUri);
    if (!horseCheck.isHorse) {
      return {
        isGoodQuality: false,
        score: 0,
        issues: [...qualityCheck.issues, 'На видео не обнаружена лошадь'],
      };
    }
    
    return {
      ...qualityCheck,
      isGoodQuality: qualityCheck.isValid && qualityCheck.score >= 0.5,
    };
  } catch (error) {
    console.error('Horse video quality validation error:', error);
    return {
      isGoodQuality: false,
      score: 0,
      issues: ['Ошибка при проверке качества видео'],
    };
  }
}

export default {
  analyzeHorseVideo,
  quickIdentifyHorse,
  convertHorseAnalysisToDetails,
  validateHorseVideoQuality,
};

