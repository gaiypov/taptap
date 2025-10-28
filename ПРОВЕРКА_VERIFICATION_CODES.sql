-- ПРОВЕРКА И СОЗДАНИЕ ТАБЛИЦЫ VERIFICATION_CODES
-- Выполнить этот SQL в Supabase SQL Editor

-- 1. Проверяем существует ли таблица
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'verification_codes'
) as table_exists;

-- 2. Если таблица не существует, создаем её
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE
);

-- 3. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- 4. Включаем RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 5. Удаляем старые политики если есть
DROP POLICY IF EXISTS "Anyone can create verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Anyone can read verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Anyone can update verification codes" ON verification_codes;

-- 6. Создаем новые политики
CREATE POLICY "Anyone can create verification codes" ON verification_codes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes" ON verification_codes
FOR SELECT USING (true);

CREATE POLICY "Anyone can update verification codes" ON verification_codes
FOR UPDATE USING (true);

-- 7. Проверяем что таблица создана
SELECT COUNT(*) as total_codes FROM verification_codes;

-- 8. Проверяем политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'verification_codes';
