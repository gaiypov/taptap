// services/ai.ts
import { Car } from '@/types';
import { analyzeWithClaude, quickIdentifyWithClaude } from './ai/claude';
import { AI_CONFIG, checkAPIKeys, logAPICost, selectAvailableAI } from './ai/config';
import { analyzeWithGoogleVision } from './ai/google';
import { analyzeWithOpenAI } from './ai/openai';
import { TEST_CONFIG, canMakeRequest, getCachedAnalysis, incrementRequestCount, setCachedAnalysis } from './ai/testMode';
import { detectCarDamages as detectDamagesWithYOLO } from './ai/yolo';
import { extractFramesFromVideo, imageUriToBase64, validateVideoQuality as validateVideoQualityUtil } from './video';

export async function analyzeCarVideo(
  videoUri: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<Partial<Car>> {
  try {
    // Проверяем лимиты тестирования
    if (!canMakeRequest()) {
      console.log('⚠️ Daily limit reached, using cached result');
      const cached = getCachedAnalysis(videoUri);
      if (cached) return cached;
    }
    
    // Проверяем доступность API
    const availableKeys = checkAPIKeys();
    console.log('🔑 Available APIs:', availableKeys);
    
    const selectedAI = selectAvailableAI();
    console.log(`🤖 Using AI: ${selectedAI}`);
    
    // Если нет ключей - используем mock
    if (selectedAI === 'mock' || AI_CONFIG.USE_MOCK) {
      console.log('⚠️ Running in MOCK mode');
      return await runMockAnalysis(onProgress);
    }
    
    // Извлекаем кадры с учетом тестового режима
    onProgress?.('Извлечение кадров...', 10);
    const maxFrames = TEST_CONFIG.USE_SINGLE_IMAGE ? 1 : AI_CONFIG.MAX_IMAGES_PER_ANALYSIS;
    const frames = await extractFramesFromVideo(videoUri, maxFrames);
    
    // Основной анализ через выбранный AI
    onProgress?.('AI анализ...', 50);
    let aiResult;
    
    // Конвертируем VideoFrame[] в string[] для совместимости
    const frameBase64s = frames.map(frame => frame.base64);
    
    if (selectedAI === 'claude' && TEST_CONFIG.ENABLE_CLAUDE) {
      aiResult = await analyzeWithClaude(frameBase64s, {});
      logAPICost('claude', frames.length);
    } else if (selectedAI === 'openai' && TEST_CONFIG.ENABLE_OPENAI) {
      aiResult = await analyzeWithOpenAI(frameBase64s, 'full_analysis', {});
      logAPICost('openai', frames.length);
    } else if (selectedAI === 'google' && TEST_CONFIG.ENABLE_GOOGLE) {
      // Fallback на Google + простую логику
      const googleData = await analyzeWithGoogleVision(frames[0].base64, 'full');
      aiResult = convertGoogleToAIResult(googleData);
      logAPICost('google', 1);
    } else {
      // Fallback на mock
      console.log('⚠️ No enabled AI providers, using mock');
      return await runMockAnalysis(onProgress);
    }
    
    // Дополнительный анализ повреждений с YOLO (если включен)
    if (TEST_CONFIG.ENABLE_YOLO && frames.length > 0) {
      onProgress?.('Анализ повреждений...', 80);
      try {
        const damageAnalysis = await detectDamagesWithYOLO(frames[0].base64);
        const existingAnalysis = aiResult.aiAnalysis ?? {};
        aiResult.aiAnalysis = {
          ...existingAnalysis,
          damages: damageAnalysis.damages,
          condition: damageAnalysis.overallCondition,
          conditionScore: damageAnalysis.conditionScore,
        };
      } catch (error) {
        console.warn('YOLO damage detection failed:', error);
      }
    }
    
    // Увеличиваем счетчик запросов
    incrementRequestCount();
    
    // Кешируем результат
    if (TEST_CONFIG.CACHE_RESULTS) {
      setCachedAnalysis(videoUri, aiResult);
    }
    
    onProgress?.('Готово!', 100);
    return formatFinalResult(aiResult, frames);
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    // Fallback на mock если API недоступен
    if (AI_CONFIG.MODE === 'development') {
      console.log('⚠️ Falling back to mock data');
      return await runMockAnalysis(onProgress);
    }
    
    throw error;
  }
}

// Mock анализ для тестирования без API
async function runMockAnalysis(
  onProgress?: (stage: string, progress: number) => void
): Promise<Partial<Car>> {
  const stages = [
    { stage: 'Извлечение кадров...', progress: 20 },
    { stage: 'Определение марки...', progress: 40 },
    { stage: 'Анализ состояния...', progress: 60 },
    { stage: 'Расчет цены...', progress: 80 },
    { stage: 'Финализация...', progress: 100 },
  ];
  
  for (const { stage, progress } of stages) {
    onProgress?.(stage, progress);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return getMockCarData();
}

function getMockCarData(): Partial<Car> {
  const details = {
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    mileage: 45120,
    color: 'Черный',
    transmission: 'automatic' as const,
    damages: [
      {
        type: 'scratch',
        severity: 'minor' as const,
        location: 'правая дверь',
        confidence: 0.87,
      },
    ],
    features: ['Кожаный салон', 'Камера'],
  };

  return {
    category: 'car',
    details,
    brand: details.brand,
    model: details.model,
    year: details.year,
    mileage: details.mileage,
    color: details.color,
    transmission: details.transmission,
    city: 'Бишкек',
    video_url: 'mock://video',
    thumbnail_url: 'https://picsum.photos/800/600',
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      condition: 'good',
      conditionScore: 85,
      damages: details.damages,
      estimatedPrice: { min: 2400000, max: 2600000 },
      features: details.features ?? [],
    },
  };
}

// Утилиты для извлечения кадров теперь импортируются из video.ts

// Конвертация Google Vision результата в стандартный формат
function convertGoogleToAIResult(googleData: any): Partial<Car> {
  const details = {
    brand: googleData.brand || 'Unknown',
    model: googleData.model || 'Unknown',
    year: googleData.year || 2020,
    mileage: googleData.mileage || 0,
    color: googleData.color,
    transmission: googleData.transmission,
    damages: googleData.damages || [],
    features: googleData.features || [],
  };

  return {
    category: 'car',
    details,
    brand: details.brand,
    model: details.model,
    year: details.year,
    mileage: details.mileage,
    color: details.color,
    transmission: details.transmission,
    city: 'Бишкек',
    video_url: 'mock://video',
    thumbnail_url: 'https://picsum.photos/800/600',
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      condition: googleData.condition || 'good',
      conditionScore: googleData.conditionScore || 80,
      damages: details.damages ?? [],
      estimatedPrice: googleData.estimatedPrice || { min: 2000000, max: 2500000 },
      features: details.features ?? [],
    },
  };
}

// Форматирование финального результата
function formatFinalResult(aiResult: any, frames: any[]): Partial<Car> {
  return {
    ...aiResult,
    thumbnail_url:
      frames[0]?.uri || frames[0]?.base64 || aiResult.thumbnail_url || 'https://picsum.photos/800/600',
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    views: 0,
    likes: 0,
    saves: 0,
    is_verified: false,
  };
}

// Экспорт конфигурации и утилит
export { AI_CONFIG, checkAPIKeys, selectAvailableAI, logAPICost } from './ai/config';
export { TEST_CONFIG } from './ai/testMode';
export { aiUtils } from './ai/utils';
export { videoUtils } from './video';

// Дополнительные функции для совместимости
export async function quickIdentifyCar(imageUri: string): Promise<{
  brand: string;
  model: string;
  year: number;
  color: string;
  confidence: number;
}> {
  if (!imageUri || typeof imageUri !== 'string' || !imageUri.trim()) {
    throw new Error('Некорректный URI изображения');
  }

  const normalizedUri = imageUri.trim();
  const selectedAI = selectAvailableAI();
  
  if (selectedAI === 'mock' || AI_CONFIG.USE_MOCK) {
    return {
      brand: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Белый',
      confidence: 0.85,
    };
  }
  
  // Реальная логика для быстрой идентификации
  let base64Image: string;
  if (normalizedUri.startsWith('data:image')) {
    base64Image = normalizedUri;
  } else {
    base64Image = await imageUriToBase64(normalizedUri);
  }

  const frameBase64s = [base64Image];
  
  if (selectedAI === 'claude') {
    const result = await quickIdentifyWithClaude(base64Image);
    logAPICost('claude', frameBase64s.length);
    return normalizeQuickIdentifyResult(result);
  }
  
  if (selectedAI === 'openai') {
    const result = await analyzeWithOpenAI(frameBase64s, 'quick_identify', {});
    logAPICost('openai', frameBase64s.length);
    return normalizeQuickIdentifyResult(result);
  }

  if (selectedAI === 'google') {
    const result = await analyzeWithGoogleVision(base64Image, 'full');
    logAPICost('google', frameBase64s.length);
    return normalizeQuickIdentifyResult({
      brand: result.brand,
      model: result.model,
      year: result.year,
      color: result.color,
      confidence: 0.7,
    });
  }
  
  return {
    brand: 'Unknown',
    model: 'Unknown',
    year: 2020,
    color: 'Unknown',
    confidence: 0.5,
  };
}

export async function validateVideoQuality(videoUri: string): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  score: number;
}> {
  try {
    console.log('📊 Validating video quality:', videoUri);
    
    // Используем новый сервис валидации видео
    const result = await validateVideoQualityUtil(videoUri);
    
    console.log('✅ Video quality validation complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Video quality validation error:', error);
    
    // Fallback на простую валидацию
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (videoUri.includes('low-quality')) {
      issues.push('Низкое качество видео');
      suggestions.push('Используйте видео с разрешением минимум 720p');
    }
    
    if (videoUri.includes('short')) {
      issues.push('Слишком короткое видео');
      suggestions.push('Рекомендуется видео длительностью от 10 секунд');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      score: issues.length === 0 ? 100 : 50,
    };
  }
}

export async function compareCars(car1: any, car2: any): Promise<{
  betterChoice: string;
  comparison: any;
}> {
  // В будущем можно добавить backend endpoint для сравнения
  return {
    betterChoice: car1.id || 'car1',
    comparison: {},
  };
}

function normalizeQuickIdentifyResult(result: any): {
  brand: string;
  model: string;
  year: number;
  color: string;
  confidence: number;
} {
  const parsedYear = typeof result.year === 'number'
    ? result.year
    : parseInt(result.year, 10);

  const rawConfidence = typeof result.confidence === 'number'
    ? result.confidence
    : Number(result.confidence);

  return {
    brand: result.brand || 'Unknown',
    model: result.model || 'Unknown',
    year: Number.isFinite(parsedYear) ? parsedYear : 2020,
    color: result.color || 'Unknown',
    confidence:
      Number.isFinite(rawConfidence)
        ? Math.min(Math.max(rawConfidence, 0), 1)
        : 0.8,
  };
}
