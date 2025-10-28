# 🗄️ Применение SQL миграции бизнес-аккаунтов

## Способ 1: Через Supabase Dashboard (Рекомендуется)

### Шаг 1: Откройте Supabase Dashboard

1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. В левом меню выберите **SQL Editor**

### Шаг 2: Откройте файл миграции

1. Откройте файл `supabase-business-accounts.sql` в редакторе кода
2. Скопируйте **ВСЁ** содержимое файла (Cmd+A → Cmd+C на Mac)

### Шаг 3: Выполните миграцию

1. В SQL Editor нажмите **New query**
2. Вставьте скопированный SQL код (Cmd+V)
3. Нажмите **Run** или используйте Cmd+Enter
4. Дождитесь выполнения (займёт 2-5 секунд)

### Шаг 4: Проверьте результат

Должны увидеть сообщение:
```
NOTICE:  ✅ Бизнес-аккаунты установлены успешно!
```

Выполните проверочный запрос:
```sql
-- Проверка таблиц
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('business_accounts', 'team_members');

-- Должны увидеть обе таблицы
```

---

## Способ 2: Через psql (для продвинутых)

### Требования:
- PostgreSQL client (psql) установлен
- Есть доступ к connection string

### Шаги:

```bash
# 1. Получите connection string из Supabase Dashboard
# Settings → Database → Connection string (URI)

# 2. Выполните миграцию
psql "ваш-connection-string" -f supabase-business-accounts.sql

# 3. Проверьте
psql "ваш-connection-string" -c "SELECT * FROM business_accounts LIMIT 1;"
```

---

## Способ 3: Через Supabase CLI (для CI/CD)

### Требования:
- Supabase CLI установлен
- Проект связан с Supabase

### Шаги:

```bash
# 1. Установите Supabase CLI (если не установлен)
npm install -g supabase

# 2. Войдите в аккаунт
supabase login

# 3. Свяжите проект
supabase link --project-ref ваш-project-id

# 4. Примените миграцию
supabase db push --include-all
```

---

## Проверка установки

После применения миграции выполните эти запросы для проверки:

### 1. Проверка таблиц
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('business_accounts', 'team_members');
```

Должны увидеть:
- `business_accounts`
- `team_members`

### 2. Проверка функций
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('can_create_listing', 'update_business_listings_count');
```

Должны увидеть:
- `can_create_listing`
- `update_business_listings_count`
- `update_team_members_count`

### 3. Проверка views
```sql
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'business_stats';
```

Должны увидеть:
- `business_stats`

### 4. Проверка RLS
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('business_accounts', 'team_members');
```

Должны увидеть несколько политик (4-5 шт).

### 5. Тестовый запрос
```sql
-- Попробовать создать тестовую функцию
SELECT can_create_listing('00000000-0000-0000-0000-000000000000', 'car');

-- Должны получить TRUE или FALSE (не ошибку!)
```

---

## Откат миграции (если нужно)

Если что-то пошло не так, выполните:

```sql
-- ОСТОРОЖНО! Это удалит все данные!

DROP VIEW IF EXISTS business_stats;
DROP TRIGGER IF EXISTS update_business_count ON listings;
DROP TRIGGER IF EXISTS update_team_count ON team_members;
DROP TRIGGER IF EXISTS business_accounts_updated_at ON business_accounts;
DROP FUNCTION IF EXISTS can_create_listing(UUID, TEXT);
DROP FUNCTION IF EXISTS update_business_listings_count();
DROP FUNCTION IF EXISTS update_team_members_count();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS business_accounts CASCADE;

-- Удалить добавленные колонки из listings
ALTER TABLE listings DROP COLUMN IF EXISTS business_id;
ALTER TABLE listings DROP COLUMN IF EXISTS is_sponsored;
```

---

## Troubleshooting

### Ошибка: "relation already exists"
**Решение:** Таблицы уже существуют. Либо:
- Откатите миграцию (см. выше)
- Или пропустите создание существующих таблиц

### Ошибка: "permission denied"
**Решение:** У вас нет прав на создание таблиц. Проверьте:
- Вы админ проекта Supabase?
- Connection string правильный?

### Ошибка: "syntax error"
**Решение:**
- Скопировали полностью весь файл?
- Используйте SQL Editor в Supabase (не Query Editor для данных)

### Миграция выполнилась, но данных нет
**Решение:** Это нормально! Таблицы пустые до первого использования.

---

## Следующие шаги

После успешного применения миграции:

1. ✅ Перезапустите приложение:
   ```bash
   npm start -- --reset-cache
   ```

2. ✅ Проверьте логи приложения на наличие ошибок

3. ✅ Попробуйте создать объявление:
   - Должна сработать проверка лимитов
   - Для 3+ объявлений FREE покажется UpgradeModal

4. ✅ Проверьте профиль:
   - Пока нет бизнес-аккаунта, badge не отображается
   - Это нормально!

---

## Создание тестового бизнес-аккаунта

Чтобы протестировать систему, создайте тестовый аккаунт:

```sql
-- Замените YOUR_USER_UUID на ваш реальный UUID
-- Получить UUID: SELECT id FROM auth.users LIMIT 1;

INSERT INTO business_accounts (
  user_id,
  tier,
  company_name,
  company_phone,
  company_email,
  business_type,
  max_listings,
  max_team_members,
  trial_ends_at
) VALUES (
  'YOUR_USER_UUID',
  'business',
  'Тест Авто Центр',
  '+996555123456',
  'test@example.com',
  'car_dealer',
  30,
  3,
  NOW() + INTERVAL '7 days'
);
```

После этого:
- В профиле появится badge 🔵 БИЗНЕС
- Можно создавать до 30 объявлений
- Приоритет в ленте +20%
- Boost скидка 30%

---

## Готово! 🎉

SQL миграция применена. Система бизнес-аккаунтов работает!

**Читайте далее:**
- `START_HERE_BUSINESS.md` - быстрый старт
- `BUSINESS_ACCOUNTS_GUIDE.md` - полное руководство

