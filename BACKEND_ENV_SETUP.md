# Backend Environment Setup

## ⚠️ Важно: Создайте файл `backend/.env`

Файл `.env` отсутствует в папке `backend/`. Создайте его вручную:

```bash
cd backend
touch .env
```

## 📝 Содержимое файла `backend/.env`

Скопируйте и вставьте следующее содержимое в `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://thqlfkngyipdscckbhor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# JWT Secret (минимум 32 символа)
JWT_SECRET=YOUR_SECURE_JWT_SECRET_AT_LEAST_32_CHARS

# api.video Configuration
APIVIDEO_API_KEY=OhnRGcRvd7YS7H7TV6uwXRNgLvocjuAfGfR2qAebSKv

# Google Cloud Vision API Key
GOOGLE_VISION_API_KEY=AIzaSyCDq7xTy4yrPvBr5JjGNUEXaXZ70fVyJGg

# CORS Configuration (URLs клиентов)
CLIENT_URL=http://localhost:8081,http://localhost:19006

# AI Services (опционально)
# OPENAI_API_KEY=sk-...
# CLAUDE_API_KEY=...
```

---

## 🔑 Где Взять Ключи

### 1. **SUPABASE_SERVICE_ROLE_KEY**

1. Откройте: https://supabase.com/dashboard/project/thqlfkngyipdscckbhor/settings/api
2. Найдите раздел **"Service Role"**
3. Скопируйте ключ (начинается с `eyJ...`)
4. ⚠️ **ВНИМАНИЕ:** Это секретный ключ с полным доступом к БД!

### 2. **JWT_SECRET**

Сгенерируйте безопасный ключ:

```bash
# Вариант 1: OpenSSL (MacOS/Linux)
openssl rand -base64 32

# Вариант 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Вариант 3: Онлайн
# https://generate-secret.vercel.app/32
```

Скопируйте результат в `JWT_SECRET=...`

### 3. **Остальные Ключи**

- `APIVIDEO_API_KEY` - ✅ Уже настроен
- `GOOGLE_VISION_API_KEY` - ✅ Уже настроен
- `OPENAI_API_KEY` - ⚠️ Опционально (для GPT-4 Vision)
- `CLAUDE_API_KEY` - ⚠️ Опционально (для Claude AI)

---

## 🚀 После Настройки

1. **Проверьте файл:**
   ```bash
   cd backend
   cat .env  # Должны быть все переменные
   ```

2. **Запустите Backend:**
   ```bash
   npm install  # если не установлено
   npm run dev
   ```

3. **Проверьте работу:**
   ```bash
   # В другом терминале:
   curl http://localhost:3001/health
   # Ожидаемый ответ: {"status":"ok","timestamp":"..."}
   ```

---

## ⚠️ Безопасность

- ❌ **НЕ коммитьте `.env` в Git**
- ✅ Файл уже добавлен в `.gitignore`
- ✅ Используйте разные ключи для dev/prod
- ✅ Service Role Key храните в секрете

---

## 🐛 Troubleshooting

### Ошибка: "JWT_SECRET must be configured"
→ Убедитесь, что `JWT_SECRET` минимум 32 символа

### Ошибка: "Missing Supabase URL"
→ Проверьте `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`

### Ошибка: "EADDRINUSE: address already in use :::3001"
→ Порт 3001 занят. Остановите другой процесс или измените `PORT=3002`

---

**Готово!** После настройки backend будет работать на `http://localhost:3001` 🚀

