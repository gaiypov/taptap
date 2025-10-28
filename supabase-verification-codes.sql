-- Создание таблицы verification_codes для SMS авторизации
-- Выполните этот SQL в Supabase SQL Editor

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE
);

-- Индекс для быстрого поиска по номеру телефона
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);

-- Индекс для очистки истекших кодов
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- RLS политики
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Политика: любой может создавать коды верификации
CREATE POLICY "Anyone can create verification codes" ON verification_codes
  FOR INSERT WITH CHECK (true);

-- Политика: любой может читать коды верификации (для проверки)
CREATE POLICY "Anyone can read verification codes" ON verification_codes
  FOR SELECT USING (true);

-- Политика: любой может обновлять коды верификации (для отметки как использованные)
CREATE POLICY "Anyone can update verification codes" ON verification_codes
  FOR UPDATE USING (true);

-- Функция для очистки истекших кодов (опционально)
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблице
COMMENT ON TABLE verification_codes IS 'Таблица для хранения SMS кодов верификации';
COMMENT ON COLUMN verification_codes.phone IS 'Номер телефона в международном формате';
COMMENT ON COLUMN verification_codes.code IS 'Код верификации';
COMMENT ON COLUMN verification_codes.expires_at IS 'Время истечения кода';
COMMENT ON COLUMN verification_codes.is_used IS 'Использован ли код';
