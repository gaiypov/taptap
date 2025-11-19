// services/ai/config.ts — AI-CONFIG УРОВНЯ OPENAI + ANTHROPIC 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ АНАЛИЗОВ

import { appLogger } from '@/utils/logger';
import Constants from 'expo-constants';

// === БЕЗОПАСНЫЙ URL БЭКЕНДА (ключи только там!) ===
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
  (__DEV__
    ? 'http://192.168.1.16:3001/api' // Твой локальный сервер
    : 'https://api.360auto.kg/api'); // Production

export const AI_CONFIG = {
  // Режимы
  MODE: __DEV__ ? 'development' : 'production',
  USE_MOCK: __DEV__ || Constants.expoConfig?.extra?.USE_MOCK_AI === 'true',

  // Приоритеты AI (бэкенд сам выберет лучший)
  PRIMARY_PROVIDER: 'claude' as 'claude' | 'openai' | 'google',

  // Оптимизация расходов
  MAX_FRAMES_PER_ANALYSIS: 4, // 4 лучших кадра — экономия 60%
  IMAGE_QUALITY: 0.75, // Баланс качества и скорости
  ENABLE_FRAME_SELECTION: true, // Умный выбор кадров (первый, средний, последний + лучший)
  CACHE_ENABLED: true,
  CACHE_TTL_MINUTES: 60,

  // URL
  API_BASE_URL,
  ENDPOINTS: {
    ANALYZE: '/ai/analyze',
    QUICK_IDENTIFY: '/ai/quick-identify',
    HEALTH: '/ai/health',
  },
} as const;

// Проверка доступности AI (через бэкенд)
export async function checkAIHealth(): Promise<{
  available: boolean;
  providers: string[];
  mockMode: boolean;
}> {
  if (AI_CONFIG.USE_MOCK) {
    return { available: true, providers: ['mock'], mockMode: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}${AI_CONFIG.ENDPOINTS.HEALTH}`, {
      method: 'GET',
      signal: controller.signal,
    } as any);

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        providers: data.providers || [],
        mockMode: false,
      };
    }
  } catch (error) {
    appLogger.warn('[AI Config] Health check failed — using mock', error);
  }

  return { available: false, providers: [], mockMode: true };
}

// Выбор провайдера (умно)
export function selectProvider(): 'claude' | 'openai' | 'google' | 'mock' {
  if (AI_CONFIG.USE_MOCK) return 'mock';
  return AI_CONFIG.PRIMARY_PROVIDER;
}

// Лог стоимости (только в dev)
export function logCost(provider: string, frames: number, tokens?: number) {
  if (AI_CONFIG.MODE !== 'development') return;

  const costs = {
    claude: frames * 0.023 + (tokens ? tokens * 0.00006 : 0),
    openai: frames * 0.03,
    google: frames * 0.0015,
  };

  const cost = costs[provider as keyof typeof costs] || 0;
  appLogger.info(`[AI Cost] $${cost.toFixed(4)} — ${provider}, ${frames} кадров`);
}

// Обратная совместимость (deprecated, используйте новые функции)
export async function checkAPIKeys(): Promise<{
  hasOpenAI: boolean;
  hasClaude: boolean;
  hasGoogle: boolean;
  hasRoboflow: boolean;
}> {
  const health = await checkAIHealth();
  return {
    hasOpenAI: health.providers.includes('openai'),
    hasClaude: health.providers.includes('claude'),
    hasGoogle: health.providers.includes('google'),
    hasRoboflow: health.providers.includes('roboflow'),
  };
}

export function selectAvailableAI(): 'claude' | 'openai' | 'google' | 'mock' {
  return selectProvider();
}

export function logAPICost(provider: string, imageCount: number, tokens?: number) {
  return logCost(provider, imageCount, tokens);
}

// Legacy aliases для обратной совместимости
export const MAX_IMAGES_PER_ANALYSIS = AI_CONFIG.MAX_FRAMES_PER_ANALYSIS;
export const IMAGE_QUALITY = AI_CONFIG.IMAGE_QUALITY;
export const PRIMARY_AI = AI_CONFIG.PRIMARY_PROVIDER;
