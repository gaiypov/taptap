# 🚀 Запуск бэкенда

## Быстрый старт

```bash
cd backend
npm run dev
```

## ✅ Проверка перед запуском

### 1. Убедитесь, что файл `.env` существует

```bash
cd backend
ls -la .env
```

Если файла нет:
```bash
cp env-config.txt .env
# Затем отредактируйте .env и укажите реальные значения
```

### 2. Проверьте обязательные переменные

Файл `.env` должен содержать:
- `SUPABASE_URL` - URL вашего Supabase проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Service role ключ (НЕ anon key!)
- `SMS_LOGIN`, `SMS_PASSWORD`, `SMS_SENDER` - для SMS
- `PORT=3001` - порт сервера

### 3. Запустите сервер

```bash
npm run dev
```

Должно появиться:
```
🚀 360⁰ Marketplace API Server Started
🌐 Listening on port: 3001
```

## 🔍 Проверка работы

Из корня проекта:
```bash
./scripts/check-backend.sh
```

Или вручную:
```bash
curl http://192.168.1.16:3001/health
```

## ❌ Частые ошибки

### "Missing Supabase URL"
- Убедитесь, что файл `.env` существует в папке `backend/`
- Проверьте, что `SUPABASE_URL` указан в `.env`

### "Port 3001 already in use"
```bash
# Mac/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Cannot find module"
```bash
cd backend
npm install
```

## 📖 Подробнее

- [QUICK_FIX_ENV.md](QUICK_FIX_ENV.md) - исправление ошибок окружения
- [FIX_502_ERROR.md](FIX_502_ERROR.md) - исправление ошибки 502

