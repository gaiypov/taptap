# Шаблон для обновления Supabase ключей

## Шаг 1: Получите ключи из Supabase Dashboard

1. Перейдите на [supabase.com](https://supabase.com)
2. Войдите в ваш проект (или создайте новый)
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **Project URL**: `https://ваш-проект-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Шаг 2: Обновите app.json

Замените строки 55-56 в файле `app.json`:

```json
"EXPO_PUBLIC_SUPABASE_URL": "https://ваш-реальный-проект-id.supabase.co",
"EXPO_PUBLIC_SUPABASE_ANON_KEY": "ваш-реальный-anon-ключ"
```

## Шаг 3: Пример реальных ключей

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_SUPABASE_URL": "https://abcdefghijklmnop.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5Njg5NjAwMCwiZXhwIjoyMDEyNDcyMDAwfQ.example-signature"
    }
  }
}
```

## Шаг 4: Выполните SQL схему

1. В Supabase Dashboard перейдите в **SQL Editor**
2. Скопируйте содержимое файла `supabase-schema.sql`
3. Выполните SQL команды
4. Проверьте создание таблиц в **Table Editor**

## Шаг 5: Перезапустите приложение

```bash
npx expo start --port 8082 --clear
```

## Шаг 6: Протестируйте подключение

1. Откройте приложение в Expo Go
2. Нажмите "🧪 Test Supabase"
3. Проверьте результаты тестов

## Если у вас еще нет Supabase проекта:

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Войдите через GitHub
4. Нажмите "New Project"
5. Введите:
   - **Name**: `360Auto MVP`
   - **Database Password**: создайте надежный пароль
   - **Region**: выберите ближайший регион
6. Нажмите "Create new project"
7. Дождитесь завершения создания (2-3 минуты)
8. Получите ключи из **Settings** → **API**
