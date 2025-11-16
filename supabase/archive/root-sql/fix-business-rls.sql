-- ======================================
-- ИСПРАВЛЕНИЕ RLS ДЛЯ BUSINESS_ACCOUNTS
-- ======================================
-- 
-- Применить в Supabase Dashboard → SQL Editor
-- 
-- Это позволит всем пользователям читать бизнес-аккаунты
-- (нужно для отображения значков "Verified" в ленте)
--

-- Удалить старую ограничивающую политику
DROP POLICY IF EXISTS "Users can view their own business account" ON business_accounts;

-- Создать публичную политику для чтения
CREATE POLICY "Anyone can view business accounts"
  ON business_accounts FOR SELECT
  USING (true);

-- Оставить write доступ только для владельцев
CREATE POLICY IF NOT EXISTS "Users can update their own business account"
  ON business_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own business account"
  ON business_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Проверка
SELECT 'RLS policies updated successfully!' AS status;

