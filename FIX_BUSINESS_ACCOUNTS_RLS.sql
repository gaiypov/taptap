-- ============================================
-- ИСПРАВЛЕНИЕ: RLS для business_accounts
-- ============================================
-- Проблема: Пользователи не могут видеть бизнес-аккаунты других продавцов
-- Решение: Добавить публичную политику чтения для основной информации

-- 1. Удаляем старую ограничивающую политику
DROP POLICY IF EXISTS "Users can view their own business account" ON business_accounts;

-- 2. Создаем ПУБЛИЧНУЮ политику для чтения (все могут видеть бизнес-аккаунты)
CREATE POLICY "Anyone can view business accounts"
  ON business_accounts FOR SELECT
  USING (true);

-- 3. Оставляем ограничения только на запись
DROP POLICY IF EXISTS "Users can insert their own business account" ON business_accounts;
CREATE POLICY "Users can insert their own business account"
  ON business_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own business account" ON business_accounts;
CREATE POLICY "Users can update their own business account"
  ON business_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Можно обновлять только свой аккаунт
CREATE POLICY "Users can only update own business account"
  ON business_accounts FOR UPDATE
  WITH CHECK (auth.uid() = user_id);

-- 4. Политика для удаления (только свой)
DROP POLICY IF EXISTS "Users can delete their own business account" ON business_accounts;
CREATE POLICY "Users can delete their own business account"
  ON business_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ПРОВЕРКА
-- ============================================

-- Проверить что RLS включен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'business_accounts';

-- Посмотреть все политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'business_accounts'
ORDER BY policyname;

-- ============================================
-- ГОТОВО!
-- ============================================

