# 🚀 КАК ЗАПУСТИТЬ BACKEND - Простая инструкция

## ❗ ВНИМАНИЕ: Backend НЕ обязателен для работы!

**Приложение работает БЕЗ backend** используя тестовый код `1234` для входа.

---

## 🔑 Чтобы запустить Backend с реальными SMS:

### Шаг 1: Получите Service Role Key из Supabase

1. Откройте https://supabase.com/dashboard
2. Выберите проект `thqlfkngyipdscckbhor`
3. Settings → API → Service Role Key (secret!)
4. Скопируйте ключ

### Шаг 2: Создайте файл .env в папке backend/

```bash
cd backend
nano .env
```

**Содержимое .env:**
```bash
# Supabase
SUPABASE_URL=https://thqlfkngyipdscckbhor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocWxma25neWlwZHNjY2tiaG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjYyMTksImV4cCI6MjA3NTYwMjIxOX0.vpFYGGSs81wgiJgedBe8_VSqle575fPMeTqdJwKHtlE
SUPABASE_SERVICE_ROLE_KEY=<ВАШ_SERVICE_ROLE_KEY_СЮДА>

# SMS (Nikita.kg)
SMS_LOGIN=superapp
SMS_PASSWORD=83fb772ee0799a422cce18ffd5f497b9
SMS_API_URL=https://smspro.nikita.kg/api/message
SMS_SENDER=bat-bat.kg

# API Video
APIVIDEO_API_KEY=OhnRGcRvd7YS7H7TV6uwXRNgLvocjuAfGfR2qAebSKv

# Google Vision AI
GOOGLE_VISION_API_KEY=AIzaSyCDq7xTy4yrPvBr5JjGNUEXaXZ70fVyJGg

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-360auto

# Server
PORT=3001
NODE_ENV=development
```

### Шаг 3: Запустите Backend

```bash
cd backend
npm run build
npm start
```

**Должно появиться:**
```
✅ Backend server running on http://localhost:3001
```

---

## 💡 БЕЗ Backend (Для разработки):

### Просто запустите приложение:
```bash
npx expo start
```

### При входе используйте тестовый код:

1. Введите номер: `+996555123456`
2. Нажмите "Получить код"
3. Увидите: "Сервер временно недоступен"
4. Введите код: **`1234`**
5. ✅ Вход выполнен!

---

## 🔍 Проверка что Backend работает:

```bash
# Проверить порт
lsof -ti:3001

# Проверить health endpoint
curl http://localhost:3001/api/health

# Если работает, увидите:
# {"status":"ok","timestamp":"..."}
```

---

## 🎯 Что выбрать?

### С Backend (реальные SMS):
- ✅ Настоящие SMS коды от Nikita.kg
- ✅ Полная функциональность
- ❌ Требует настройки

### Без Backend (тестовый режим):
- ✅ Работает сразу
- ✅ Тестовый код 1234
- ✅ Подходит для демо инвесторам
- ⚠️ SMS коды не отправляются

---

## 📝 Рекомендация:

**Для демо инвесторам - используйте БЕЗ backend!**

Приложение выглядит и работает идентично, но не требует настройки. Просто скажите инвесторам: "Для демо используется тестовый код 1234".

---

**Дата**: 19 октября 2025  
**Статус**: Backend опционален  
**Тестовый код**: 1234

