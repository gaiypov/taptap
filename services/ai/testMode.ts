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
    console.warn(`⚠️ Daily limit reached: ${REQUEST_LIMIT} requests`);
    return false;
  }
  return true;
}

export function incrementRequestCount() {
  requestCount++;
  console.log(`📊 Requests today: ${requestCount}/${REQUEST_LIMIT}`);
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
