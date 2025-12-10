# 🔧 Быстрое исправление ошибки "Missing Supabase URL"

## Проблема
```
Error: Missing Supabase URL. Set SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) in environment.
```

## Решение

### 1. Создайте файл `.env` в папке `backend/`

```bash
cd backend
cp env-config.txt .env
```

### 2. Откройте `.env` и укажите реальные значения

**ВАЖНО:** Замените `your-service-role-key` на реальный ключ!

```env
# Supabase Configuration
SUPABASE_URL=https://thqlfkngyipdscckbhor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш-реальный-service-role-key-здесь

# SMS Configuration
SMS_LOGIN=superapp
SMS_PASSWORD=83fb772ee0799a422cce18ffd5f497b9
SMS_SENDER=bat-bat.kg
SMS_API_URL=https://smspro.nikita.kg/api/message

# Server Configuration
PORT=3001
NODE_ENV=production
```

### 3. Где взять SUPABASE_SERVICE_ROLE_KEY?

1. Откройте https://supabase.com/dashboard/project/thqlfkngyipdscckbhor/settings/api
2. Найдите секцию **"Project API keys"**
3. Скопируйте ключ из строки **`service_role`** (НЕ `anon`!)
4. Вставьте в `.env` файл

### 4. Запустите бэкенд

```bash
cd backend
npm run dev
```

## ✅ Готово!

Теперь бэкенд должен запуститься без ошибок.

## 🔍 Проверка

Убедитесь, что переменные загружены:
```bash
cd backend
npm run check-env
```

