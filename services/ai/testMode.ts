// services/ai/testMode.ts — TEST MODE УРОВНЯ OPENAI + ANTHROPIC 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К РАЗРАБОТКЕ БЕЗ РАСХОДОВ

import { appLogger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ai_test_mode';
const DAILY_LIMIT = 30; // Максимум запросов в день

interface TestConfig {
  useSingleImage: boolean;
  cacheEnabled: boolean;
  dailyLimit: number;
  enabledProviders: {
    claude: boolean;
    openai: boolean;
    google: boolean;
    yolo: boolean;
  };
}

export const TEST_CONFIG: TestConfig = {
  useSingleImage: true,
  cacheEnabled: true,
  dailyLimit: DAILY_LIMIT,
  enabledProviders: {
    claude: true,
    openai: false,
    google: true,
    yolo: false,
  },
};

// Обратная совместимость (deprecated, используйте enabledProviders)
export const ENABLE_CLAUDE = TEST_CONFIG.enabledProviders.claude;
export const ENABLE_OPENAI = TEST_CONFIG.enabledProviders.openai;
export const ENABLE_GOOGLE = TEST_CONFIG.enabledProviders.google;
export const ENABLE_YOLO = TEST_CONFIG.enabledProviders.yolo;
export const USE_SINGLE_IMAGE = TEST_CONFIG.useSingleImage;
export const CACHE_RESULTS = TEST_CONFIG.cacheEnabled;
export const MAX_REQUESTS_PER_DAY = TEST_CONFIG.dailyLimit;

// Счётчик запросов (сохраняется между сессиями)
let requestCount = 0;
let lastResetDate = new Date().toDateString();

// Инициализация при старте
export async function initTestMode(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { count, date } = JSON.parse(saved);
      if (date === new Date().toDateString()) {
        requestCount = count;
      } else {
        requestCount = 0; // Новый день — сброс
      }
    }
  } catch (error) {
    appLogger.error('[TestMode] Init failed', { error });
  }
}

// Проверка лимита
export function canMakeRequest(): boolean {
  if (new Date().toDateString() !== lastResetDate) {
    requestCount = 0;
    lastResetDate = new Date().toDateString();
  }

  return requestCount < DAILY_LIMIT;
}

// Инкремент счётчика (async для сохранения в AsyncStorage)
export async function incrementRequestCount(): Promise<void> {
  requestCount++;
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        count: requestCount,
        date: new Date().toDateString(),
      })
    );
  } catch (error) {
    appLogger.error('[TestMode] Failed to save request count', { error });
  }
}

// Синхронная версия для обратной совместимости (deprecated)
export function incrementRequestCountSync(): void {
  requestCount++;
}

// Кэш
const cache = new Map<string, any>();

export function getCachedAnalysis(key: string): any | null {
  return TEST_CONFIG.cacheEnabled ? cache.get(key) || null : null;
}

export function setCachedAnalysis(key: string, result: any): void {
  if (TEST_CONFIG.cacheEnabled) {
    cache.set(key, result);
  }
}

// Mock результаты
export const MOCK_RESULTS = {
  car: {
    brand: 'Toyota',
    model: 'Camry',
    year: 2021,
    color: 'черный',
    mileage: 42000,
    transmission: 'automatic',
    aiAnalysis: {
      condition: 'excellent',
      conditionScore: 94,
      damages: [],
      estimatedPrice: { min: 2600000, max: 2850000 },
      features: ['кожа', 'камера 360', 'подогрев', 'люк'],
    },
  },
  horse: {
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
  },
  real_estate: {
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
  },
};

export async function runMockAnalysis(
  category: 'car' | 'horse' | 'real_estate',
  onProgress?: (stage: string, progress: number) => void
): Promise<any> {
  const steps = [
    { stage: 'Извлечение кадров...', progress: 20 },
    { stage: 'Анализ...', progress: 60 },
    { stage: 'Оценка цены...', progress: 90 },
    { stage: 'Готово!', progress: 100 },
  ];

  for (const step of steps) {
    onProgress?.(step.stage, step.progress);
    await new Promise((r) => setTimeout(r, 600));
  }

  return MOCK_RESULTS[category];
}

// Сброс счётчика (для тестирования)
export function resetRequestCount(): void {
  requestCount = 0;
  lastResetDate = new Date().toDateString();
}

// Получить текущий счётчик (для отладки)
export function getRequestCount(): number {
  return requestCount;
}
