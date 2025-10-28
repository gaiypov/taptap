# AI Service with API Keys - Complete Implementation

## 🔑 Новая структура AI сервиса с ключами

### 📁 Структура файлов
```
services/ai/
├── config.ts          # Конфигурация и API ключи
├── utils.ts           # Утилиты для работы с AI
└── index.ts           # Основной AI сервис
```

## 🔧 Конфигурация (services/ai/config.ts)

### API ключи
```typescript
export const AI_CONFIG = {
  // API Keys
  OPENAI_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  CLAUDE_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_CLAUDE_API_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
  GOOGLE_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '',
  ROBOFLOW_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_ROBOFLOW_API_KEY || process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY || '',
  
  // Режимы работы
  MODE: (process.env.EXPO_PUBLIC_AI_MODE as 'development' | 'production') || 'development',
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
  
  // Приоритеты AI
  PRIMARY_AI: 'claude', // 'claude' | 'openai' | 'google'
  FALLBACK_ENABLED: true,
  
  // Оптимизация расходов
  MAX_IMAGES_PER_ANALYSIS: 3,
  IMAGE_QUALITY: 0.7,
  ENABLE_CACHING: true,
};
```

### Функции конфигурации
- **`checkAPIKeys()`** - Проверка наличия и валидности ключей
- **`selectAvailableAI()`** - Выбор доступного AI провайдера
- **`logAPICost()`** - Логирование стоимости запросов

## 🛠️ Утилиты (services/ai/utils.ts)

### Основные функции
```typescript
// Статус AI сервиса
const status = aiUtils.getAIStatus();

// Логирование конфигурации
aiUtils.logAIConfiguration();

// Рекомендации по настройке
const recommendations = aiUtils.getSetupRecommendations();

// Проверка готовности к продакшену
const isReady = aiUtils.isReadyForProduction();

// Оценка стоимости анализа
const cost = aiUtils.estimateAnalysisCost(3, 'claude');
```

### Кэширование
```typescript
// Получение из кэша
const cached = aiUtils.getCachedAnalysis(cacheKey);

// Сохранение в кэш
aiUtils.setCachedAnalysis(cacheKey, result);

// Генерация ключа кэша
const cacheKey = aiUtils.generateCacheKey(videoUri, 'analysis');
```

## 🤖 Основной AI сервис (services/ai/index.ts)

### Главные функции
```typescript
// Полный анализ автомобиля
const result = await analyzeCarVideo(videoUri, (step, progress) => {
  console.log(`${step}: ${progress}%`);
});

// Быстрая идентификация
const carInfo = await quickIdentifyCar(imageUri);

// Проверка качества видео
const validation = await validateVideoQuality(videoUri);
```

### AI провайдеры
- **Claude** - Приоритетный (самый дешевый)
- **OpenAI** - Резервный
- **Google Vision** - Для OCR и детекции
- **Mock** - Для разработки

## 📱 Конфигурация в app.json

### Обновленный app.json
```json
{
  "expo": {
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
}
```

### Переменные окружения (.env)
```bash
# AI API Keys
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-your-claude-key
EXPO_PUBLIC_GOOGLE_API_KEY=AIza-your-google-key
EXPO_PUBLIC_ROBOFLOW_API_KEY=your-roboflow-key

# AI Configuration
EXPO_PUBLIC_AI_MODE=development
EXPO_PUBLIC_USE_MOCK=true
```

## 🔒 Безопасность

### ⚠️ ВАЖНО: API ключи в клиенте
**Этот подход НЕ рекомендуется для продакшена!**

### Проблемы безопасности:
- API ключи могут быть извлечены из приложения
- Нет контроля над использованием ключей
- Нарушение условий использования AI провайдеров
- Потенциальные утечки в production

### ✅ Рекомендуемое решение:
Используйте **backend API** (уже реализован) для хранения ключей на сервере.

## 💰 Оптимизация расходов

### Настройки экономии
```typescript
// Максимум 3 изображения на анализ
MAX_IMAGES_PER_ANALYSIS: 3

// Сжатие изображений до 70%
IMAGE_QUALITY: 0.7

// Кэширование результатов
ENABLE_CACHING: true
```

### Логирование стоимости
```typescript
// Автоматическое логирование в development режиме
logAPICost('claude', 3); // $0.069 (claude, 3 images)
```

### Приоритет провайдеров
1. **Claude** - $0.023 за изображение (самый дешевый)
2. **OpenAI** - $0.03 за изображение
3. **Google** - $0.0015 за изображение (только для >1000 запросов)
4. **Mock** - $0 (бесплатно)

## 🚀 Использование

### Базовое использование
```typescript
import { analyzeCarVideo, quickIdentifyCar, AI_CONFIG, aiUtils } from '@/services/ai';

// Проверка конфигурации
aiUtils.logAIConfiguration();

// Анализ автомобиля
const result = await analyzeCarVideo(videoUri, (step, progress) => {
  console.log(`${step}: ${progress}%`);
});

// Быстрая идентификация
const carInfo = await quickIdentifyCar(imageUri);
```

### Проверка статуса
```typescript
const status = aiUtils.getAIStatus();
console.log('Available providers:', status.availableProviders);
console.log('Selected provider:', status.selectedProvider);
console.log('Has API keys:', status.hasKeys);
```

### Оценка стоимости
```typescript
const cost = aiUtils.estimateAnalysisCost(3, 'claude');
console.log(`Estimated cost: $${cost.toFixed(4)}`);
```

## 🔄 Переключение режимов

### Development режим
```json
{
  "extra": {
    "EXPO_PUBLIC_AI_MODE": "development",
    "EXPO_PUBLIC_USE_MOCK": "true"
  }
}
```

### Production режим
```json
{
  "extra": {
    "EXPO_PUBLIC_AI_MODE": "production",
    "EXPO_PUBLIC_USE_MOCK": "false"
  }
}
```

## 📊 Мониторинг

### Логирование
```typescript
// В development режиме автоматически логируется:
// - Выбранный AI провайдер
// - Стоимость запросов
// - Статус кэширования
// - Ошибки API
```

### Метрики
- Количество запросов к каждому провайдеру
- Общая стоимость AI запросов
- Эффективность кэширования
- Время отклика провайдеров

## 🛠️ Troubleshooting

### Частые проблемы

1. **"No AI API keys found"**
   ```typescript
   const keys = checkAPIKeys();
   console.log('Available keys:', keys);
   ```

2. **"Invalid API key format"**
   - OpenAI: должен начинаться с `sk-`
   - Claude: должен начинаться с `sk-ant-`
   - Google: должен начинаться с `AIza`

3. **"High API costs"**
   ```typescript
   // Уменьшите количество изображений
   MAX_IMAGES_PER_ANALYSIS: 2
   
   // Включите кэширование
   ENABLE_CACHING: true
   ```

## 🎯 Рекомендации

### Для разработки:
- Используйте `USE_MOCK: true`
- Включите подробное логирование
- Тестируйте с разными провайдерами

### Для продакшена:
- **НЕ используйте API ключи в клиенте**
- Используйте backend API (уже реализован)
- Настройте мониторинг расходов
- Ограничьте количество запросов

---

**Важно**: Для продакшена используйте backend API вместо клиентских ключей!
