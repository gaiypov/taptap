# Expo Constants Configuration Guide

## 🔧 Безопасная конфигурация с expo-constants

### Установленные зависимости
```bash
npx expo install expo-constants
npm install --save-dev @types/node
```

## 📱 Конфигурация в app.json

### Обновленный app.json
```json
{
  "expo": {
    "name": "360AutoMVP",
    "slug": "360AutoMVP",
    "version": "1.0.0",
    "extra": {
      "apiUrl": "http://localhost:3001/api",
      "aiMode": "production"
    }
  }
}
```

### Переменные конфигурации
- **`apiUrl`** - URL backend API
- **`aiMode`** - Режим работы AI сервиса (`mock` | `production`)
- **`environment`** - Окружение (`development` | `staging` | `production`)

## 🔒 Безопасность

### Преимущества expo-constants над process.env:
1. **Компилируется в билд** - переменные встраиваются в приложение
2. **Нет доступа к process.env** - более безопасно для React Native
3. **Типизация** - полная поддержка TypeScript
4. **Кэширование** - быстрый доступ к конфигурации

### Что НЕ должно быть в конфигурации:
- ❌ API ключи (только на backend)
- ❌ Секретные токены
- ❌ Пароли
- ❌ Приватные данные

### Что МОЖНО в конфигурации:
- ✅ URL серверов
- ✅ Режимы работы
- ✅ Настройки UI
- ✅ Публичные конфигурации

## 💻 Использование в коде

### Импорт
```typescript
import Constants from 'expo-constants';
```

### Доступ к конфигурации
```typescript
// URL backend API
const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

// Режим AI сервиса
const aiMode = Constants.expoConfig?.extra?.aiMode || 'mock';

// Проверка окружения
const isProduction = Constants.expoConfig?.extra?.environment === 'production';
```

### Обновленный AI сервис
```typescript
// services/ai.ts
import Constants from 'expo-constants';

const AI_CONFIG = {
  mode: (Constants.expoConfig?.extra?.aiMode as 'mock' | 'production') || 'mock',
  backendUrl: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api',
  settings: {
    maxVideoSize: 50 * 1024 * 1024,
    maxFramesPerRequest: 10,
    requestTimeout: 30000,
  },
};
```

### Обновленный API сервис
```typescript
// services/api.ts
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';
```

## 🎯 Типизация

### Создан файл типов
```typescript
// types/expo-constants.d.ts
import Constants from 'expo-constants';

declare module 'expo-constants' {
  interface ExpoConfig {
    extra?: {
      apiUrl?: string;
      aiMode?: 'mock' | 'production';
      environment?: 'development' | 'staging' | 'production';
    };
  }
}
```

### Использование с типизацией
```typescript
// Полная типизация
const apiUrl: string = Constants.expoConfig?.extra?.apiUrl || 'default';
const aiMode: 'mock' | 'production' = Constants.expoConfig?.extra?.aiMode || 'mock';
```

## 🔄 Разные окружения

### Development
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3001/api",
      "aiMode": "mock",
      "environment": "development"
    }
  }
}
```

### Staging
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://staging-api.360auto.com/api",
      "aiMode": "production",
      "environment": "staging"
    }
  }
}
```

### Production
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.360auto.com/api",
      "aiMode": "production",
      "environment": "production"
    }
  }
}
```

## 🚀 Развертывание

### 1. Обновление конфигурации
```bash
# Измените app.json для нужного окружения
# Затем пересоберите приложение
npx expo build
```

### 2. Проверка конфигурации
```typescript
// В компоненте
console.log('API URL:', Constants.expoConfig?.extra?.apiUrl);
console.log('AI Mode:', Constants.expoConfig?.extra?.aiMode);
console.log('Environment:', Constants.expoConfig?.extra?.environment);
```

### 3. Условная логика
```typescript
const isDevelopment = Constants.expoConfig?.extra?.environment === 'development';

if (isDevelopment) {
  console.log('Development mode - detailed logging enabled');
} else {
  console.log('Production mode - minimal logging');
}
```

## 🔍 Отладка

### Проверка конфигурации
```typescript
// В любом компоненте
import Constants from 'expo-constants';

const DebugConfig = () => {
  return (
    <View>
      <Text>API URL: {Constants.expoConfig?.extra?.apiUrl}</Text>
      <Text>AI Mode: {Constants.expoConfig?.extra?.aiMode}</Text>
      <Text>Environment: {Constants.expoConfig?.extra?.environment}</Text>
    </View>
  );
};
```

### Логирование конфигурации
```typescript
// В utils/aiConfig.ts
export function logConfiguration() {
  console.log('🔧 App Configuration:');
  console.log(`   API URL: ${Constants.expoConfig?.extra?.apiUrl}`);
  console.log(`   AI Mode: ${Constants.expoConfig?.extra?.aiMode}`);
  console.log(`   Environment: ${Constants.expoConfig?.extra?.environment}`);
}
```

## 📊 Мониторинг

### Отслеживание конфигурации
```typescript
// В analytics
import Constants from 'expo-constants';

Analytics.track('app_configuration', {
  apiUrl: Constants.expoConfig?.extra?.apiUrl,
  aiMode: Constants.expoConfig?.extra?.aiMode,
  environment: Constants.expoConfig?.extra?.environment,
});
```

## ✅ Преимущества новой конфигурации

### 🔒 Безопасность
- Конфигурация компилируется в билд
- Нет доступа к process.env
- Типизированные переменные

### 🚀 Производительность
- Быстрый доступ к конфигурации
- Кэширование значений
- Нет runtime парсинга

### 🛠️ Удобство разработки
- Полная типизация TypeScript
- Автодополнение в IDE
- Валидация на этапе компиляции

### 📱 Кроссплатформенность
- Работает на iOS, Android, Web
- Единая конфигурация для всех платформ
- Нет различий в доступе к переменным

---

**Важно**: Всегда проверяйте конфигурацию после обновления app.json!
