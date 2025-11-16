// services/ai/testMode.ts
// Режим экономного тестирования

export const TEST_CONFIG = {
  // Используем ТОЛЬКО 1 изображение для экономии
  USE_SINGLE_IMAGE: true,
  
  // Кешируем результаты
  CACHE_RESULTS: true,
  
  // Лимиты на день тестирования
  MAX_REQUESTS_PER_DAY: 20,
  
  // Какие AI использовать
  ENABLE_CLAUDE: true,      // Главный (самый дешевый)
  ENABLE_OPENAI: false,     // Только если Claude не работает
  ENABLE_GOOGLE: true,      // Только для OCR (бесплатно)
  ENABLE_YOLO: false,       // Пропускаем для MVP
};

// Счетчик запросов
let requestCount = 0;
const REQUEST_LIMIT = TEST_CONFIG.MAX_REQUESTS_PER_DAY;

export function canMakeRequest(): boolean {
  if (requestCount >= REQUEST_LIMIT) {
    return false;
  }
  return true;
}

export function incrementRequestCount() {
  requestCount++;
}

export function resetRequestCount() {
  requestCount = 0;
}

// Простой кеш
const analysisCache = new Map<string, any>();

export function getCachedAnalysis(videoUri: string): any | null {
  return analysisCache.get(videoUri) || null;
}

export function setCachedAnalysis(videoUri: string, result: any) {
  analysisCache.set(videoUri, result);
}

/**
 * Тестовый режим AI согласно промпту CursorAI-Prompt.md
 * Используется для разработки без API ключей
 */
export async function useTestMode(
  provider: 'openai' | 'claude' | 'google' | 'yolo',
  mockData?: any
): Promise<any> {
  // Test mode enabled
  
  // Простые мок данные для разработки
  const mockResults = {
    openai: {
      description: 'Отличное состояние, без повреждений',
      estimatedPrice: 2500000,
      condition: 'excellent',
    },
    claude: {
      analysis: 'Справедливая цена для данной модели',
      condition: 'good',
    },
    google: {
      labels: ['car', 'bmw', 'sedan', 'black'],
      objects: [{ name: 'car', confidence: 0.95 }],
    },
    yolo: {
      objects: [{ type: 'car', confidence: 0.9 }],
    },
  };
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Имитация задержки
  
  return mockResults[provider] || mockData;
}
