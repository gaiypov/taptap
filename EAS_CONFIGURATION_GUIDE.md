# EAS Configuration Guide

## 🚀 Expo Application Services (EAS) Setup

### Обновленная конфигурация

#### app.json
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

#### eas.json
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

## 🔧 Установка и настройка

### 1. Установка EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Вход в аккаунт Expo
```bash
eas login
```

### 3. Инициализация проекта
```bash
eas init
```

### 4. Получение Project ID
После инициализации EAS автоматически добавит projectId в app.json:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      }
    }
  }
}
```

## 🏗️ Build конфигурации

### Development Build
```json
{
  "development": {
    "developmentClient": true,
    "distribution": "internal",
    "ios": {
      "resourceClass": "m-medium"
    },
    "android": {
      "resourceClass": "medium"
    }
  }
}
```

**Использование:**
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview Build
```json
{
  "preview": {
    "distribution": "internal",
    "ios": {
      "resourceClass": "m-medium"
    },
    "android": {
      "resourceClass": "medium"
    }
  }
}
```

**Использование:**
```bash
eas build --profile preview --platform all
```

### Production Build
```json
{
  "production": {
    "ios": {
      "resourceClass": "m-medium"
    },
    "android": {
      "resourceClass": "medium"
    }
  }
}
```

**Использование:**
```bash
eas build --profile production --platform all
```

## 📱 Платформы и ресурсы

### iOS Resource Classes
- `m-medium` - 2 vCPU, 4 GB RAM
- `m-large` - 4 vCPU, 8 GB RAM
- `m1-medium` - 2 vCPU, 4 GB RAM (Apple Silicon)
- `m1-large` - 4 vCPU, 8 GB RAM (Apple Silicon)

### Android Resource Classes
- `medium` - 2 vCPU, 4 GB RAM
- `large` - 4 vCPU, 8 GB RAM
- `m1-medium` - 2 vCPU, 4 GB RAM (Apple Silicon)
- `m1-large` - 4 vCPU, 8 GB RAM (Apple Silicon)

## 🔐 Submit конфигурация

### iOS App Store
```json
{
  "ios": {
    "appleId": "your-apple-id@example.com",
    "ascAppId": "your-app-store-connect-app-id",
    "appleTeamId": "your-apple-team-id"
  }
}
```

### Google Play Store
```json
{
  "android": {
    "serviceAccountKeyPath": "./path-to-service-account-key.json",
    "track": "production"
  }
}
```

## 🚀 Команды EAS

### Build команды
```bash
# Build для всех платформ
eas build --platform all

# Build для конкретной платформы
eas build --platform ios
eas build --platform android

# Build с конкретным профилем
eas build --profile production

# Build с локальным сервером разработки
eas build --profile development --local
```

### Submit команды
```bash
# Submit в App Store и Google Play
eas submit --platform all

# Submit только в iOS App Store
eas submit --platform ios

# Submit только в Google Play
eas submit --platform android
```

### Update команды
```bash
# OTA update
eas update --branch production

# Update с сообщением
eas update --branch production --message "Bug fixes and improvements"
```

## 🔧 Environment Variables

### Build-time переменные
```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.360auto.com/api",
        "AI_MODE": "production"
      }
    }
  }
}
```

### Runtime переменные через app.json
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.360auto.com/api",
      "aiMode": "production"
    }
  }
}
```

## 📊 Мониторинг и аналитика

### EAS Analytics
```bash
# Просмотр аналитики
eas analytics

# Просмотр конкретной метрики
eas analytics --metric crashes
```

### Build статус
```bash
# Список всех build'ов
eas build:list

# Детали конкретного build'а
eas build:view [BUILD_ID]
```

## 🔄 CI/CD интеграция

### GitHub Actions
```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Expo Token
```bash
# Получение токена для CI/CD
eas auth:login --non-interactive
```

## 🛠️ Troubleshooting

### Частые проблемы

1. **"Project not found"**
   ```bash
   eas init
   ```

2. **"Build failed"**
   ```bash
   eas build:view [BUILD_ID]
   ```

3. **"Submit failed"**
   ```bash
   eas submit:view [SUBMIT_ID]
   ```

### Логи и отладка
```bash
# Подробные логи build'а
eas build --verbose

# Логи submit'а
eas submit --verbose
```

## 📈 Оптимизация

### Уменьшение размера билда
```json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m-medium",
        "simulator": false
      },
      "android": {
        "resourceClass": "medium",
        "buildType": "apk"
      }
    }
  }
}
```

### Кэширование зависимостей
```json
{
  "build": {
    "production": {
      "cache": {
        "disabled": false
      }
    }
  }
}
```

## 🔒 Безопасность

### Переменные окружения
```bash
# Добавление секретов
eas secret:create --scope project --name API_KEY --value "your-secret-key"
```

### Доступ к секретам в коде
```typescript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.apiKey;
```

---

**Важно**: Всегда тестируйте build'ы в preview режиме перед production!
