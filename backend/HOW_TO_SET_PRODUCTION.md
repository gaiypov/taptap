# 🚀 Как установить NODE_ENV=production для реальной отправки SMS

## 📝 ШАГ 1: Найдите файл `.env` в папке `backend/`

Если файла `.env` нет, создайте его на основе `env-config.txt`:

```bash
cd backend
cp env-config.txt .env
```

## ✏️ ШАГ 2: Откройте файл `backend/.env` в редакторе

Найдите строку:
```bash
NODE_ENV=development
```

## 🔄 ШАГ 3: Измените на `production`

Замените:
```bash
NODE_ENV=development
```

На:
```bash
NODE_ENV=production
```

## ✅ ШАГ 4: Сохраните файл

Сохраните изменения в файле `.env`

## 🔄 ШАГ 5: Перезапустите бэкенд

**ВАЖНО:** После изменения `.env` нужно перезапустить сервер!

1. Остановите текущий сервер (Ctrl+C в терминале)
2. Запустите заново:

```bash
cd backend
npm run dev
```

## 🔍 ШАГ 6: Проверьте, что установлено правильно

При запуске бэкенда вы должны увидеть в логах:

```
✅ SMS провайдер настроен
   URL: https://smspro.nikita.kg/api/message
   Login: superapp
   Sender: bat-bat.kg
   Mode: production    ← Должно быть "production", а не "development"
```

Если видите:
```
⚠️  В development режиме SMS не отправляется реально...
```

Значит `NODE_ENV` все еще `development` - проверьте файл `.env` еще раз.

## 📋 ПОЛНЫЙ ПРИМЕР ФАЙЛА `.env`:

```bash
# Backend Environment Variables
SUPABASE_URL=https://thqlfkngyipdscckbhor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here-360auto-mvp-2025

# SMS Configuration (smspro.nikita.kg)
SMS_LOGIN=superapp
SMS_PASSWORD=83fb772ee0799a422cce18ffd5f497b9
SMS_SENDER=bat-bat.kg
SMS_API_URL=https://smspro.nikita.kg/api/message

# SMS Settings
SMS_CODE_LENGTH=4
SMS_CODE_TTL_MINUTES=5
EXPOSE_TEST_SMS_CODE=false

# Server Configuration
PORT=3001
NODE_ENV=production    ← ВОТ ЭТА СТРОКА ДОЛЖНА БЫТЬ production

# API Video Service
APIVIDEO_API_KEY=your-apivideo-api-key-here
API_VIDEO_KEY=your-apivideo-api-key-here

# Google Vision API
GOOGLE_VISION_API_KEY=your-google-vision-api-key-here
```

## ⚠️ ВАЖНО:

1. **Файл должен называться `.env`** (с точкой в начале), не `env.txt` или `env-config.txt`
2. **Файл должен быть в папке `backend/`**, не в корне проекта
3. **После изменения `.env` обязательно перезапустите сервер**
4. **В production режиме SMS отправляется РЕАЛЬНО** через nikita.kg

## 🧪 ПРОВЕРКА:

После установки `NODE_ENV=production` и перезапуска:

1. Попробуйте отправить SMS на реальный номер
2. Проверьте логи бэкенда - должны быть детальные логи отправки
3. SMS должно прийти на телефон (если все настроено правильно)

## 🔙 ВЕРНУТЬСЯ В DEVELOPMENT:

Если нужно вернуться в development режим (для тестирования без реальной отправки SMS):

```bash
NODE_ENV=development
```

И перезапустите сервер.

