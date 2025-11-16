-- =====================================================
-- ТАБЛИЦА ДЛЯ ХРАНЕНИЯ СОГЛАСИЙ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================
-- Для ОСОО "Супер Апп" - Приложение 360Auto
-- Соответствует Закону КР "Об информации персонального характера" № 58
-- =====================================================

-- Удаляем таблицу если существует (для повторного запуска)
DROP TABLE IF EXISTS user_consents CASCADE;

-- Создаём таблицу
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Согласия
  terms_accepted BOOLEAN DEFAULT false,
  privacy_accepted BOOLEAN DEFAULT false,
  consent_accepted BOOLEAN DEFAULT false,
  
  -- Дополнительные согласия
  marketing_accepted BOOLEAN DEFAULT false,
  notifications_accepted BOOLEAN DEFAULT true,
  
  -- Информация о принятии
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  
  -- Информация об отзыве
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoke_reason TEXT,
  
  -- Версия документов
  terms_version TEXT DEFAULT '1.0',
  privacy_version TEXT DEFAULT '1.0',
  consent_version TEXT DEFAULT '1.0',
  
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_accepted_at ON user_consents(accepted_at);
CREATE INDEX idx_user_consents_revoked ON user_consents(revoked);

-- Уникальность: один активный consent на пользователя
CREATE UNIQUE INDEX idx_user_consents_user_active ON user_consents(user_id) 
WHERE revoked = false;

-- =====================================================
-- ФУНКЦИЯ: Проверка наличия согласий
-- =====================================================
CREATE OR REPLACE FUNCTION has_user_consents(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_consents BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM user_consents 
    WHERE user_id = p_user_id 
      AND revoked = false
      AND terms_accepted = true
      AND privacy_accepted = true
      AND consent_accepted = true
  ) INTO v_has_consents;
  
  RETURN v_has_consents;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ФУНКЦИЯ: Получение согласий пользователя
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_consents(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  terms_accepted BOOLEAN,
  privacy_accepted BOOLEAN,
  consent_accepted BOOLEAN,
  marketing_accepted BOOLEAN,
  notifications_accepted BOOLEAN,
  accepted_at TIMESTAMP WITH TIME ZONE,
  revoked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.id,
    uc.terms_accepted,
    uc.privacy_accepted,
    uc.consent_accepted,
    uc.marketing_accepted,
    uc.notifications_accepted,
    uc.accepted_at,
    uc.revoked
  FROM user_consents uc
  WHERE uc.user_id = p_user_id
    AND uc.revoked = false
  ORDER BY uc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ФУНКЦИЯ: Отзыв согласия
-- =====================================================
CREATE OR REPLACE FUNCTION revoke_user_consents(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_consents
  SET 
    revoked = true,
    revoked_at = NOW(),
    revoke_reason = p_reason,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND revoked = false;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ТРИГГЕР: Обновление updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_user_consents_updated_at ON user_consents;

CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS ПОЛИТИКИ
-- =====================================================

-- Включаем RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Пользователь может читать только свои согласия
DROP POLICY IF EXISTS "Users can view own consents" ON user_consents;
CREATE POLICY "Users can view own consents" ON user_consents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может создавать свои согласия
DROP POLICY IF EXISTS "Users can create own consents" ON user_consents;
CREATE POLICY "Users can create own consents" ON user_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять свои согласия
DROP POLICY IF EXISTS "Users can update own consents" ON user_consents;
CREATE POLICY "Users can update own consents" ON user_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователь НЕ может удалять согласия (только отзывать)
-- Согласия хранятся для юридической защиты

-- =====================================================
-- ТЕСТОВЫЕ ДАННЫЕ (опционально)
-- =====================================================

-- Вставка примера согласия для первого пользователя
-- INSERT INTO user_consents (
--   user_id,
--   terms_accepted,
--   privacy_accepted,
--   consent_accepted,
--   ip_address,
--   user_agent
-- )
-- SELECT 
--   id,
--   true,
--   true,
--   true,
--   '127.0.0.1',
--   'React Native App'
-- FROM users
-- LIMIT 1
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- КОММЕНТАРИИ К ТАБЛИЦЕ
-- =====================================================
COMMENT ON TABLE user_consents IS 'Хранение согласий пользователей на обработку персональных данных для ОСОО "Супер Апп"';
COMMENT ON COLUMN user_consents.user_id IS 'ID пользователя из таблицы users';
COMMENT ON COLUMN user_consents.terms_accepted IS 'Согласие с Пользовательским соглашением';
COMMENT ON COLUMN user_consents.privacy_accepted IS 'Согласие с Политикой конфиденциальности';
COMMENT ON COLUMN user_consents.consent_accepted IS 'Согласие на обработку персональных данных';
COMMENT ON COLUMN user_consents.marketing_accepted IS 'Согласие на маркетинговые рассылки (опционально)';
COMMENT ON COLUMN user_consents.notifications_accepted IS 'Согласие на уведомления';
COMMENT ON COLUMN user_consents.revoked IS 'Флаг отзыва согласия';
COMMENT ON COLUMN user_consents.revoked_at IS 'Дата и время отзыва согласия';
COMMENT ON COLUMN user_consents.ip_address IS 'IP-адрес при принятии согласия';
COMMENT ON COLUMN user_consents.user_agent IS 'User Agent при принятии согласия';

-- =====================================================
-- УСПЕШНО!
-- =====================================================
SELECT 'User consents table created successfully!' as message;

