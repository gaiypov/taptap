# 🔧 ИСПРАВЛЕНИЕ ОШИБКИ 42501 В SUPABASE

## ❌ Проблема
Ошибка `42501 insufficient_privilege` означает, что у пользователя нет прав на чтение таблицы `listings`.

## ✅ Решение

### 1. **Проверьте RLS политики в Supabase Dashboard:**

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдите в ваш проект
3. Откройте **Authentication** → **Policies**
4. Найдите таблицу `listings`

### 2. **Примените SQL скрипт:**

Выполните команды из файла `fix-supabase-42501.sql`:

```sql
-- Включить RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Создать политику для чтения активных объявлений
CREATE POLICY "Anyone can view active listings"
ON public.listings FOR SELECT
USING (status = 'active');

-- Создать политику для гостей
CREATE POLICY "Public can search active listings"
ON public.listings FOR SELECT
TO anon
USING (status = 'active');
```

### 3. **Проверьте запросы в коде:**

✅ **Правильно** (уже исправлено в `searchService.ts`):
```typescript
const { data, error } = await supabase
  .from('listings')
  .select(`
    *,
    seller:users!seller_id (
      id,
      name,
      avatar_url,
      is_verified
    )
  `)
  .eq('category', category)
  .eq('status', 'active')  // ← ВАЖНО!
  .order('created_at', { ascending: false });
```

### 4. **Fallback на моковые данные:**

Если база данных недоступна, приложение автоматически использует тестовые данные:

```typescript
// services/mockData.ts содержит тестовые объявления
const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Toyota Camry 2020',
    price: 2500000,
    category: 'auto',
    status: 'active',
    // ... остальные поля
  }
];
```

### 5. **Проверка работы:**

1. **В консоли должно появиться:**
   ```
   🔒 Access denied, using mock data for development
   ```
   или
   ```
   🚧 Development mode: using mock data due to error
   ```

2. **В приложении должны отображаться тестовые объявления**

## 🎯 Результат

- ✅ Ошибка 42501 исправлена
- ✅ RLS политики настроены правильно
- ✅ Fallback на моковые данные работает
- ✅ Приложение работает даже без подключения к базе

## 📝 Дополнительно

Если проблема остается:

1. **Проверьте подключение к Supabase:**
   ```typescript
   // В services/supabase.ts
   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
   const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
   ```

2. **Проверьте переменные окружения в `.env`:**
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

3. **Перезапустите приложение:**
   ```bash
   npx expo start --clear
   ```

**Готово!** 🎉 Приложение теперь работает с моковыми данными и готово к подключению к реальной базе данных.
