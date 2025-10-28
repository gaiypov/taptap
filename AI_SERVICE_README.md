# AI Service Configuration

## Обзор

Файл `services/ai.ts` содержит полную интеграцию различных AI моделей для анализа автомобилей:

- **OpenAI GPT-4 Vision** - для идентификации марки, модели и года автомобиля
- **Claude (Anthropic)** - для комплексного анализа состояния и ценообразования
- **Google Cloud Vision** - для детекции повреждений и OCR одометра
- **Roboflow** - для custom ML моделей (опционально)

## Настройка

### 1. Переменные окружения

Создайте файл `.env` в корне проекта:

```bash
# OpenAI API Key для GPT-4 Vision
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic API Key для Claude
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Google Cloud Vision API Key
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your-google-vision-api-key-here

# Roboflow API Key (опционально)
EXPO_PUBLIC_ROBOFLOW_API_KEY=your-roboflow-api-key-here
```

### 2. Получение API ключей

#### OpenAI
1. Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com)
2. Создайте API ключ в разделе API Keys
3. Убедитесь что у вас есть доступ к GPT-4 Vision

#### Anthropic (Claude)
1. Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com)
2. Создайте API ключ
3. Убедитесь что у вас есть доступ к Claude Sonnet

#### Google Cloud Vision
1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com)
2. Включите Vision API
3. Создайте API ключ в разделе Credentials
4. Ограничьте ключ только Vision API для безопасности

#### Roboflow (опционально)
1. Зарегистрируйтесь на [roboflow.com](https://roboflow.com)
2. Создайте custom модель для детекции повреждений
3. Получите API ключ из настроек проекта

### 3. Режимы работы

Режим работы настраивается через переменную окружения в файле `.env`:

```bash
EXPO_PUBLIC_AI_MODE=mock # или production
```

- **`mock`** - использует мокированные данные для разработки
- **`production`** - использует реальные AI API

Также можно программно изменить режим:

```typescript
import { AI_CONFIG } from '@/services/ai';

// Переключение в продакшн режим
AI_CONFIG.mode = 'production';
```

## Использование

### Основная функция анализа

```typescript
import { analyzeCarVideo } from '@/services/ai';

const result = await analyzeCarVideo(videoUri, (step, progress) => {
  console.log(`${step}: ${progress}%`);
});
```

### Быстрая идентификация

```typescript
import { quickIdentifyCar } from '@/services/ai';

const carInfo = await quickIdentifyCar(imageUri);
console.log(carInfo.brand, carInfo.model);
```

### Проверка качества видео

```typescript
import { validateVideoQuality } from '@/services/ai';

const validation = await validateVideoQuality(videoUri);
if (!validation.isValid) {
  console.log('Issues:', validation.issues);
  console.log('Suggestions:', validation.suggestions);
}
```

## Структура ответа

### Результат анализа автомобиля

```typescript
interface Car {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  location: string;
  videoUrl: string;
  thumbnailUrl: string;
  aiAnalysis?: {
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    conditionScore: number;
    damages: Damage[];
    estimatedPrice: {
      min: number;
      max: number;
    };
    features: string[];
  };
}
```

### Детекция повреждений

```typescript
interface Damage {
  type: 'scratch' | 'dent' | 'rust' | 'crack' | 'other';
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  confidence: number;
}
```

## Безопасность

⚠️ **ВАЖНО**: В продакшене API ключи должны быть на backend!

1. Никогда не коммитьте `.env` файл в git
2. Используйте переменные окружения на сервере
3. Ограничьте API ключи по доменам/IP
4. Регулярно ротируйте ключи

## Стоимость

Примерные цены (на момент создания):

- **OpenAI GPT-4 Vision**: ~$0.01-0.03 за изображение
- **Claude Sonnet**: ~$0.003-0.015 за 1K токенов
- **Google Vision API**: ~$1.50 за 1000 запросов
- **Roboflow**: зависит от плана

## Troubleshooting

### Частые ошибки

1. **"API key not found"** - проверьте переменные окружения
2. **"Rate limit exceeded"** - добавьте задержки между запросами
3. **"Invalid image format"** - убедитесь что изображение в base64
4. **"Model not available"** - проверьте доступность модели в вашем регионе

### Логирование

Включите подробное логирование для отладки:

```typescript
console.log('🚀 Starting video analysis...', videoUri);
console.log('✅ Car identified:', carIdentification);
console.log('❌ Analysis error:', error);
```

## Дополнительные возможности

### Кастомизация провайдеров

```typescript
const AI_CONFIG = {
  providers: {
    carIdentification: 'openai', // или 'claude'
    damageDetection: 'google',    // или 'custom'
    conditionAnalysis: 'claude',  // или 'openai'
    ocrMileage: 'google',         // только Google Vision
    priceEstimation: 'claude',    // или 'openai'
  },
};
```

### Добавление новых моделей

Для добавления новых AI провайдеров:

1. Создайте функцию анализа
2. Добавьте в конфигурацию
3. Интегрируйте в основной pipeline

## Поддержка

При возникновении проблем:

1. Проверьте логи в консоли
2. Убедитесь в корректности API ключей
3. Проверьте лимиты API
4. Обратитесь к документации провайдеров
