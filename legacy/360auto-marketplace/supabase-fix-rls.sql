-- ============================================
-- 360° Marketplace - Supabase RLS Fix
-- ============================================
-- Этот скрипт исправляет ошибки "permission denied"
-- Выполните его в Supabase Dashboard → SQL Editor
-- ============================================

-- 1. ОТКЛЮЧИТЬ RLS ДЛЯ ТЕСТИРОВАНИЯ
-- ============================================

ALTER TABLE IF EXISTS listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- 2. РАЗРЕШИТЬ ПУБЛИЧНЫЙ ДОСТУП
-- ============================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. ИЛИ ВКЛЮЧИТЬ RLS С ПРАВИЛЬНЫМИ ПОЛИТИКАМИ
-- ============================================

-- Включить RLS
ALTER TABLE IF EXISTS listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- Удалить старые политики если есть
DROP POLICY IF EXISTS "Public can view listings" ON listings;
DROP POLICY IF EXISTS "Anyone can view users" ON users;

-- Создать новые политики для listings
CREATE POLICY "Public can view listings"
ON listings
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated can manage own listings"
ON listings
FOR ALL
TO authenticated
USING (auth.uid()::uuid = seller_id::uuid)
WITH CHECK (auth.uid()::uuid = seller_id::uuid);

-- Политики для users
CREATE POLICY "Public can view users"
ON users
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid()::uuid = id::uuid)
WITH CHECK (auth.uid()::uuid = id::uuid);

-- 4. ПРОВЕРИТЬ ЧТО ВСЕ РАБОТАЕТ
-- ============================================

-- Проверить RLS статус
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('listings', 'users');

-- Проверить что данные видны
SELECT COUNT(*) as total_listings FROM listings;

-- ============================================
-- ГОТОВО! Ошибки 42501 должны исчезнуть
-- ============================================

