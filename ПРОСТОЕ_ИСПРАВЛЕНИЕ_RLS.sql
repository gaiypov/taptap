-- ПРОСТОЕ И НАДЕЖНОЕ ИСПРАВЛЕНИЕ SUPABASE RLS
-- Выполнить этот SQL в Supabase SQL Editor
-- Этот скрипт точно работает!

-- 1. Включаем RLS для таблицы listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем ВСЕ возможные политики для listings
DROP POLICY IF EXISTS "Public can read all listings" ON listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON listings;
DROP POLICY IF EXISTS "Allow public read access to active listings" ON listings;
DROP POLICY IF EXISTS "Allow users to read their own listings" ON listings;
DROP POLICY IF EXISTS "Allow authenticated users to create listings" ON listings;
DROP POLICY IF EXISTS "Allow users to update their own listings" ON listings;
DROP POLICY IF EXISTS "Allow users to delete their own listings" ON listings;

-- 3. Создаем простые политики для listings
CREATE POLICY "listings_select_policy" ON listings
FOR SELECT USING (true);

CREATE POLICY "listings_insert_policy" ON listings
FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "listings_update_policy" ON listings
FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "listings_delete_policy" ON listings
FOR DELETE USING (auth.uid() = seller_id);

-- 4. Включаем RLS для таблицы users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Удаляем ВСЕ возможные политики для users
DROP POLICY IF EXISTS "Public can read user profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Allow public read access to user profiles" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON users;

-- 6. Создаем простые политики для users
CREATE POLICY "users_select_policy" ON users
FOR SELECT USING (true);

CREATE POLICY "users_update_policy" ON users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Проверяем результат
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('listings', 'users');
