-- Выполнить этот SQL в Supabase SQL Editor
-- Это исправит ошибку "permission denied for table listings"

-- 1. Включаем RLS для таблицы listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем старые политики если есть
DROP POLICY IF EXISTS "Allow public read access to active listings" ON listings;
DROP POLICY IF EXISTS "Allow users to read their own listings" ON listings;
DROP POLICY IF EXISTS "Allow authenticated users to create listings" ON listings;
DROP POLICY IF EXISTS "Allow users to update their own listings" ON listings;
DROP POLICY IF EXISTS "Allow users to delete their own listings" ON listings;

-- 3. Создаем новые политики
-- Политика для чтения всех активных объявлений (публичный доступ)
CREATE POLICY "Allow public read access to active listings" ON listings
FOR SELECT USING (status = 'active');

-- Политика для чтения собственных объявлений (для владельца)
CREATE POLICY "Allow users to read their own listings" ON listings
FOR SELECT USING (auth.uid() = seller_id);

-- Политика для создания объявлений (только авторизованные пользователи)
CREATE POLICY "Allow authenticated users to create listings" ON listings
FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Политика для обновления собственных объявлений
CREATE POLICY "Allow users to update their own listings" ON listings
FOR UPDATE USING (auth.uid() = seller_id);

-- Политика для удаления собственных объявлений
CREATE POLICY "Allow users to delete their own listings" ON listings
FOR DELETE USING (auth.uid() = seller_id);

-- 4. Также исправляем таблицу users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики users если есть
DROP POLICY IF EXISTS "Allow public read access to user profiles" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON users;

-- Политика для чтения публичной информации пользователей
CREATE POLICY "Allow public read access to user profiles" ON users
FOR SELECT USING (true);

-- Политика для обновления собственного профиля
CREATE POLICY "Allow users to update their own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Политика для создания профиля при регистрации
CREATE POLICY "Allow users to create their own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Проверяем что политики созданы
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('listings', 'users');
