# Как получить SUPABASE_SERVICE_ROLE_KEY

## Быстрый способ:

1. Откройте: https://supabase.com/dashboard/project/thqlfkngyipdscckbhor/settings/api

2. Найдите раздел "Project API keys"

3. Скопируйте ключ из строки **"service_role"** (НЕ "anon" или "public"!)

4. Добавьте его в `.env` файл:
   ```
   SUPABASE_SERVICE_ROLE_KEY=ваш-скопированный-ключ
   ```

5. Или добавьте в `app.json` (временное решение):
   ```json
   {
     "expo": {
       "extra": {
         "SUPABASE_SERVICE_ROLE_KEY": "ваш-ключ"
       }
     }
   }
   ```

## Важно:
- SERVICE_ROLE_KEY имеет полные права доступа к базе данных
- НЕ публикуйте его в Git
- Используйте только для backend скриптов

