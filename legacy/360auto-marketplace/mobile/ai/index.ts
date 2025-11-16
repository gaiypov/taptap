// services/ai/index.ts
import { Car } from '@/types';
import { AI_CONFIG, logAPICost, selectAvailableAI } from './config';
import { generateCacheKey, getCachedAnalysis, optimizeImageForAI, setCachedAnalysis } from './utils';

// ==============================================
// ОСНОВНОЙ AI СЕРВИС С КЛЮЧАМИ
// ==============================================

/**
 * Анализ автомобиля с использованием доступных AI провайдеров
 */
export async function analyzeCarVideo(
  videoUri: string,
  onProgress?: (step: string, progress: number) => void
): Promise<Partial<Car>> {
  try {
    console.log('🚀 Starting AI car analysis...', videoUri);
    
    // Проверяем кэш
    const cacheKey = generateCacheKey(videoUri, 'full_analysis');
    const cachedResult = getCachedAnalysis(cacheKey);
    if (cachedResult) {
      onProgress?.('Using cached result', 100);
      return cachedResult;
    }
    
    // Выбираем доступный AI провайдер
    const selectedProvider = selectAvailableAI();
    console.log(`🤖 Using AI provider: ${selectedProvider}`);
    
    onProgress?.('Preparing video frames...', 10);
    
    // Извлекаем кадры (в реальном приложении используйте expo-video-thumbnails)
    const frames = await extractFramesFromVideo(videoUri);
    const optimizedFrames = frames.slice(0, AI_CONFIG.MAX_IMAGES_PER_ANALYSIS);
    
    onProgress?.('Analyzing with AI...', 30);
    
    let result: Partial<Car>;
    
    switch (selectedProvider) {
      case 'claude':
        result = await analyzeWithClaude(optimizedFrames, onProgress);
        break;
      case 'openai':
        result = await analyzeWithOpenAI(optimizedFrames, onProgress);
        break;
      case 'google':
        result = await analyzeWithGoogle(optimizedFrames, onProgress);
        break;
      case 'mock':
        result = await analyzeWithMock(optimizedFrames, onProgress);
        break;
      default:
        throw new Error(`Unknown AI provider: ${selectedProvider}`);
    }
    
    // Логируем стоимость
    logAPICost(selectedProvider, optimizedFrames.length);
    
    // Кэшируем результат
    setCachedAnalysis(cacheKey, result);
    
    onProgress?.('Analysis complete!', 100);
    console.log('🎉 AI analysis complete:', result);
    
    return result;
  } catch (error) {
    console.error('❌ AI analysis error:', error);
    throw new Error('Не удалось проанализировать видео. Попробуйте еще раз.');
  }
}

/**
 * Быстрая идентификация автомобиля
 */
export async function quickIdentifyCar(imageUri: string): Promise<{
  brand: string;
  model: string;
  year: number;
  color: string;
  confidence: number;
}> {
  try {
    console.log('🔍 Quick car identification...', imageUri);
    
    const selectedProvider = selectAvailableAI();
    const imageBase64 = await imageUriToBase64(imageUri);
    const optimizedImage = optimizeImageForAI(imageBase64);
    
    let result;
    
    switch (selectedProvider) {
      case 'claude':
        result = await quickIdentifyWithClaude(optimizedImage);
        break;
      case 'openai':
        result = await quickIdentifyWithOpenAI(optimizedImage);
        break;
      case 'google':
        result = await quickIdentifyWithGoogle(optimizedImage);
        break;
      case 'mock':
        result = await quickIdentifyWithMock();
        break;
      default:
        throw new Error(`Unknown AI provider: ${selectedProvider}`);
    }
    
    logAPICost(selectedProvider, 1);
    
    console.log('✅ Quick identification complete:', result);
    return result;
  } catch (error) {
    console.error('❌ Quick identification error:', error);
    throw new Error('Не удалось идентифицировать автомобиль.');
  }
}

/**
 * Проверка качества видео
 */
export async function validateVideoQuality(videoUri: string): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  // Простая валидация для демо
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Проверки качества видео
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
  };
}

// ==============================================
// AI ПРОВАЙДЕРЫ
// ==============================================

// Claude анализ
async function analyzeWithClaude(frames: string[], onProgress?: (step: string, progress: number) => void): Promise<Partial<Car>> {
  onProgress?.('Claude analysis...', 50);
  
  // Здесь будет реальный вызов Claude API
  // Для демо возвращаем мок данные
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    mileage: 45000,
    location: 'Бишкек',
    videoUrl: 'mock-video-url',
    thumbnailUrl: frames[0],
    views: 0,
    likes: 0,
    saves: 0,
    createdAt: new Date().toISOString(),
    isVerified: false,
    aiAnalysis: {
      condition: 'good',
      conditionScore: 82,
      damages: [
        {
          type: 'scratch',
          severity: 'minor',
          location: 'правая дверь',
          confidence: 0.87,
        },
      ],
      estimatedPrice: {
        min: 2300000,
        max: 2600000,
      },
      features: [
        'Кожаный салон',
        'Камера заднего вида',
        'Подогрев сидений',
      ],
    },
  };
}

// OpenAI анализ
async function analyzeWithOpenAI(frames: string[], onProgress?: (step: string, progress: number) => void): Promise<Partial<Car>> {
  onProgress?.('OpenAI analysis...', 50);
  
  // Здесь будет реальный вызов OpenAI API
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    brand: 'BMW',
    model: 'X5',
    year: 2019,
    mileage: 38000,
    location: 'Бишкек',
    videoUrl: 'mock-video-url',
    thumbnailUrl: frames[0],
    views: 0,
    likes: 0,
    saves: 0,
    createdAt: new Date().toISOString(),
    isVerified: false,
    aiAnalysis: {
      condition: 'excellent',
      conditionScore: 91,
      damages: [],
      estimatedPrice: {
        min: 4500000,
        max: 5200000,
      },
      features: [
        'Кожаный салон',
        'Навигация',
        'Панорамная крыша',
        'Автоматическая коробка',
      ],
    },
  };
}

// Google Vision анализ
async function analyzeWithGoogle(frames: string[], onProgress?: (step: string, progress: number) => void): Promise<Partial<Car>> {
  onProgress?.('Google Vision analysis...', 50);
  
  // Здесь будет реальный вызов Google Vision API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    brand: 'Mercedes',
    model: 'E-Class',
    year: 2021,
    mileage: 25000,
    location: 'Бишкек',
    videoUrl: 'mock-video-url',
    thumbnailUrl: frames[0],
    views: 0,
    likes: 0,
    saves: 0,
    createdAt: new Date().toISOString(),
    isVerified: false,
    aiAnalysis: {
      condition: 'excellent',
      conditionScore: 95,
      damages: [],
      estimatedPrice: {
        min: 5500000,
        max: 6200000,
      },
      features: [
        'Кожаный салон',
        'Адаптивный круиз-контроль',
        'Массаж сидений',
        'Burmester звук',
      ],
    },
  };
}

// Mock анализ
async function analyzeWithMock(frames: string[], onProgress?: (step: string, progress: number) => void): Promise<Partial<Car>> {
  onProgress?.('Mock analysis...', 50);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const brands = ['Toyota', 'BMW', 'Mercedes', 'Audi', 'Lexus'];
  const models = ['Camry', 'X5', 'E-Class', 'A6', 'ES'];
  
  return {
    brand: brands[Math.floor(Math.random() * brands.length)],
    model: models[Math.floor(Math.random() * models.length)],
    year: 2018 + Math.floor(Math.random() * 6),
    mileage: Math.floor(Math.random() * 80000) + 20000,
    location: 'Бишкек',
    videoUrl: 'mock-video-url',
    thumbnailUrl: frames[0],
    views: 0,
    likes: 0,
    saves: 0,
    createdAt: new Date().toISOString(),
    isVerified: false,
    aiAnalysis: {
      condition: 'good',
      conditionScore: 75 + Math.floor(Math.random() * 20),
      damages: [],
      estimatedPrice: {
        min: 2000000 + Math.floor(Math.random() * 3000000),
        max: 2500000 + Math.floor(Math.random() * 3000000),
      },
      features: [
        'Автоматическая коробка',
        'Кондиционер',
        'Электростеклоподъемники',
      ],
    },
  };
}

// Быстрая идентификация с Claude
async function quickIdentifyWithClaude(imageBase64: string) {
  // Реальный вызов Claude API
  return {
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'Белый',
    confidence: 0.92,
  };
}

// Быстрая идентификация с OpenAI
async function quickIdentifyWithOpenAI(imageBase64: string) {
  // Реальный вызов OpenAI API
  return {
    brand: 'BMW',
    model: 'X5',
    year: 2019,
    color: 'Черный',
    confidence: 0.89,
  };
}

// Быстрая идентификация с Google
async function quickIdentifyWithGoogle(imageBase64: string) {
  // Реальный вызов Google Vision API
  return {
    brand: 'Mercedes',
    model: 'E-Class',
    year: 2021,
    color: 'Серебристый',
    confidence: 0.85,
  };
}

// Mock быстрая идентификация
async function quickIdentifyWithMock() {
  const brands = ['Toyota', 'BMW', 'Mercedes'];
  const models = ['Camry', 'X5', 'E-Class'];
  const colors = ['Белый', 'Черный', 'Серебристый'];
  
  return {
    brand: brands[Math.floor(Math.random() * brands.length)],
    model: models[Math.floor(Math.random() * models.length)],
    year: 2018 + Math.floor(Math.random() * 6),
    color: colors[Math.floor(Math.random() * colors.length)],
    confidence: 0.8 + Math.random() * 0.2,
  };
}

// ==============================================
// УТИЛИТЫ
// ==============================================

// Извлечение кадров из видео
async function extractFramesFromVideo(videoUri: string): Promise<string[]> {
  // В реальном приложении используйте expo-video-thumbnails
  return [
    'data:image/jpeg;base64,mock-frame-1',
    'data:image/jpeg;base64,mock-frame-2',
    'data:image/jpeg;base64,mock-frame-3',
  ];
}

// Конвертация изображения в base64
async function imageUriToBase64(uri: string): Promise<string> {
  // В реальном приложении используйте FileSystem.readAsStringAsync
  return 'data:image/jpeg;base64,mock-image-data';
}

// Экспорт конфигурации
export { AI_CONFIG } from './config';
export { aiUtils } from './utils';

