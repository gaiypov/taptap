import Constants from 'expo-constants';

// Получаем API ключи из .env
export const AI_CONFIG = {
  // API Keys
  OPENAI_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  CLAUDE_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_CLAUDE_API_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
  GOOGLE_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '',
  ROBOFLOW_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_ROBOFLOW_API_KEY || process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY || '',
  
  // Режимы работы
  MODE: (process.env.EXPO_PUBLIC_AI_MODE as 'development' | 'production') || 'development',
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
  
  // Приоритеты AI (какой использовать первым)
  PRIMARY_AI: 'claude', // 'claude' | 'openai' | 'google'
  FALLBACK_ENABLED: true,
  
  // Оптимизация расходов
  MAX_IMAGES_PER_ANALYSIS: 3, // Только 3 лучших кадра
  IMAGE_QUALITY: 0.7, // Сжатие для экономии
  ENABLE_CACHING: true, // Кешируем повторные запросы
};

// Проверка наличия ключей
export function checkAPIKeys(): {
  hasOpenAI: boolean;
  hasClaude: boolean;
  hasGoogle: boolean;
  hasRoboflow: boolean;
} {
  return {
    hasOpenAI: !!AI_CONFIG.OPENAI_API_KEY && AI_CONFIG.OPENAI_API_KEY.startsWith('sk-'),
    hasClaude: !!AI_CONFIG.CLAUDE_API_KEY && AI_CONFIG.CLAUDE_API_KEY.startsWith('sk-ant-'),
    hasGoogle: !!AI_CONFIG.GOOGLE_API_KEY && AI_CONFIG.GOOGLE_API_KEY.startsWith('AIza'),
    hasRoboflow: !!AI_CONFIG.ROBOFLOW_API_KEY,
  };
}

// Выбор доступного AI
export function selectAvailableAI(): 'claude' | 'openai' | 'google' | 'mock' {
  const keys = checkAPIKeys();
  
  if (AI_CONFIG.USE_MOCK) return 'mock';
  
  // Приоритет: Claude (дешевле) → OpenAI → Google → Mock
  if (keys.hasClaude) return 'claude';
  if (keys.hasOpenAI) return 'openai';
  if (keys.hasGoogle) return 'google';
  
  console.warn('⚠️ No AI API keys found, using mock data');
  return 'mock';
}

// Лог стоимости запроса
export function logAPICost(provider: string, imageCount: number, tokens?: number) {
  if (AI_CONFIG.MODE !== 'development') return;
  
  const costs = {
    claude: imageCount * 0.023,
    openai: imageCount * 0.03,
    google: imageCount > 1000 ? imageCount * 0.0015 : 0,
  };
  
  const cost = costs[provider as keyof typeof costs] || 0;
  console.log(`💰 AI Cost: $${cost.toFixed(4)} (${provider}, ${imageCount} images)`);
}
