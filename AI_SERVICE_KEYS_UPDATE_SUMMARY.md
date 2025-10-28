# AI Service with API Keys - Update Summary

## ✅ Обновления AI сервиса

### 1. Новая структура файлов
```
services/ai/
├── config.ts          # Конфигурация и API ключи
├── utils.ts           # Утилиты для работы с AI
└── index.ts           # Основной AI сервис
```

### 2. services/ai/config.ts
```typescript
export const AI_CONFIG = {
  // API Keys из Constants и process.env
  OPENAI_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  CLAUDE_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_CLAUDE_API_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
  GOOGLE_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '',
  ROBOFLOW_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_ROBOFLOW_API_KEY || process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY || '',
  
  // Режимы работы
  MODE: (process.env.EXPO_PUBLIC_AI_MODE as 'development' | 'production') || 'development',
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
  
  // Приоритеты AI
  PRIMARY_AI: 'claude',
  FALLBACK_ENABLED: true,
  
  // Оптимизация расходов
  MAX_IMAGES_PER_ANALYSIS: 3,
  IMAGE_QUALITY: 0.7,
  ENABLE_CACHING: true,
};
```

### 3. services/ai/utils.ts
- **`getAIStatus()`** - Статус AI сервиса
- **`logAIConfiguration()`** - Логирование конфигурации
- **`getSetupRecommendations()`** - Рекомендации по настройке
- **`isReadyForProduction()`** - Проверка готовности к продакшену
- **`estimateAnalysisCost()`** - Оценка стоимости анализа
- **`getCachedAnalysis()`** - Кэширование результатов
- **`validateAPIKeys()`** - Валидация API ключей

### 4. services/ai/index.ts
- **`analyzeCarVideo()`** - Полный анализ автомобиля
- **`quickIdentifyCar()`** - Быстрая идентификация
- **`validateVideoQuality()`** - Проверка качества видео
- Поддержка всех AI провайдеров (Claude, OpenAI, Google, Mock)
- Автоматический выбор доступного провайдера
- Логирование стоимости запросов

### 5. Обновленная типизация
```typescript
// types/expo-constants.d.ts
declare module 'expo-constants' {
  interface ExpoConfig {
    extra?: {
      // AI API Keys
      EXPO_PUBLIC_OPENAI_API_KEY?: string;
      EXPO_PUBLIC_CLAUDE_API_KEY?: string;
      EXPO_PUBLIC_GOOGLE_API_KEY?: string;
      EXPO_PUBLIC_ROBOFLOW_API_KEY?: string;
      // AI Configuration
      EXPO_PUBLIC_AI_MODE?: 'development' | 'production';
      EXPO_PUBLIC_USE_MOCK?: string;
    };
  }
}
```

### 6. Обновленный app.json
```json
{
  "extra": {
    "apiUrl": "http://localhost:3001/api",
    "aiMode": "production",
    "eas": {
      "projectId": "your-project-id"
    },
    "EXPO_PUBLIC_AI_MODE": "development",
    "EXPO_PUBLIC_USE_MOCK": "true"
  }
}
```

### 7. Обновленный services/ai.ts
```typescript
// Реэкспорт из новой структуры
export {
  analyzeCarVideo,
  quickIdentifyCar,
  validateVideoQuality,
  AI_CONFIG,
  aiUtils,
} from './ai/index';
```

## 🔑 Функции работы с ключами

### Проверка ключей
```typescript
const keys = checkAPIKeys();
// {
//   hasOpenAI: boolean,
//   hasClaude: boolean,
//   hasGoogle: boolean,
//   hasRoboflow: boolean
// }
```

### Выбор AI провайдера
```typescript
const provider = selectAvailableAI();
// 'claude' | 'openai' | 'google' | 'mock'
```

### Логирование стоимости
```typescript
logAPICost('claude', 3); // $0.069 (claude, 3 images)
```

## 💰 Оптимизация расходов

### Настройки экономии
- **MAX_IMAGES_PER_ANALYSIS: 3** - Только 3 лучших кадра
- **IMAGE_QUALITY: 0.7** - Сжатие до 70%
- **ENABLE_CACHING: true** - Кэширование результатов

### Приоритет провайдеров (по стоимости)
1. **Claude** - $0.023 за изображение
2. **OpenAI** - $0.03 за изображение
3. **Google** - $0.0015 за изображение
4. **Mock** - $0 (бесплатно)

## 🚀 Использование

### Базовое использование
```typescript
import { analyzeCarVideo, aiUtils } from '@/services/ai';

// Проверка конфигурации
aiUtils.logAIConfiguration();

// Анализ автомобиля
const result = await analyzeCarVideo(videoUri, (step, progress) => {
  console.log(`${step}: ${progress}%`);
});
```

### Проверка статуса
```typescript
const status = aiUtils.getAIStatus();
console.log('Selected provider:', status.selectedProvider);
console.log('Has API keys:', status.hasKeys);
```

## ⚠️ Важные замечания

### Безопасность
- **API ключи в клиенте НЕ безопасны для продакшена**
- Рекомендуется использовать backend API (уже реализован)
- Ключи могут быть извлечены из приложения

### Переменные окружения
```bash
# .env файл
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-your-key
EXPO_PUBLIC_GOOGLE_API_KEY=AIza-your-key
EXPO_PUBLIC_ROBOFLOW_API_KEY=your-key
EXPO_PUBLIC_AI_MODE=development
EXPO_PUBLIC_USE_MOCK=true
```

## 🔄 Режимы работы

### Development
- Подробное логирование
- Mock режим по умолчанию
- Отображение стоимости запросов

### Production
- Минимальное логирование
- Реальные AI провайдеры
- Оптимизация производительности

## ✅ Готово к использованию

- ✅ Новая структура AI сервиса создана
- ✅ Конфигурация с API ключами
- ✅ Утилиты для работы с AI
- ✅ Оптимизация расходов
- ✅ Кэширование результатов
- ✅ Типизация обновлена
- ✅ Документация создана

Теперь AI сервис готов для работы с реальными API ключами! 🚀

**Примечание**: Для продакшена рекомендуется использовать backend API вместо клиентских ключей.
