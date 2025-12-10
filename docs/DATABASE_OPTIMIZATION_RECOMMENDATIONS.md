# Рекомендации по оптимизации базы данных

**Дата:** 2025-01-28  
**Статус:** Рекомендации после аудита RLS, индексов и логов

---

## 1. Использование service_role ключа

### ✅ Текущее состояние

**Правильное использование service_role:**
- `backend/services/supabaseClient.ts` - экспортирует `serviceSupabase` для backend операций
- `supabase/functions/cleanup-listings/index.ts` - edge function использует service_role (правильно, т.к. нужен bypass RLS)
- `backend/src/api/v1/chat.ts` - использует **anon key + RLS** ✅
- `backend/src/api/v1/listings.ts` - использует **anon key + RLS** ✅

**Требует проверки:**
- `backend/src/api/v1/business.ts` - использует `serviceSupabase` (service_role)

### 🔍 Анализ business.ts

**Текущее использование service_role:**
```typescript
import { serviceSupabase as supabase } from '../../../services/supabaseClient';
```

**Операции в business.ts:**
1. Проверка существования бизнес-аккаунта пользователя
2. Создание бизнес-аккаунта
3. Получение бизнес-аккаунта
4. Обновление бизнес-аккаунта
5. Управление членами команды
6. Получение объявлений бизнеса

**Рекомендация:**
- Большинство операций можно выполнять через **anon key + RLS**, если политики настроены правильно
- Service_role нужен только если:
  - Нужно обойти RLS для проверки членства в команде (cross-table проверки)
  - Выполняются административные операции

**Действие:**
- ✅ Оставить service_role для business.ts (оправдано для проверки членства в команде)
- ✅ Убедиться, что RLS политики для `business_accounts` и `business_members` настроены правильно

---

## 2. Составные индексы (опционально)

### 📊 Анализ частых запросов

**Запросы, которые могут выиграть от составных индексов:**

#### 2.1. `chat_threads`
**Запрос:**
```sql
SELECT * FROM chat_threads 
WHERE (buyer_id = $1 OR seller_id = $1 OR business_id IN (...))
ORDER BY last_message_at DESC;
```

**Текущие индексы:**
- `idx_chat_threads_buyer_id` (если есть)
- `idx_chat_threads_seller_id` (если есть)
- `idx_chat_threads_last_message_at` (если есть)

**Рекомендация:**
```sql
-- Составной индекс для сортировки по last_message_at после фильтрации
CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_last_message 
  ON chat_threads(buyer_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_threads_seller_last_message 
  ON chat_threads(seller_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_threads_business_last_message 
  ON chat_threads(business_id, last_message_at DESC NULLS LAST) 
  WHERE business_id IS NOT NULL;
```

**Приоритет:** Средний (добавить если запросы медленные)

---

#### 2.2. `chat_messages`
**Запрос:**
```sql
SELECT * FROM chat_messages 
WHERE thread_id = $1 
ORDER BY created_at DESC;
```

**Текущие индексы:**
- `idx_chat_messages_thread_id` (если есть)
- `idx_chat_messages_created_at` (если есть)

**Рекомендация:**
```sql
-- Составной индекс для сортировки сообщений в треде
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created 
  ON chat_messages(thread_id, created_at DESC);
```

**Приоритет:** Высокий (часто используется)

---

#### 2.3. `listings`
**Запрос:**
```sql
SELECT * FROM listings 
WHERE seller_id = $1 
ORDER BY created_at DESC;
```

**Текущие индексы:**
- `idx_listings_seller_user_id` (если есть)
- `idx_listings_created_at` (если есть)

**Рекомендация:**
```sql
-- Составной индекс для личных объявлений пользователя
CREATE INDEX IF NOT EXISTS idx_listings_seller_created 
  ON listings(seller_id, created_at DESC) 
  WHERE seller_id IS NOT NULL;
```

**Приоритет:** Средний (добавить если запросы медленные)

---

#### 2.4. `listing_likes` и `listing_saves`
**Запрос:**
```sql
SELECT * FROM listing_likes 
WHERE user_id = $1 
ORDER BY created_at DESC;
```

**Рекомендация:**
```sql
-- Составные индексы для лайков и сохранений
CREATE INDEX IF NOT EXISTS idx_listing_likes_user_created 
  ON listing_likes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_saves_user_created 
  ON listing_saves(user_id, created_at DESC);
```

**Приоритет:** Средний (добавить если запросы медленные)

---

#### 2.5. `business_members`
**Запрос:**
```sql
SELECT * FROM business_members 
WHERE user_id = $1 
ORDER BY created_at ASC;
```

**Рекомендация:**
```sql
-- Составной индекс для членов команды
CREATE INDEX IF NOT EXISTS idx_business_members_user_created 
  ON business_members(user_id, created_at ASC);
```

**Приоритет:** Низкий (если запросы быстрые)

---

#### 2.6. `consent_audit_log`
**Запрос:**
```sql
SELECT * FROM consent_audit_log 
WHERE user_id = $1 
ORDER BY created_at DESC;
```

**Рекомендация:**
```sql
-- Составной индекс для аудита согласий
CREATE INDEX IF NOT EXISTS idx_consent_audit_user_created 
  ON consent_audit_log(user_id, created_at DESC);
```

**Приоритет:** Низкий (если запросы быстрые)

---

### 📝 SQL миграция для составных индексов

**Файл:** `supabase/migrations/20250128_composite_indexes.sql`

```sql
-- ============================================
-- Составные индексы для оптимизации запросов
-- ============================================
-- Добавлять только если запросы медленные
-- Мониторить производительность перед добавлением

-- Chat messages: thread_id + created_at
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created 
  ON chat_messages(thread_id, created_at DESC);

-- Chat threads: buyer_id + last_message_at
CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_last_message 
  ON chat_threads(buyer_id, last_message_at DESC NULLS LAST)
  WHERE buyer_id IS NOT NULL;

-- Chat threads: seller_id + last_message_at
CREATE INDEX IF NOT EXISTS idx_chat_threads_seller_last_message 
  ON chat_threads(seller_id, last_message_at DESC NULLS LAST)
  WHERE seller_id IS NOT NULL;

-- Chat threads: business_id + last_message_at
CREATE INDEX IF NOT EXISTS idx_chat_threads_business_last_message 
  ON chat_threads(business_id, last_message_at DESC NULLS LAST)
  WHERE business_id IS NOT NULL;

-- Listings: seller_id + created_at
CREATE INDEX IF NOT EXISTS idx_listings_seller_created 
  ON listings(seller_id, created_at DESC)
  WHERE seller_id IS NOT NULL;

-- Listing likes: user_id + created_at
CREATE INDEX IF NOT EXISTS idx_listing_likes_user_created 
  ON listing_likes(user_id, created_at DESC);

-- Listing saves: user_id + created_at
CREATE INDEX IF NOT EXISTS idx_listing_saves_user_created 
  ON listing_saves(user_id, created_at DESC);

-- Business members: user_id + created_at
CREATE INDEX IF NOT EXISTS idx_business_members_user_created 
  ON business_members(user_id, created_at ASC);

-- Consent audit log: user_id + created_at
CREATE INDEX IF NOT EXISTS idx_consent_audit_user_created 
  ON consent_audit_log(user_id, created_at DESC);
```

**Когда применять:**
- ✅ Если запросы к этим таблицам медленные (>100ms)
- ✅ Если мониторинг показывает высокую нагрузку на эти таблицы
- ❌ Не применять "на всякий случай" - индексы занимают место и замедляют INSERT/UPDATE

---

## 3. Логи Edge Functions

### 📋 Текущее состояние

**Проверены:**
- ✅ Логи Postgres - нет ошибок уровня ERROR/FATAL
- ⚠️ Логи Edge Functions - не проверены

### 🔍 Рекомендации

**1. Получить логи Edge Functions:**
```bash
# Через Supabase CLI
supabase functions logs cleanup-listings --project-ref thqlfkngyipdscckbhor

# Или через Dashboard
# Dashboard → Edge Functions → cleanup-listings → Logs
```

**2. Проверить:**
- Ошибки выполнения (ERROR/FATAL)
- Время выполнения (должно быть < 5 секунд)
- Количество обработанных записей
- Ошибки подключения к api.video

**3. Настроить алерты:**
- Уведомления при ошибках в edge functions
- Мониторинг времени выполнения

---

## 4. Итоговые рекомендации

### ✅ Немедленные действия

1. **Проверить логи Edge Functions:**
   - Получить логи за последние 24 часа
   - Проверить наличие ошибок

2. **Валидация service_role:**
   - ✅ `backend/src/api/v1/business.ts` - оставить service_role (оправдано)
   - ✅ `backend/src/api/v1/chat.ts` - использует anon key (правильно)
   - ✅ `backend/src/api/v1/listings.ts` - использует anon key (правильно)
   - ✅ `supabase/functions/cleanup-listings/index.ts` - использует service_role (правильно)

### 📊 Мониторинг (опционально)

1. **Производительность запросов:**
   - Включить `pg_stat_statements` в Supabase
   - Мониторить медленные запросы (>100ms)
   - Добавлять составные индексы только при необходимости

2. **RLS политики:**
   - ✅ Политики настроены правильно
   - ✅ Service_role используется только там, где нужно
   - ✅ Anon key используется на клиенте и в большинстве API

### 🎯 Долгосрочные улучшения

1. **Составные индексы:**
   - Добавлять только после мониторинга медленных запросов
   - Начать с `idx_chat_messages_thread_created` (высокий приоритет)

2. **Edge Functions:**
   - Настроить алерты на ошибки
   - Мониторить производительность

---

## 5. Проверочный чеклист

- [x] RLS политики проверены и корректны
- [x] Индексы покрывают основные кейсы
- [x] Service_role используется правильно
- [ ] Логи Edge Functions проверены
- [ ] Мониторинг медленных запросов настроен (опционально)
- [ ] Составные индексы добавлены (только при необходимости)

---

**Вывод:** Текущая конфигурация базы данных выглядит хорошо. Основные рекомендации:
1. Проверить логи Edge Functions
2. Добавить составные индексы только при необходимости (после мониторинга)
3. Продолжать использовать service_role только там, где это оправдано

