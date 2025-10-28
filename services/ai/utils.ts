// services/ai/utils.ts
import { AI_CONFIG, checkAPIKeys, logAPICost, selectAvailableAI } from './config';

/**
 * Утилиты для работы с AI конфигурацией
 */

// Получение статуса AI сервиса
export function getAIStatus(): {
  mode: string;
  useMock: boolean;
  availableProviders: string[];
  selectedProvider: string;
  hasKeys: boolean;
  costOptimization: boolean;
} {
  const keys = checkAPIKeys();
  const selectedProvider = selectAvailableAI();
  
  const availableProviders = [];
  if (keys.hasClaude) availableProviders.push('claude');
  if (keys.hasOpenAI) availableProviders.push('openai');
  if (keys.hasGoogle) availableProviders.push('google');
  if (keys.hasRoboflow) availableProviders.push('roboflow');
  
  return {
    mode: AI_CONFIG.MODE,
    useMock: AI_CONFIG.USE_MOCK,
    availableProviders,
    selectedProvider,
    hasKeys: availableProviders.length > 0,
    costOptimization: AI_CONFIG.ENABLE_CACHING && AI_CONFIG.MAX_IMAGES_PER_ANALYSIS <= 3,
  };
}

// Логирование конфигурации AI
export function logAIConfiguration(): void {
  const status = getAIStatus();
  
  console.log('🤖 AI Service Configuration:');
  console.log(`   Mode: ${status.mode}`);
  console.log(`   Use Mock: ${status.useMock}`);
  console.log(`   Selected Provider: ${status.selectedProvider}`);
  console.log(`   Available Providers: ${status.availableProviders.join(', ')}`);
  console.log(`   Has API Keys: ${status.hasKeys ? '✅' : '❌'}`);
  console.log(`   Cost Optimization: ${status.costOptimization ? '✅' : '❌'}`);
  
  if (!status.hasKeys && !status.useMock) {
    console.warn('⚠️  No AI API keys found and mock mode disabled!');
  }
}

// Получение рекомендаций по настройке
export function getSetupRecommendations(): string[] {
  const recommendations: string[] = [];
  const keys = checkAPIKeys();
  
  if (!keys.hasClaude && !keys.hasOpenAI && !keys.hasGoogle) {
    recommendations.push('Добавьте хотя бы один AI API ключ для работы');
    recommendations.push('Рекомендуется Claude API (самый дешевый)');
  }
  
  if (!keys.hasClaude) {
    recommendations.push('Получите Claude API ключ на console.anthropic.com');
  }
  
  if (!keys.hasOpenAI) {
    recommendations.push('Получите OpenAI API ключ на platform.openai.com');
  }
  
  if (!keys.hasGoogle) {
    recommendations.push('Настройте Google Cloud Vision API');
  }
  
  if (AI_CONFIG.MAX_IMAGES_PER_ANALYSIS > 5) {
    recommendations.push('Уменьшите MAX_IMAGES_PER_ANALYSIS для экономии');
  }
  
  if (!AI_CONFIG.ENABLE_CACHING) {
    recommendations.push('Включите кэширование для экономии API запросов');
  }
  
  return recommendations;
}

// Проверка готовности к продакшену
export function isReadyForProduction(): boolean {
  const status = getAIStatus();
  
  return (
    status.hasKeys &&
    !status.useMock &&
    status.mode === 'production' &&
    status.availableProviders.length > 0
  );
}

// Получение стоимости анализа
export function estimateAnalysisCost(imageCount: number, provider?: string): number {
  const selectedProvider = provider || selectAvailableAI();
  
  const costs = {
    claude: imageCount * 0.023,
    openai: imageCount * 0.03,
    google: imageCount > 1000 ? imageCount * 0.0015 : 0,
    mock: 0,
  };
  
  return costs[selectedProvider as keyof typeof costs] || 0;
}

// Оптимизация изображений для экономии
export function optimizeImageForAI(imageBase64: string, quality: number = AI_CONFIG.IMAGE_QUALITY): string {
  // В реальном приложении здесь будет сжатие изображения
  // Для демо возвращаем оригинал
  return imageBase64;
}

// Кэширование результатов анализа
const analysisCache = new Map<string, any>();

export function getCachedAnalysis(cacheKey: string): any | null {
  if (!AI_CONFIG.ENABLE_CACHING) return null;
  
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 часа
    console.log('📦 Using cached analysis result');
    return cached.data;
  }
  
  return null;
}

export function setCachedAnalysis(cacheKey: string, data: any): void {
  if (!AI_CONFIG.ENABLE_CACHING) return;
  
  analysisCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  
  // Ограничиваем размер кэша
  if (analysisCache.size > 100) {
    const firstKey = analysisCache.keys().next().value;
    if (firstKey) {
      analysisCache.delete(firstKey);
    }
  }
}

// Генерация ключа кэша
export function generateCacheKey(videoUri: string, analysisType: string): string {
  // Простой хэш для демо
  return `${videoUri}_${analysisType}_${Date.now().toString(36)}`;
}

// Валидация API ключей
export function validateAPIKeys(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const keys = checkAPIKeys();
  
  if (!keys.hasClaude && !keys.hasOpenAI && !keys.hasGoogle) {
    errors.push('No valid AI API keys found');
  }
  
  if (keys.hasOpenAI && !AI_CONFIG.OPENAI_API_KEY.startsWith('sk-')) {
    errors.push('Invalid OpenAI API key format');
  }
  
  if (keys.hasClaude && !AI_CONFIG.CLAUDE_API_KEY.startsWith('sk-ant-')) {
    errors.push('Invalid Claude API key format');
  }
  
  if (keys.hasGoogle && !AI_CONFIG.GOOGLE_API_KEY.startsWith('AIza')) {
    errors.push('Invalid Google API key format');
  }
  
  if (AI_CONFIG.MAX_IMAGES_PER_ANALYSIS > 10) {
    warnings.push('High image count may increase costs significantly');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Экспорт всех утилит
export const aiUtils = {
  getAIStatus,
  logAIConfiguration,
  getSetupRecommendations,
  isReadyForProduction,
  estimateAnalysisCost,
  optimizeImageForAI,
  getCachedAnalysis,
  setCachedAnalysis,
  generateCacheKey,
  validateAPIKeys,
  logAPICost,
};
