-- ИСПРАВЛЕНИЕ RLS ДЛЯ BUSINESS_ACCOUNTS
-- Выполнить этот SQL в Supabase SQL Editor

-- 1. Включаем RLS для таблицы business_accounts
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем все существующие политики
DROP POLICY IF EXISTS "Users can view own business account" ON business_accounts;
DROP POLICY IF EXISTS "Users can update own business account" ON business_accounts;
DROP POLICY IF EXISTS "Users can create own business account" ON business_accounts;
DROP POLICY IF EXISTS "Public can view verified business accounts" ON business_accounts;

-- 3. Создаем новые политики
-- Политика для чтения собственного бизнес-аккаунта
CREATE POLICY "Users can view own business account" ON business_accounts
FOR SELECT USING (auth.uid() = user_id);

-- Политика для чтения верифицированных бизнес-аккаунтов (для алгоритма приоритета)
CREATE POLICY "Public can view verified business accounts" ON business_accounts
FOR SELECT USING (is_verified = true AND tier IN ('pro', 'premium'));

-- Политика для обновления собственного бизнес-аккаунта
CREATE POLICY "Users can update own business account" ON business_accounts
FOR UPDATE USING (auth.uid() = user_id);

-- Политика для создания собственного бизнес-аккаунта
CREATE POLICY "Users can create own business account" ON business_accounts
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Проверяем что политики созданы
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'business_accounts';
