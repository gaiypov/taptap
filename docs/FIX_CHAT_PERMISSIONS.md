# 🔧 Исправление ошибки: Permission denied for table chat_messages

## Проблема
```
[ERROR] [Supabase] chat.getMessages failed {"error":"permission denied for table chat_messages"}
code: "42501"
message: "permission denied for table chat_messages"
```

## Причины
1. ❌ RLS политики не применены к таблице chat_messages
2. ❌ Пользователь не авторизован (auth.uid() = NULL)
3. ❌ RLS включен, но политики отсутствуют или повреждены

## Решение

### Шаг 1: Применить миграцию через Supabase Dashboard

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект **360AutoMVP**
3. Перейдите в **SQL Editor**
4. Создайте новый запрос
5. Скопируйте содержимое файла:
   ```
   supabase/migrations/20250126_fix_chat_rls.sql
   ```
6. Вставьте в SQL Editor
7. Нажмите **Run** (Cmd/Ctrl + Enter)
8. Убедитесь что выполнено без ошибок

### Шаг 2: Проверка RLS политик

После применения миграции проверьте в SQL Editor:

```sql
-- Проверка что RLS включен
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('chat_threads', 'chat_messages');
-- Должно показать rowsecurity = true для обеих таблиц

-- Проверка что политики созданы
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('chat_threads', 'chat_messages')
ORDER BY tablename, policyname;
-- Должно показать 6 политик (3 для chat_threads, 3 для chat_messages)
```

### Шаг 3: Проверка авторизации

Убедитесь что пользователь авторизован:

```sql
-- В Supabase SQL Editor (будет работать только если вы залогинены через UI)
SELECT auth.uid();
-- Должно вернуть UUID, если NULL - пользователь не авторизован
```

В приложении проверьте:
```typescript
// В любом компоненте
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);
// Должно показать UUID пользователя
```

### Шаг 4: Тестирование

1. Перезагрузите приложение
2. Убедитесь что авторизованы (есть токен)
3. Откройте чат
4. Ошибка должна исчезнуть

## Что изменено в миграции

### 1. Включен FORCE RLS (усиленная защита):
```sql
ALTER TABLE public.chat_threads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;
```
`FORCE ROW LEVEL SECURITY` гарантирует что даже владелец таблицы не может обойти политики.

### Созданы политики для chat_messages:

1. **SELECT (Просмотр)**: Пользователь видит сообщения только в своих тредах
   ```sql
   CREATE POLICY "Users can view messages in own threads"
   ON public.chat_messages FOR SELECT
   USING (EXISTS (
     SELECT 1 FROM chat_threads
     WHERE id = thread_id
     AND (buyer_id = auth.uid() OR seller_id = auth.uid())
   ));
   ```

2. **INSERT (Отправка)**: Пользователь может отправлять сообщения
   ```sql
   CREATE POLICY "Users can send messages in own threads"
   ON public.chat_messages FOR INSERT
   WITH CHECK (
     auth.uid() = sender_id
     AND EXISTS (...)
   );
   ```

3. **UPDATE (Обновление)**: Пользователь может обновлять (отметка о прочтении)
   ```sql
   CREATE POLICY "Users can update messages in own threads"
   ON public.chat_messages FOR UPDATE
   USING (EXISTS (...));
   ```

### 4. Добавлены индексы для производительности:
```sql
CREATE INDEX idx_chat_threads_buyer_id ON chat_threads(buyer_id);
CREATE INDEX idx_chat_threads_seller_id ON chat_threads(seller_id);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
```

### 5. Защита SECURITY DEFINER функций:
```sql
-- Отзыв прав у анонимных пользователей
REVOKE EXECUTE ON FUNCTION update_chat_thread_expiry() FROM anon;
REVOKE EXECUTE ON FUNCTION update_chat_thread_expiry() FROM public;
GRANT EXECUTE ON FUNCTION update_chat_thread_expiry() TO authenticated;

-- Cleanup функция доступна только service_role
REVOKE EXECUTE ON FUNCTION cleanup_expired_chat_threads() FROM anon;
REVOKE EXECUTE ON FUNCTION cleanup_expired_chat_threads() FROM public;
```

## Security Best Practices

### ✅ Реализовано:
1. **FORCE RLS** - Невозможно обойти политики даже для владельца таблицы
2. **auth.uid() NOT NULL** - Явная проверка авторизации в INSERT/UPDATE
3. **REVOKE от anon** - Анонимные пользователи не могут выполнять функции
4. **Индексы на FK** - Быстрая проверка прав доступа

### ⚠️ Важно:
- Все INSERT/UPDATE требуют `auth.uid() IS NOT NULL`
- Анонимные запросы автоматически отклоняются
- SECURITY DEFINER функции защищены от анонимного доступа
- При добавлении новых функций всегда используйте:
  ```sql
  REVOKE EXECUTE ON FUNCTION function_name() FROM anon;
  REVOKE EXECUTE ON FUNCTION function_name() FROM public;
  GRANT EXECUTE ON FUNCTION function_name() TO authenticated;
  ```

## Дополнительная диагностика

### Если ошибка сохраняется:

1. **Проверьте auth токен**:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';

   const session = await AsyncStorage.getItem('supabase.auth.token');
   console.log('Auth token exists:', !!session);
   ```

2. **Проверьте что пользователь в базе**:
   ```sql
   SELECT id, name, phone FROM users WHERE id = 'YOUR_USER_ID';
   ```

3. **Проверьте существующие треды**:
   ```sql
   SELECT id, buyer_id, seller_id, listing_id
   FROM chat_threads
   WHERE buyer_id = 'YOUR_USER_ID' OR seller_id = 'YOUR_USER_ID';
   ```

4. **Попробуйте явно указать user_id**:
   ```typescript
   const { data: session } = await supabase.auth.getSession();
   if (!session?.user) {
     console.error('User not authenticated!');
     // Redirect to login
   }
   ```

## Troubleshooting

### "RLS enabled but still permission denied"
- Проверьте что auth.uid() не NULL
- Возможно токен истек - попробуйте переавторизоваться
- Убедитесь что используется правильный Supabase URL/key

### "Cannot find table chat_messages"
- Таблица не создана - примените базовые миграции сначала
- Проверьте schema (должна быть public)

### "Policy already exists"
- Удалите старые политики через Dashboard
- Или используйте `DROP POLICY IF EXISTS` в миграции

## Проверка успешного исправления

После применения миграции:
1. ✅ Чат открывается без ошибок
2. ✅ Сообщения загружаются
3. ✅ Можно отправлять новые сообщения
4. ✅ Отметка о прочтении работает
5. ✅ В логах нет "permission denied"

## Альтернативное решение (если Dashboard недоступен)

### Через Supabase CLI:
```bash
cd /Users/ulanbekgaiypov/360AutoMVP
npx supabase db push
```

Или через psql:
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" \
  -f supabase/migrations/20250126_fix_chat_rls.sql
```

---

**Файлы:**
- ✅ Миграция: `supabase/migrations/20250126_fix_chat_rls.sql`
- ✅ Сервис: `services/supabase.ts` (chat методы)
- ✅ Документация: этот файл

**Статус:** Готово к применению
**Дата:** 2025-01-26
