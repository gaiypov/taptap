# AI Service Deployment Guide

## Обзор развертывания

Этот гайд поможет вам развернуть AI сервис для анализа автомобилей в продакшене.

## Структура файлов

```
services/
├── ai.ts                 # Основной AI сервис
├── api.ts               # API клиент
├── storage.ts           # Сервис хранения
└── index.ts             # Экспорты

types/
└── index.ts             # TypeScript типы

utils/
├── helpers.ts           # Общие утилиты
└── aiHelpers.ts         # AI утилиты

components/
└── AIAnalysis/
    └── AIAnalysisExample.tsx  # Пример компонента

examples/
└── AIUsageExamples.ts   # Примеры использования

__tests__/
└── services/
    └── ai.test.ts       # Тесты

AI_SERVICE_README.md     # Документация
```

## Шаги развертывания

### 1. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# OpenAI API Key
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic API Key  
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Google Cloud Vision API Key
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your-google-vision-api-key-here

# Roboflow API Key (опционально)
EXPO_PUBLIC_ROBOFLOW_API_KEY=your-roboflow-api-key-here
```

### 2. Установка зависимостей

```bash
# Основные зависимости (уже должны быть установлены)
npm install expo-file-system

# Для тестирования
npm install --save-dev jest @types/jest

# Для работы с видео (опционально)
npm install expo-video-thumbnails
```

### 3. Настройка API ключей

#### OpenAI
1. Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com)
2. Создайте API ключ
3. Убедитесь что у вас есть доступ к GPT-4 Vision
4. Добавьте ключ в `.env`

#### Anthropic (Claude)
1. Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com)
2. Создайте API ключ
3. Убедитесь что у вас есть доступ к Claude Sonnet
4. Добавьте ключ в `.env`

#### Google Cloud Vision
1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com)
2. Включите Vision API
3. Создайте API ключ
4. Ограничьте ключ только Vision API
5. Добавьте ключ в `.env`

### 4. Переключение в продакшн режим

В файле `services/ai.ts` измените:

```typescript
const AI_CONFIG = {
  mode: 'production', // Изменить с 'mock' на 'production'
  // ...
};
```

### 5. Тестирование

Запустите тесты:

```bash
npm test
```

Или тестируйте вручную:

```typescript
import { analyzeCarVideo } from '@/services/ai';

// Тест с мок данными
const result = await analyzeCarVideo('test-video.mp4');
console.log(result);
```

### 6. Интеграция в приложение

#### Базовое использование

```typescript
import { analyzeCarVideo } from '@/services/ai';

const handleVideoUpload = async (videoUri: string) => {
  try {
    const result = await analyzeCarVideo(videoUri, (step, progress) => {
      console.log(`${step}: ${progress}%`);
    });
    
    // Используйте результат
    console.log('Автомобиль:', result.brand, result.model);
  } catch (error) {
    console.error('Ошибка анализа:', error);
  }
};
```

#### С UI компонентом

```typescript
import AIAnalysisExample from '@/components/AIAnalysis/AIAnalysisExample';

// В вашем компоненте
<AIAnalysisExample 
  videoUri={selectedVideoUri}
  imageUri={selectedImageUri}
/>
```

### 7. Мониторинг и логирование

Добавьте логирование для мониторинга:

```typescript
// В services/ai.ts
console.log('🚀 Starting video analysis...', videoUri);
console.log('✅ Car identified:', carIdentification);
console.log('❌ Analysis error:', error);
```

### 8. Оптимизация производительности

#### Кэширование результатов
```typescript
// Добавьте кэширование в ваш сервис
const analysisCache = new Map<string, Partial<Car>>();

export async function analyzeCarVideoWithCache(videoUri: string) {
  if (analysisCache.has(videoUri)) {
    return analysisCache.get(videoUri);
  }
  
  const result = await analyzeCarVideo(videoUri);
  analysisCache.set(videoUri, result);
  return result;
}
```

#### Ограничение запросов
```typescript
// Добавьте rate limiting
const requestQueue = [];
const MAX_CONCURRENT_REQUESTS = 3;

export async function throttledAnalysis(videoUri: string) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ videoUri, resolve, reject });
    processQueue();
  });
}
```

### 9. Безопасность

#### Защита API ключей
- Никогда не коммитьте `.env` файл
- Используйте переменные окружения на сервере
- Ограничьте API ключи по доменам/IP
- Регулярно ротируйте ключи

#### Валидация входных данных
```typescript
export function validateVideoInput(videoUri: string): boolean {
  // Проверка формата файла
  const validExtensions = ['.mp4', '.mov', '.avi'];
  const hasValidExtension = validExtensions.some(ext => 
    videoUri.toLowerCase().endsWith(ext)
  );
  
  // Проверка размера файла (если возможно)
  // Проверка длительности видео
  
  return hasValidExtension;
}
```

### 10. Масштабирование

#### Горизонтальное масштабирование
- Используйте load balancer
- Разделите анализ на микросервисы
- Используйте очереди для обработки

#### Вертикальное масштабирование
- Увеличьте лимиты API
- Оптимизируйте обработку изображений
- Используйте CDN для статики

### 11. Мониторинг ошибок

#### Sentry интеграция
```typescript
import * as Sentry from '@sentry/react-native';

export async function analyzeCarVideoWithErrorTracking(videoUri: string) {
  try {
    return await analyzeCarVideo(videoUri);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'ai-analysis',
        videoUri: videoUri,
      },
    });
    throw error;
  }
}
```

### 12. Аналитика

#### Отслеживание использования
```typescript
import { Analytics } from 'expo-analytics';

export async function trackAnalysisEvent(event: string, properties: any) {
  Analytics.track(event, properties);
}

// Использование
await trackAnalysisEvent('car_analysis_started', {
  video_duration: videoDuration,
  user_id: userId,
});
```

## Troubleshooting

### Частые проблемы

1. **"API key not found"**
   - Проверьте переменные окружения
   - Убедитесь что файл `.env` загружается

2. **"Rate limit exceeded"**
   - Добавьте задержки между запросами
   - Увеличьте лимиты API

3. **"Invalid image format"**
   - Проверьте что изображение в base64
   - Убедитесь в корректности формата

4. **"Model not available"**
   - Проверьте доступность модели в регионе
   - Обновите версию API

### Логи для отладки

```typescript
// Включите подробное логирование
const DEBUG_MODE = __DEV__;

if (DEBUG_MODE) {
  console.log('AI Config:', AI_CONFIG);
  console.log('Video URI:', videoUri);
  console.log('Analysis result:', result);
}
```

## Поддержка

При возникновении проблем:

1. Проверьте логи в консоли
2. Убедитесь в корректности API ключей
3. Проверьте лимиты API
4. Обратитесь к документации провайдеров

## Обновления

Для обновления AI сервиса:

1. Обновите зависимости
2. Проверьте совместимость API
3. Обновите тесты
4. Протестируйте в staging
5. Разверните в продакшене

---

**Важно**: Всегда тестируйте изменения в staging окружении перед развертыванием в продакшене!
