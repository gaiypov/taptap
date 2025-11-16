# 🔐 Environment Variables Setup Guide

## ⚠️ ВАЖНО: Секретные ключи удалены из app.json

Все секретные ключи теперь должны храниться в `.env` файле.

---

## 📋 Быстрая настройка

### 1. Создайте `.env` файл

Скопируйте шаблон:
```bash
cp .env.local.example .env
```

### 2. Заполните секретные ключи

Откройте `.env` и заполните реальные значения:

```bash
# Supabase Service Role Key (Backend only)
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# Google Vision API Key (Backend only)
GOOGLE_VISION_API_KEY=your-actual-google-vision-key

# SMS Password (Backend only)
EXPO_PUBLIC_SMS_PASSWORD=your-actual-sms-password

# API Video Key (Client-side)
EXPO_PUBLIC_APIVIDEO_API_KEY=your-actual-apivideo-key
```

### 3. Проверьте .gitignore

Убедитесь, что `.env` в `.gitignore`:
```gitignore
.env
.env.local
```

---

## 🔑 Где взять ключи?

### Supabase Service Role Key
1. Зайдите в Supabase Dashboard
2. Settings → API
3. Скопируйте `service_role` key (⚠️ НЕ anon key!)

### Google Vision API Key
1. Google Cloud Console
2. APIs & Services → Credentials
3. Создайте или скопируйте API Key

### SMS Password
1. Панель smspro.nikita.kg
2. Настройки аккаунта
3. Скопируйте пароль

### API Video Key
1. api.video Dashboard
2. Settings → API Keys
3. Скопируйте API Key

---

## 📱 Для Expo/React Native

### Публичные переменные (можно в app.json)

Эти переменные безопасны для публикации:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon key безопасен)
- `EXPO_PUBLIC_SMS_LOGIN`
- `EXPO_PUBLIC_SMS_API_URL`
- `EXPO_PUBLIC_SMS_SENDER`

### Секретные переменные (только в .env)

Эти переменные НЕ должны быть в app.json:
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️
- `GOOGLE_VISION_API_KEY` ⚠️
- `EXPO_PUBLIC_SMS_PASSWORD` ⚠️
- `EXPO_PUBLIC_APIVIDEO_API_KEY` ⚠️

---

## 🔧 Использование в коде

Код автоматически читает из:
1. `Constants.expoConfig?.extra?.KEY` (app.json)
2. `process.env.KEY` (.env файл)
3. Fallback значение (если есть)

Пример:
```typescript
const apiKey = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_APIVIDEO_API_KEY || 
  process.env.EXPO_PUBLIC_APIVIDEO_API_KEY || 
  '';
```

---

## 🚨 Безопасность

### ✅ Правильно:
- Хранить секреты в `.env`
- `.env` в `.gitignore`
- Использовать `.env.example` как шаблон

### ❌ Неправильно:
- Коммитить `.env` в Git
- Хранить секреты в `app.json`
- Публиковать ключи в документации

---

## 🔄 После получения новых ключей

Если ключи были скомпрометированы:

1. **Ротируйте все ключи** (сгенерируйте новые)
2. **Обновите `.env`** с новыми значениями
3. **Проверьте логи** на подозрительную активность
4. **Ограничьте старые ключи** (если возможно)

---

## 📞 Помощь

Если что-то не работает:
1. Проверьте, что `.env` файл существует
2. Проверьте, что переменные правильно названы
3. Перезапустите Metro bundler: `npm start -- --clear`
4. Проверьте консоль на ошибки

---

**Статус:** ✅ Секреты удалены из app.json  
**Дата:** Январь 2025

