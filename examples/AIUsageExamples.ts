// examples/AIUsageExamples.ts
/**
 * Примеры использования AI сервиса
 * Этот файл демонстрирует различные способы интеграции AI анализа
 */

import {
    AI_CONFIG,
    analyzeCarVideo,
    quickIdentifyCar,
    validateVideoQuality
} from '@/services/ai';
import { Car } from '@/types';
import {
    formatPrice,
    generateCarSummary,
    generateDetailedDescription,
    generateSearchTags,
    getCarRating,
    getConditionText,
    matchesSearchFilters
} from '@/utils/aiHelpers';

// ==============================================
// 1. БАЗОВОЕ ИСПОЛЬЗОВАНИЕ
// ==============================================

export async function basicVideoAnalysis() {
  const videoUri = 'file://path/to/car-video.mp4';
  
  try {
    // Анализ с отслеживанием прогресса
    const result = await analyzeCarVideo(videoUri, (step, progress) => {
      console.log(`${step}: ${progress}%`);
    });
    
    console.log('Результат анализа:', result);
    return result;
  } catch (error) {
    console.error('Ошибка анализа:', error);
    throw error;
  }
}

// ==============================================
// 2. БЫСТРАЯ ИДЕНТИФИКАЦИЯ
// ==============================================

export async function quickCarIdentification() {
  const imageUri = 'file://path/to/car-photo.jpg';
  
  try {
    const carInfo = await quickIdentifyCar(imageUri);
    
    console.log(`Автомобиль: ${carInfo.brand} ${carInfo.model}`);
    console.log(`Год: ${carInfo.year}`);
    console.log(`Цвет: ${carInfo.color}`);
    console.log(`Уверенность: ${(carInfo.confidence * 100).toFixed(1)}%`);
    
    return carInfo;
  } catch (error) {
    console.error('Ошибка идентификации:', error);
    throw error;
  }
}

// ==============================================
// 3. ПРОВЕРКА КАЧЕСТВА ВИДЕО
// ==============================================

export async function videoQualityCheck() {
  const videoUri = 'file://path/to/car-video.mp4';
  
  try {
    const validation = await validateVideoQuality(videoUri);
    
    if (!validation.isValid) {
      console.log('Проблемы с видео:');
      validation.issues.forEach(issue => console.log(`- ${issue}`));
      
      console.log('Рекомендации:');
      validation.suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
    } else {
      console.log('Видео подходит для анализа');
    }
    
    return validation;
  } catch (error) {
    console.error('Ошибка проверки качества:', error);
    throw error;
  }
}

// ==============================================
// 4. ИСПОЛЬЗОВАНИЕ УТИЛИТ
// ==============================================

export function demonstrateHelpers(car: Car) {
  console.log('=== Демонстрация утилит ===');
  
  // Форматирование цены
  if (car.aiAnalysis?.estimatedPrice) {
    const avgPrice = (car.aiAnalysis.estimatedPrice.min + car.aiAnalysis.estimatedPrice.max) / 2;
    console.log(`Средняя цена: ${formatPrice(avgPrice)}`);
  }
  
  // Описание состояния
  if (car.aiAnalysis) {
    console.log(`Состояние: ${getConditionText(car.aiAnalysis.condition)}`);
  }
  
  // Краткое описание
  console.log(`Описание: ${generateCarSummary(car)}`);
  
  // Детальное описание для объявления
  console.log(`Детальное описание:\n${generateDetailedDescription(car)}`);
  
  // Рейтинг автомобиля
  console.log(`Рейтинг: ${getCarRating(car)}/5 звезд`);
  
  // Теги для поиска
  console.log(`Теги: ${generateSearchTags(car).join(', ')}`);
}

// ==============================================
// 5. ИНТЕГРАЦИЯ С UI КОМПОНЕНТАМИ
// ==============================================

export class CarAnalysisManager {
  private isAnalyzing = false;
  private currentProgress = 0;
  private currentStep = '';
  
  constructor(
    private onProgressUpdate?: (step: string, progress: number) => void,
    private onComplete?: (result: Partial<Car>) => void,
    private onError?: (error: string) => void
  ) {}
  
  async analyzeVideo(videoUri: string): Promise<Partial<Car> | null> {
    if (this.isAnalyzing) {
      throw new Error('Анализ уже выполняется');
    }
    
    this.isAnalyzing = true;
    this.currentProgress = 0;
    this.currentStep = '';
    
    try {
      // Проверяем качество видео
      const validation = await validateVideoQuality(videoUri);
      if (!validation.isValid) {
        this.onError?.(`Проблемы с видео: ${validation.issues.join(', ')}`);
        return null;
      }
      
      // Запускаем анализ
      const result = await analyzeCarVideo(videoUri, (step, progress) => {
        this.currentStep = step;
        this.currentProgress = progress;
        this.onProgressUpdate?.(step, progress);
      });
      
      this.onComplete?.(result);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.onError?.(errorMessage);
      return null;
    } finally {
      this.isAnalyzing = false;
    }
  }
  
  async quickIdentify(imageUri: string) {
    try {
      const result = await quickIdentifyCar(imageUri);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.onError?.(errorMessage);
      return null;
    }
  }
  
  getStatus() {
    return {
      isAnalyzing: this.isAnalyzing,
      progress: this.currentProgress,
      step: this.currentStep,
    };
  }
}

// ==============================================
// 6. ФИЛЬТРАЦИЯ И ПОИСК
// ==============================================

export function searchCars(cars: Car[], filters: {
  brand?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  condition?: string[];
  maxMileage?: number;
}): Car[] {
  return cars.filter(car => matchesSearchFilters(car, filters));
}

export function sortCarsByRating(cars: Car[]): Car[] {
  return cars.sort((a, b) => getCarRating(b) - getCarRating(a));
}

export function sortCarsByPrice(cars: Car[]): Car[] {
  return cars.sort((a, b) => {
    const priceA = a.aiAnalysis ? (a.aiAnalysis.estimatedPrice.min + a.aiAnalysis.estimatedPrice.max) / 2 : 0;
    const priceB = b.aiAnalysis ? (b.aiAnalysis.estimatedPrice.min + b.aiAnalysis.estimatedPrice.max) / 2 : 0;
    return priceA - priceB;
  });
}

// ==============================================
// 7. КОНФИГУРАЦИЯ AI СЕРВИСА
// ==============================================

export function configureAIService() {
  // Переключение в продакшн режим
  AI_CONFIG.MODE = 'production';
  AI_CONFIG.USE_MOCK = false;
  AI_CONFIG.PRIMARY_AI = 'claude';

  console.log('AI сервис настроен для продакшена');
}

export function configureMockMode() {
  // Переключение в режим разработки
  AI_CONFIG.MODE = 'development';
  AI_CONFIG.USE_MOCK = true;

  console.log('AI сервис переключен в режим разработки');
}

// ==============================================
// 8. ОБРАБОТКА ОШИБОК
// ==============================================

export async function robustAnalysis(videoUri: string, maxRetries: number = 3) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Попытка анализа ${attempt}/${maxRetries}`);
      
      const result = await analyzeCarVideo(videoUri);
      console.log('Анализ успешно завершен');
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Неизвестная ошибка');
      console.error(`Попытка ${attempt} неудачна:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  
  throw new Error(`Анализ не удался после ${maxRetries} попыток. Последняя ошибка: ${lastError?.message}`);
}

// ==============================================
// 9. ПАКЕТНЫЙ АНАЛИЗ
// ==============================================

export async function batchAnalysis(videoUris: string[]): Promise<Partial<Car>[]> {
  const results: Partial<Car>[] = [];
  const errors: string[] = [];
  
  console.log(`Начинаем пакетный анализ ${videoUris.length} видео`);
  
  for (let i = 0; i < videoUris.length; i++) {
    const videoUri = videoUris[i];
    console.log(`Анализ ${i + 1}/${videoUris.length}: ${videoUri}`);
    
    try {
      const result = await analyzeCarVideo(videoUri);
      results.push(result);
      console.log(`✅ Анализ ${i + 1} завершен`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      errors.push(`Видео ${i + 1}: ${errorMessage}`);
      console.error(`❌ Ошибка в анализе ${i + 1}:`, errorMessage);
    }
    
    // Небольшая пауза между анализами
    if (i < videoUris.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Пакетный анализ завершен. Успешно: ${results.length}, Ошибок: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('Ошибки:', errors);
  }
  
  return results;
}

// ==============================================
// 10. ЭКСПОРТ ДАННЫХ
// ==============================================

export function exportAnalysisResults(cars: Car[], format: 'json' | 'csv' = 'json') {
  if (format === 'json') {
    return JSON.stringify(cars, null, 2);
  }
  
  if (format === 'csv') {
    const headers = ['Brand', 'Model', 'Year', 'Mileage', 'Condition', 'Price Min', 'Price Max', 'Rating'];
    const rows = cars.map(car => [
      car.brand,
      car.model,
      car.year.toString(),
      car.mileage.toString(),
      car.aiAnalysis?.condition || '',
      car.aiAnalysis?.estimatedPrice.min.toString() || '',
      car.aiAnalysis?.estimatedPrice.max.toString() || '',
      getCarRating(car).toString(),
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  throw new Error('Неподдерживаемый формат экспорта');
}

// Экспорт всех примеров
export const AIUsageExamples = {
  basicVideoAnalysis,
  quickCarIdentification,
  videoQualityCheck,
  demonstrateHelpers,
  CarAnalysisManager,
  searchCars,
  sortCarsByRating,
  sortCarsByPrice,
  configureAIService,
  configureMockMode,
  robustAnalysis,
  batchAnalysis,
  exportAnalysisResults,
};
