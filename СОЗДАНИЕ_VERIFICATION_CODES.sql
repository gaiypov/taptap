-- СОЗДАНИЕ ТАБЛИЦЫ VERIFICATION_CODES ДЛЯ SMS
-- Выполните этот SQL в Supabase SQL Editor

-- 1. Создаем таблицу verification_codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE
);

-- 2. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON public.verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.verification_codes(expires_at);

-- 3. Включаем RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- 4. Создаем политики RLS
DROP POLICY IF EXISTS "Anyone can create verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can read verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can update verification codes" ON public.verification_codes;

CREATE POLICY "Anyone can create verification codes" ON public.verification_codes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes" ON public.verification_codes
FOR SELECT USING (true);

CREATE POLICY "Anyone can update verification codes" ON public.verification_codes
FOR UPDATE USING (true);

-- 5. Проверяем что таблица создана
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'verification_codes';
