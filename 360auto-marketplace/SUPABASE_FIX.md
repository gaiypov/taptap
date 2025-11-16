# 🔧 Настройка и исправление Supabase

**Дата:** 28 января 2025  
**Статус:** 🔧 Требуется настройка RLS политик

---

## 🚨 Текущая проблема

### Ошибка: `permission denied for table listings` (code: 42501)

**Причина:** Row Level Security (RLS) политики не настроены или слишком строгие.

---

## ✅ Уже настроено

### 1. Конфигурация клиента ✅

**app.json:**

```json
"EXPO_PUBLIC_SUPABASE_URL": "https://thqlfkngyipdscckbhor.supabase.co",
"EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Клиент инициализирован ✅

**services/supabase.ts:**

- URL: Настроен
- Anon Key: Настроен
- AsyncStorage: Подключен
- Auto refresh: Включен

---

## 🔧 Что нужно исправить

### 1. Настроить RLS политики в Supabase Dashboard

```sql
-- Разрешить анонимным пользователям читать listings
CREATE POLICY "Anyone can view active listings"
ON listings
FOR SELECT
TO anon
USING (true);

-- Разрешить аутентифицированным пользователям создавать listings
CREATE POLICY "Authenticated users can create listings"
ON listings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Разрешить владельцу обновлять свои listings
CREATE POLICY "Users can update own listings"
ON listings
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id);
```

### 2. Отключить RLS (для тестирования)

```sql
-- ВНИМАНИЕ: Только для development!
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
```

### 3. Проверить публичную схему

```sql
-- Убедиться что схема public доступна
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
```

---

## 📝 Инструкция по исправлению

### Шаг 1: Откройте Supabase Dashboard

```
https://supabase.com/dashboard/project/thqlfkngyipdscckbhor
```

### Шаг 2: Перейдите в SQL Editor

```
SQL Editor → New Query
```

### Шаг 3: Выполните SQL для отключения RLS (development)

```sql
-- Отключить RLS для тестирования
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_saves DISABLE ROW LEVEL SECURITY;

-- Или настроить правильные политики
CREATE POLICY "Public listings are viewable by everyone"
ON listings FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own listings"
ON listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);
```

### Шаг 4: Проверьте таблицы

```sql
-- Проверить что таблицы существуют
SELECT * FROM listings LIMIT 5;
```

### Шаг 5: Проверьте RLS статус

```sql
-- Проверить RLS для listings
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'listings';
```

---

## 🧪 Тестирование

### 1. Протестировать запрос

```typescript
const { data, error } = await supabase
  .from('listings')
  .select('*')
  .limit(5);

console.log('Data:', data);
console.log('Error:', error);
```

### 2. Проверить авторизацию

```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

---

## 🔒 Безопасность (Production)

### Для production используйте правильные RLS политики

```sql
-- Просмотр только активных listings
CREATE POLICY "View active listings"
ON listings FOR SELECT
USING (status = 'active' OR auth.uid() = seller_id);

-- Создание только авторизованными пользователями
CREATE POLICY "Authenticated can create"
ON listings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Обновление только своих listings
CREATE POLICY "Update own listings"
ON listings FOR UPDATE
USING (auth.uid() = seller_id);
```

---

## ✅ После исправления

1. Перезапустите приложение
2. Проверьте что ошибки 42501 исчезли
3. Убедитесь что данные загружаются
4. Проверьте создание новых listings

---

**Требуется доступ к Supabase Dashboard для исправления! 🔧**
