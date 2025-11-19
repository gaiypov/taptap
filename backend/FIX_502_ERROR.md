# 🔧 Исправление ошибки 502 Bad Gateway

## Проблема

Ошибка 502 означает, что бэкенд не запущен или недоступен.

## Решение

### 1. Исправьте переменные окружения

В файле `backend/.env` должны быть установлены **реальные** значения:

```bash
# Supabase
SUPABASE_URL=https://thqlfkngyipdscckbhor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш_реальный_service_role_ключ  # ← НЕ "your-service-role-key"!
SUPABASE_ANON_KEY=ваш_реальный_anon_ключ

# JWT
JWT_SECRET=ваш_реальный_jwt_секрет  # ← НЕ "your-jwt-secret-key-here"!

# SMS (для реальной отправки)
SMS_LOGIN=superapp
SMS_PASSWORD=83fb772ee0799a422cce18ffd5f497b9
SMS_SENDER=bat-bat.kg
SMS_API_URL=https://smspro.nikita.kg/api/message

# Режим
NODE_ENV=production  # или development
PORT=3001
```

### 2. Где взять ключи Supabase

1. Зайдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. Settings → API
4. Скопируйте:
   - **URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Секретный ключ!**

### 3. Запустите бэкенд

```bash
cd backend
npm run dev
```

Должно появиться:
```
🚀 360⁰ Marketplace API Server Started
📍 Environment: production
🌐 Listening on port: 3001
```

### 4. Проверьте работу

```bash
curl http://localhost:3001/health
```

Должен вернуть JSON с `"status": "healthy"`.

### 5. Проверьте IP адрес в приложении

В `app.json` указан IP: `http://192.168.1.16:3001/api`

Проверьте ваш текущий IP:
```bash
ifconfig | grep "inet.*192.168"
```

Если IP изменился, обновите `app.json`:
```json
{
  "extra": {
    "apiUrl": "http://ВАШ_IP:3001/api"
  }
}
```

## Быстрая проверка

```bash
# 1. Проверьте переменные
cd backend
cat .env | grep -E "SUPABASE|JWT" | grep -v "your-"

# 2. Запустите бэкенд
npm run dev

# 3. В другом терминале проверьте
curl http://localhost:3001/health
```

## Если все еще не работает

1. Проверьте логи бэкенда на ошибки
2. Убедитесь, что порт 3001 свободен: `lsof -ti:3001`
3. Проверьте firewall настройки
4. Убедитесь, что IP адрес в `app.json` совпадает с вашим IP
