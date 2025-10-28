# EAS Configuration Update - Summary

## ✅ Обновления конфигурации

### 1. app.json
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3001/api",
      "aiMode": "production",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 2. eas.json (новый файл)
```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account-key.json",
        "track": "production"
      }
    }
  }
}
```

### 3. Типизация обновлена
```typescript
// types/expo-constants.d.ts
declare module 'expo-constants' {
  interface ExpoConfig {
    extra?: {
      apiUrl?: string;
      aiMode?: 'mock' | 'production';
      environment?: 'development' | 'staging' | 'production';
      eas?: {
        projectId?: string;
      };
    };
  }
}
```

## 🚀 EAS Build профили

### Development
- **Цель**: Разработка с Expo Dev Client
- **Распределение**: Internal
- **Ресурсы**: Medium (2 vCPU, 4 GB RAM)

### Preview
- **Цель**: Тестирование перед релизом
- **Распределение**: Internal
- **Ресурсы**: Medium (2 vCPU, 4 GB RAM)

### Production
- **Цель**: Финальный релиз
- **Распределение**: Store
- **Ресурсы**: Medium (2 vCPU, 4 GB RAM)

## 📱 Команды для использования

### Инициализация EAS
```bash
npm install -g @expo/eas-cli
eas login
eas init
```

### Build команды
```bash
# Development build
eas build --profile development --platform all

# Preview build
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

### Submit команды
```bash
# Submit в магазины
eas submit --platform all

# Submit только iOS
eas submit --platform ios

# Submit только Android
eas submit --platform android
```

## 🔧 Настройка для продакшена

### 1. Получение Project ID
После `eas init` получите реальный projectId:
```json
{
  "eas": {
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

### 2. Настройка App Store Connect
```json
{
  "ios": {
    "appleId": "your-real-apple-id@example.com",
    "ascAppId": "your-real-app-store-connect-app-id",
    "appleTeamId": "your-real-apple-team-id"
  }
}
```

### 3. Настройка Google Play Console
```json
{
  "android": {
    "serviceAccountKeyPath": "./real-service-account-key.json",
    "track": "production"
  }
}
```

## 🔒 Безопасность

### Переменные окружения
```bash
# Добавление секретов
eas secret:create --scope project --name API_KEY --value "your-secret-key"
```

### Доступ в коде
```typescript
import Constants from 'expo-constants';

const projectId = Constants.expoConfig?.extra?.eas?.projectId;
```

## 📊 Мониторинг

### Build статус
```bash
# Список build'ов
eas build:list

# Детали build'а
eas build:view [BUILD_ID]
```

### Submit статус
```bash
# Список submit'ов
eas submit:list

# Детали submit'а
eas submit:view [SUBMIT_ID]
```

## 🎯 Следующие шаги

### 1. Инициализация
```bash
eas init
```

### 2. Настройка projectId
Замените `"your-project-id"` на реальный ID из EAS

### 3. Настройка магазинов
Обновите Apple ID, Google Play credentials

### 4. Первый build
```bash
eas build --profile preview --platform all
```

### 5. Тестирование
Протестируйте build перед production

## ✅ Готово к использованию

- ✅ EAS конфигурация добавлена в app.json
- ✅ eas.json создан с профилями build'ов
- ✅ Типизация обновлена для EAS
- ✅ Документация создана
- ✅ Готово к инициализации EAS

Теперь проект готов для использования EAS Build и Submit! 🚀
