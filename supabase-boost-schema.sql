-- ============================================
-- BOOST MONETIZATION SCHEMA
-- ============================================

-- Таблица транзакций BOOST
CREATE TABLE IF NOT EXISTS boost_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('basic', 'top', 'premium')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KGS',
  payment_method TEXT NOT NULL CHECK (
    payment_method IN ('mbank', 'bakai', 'obank', 'optima')
  ),
  payment_id TEXT,
  payment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'success', 'failed', 'cancelled', 'refunded')
  ),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  duration_hours INTEGER NOT NULL,
  views_before INTEGER DEFAULT 0,
  views_during INTEGER DEFAULT 0,
  views_after INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_boost_transactions_car_id ON boost_transactions(car_id);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_user_id ON boost_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_status ON boost_transactions(status);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_created_at ON boost_transactions(created_at DESC);

-- Добавляем поля BOOST в таблицу cars
ALTER TABLE cars ADD COLUMN IF NOT EXISTS boost_type TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS boost_activated_at TIMESTAMP;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS views_before_boost INTEGER DEFAULT 0;

-- Индекс для активных BOOST
CREATE INDEX IF NOT EXISTS idx_cars_boost_expires_at ON cars(boost_expires_at) WHERE boost_expires_at IS NOT NULL;

-- Функция проверки активного BOOST
CREATE OR REPLACE FUNCTION has_active_boost(car_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM cars
    WHERE id = car_uuid
      AND boost_type IS NOT NULL
      AND boost_expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Функция получения типа активного BOOST
CREATE OR REPLACE FUNCTION get_active_boost_type(car_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  boost TEXT;
BEGIN
  SELECT boost_type INTO boost
  FROM cars
  WHERE id = car_uuid
    AND boost_type IS NOT NULL
    AND boost_expires_at > NOW();
  
  RETURN boost;
END;
$$ LANGUAGE plpgsql;

-- Функция обновления BOOST для автомобиля
CREATE OR REPLACE FUNCTION update_car_boost(
  car_uuid UUID,
  new_boost_type TEXT,
  new_expires_at TIMESTAMP,
  new_activated_at TIMESTAMP
)
RETURNS VOID AS $$
BEGIN
  -- Сохраняем текущее количество просмотров перед активацией BOOST
  UPDATE cars
  SET 
    views_before_boost = views,
    boost_type = new_boost_type,
    boost_activated_at = new_activated_at,
    boost_expires_at = new_expires_at,
    updated_at = NOW()
  WHERE id = car_uuid;
END;
$$ LANGUAGE plpgsql;

-- Функция деактивации истекших BOOST
CREATE OR REPLACE FUNCTION cleanup_expired_boosts()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Обновляем транзакции с просмотрами после BOOST
  UPDATE boost_transactions bt
  SET 
    views_after = c.views,
    updated_at = NOW()
  FROM cars c
  WHERE bt.car_id = c.id
    AND bt.status = 'success'
    AND bt.expires_at <= NOW()
    AND bt.views_after = 0;

  -- Деактивируем истекшие BOOST в cars
  UPDATE cars
  SET 
    boost_type = NULL,
    boost_expires_at = NULL
  WHERE boost_expires_at <= NOW()
    AND boost_type IS NOT NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_boost_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boost_transactions_modtime
  BEFORE UPDATE ON boost_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_boost_transaction_timestamp();

-- Таблица логов webhook'ов
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('mbank', 'bakai', 'obank', 'optima')),
  event TEXT NOT NULL,
  payment_id TEXT,
  headers JSONB,
  body JSONB,
  response JSONB,
  ip_address INET,
  success BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для webhook логов
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- RLS политики
ALTER TABLE boost_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои транзакции
CREATE POLICY "Users can view own boost transactions"
  ON boost_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователи могут создавать свои транзакции
CREATE POLICY "Users can create own boost transactions"
  ON boost_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: только система может обновлять транзакции (через service role)
CREATE POLICY "Service role can update boost transactions"
  ON boost_transactions FOR UPDATE
  USING (true);

-- Политика: webhook логи доступны только через service role
CREATE POLICY "Service role can manage webhook logs"
  ON webhook_logs FOR ALL
  USING (true);

-- Функция для получения статистики BOOST пользователя
CREATE OR REPLACE FUNCTION get_user_boost_stats(user_uuid UUID)
RETURNS TABLE(
  total_spent DECIMAL,
  total_boosts INTEGER,
  avg_multiplier DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_spent,
    COUNT(*)::INTEGER as total_boosts,
    COALESCE(AVG(CASE 
      WHEN views_before > 0 THEN views_during::DECIMAL / views_before::DECIMAL 
      ELSE 0 
    END), 0) as avg_multiplier
  FROM boost_transactions
  WHERE user_id = user_uuid AND status = 'success';
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблицам
COMMENT ON TABLE boost_transactions IS 'Таблица транзакций для BOOST монетизации';
COMMENT ON TABLE webhook_logs IS 'Логи webhook запросов от платежных систем';

COMMENT ON COLUMN boost_transactions.boost_type IS 'Тип BOOST: basic (⭐), top (🔥), premium (💎)';
COMMENT ON COLUMN boost_transactions.duration_hours IS 'Длительность BOOST в часах';
COMMENT ON COLUMN boost_transactions.views_before IS 'Просмотры до активации BOOST';
COMMENT ON COLUMN boost_transactions.views_during IS 'Просмотры во время действия BOOST';
COMMENT ON COLUMN boost_transactions.views_after IS 'Просмотры после истечения BOOST';
