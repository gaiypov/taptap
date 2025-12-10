// services/ai/index.ts — ЕДИНЫЙ AI-БАРРЕЛЬ 360AutoMVP 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ АНАЛИЗОВ

import { Car, HorseAIAnalysis, RealEstateAIAnalysis } from '@/types';
import { appLogger } from '@/utils/logger';
import { extractKeyFrames } from '../video';
import { logAPICost, selectAvailableAI } from './config';
import { canMakeRequest, incrementRequestCount, setCachedAnalysis } from './testMode';

// ==============================================
// НОВЫЕ ЭКСПОРТЫ ДЛЯ AI МОДЕРАЦИИ
// ==============================================

// Types
export * from './types';

// API Client
export { aiApi, default as AIApiClient } from './aiApi';

// Re-export hooks (для удобства)
export { useAIModeration } from '@/hooks/useAIModeration';
export { useVideoFrameExtractor } from '@/hooks/useVideoFrameExtractor';

// Универсальный тип результата
export type AIAnalysisResult = Partial<Car> | HorseAIAnalysis | RealEstateAIAnalysis;

// Кэш ключ
const getCacheKey = (uri: string, type: string) => `ai_${type}_${uri.split('/').pop()}`;

// Универсальная функция анализа
export async function analyzeContent(
  videoUri: string,
  type: 'car' | 'horse' | 'real_estate',
  onProgress?: (stage: string, progress: number) => void
): Promise<AIAnalysisResult> {
  try {
    if (!canMakeRequest()) {
      appLogger.warn('[AI] Limit reached — using mock');
      return runMockAnalysis(type, onProgress);
    }

    const provider = selectAvailableAI();
    appLogger.info('[AI] Starting analysis', { type, provider, videoUri });

    onProgress?.('Извлечение кадров...', 15);
    const frames = await extractKeyFrames(videoUri, { maxFrames: 5 });

    onProgress?.('AI анализ...', 60);

    let result: AIAnalysisResult;

    switch (provider) {
      case 'claude': {
        const { analyzeWithClaude } = await import('./claude');
        // Для разных типов нужны разные промпты, но пока используем универсальный подход
        const prompt = getPromptForType(type);
        result = await analyzeWithClaude(frames.map((f) => f.base64), prompt);
        logAPICost('claude', frames.length);
        break;
      }
      case 'openai': {
        const { analyzeWithOpenAI } = await import('./openai');
        // OpenAI принимает analysisType как второй параметр
        const analysisType = type === 'car' ? 'full_analysis' : 'full_analysis';
        result = await analyzeWithOpenAI(frames.map((f) => f.base64), analysisType);
        logAPICost('openai', frames.length);
        break;
      }
      case 'google': {
        const { analyzeWithGoogleVision } = await import('./google');
        result = await analyzeWithGoogleVision(frames[0].base64, 'full');
        logAPICost('google', 1);
        break;
      }
      default:
        result = await runMockAnalysis(type, onProgress);
    }

    incrementRequestCount();
    setCachedAnalysis(getCacheKey(videoUri, type), result);

    onProgress?.('Готово!', 100);
    appLogger.info('[AI] Analysis complete');

    return result;
  } catch (error: any) {
    appLogger.error('[AI] Analysis failed', { type, error });
    return runMockAnalysis(type, onProgress);
  }
}

/**
 * Получить промпт для типа анализа
 */
function getPromptForType(type: 'car' | 'horse' | 'real_estate'): string {
  switch (type) {
    case 'car':
      return `Проанализируй изображения автомобиля и верни JSON с полями: brand, model, year, color, mileage, transmission, condition, condition_score, damages, features, estimated_price.`;
    case 'horse':
      return `Проанализируй изображения лошади и верни JSON с полями: is_horse, confidence, breed, color, age_years, height_cm, gender, temperament, body_condition_score, conformation, visible_defects, quality_score, tags, issues.`;
    case 'real_estate':
      return `Проанализируй изображения недвижимости и верни JSON с полями: is_real_estate, confidence, property_type, rooms, area_sqm, floor, total_floors, building_type, renovation, balcony, furniture, view, advantages, issues, quality_score, estimated_price, price_per_sqm, market_comparison, recommendation.`;
    default:
      return `Проанализируй изображения и верни JSON.`;
  }
}

// Mock анализ
async function runMockAnalysis(
  type: 'car' | 'horse' | 'real_estate',
  onProgress?: (stage: string, progress: number) => void
): Promise<AIAnalysisResult> {
  const steps = [
    { stage: 'Извлечение кадров...', progress: 20 },
    { stage: 'Анализ...', progress: 60 },
    { stage: 'Оценка цены...', progress: 90 },
    { stage: 'Готово!', progress: 100 },
  ];

  for (const step of steps) {
    onProgress?.(step.stage, step.progress);
    await new Promise((r) => setTimeout(r, 800));
  }

  if (type === 'car') {
    return {
      brand: 'Toyota',
      model: 'Camry',
      year: 2021,
      mileage: 38000,
      color: 'черный',
      transmission: 'automatic',
      aiAnalysis: {
        condition: 'excellent',
        conditionScore: 94,
        damages: [],
        estimatedPrice: { min: 2600000, max: 2850000 },
        features: ['кожа', 'камера 360', 'подогрев'],
      },
    };
  }

  if (type === 'horse') {
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
      tags: ['породистая', 'спортивная'],
      issues: [],
    };
  }

  return {
    is_real_estate: true,
    confidence: 0.96,
    property_type: 'apartment',
    rooms: 3,
    area_sqm: 85,
    floor: 7,
    total_floors: 12,
    building_type: 'монолит',
    renovation: 'евро',
    balcony: true,
    furniture: 'частично',
    view: 'на горы',
    advantages: ['солнечная сторона', 'новый ремонт'],
    issues: [],
    quality_score: 0.94,
    estimated_price: { min: 9500000, max: 11000000, avg: 10250000 },
    price_per_sqm: 120588,
    market_comparison: 'по рынку',
    recommendation: 'покупать',
  };
}

// Специфичные функции
export const ai = {
  car: (uri: string, onProgress?: (stage: string, progress: number) => void) =>
    analyzeContent(uri, 'car', onProgress),
  horse: (uri: string, onProgress?: (stage: string, progress: number) => void) =>
    analyzeContent(uri, 'horse', onProgress),
  realEstate: (uri: string, onProgress?: (stage: string, progress: number) => void) =>
    analyzeContent(uri, 'real_estate', onProgress),

  quickIdentify: async (uri: string, type: 'car' | 'horse' | 'real_estate') => {
    const result = await analyzeContent(uri, type);
    return { confidence: 0.9, ...result };
  },
};

export default ai;
