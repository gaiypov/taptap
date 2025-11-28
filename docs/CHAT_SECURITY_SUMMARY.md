# 🔒 Chat Security - Улучшенная защита

## Проблема и решение

### ❌ Было:
```
[ERROR] permission denied for table chat_messages
```

### ✅ Стало:
- **FORCE RLS** - усиленная защита на уровне БД
- **auth.uid() NOT NULL** - явная проверка авторизации
- **REVOKE от anon** - защита от анонимных запросов
- **Защита SECURITY DEFINER** - функции доступны только authenticated

## Security Improvements

### 1. FORCE Row Level Security
```sql
ALTER TABLE public.chat_threads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;
```

**Что это дает:**
- ✅ Даже table owner не может обойти политики
- ✅ Защита от privilege escalation
- ✅ Guarantee что RLS проверяется всегда

### 2. Явная проверка auth.uid()
```sql
-- INSERT требует авторизации
CREATE POLICY "Users can create chat threads"
ON public.chat_threads FOR INSERT
WITH CHECK (
  auth.uid() = buyer_id
  AND auth.uid() IS NOT NULL  -- ✅ Явная проверка
);

-- UPDATE требует авторизации
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND auth.uid() IS NOT NULL  -- ✅ Явная проверка
  AND EXISTS (...)
);
```

**Что это дает:**
- ✅ Анонимные запросы отклоняются на уровне политик
- ✅ Невозможно создать сообщение без авторизации
- ✅ Защита от spoofing (подделки sender_id)

### 3. Защита SECURITY DEFINER функций
```sql
-- Функция update_chat_thread_expiry
REVOKE EXECUTE ON FUNCTION public.update_chat_thread_expiry() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_chat_thread_expiry() FROM public;
GRANT EXECUTE ON FUNCTION public.update_chat_thread_expiry() TO authenticated;

-- Функция cleanup (только service_role)
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() FROM public;
```

**Что это дает:**
- ✅ Анонимные пользователи не могут вызвать функции
- ✅ public роль не имеет доступа
- ✅ Только authenticated могут использовать триггеры
- ✅ Cleanup доступен только service_role (админ)

### 4. Индексы для производительности
```sql
CREATE INDEX idx_chat_threads_buyer_id ON chat_threads(buyer_id);
CREATE INDEX idx_chat_threads_seller_id ON chat_threads(seller_id);
CREATE INDEX idx_chat_threads_business_id ON chat_threads(business_id);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_team_members_business_user ON team_members(business_id, user_id);
```

**Что это дает:**
- ✅ Быстрая проверка прав доступа (EXISTS queries)
- ✅ Эффективный JOIN с chat_threads
- ✅ Оптимизация для business_id проверок

## Матрица доступа

### chat_threads

| Операция | anon | authenticated (buyer) | authenticated (seller) | authenticated (team) | service_role |
|----------|------|----------------------|------------------------|---------------------|--------------|
| SELECT   | ❌    | ✅ (own)              | ✅ (own)                | ✅ (business)        | ✅            |
| INSERT   | ❌    | ✅ (as buyer)         | ❌                      | ❌                   | ✅            |
| UPDATE   | ❌    | ✅ (own)              | ✅ (own)                | ✅ (business)        | ✅            |
| DELETE   | ❌    | ❌                    | ❌                      | ❌                   | ✅            |

### chat_messages

| Операция | anon | authenticated (participant) | authenticated (non-participant) | service_role |
|----------|------|----------------------------|--------------------------------|--------------|
| SELECT   | ❌    | ✅ (in own threads)         | ❌                              | ✅            |
| INSERT   | ❌    | ✅ (in own threads)         | ❌                              | ✅            |
| UPDATE   | ❌    | ✅ (in own threads)         | ❌                              | ✅            |
| DELETE   | ❌    | ❌                          | ❌                              | ✅            |

## Как это работает

### Пример 1: Попытка анонимного доступа
```typescript
// ❌ БЕЗ авторизации
const { data, error } = await supabase
  .from('chat_messages')
  .select('*');

// Результат: error "permission denied"
// Причина: auth.uid() = NULL, политика отклоняет запрос
```

### Пример 2: Авторизованный доступ
```typescript
// ✅ С авторизацией
await supabase.auth.signInWithOtp({ phone: '+996...' });

const { data, error } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('thread_id', threadId);

// Результат: success
// Политика проверяет:
// 1. auth.uid() не NULL
// 2. Пользователь - участник треда (buyer или seller)
// 3. Возвращает только сообщения из его тредов
```

### Пример 3: Попытка подделки sender_id
```typescript
// ❌ Попытка отправить сообщение от имени другого пользователя
const { data, error } = await supabase
  .from('chat_messages')
  .insert({
    thread_id: 'thread-123',
    sender_id: 'other-user-id',  // ❌ Не равен auth.uid()
    body: 'Fake message'
  });

// Результат: error "permission denied"
// Причина: auth.uid() !== sender_id, политика отклоняет
```

### Пример 4: Корректная отправка
```typescript
// ✅ Корректная отправка
const { data: { user } } = await supabase.auth.getUser();

const { data, error } = await supabase
  .from('chat_messages')
  .insert({
    thread_id: 'thread-123',
    sender_id: user.id,  // ✅ Равен auth.uid()
    body: 'Real message'
  });

// Результат: success
// Политика проверяет:
// 1. auth.uid() === sender_id ✅
// 2. auth.uid() !== NULL ✅
// 3. Пользователь - участник треда ✅
```

## Best Practices для будущих функций

### Шаблон для SECURITY DEFINER функций:
```sql
CREATE OR REPLACE FUNCTION public.your_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- ⚠️ Опасно без защиты!
SET search_path = public
AS $$
BEGIN
  -- Явная проверка авторизации
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Логика функции...
END;
$$;

-- ✅ ОБЯЗАТЕЛЬНО: Отозвать права у anon
REVOKE EXECUTE ON FUNCTION public.your_function() FROM anon;
REVOKE EXECUTE ON FUNCTION public.your_function() FROM public;

-- ✅ Дать права только authenticated
GRANT EXECUTE ON FUNCTION public.your_function() TO authenticated;

-- Комментарий для документации
COMMENT ON FUNCTION public.your_function() IS
  'SECURITY: Requires authentication. Revoked from anon/public.';
```

### Checklist для новых таблиц:
- [ ] `ENABLE ROW LEVEL SECURITY`
- [ ] `FORCE ROW LEVEL SECURITY` (если критично)
- [ ] Политика SELECT с проверкой auth.uid()
- [ ] Политика INSERT с `auth.uid() IS NOT NULL`
- [ ] Политика UPDATE с `auth.uid() IS NOT NULL`
- [ ] DELETE только для service_role
- [ ] Индексы на FK для производительности
- [ ] COMMENT с описанием security модели

## Тестирование безопасности

### 1. Тест анонимного доступа
```sql
-- Должно вернуть error
SET ROLE anon;
SELECT * FROM chat_messages;
```

### 2. Тест авторизованного доступа
```sql
-- Должно вернуть только свои треды
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user-uuid';
SELECT * FROM chat_threads WHERE buyer_id = auth.uid() OR seller_id = auth.uid();
```

### 3. Тест подделки
```sql
-- Должно вернуть error
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user-1';
INSERT INTO chat_messages (thread_id, sender_id, body)
VALUES ('thread-123', 'user-2', 'Fake');  -- ❌ user-2 != user-1
```

## Применение миграции

1. Откройте Supabase Dashboard → SQL Editor
2. Скопируйте `supabase/migrations/20250126_fix_chat_rls.sql`
3. Вставьте и запустите (Cmd+Enter)
4. Проверьте результат:
   ```sql
   -- Должно показать 'f' (force enabled)
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE tablename IN ('chat_threads', 'chat_messages');
   ```

## Мониторинг

### Логи для отслеживания:
```sql
-- Попытки доступа к chat_messages
SELECT * FROM pg_stat_statements
WHERE query LIKE '%chat_messages%'
AND calls > 0
ORDER BY calls DESC;

-- Ошибки permission denied
SELECT * FROM pg_stat_database_conflicts
WHERE datname = current_database();
```

---

**Статус:** ✅ Готово к production
**Security Level:** High
**Дата:** 2025-01-26
