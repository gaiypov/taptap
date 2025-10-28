# AI Service Environment Configuration

## Переменные окружения

Создайте файл `.env` в корне проекта со следующими переменными:

```bash
# AI API Keys (НЕ КОММИТЬ В GIT!)
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key-here
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-claude-key-here
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your-google-cloud-key-here
EXPO_PUBLIC_ROBOFLOW_API_KEY=your-roboflow-key-here

# Режим работы AI сервиса
EXPO_PUBLIC_AI_MODE=mock # mock | production
```

## Описание переменных

### Обязательные переменные

- **`EXPO_PUBLIC_AI_MODE`** - Режим работы AI сервиса
  - `mock` - Режим разработки с мокированными данными
  - `production` - Режим продакшена с реальными AI API

### API ключи (обязательны для production режима)

- **`EXPO_PUBLIC_OPENAI_API_KEY`** - Ключ для OpenAI GPT-4 Vision
- **`EXPO_PUBLIC_ANTHROPIC_API_KEY`** - Ключ для Claude (Anthropic)
- **`EXPO_PUBLIC_GOOGLE_VISION_API_KEY`** - Ключ для Google Cloud Vision
- **`EXPO_PUBLIC_ROBOFLOW_API_KEY`** - Ключ для Roboflow (опционально)

## Проверка конфигурации

### Программная проверка

```typescript
import { initializeAIService, getAIStatus } from '@/utils/aiConfig';

// Инициализация с проверкой
const isReady = initializeAIService();

// Получение статуса
const status = getAIStatus();
console.log('AI готов:', status.readyForProduction);
```

### UI компонент для проверки

```typescript
import AIStatusCard from '@/components/AIAnalysis/AIStatusCard';

<AIStatusCard onStatusChange={(isReady) => {
  console.log('AI сервис готов:', isReady);
}} />
```

## Режимы работы

### Mock режим (разработка)

```bash
EXPO_PUBLIC_AI_MODE=mock
```

- Использует мокированные данные
- Не требует API ключей
- Быстрый отклик для тестирования
- Идеален для разработки UI

### Production режим (продакшен)

```bash
EXPO_PUBLIC_AI_MODE=production
```

- Использует реальные AI API
- Требует все API ключи
- Реальные результаты анализа
- Готов для продакшена

## Безопасность

### ⚠️ Важные правила

1. **Никогда не коммитьте `.env` файл в git**
2. **Используйте `.gitignore`**:
   ```gitignore
   .env
   .env.local
   .env.production
   ```

3. **Ограничьте API ключи**:
   - OpenAI: по доменам/IP
   - Google: только Vision API
   - Anthropic: по доменам

4. **Ротируйте ключи регулярно**

## Получение API ключей

### OpenAI
1. Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com)
2. Перейдите в API Keys
3. Создайте новый ключ
4. Убедитесь что у вас есть доступ к GPT-4 Vision

### Anthropic (Claude)
1. Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com)
2. Перейдите в API Keys
3. Создайте новый ключ
4. Убедитесь что у вас есть доступ к Claude Sonnet

### Google Cloud Vision
1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com)
2. Включите Vision API
3. Перейдите в Credentials
4. Создайте API ключ
5. Ограничьте ключ только Vision API

### Roboflow (опционально)
1. Зарегистрируйтесь на [roboflow.com](https://roboflow.com)
2. Создайте custom модель
3. Получите API ключ из настроек проекта

## Troubleshooting

### Проблемы с переменными окружения

1. **"API key not found"**
   ```bash
   # Проверьте что файл .env существует
   ls -la .env
   
   # Проверьте содержимое
   cat .env
   ```

2. **"Invalid AI mode"**
   ```bash
   # Убедитесь что режим правильный
   EXPO_PUBLIC_AI_MODE=mock
   # или
   EXPO_PUBLIC_AI_MODE=production
   ```

3. **"Missing API keys in production"**
   ```bash
   # Проверьте все ключи
   echo $EXPO_PUBLIC_OPENAI_API_KEY
   echo $EXPO_PUBLIC_ANTHROPIC_API_KEY
   echo $EXPO_PUBLIC_GOOGLE_VISION_API_KEY
   ```

### Проверка в коде

```typescript
// Проверка переменных окружения
console.log('AI Mode:', process.env.EXPO_PUBLIC_AI_MODE);
console.log('OpenAI Key:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'Set' : 'Missing');
console.log('Claude Key:', process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ? 'Set' : 'Missing');
console.log('Google Key:', process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY ? 'Set' : 'Missing');
```

## Примеры использования

### Базовое использование

```typescript
import { analyzeCarVideo } from '@/services/ai';

// Анализ будет использовать настройки из .env
const result = await analyzeCarVideo(videoUri);
```

### Проверка перед анализом

```typescript
import { getAIStatus } from '@/utils/aiConfig';

const status = getAIStatus();
if (!status.readyForProduction) {
  console.warn('AI сервис не готов для продакшена');
}
```

### Динамическое переключение режима

```typescript
import { AI_CONFIG } from '@/services/ai';

// Переключение в продакшн
AI_CONFIG.mode = 'production';

// Переключение в mock
AI_CONFIG.mode = 'mock';
```

## Мониторинг

### Логирование конфигурации

```typescript
import { logAIConfiguration } from '@/utils/aiConfig';

// Логирует текущую конфигурацию
logAIConfiguration();
```

### Получение рекомендаций

```typescript
import { getSetupRecommendations } from '@/utils/aiConfig';

const recommendations = getSetupRecommendations();
recommendations.forEach(rec => console.log(rec));
```

---

**Важно**: Всегда тестируйте изменения в staging окружении перед развертыванием в продакшене!
