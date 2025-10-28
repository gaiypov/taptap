# 🔑 Настройка ключей Supabase

## Шаг 1: Получите ключи из Supabase Dashboard

1. Перейдите на [supabase.com](https://supabase.com)
2. Войдите в ваш проект (или создайте новый)
3. **Settings** → **API**
4. Скопируйте:
   - **Project URL**: `https://supabase.com/dashboard/project/thqlfkngyipdscckbhor/settings/api-keys`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocWxma25neWlwZHNjY2tiaG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjYyMTksImV4cCI6MjA3NTYwMjIxOX0.vpFYGGSs81wgiJgedBe8_VSqle575fPMeTqdJwKHtlE`

## Шаг 2: Запустите скрипт настройки

```bash
./update-supabase-keys.sh
```

Скрипт попросит ввести ваши ключи и автоматически обновит `app.json`.

## Шаг 3: Проверьте настройку

```bash
# Перезапустите Expo (если нужно)
npx expo start --port 8082 --clear

# Откройте приложение в Expo Go
# Нажмите "🧪 Test Supabase" для проверки
```

## Примеры ключей:

**URL**: `https://abcdefghijklmnop.supabase.co`
**Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5Njg5NjAwMCwiZXhwIjoyMDEyNDcyMDAwfQ.example-signature`

## ⚠️ Важно:

- Используйте **anon** ключ, а не **service_role**
- Не добавляйте лишних пробелов
- Перезапустите Expo после изменений
- Не коммитьте реальные ключи в Git

## 🚨 Если что-то не работает:

1. Проверьте правильность ключей
2. Убедитесь что проект активен в Supabase Dashboard
3. Выполните SQL из `supabase-schema.sql`
4. Создайте storage buckets: `car-videos`, `car-thumbnails`
