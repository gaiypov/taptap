# ⚡ Быстрое исправление Supabase RLS

**Дата:** 28 января 2025  
**Проблема:** `permission denied for table listings` (42501)

---

## 🎯 Решение (2 минуты)

### Вариант 1: Полностью отключить RLS (самый быстрый)

1. Откройте Supabase Dashboard:

   ```
   https://supabase.com/dashboard/project/thqlfkngyipdscckbhor
   ```

2. Перейдите в **SQL Editor** → **New Query**

3. Выполните SQL:

```sql
-- Отключить RLS для разработки
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_saves DISABLE ROW LEVEL SECURITY;
```

4. Нажмите **Run**

---

### Вариант 2: Настроить правильные RLS политики

Выполните весь скрипт из файла `supabase-fix-rls.sql`

---

## ✅ Проверка

После выполнения SQL:

1. Перезапустите приложение
2. Ошибки 42501 должны исчезнуть
3. Данные должны загружаться

---

## 📝 Текущая конфигурация

```json
{
  "EXPO_PUBLIC_SUPABASE_URL": "https://thqlfkngyipdscckbhor.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ URL настроен  
✅ Anon Key настроен  
❌ RLS политики требуют настройки

---

**Требуется доступ к Supabase Dashboard! 🔧**
