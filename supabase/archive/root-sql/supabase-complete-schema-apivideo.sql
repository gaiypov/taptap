-- ============================================
-- ПОЛНАЯ SQL СХЕМА ДЛЯ 360AUTO + API.VIDEO
-- ============================================
-- Применить в Supabase Dashboard → SQL Editor

-- ============================================
-- 1. ТАБЛИЦА CARS (с api.video поддержкой)
-- ============================================

-- Проверяем и обновляем таблицу cars
DO $$ 
BEGIN
  -- Добавляем video_id если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'video_id'
  ) THEN
    ALTER TABLE cars ADD COLUMN video_id TEXT;
    COMMENT ON COLUMN cars.video_id IS 'ID видео из api.video';
  END IF;

  -- Добавляем thumbnail_url если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE cars ADD COLUMN thumbnail_url TEXT;
  END IF;

  -- Добавляем views_before_boost если его нет (для BOOST)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'views_before_boost'
  ) THEN
    ALTER TABLE cars ADD COLUMN views_before_boost INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- МИГРАЦИЯ СТАТУСОВ
-- ============================================
-- Обновляем статусы на новые значения
UPDATE cars SET status = 'archived' WHERE status IN ('deleted', 'moderation', 'rejected');

-- Удаляем старый constraint и добавляем новый
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_status_check;
ALTER TABLE cars ADD CONSTRAINT cars_status_check 
  CHECK (status IN ('active', 'sold', 'archived', 'expired'));

-- Обновляем default значение
ALTER TABLE cars ALTER COLUMN status SET DEFAULT 'active';

-- Добавляем комментарии
COMMENT ON COLUMN cars.status IS 'Статус объявления: active - активное, sold - продано, archived - архивировано, expired - истекло время';

-- ============================================
-- 2. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

-- api.video индексы
CREATE INDEX IF NOT EXISTS idx_cars_video_id ON cars(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cars_likes ON cars(likes DESC);
CREATE INDEX IF NOT EXISTS idx_cars_views ON cars(views DESC);

-- Индекс для трендовых авто
CREATE INDEX IF NOT EXISTS idx_cars_trending ON cars(views DESC, created_at DESC) 
WHERE status = 'active' AND video_url IS NOT NULL;

-- Индекс для поиска по бренду и модели
CREATE INDEX IF NOT EXISTS idx_cars_brand_model ON cars(brand, model);

-- Индекс для поиска по статусу
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status) WHERE status = 'active';

-- ============================================
-- 3. SQL ФУНКЦИИ ДЛЯ API.VIDEO
-- ============================================

-- Функция инкремента просмотров
CREATE OR REPLACE FUNCTION increment_views(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE cars
  SET 
    views = views + 1,
    updated_at = NOW()
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция инкремента лайков
CREATE OR REPLACE FUNCTION increment_likes(car_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE cars
  SET 
    likes = likes + 1,
    updated_at = NOW()
  WHERE id = car_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция декремента лайков
CREATE OR REPLACE FUNCTION decrement_likes(car_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE cars
  SET 
    likes = GREATEST(likes - 1, 0),
    updated_at = NOW()
  WHERE id = car_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения популярных авто (по просмотрам)
CREATE OR REPLACE FUNCTION get_trending_cars(time_period INTERVAL DEFAULT '7 days', result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  car_id UUID,
  brand TEXT,
  model TEXT,
  year INTEGER,
  price DECIMAL,
  views INTEGER,
  likes INTEGER,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as car_id,
    c.brand,
    c.model,
    c.year,
    c.price,
    c.views,
    c.likes,
    c.created_at
  FROM cars c
  WHERE 
    c.created_at >= (NOW() - time_period)
    AND c.status = 'active'
    AND c.video_url IS NOT NULL
  ORDER BY c.views DESC, c.likes DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения видео с высоким engagement
CREATE OR REPLACE FUNCTION get_high_engagement_cars(result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  car_id UUID,
  brand TEXT,
  model TEXT,
  engagement_score DECIMAL,
  views INTEGER,
  likes INTEGER,
  messages_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as car_id,
    c.brand,
    c.model,
    ROUND(
      ((c.likes * 10.0) + (COALESCE(c.messages_count, 0) * 20.0)) / NULLIF(c.views, 0.1)
    , 2) as engagement_score,
    c.views,
    c.likes,
    COALESCE(c.messages_count, 0) as messages_count
  FROM cars c
  WHERE 
    c.status = 'active'
    AND c.video_url IS NOT NULL
    AND c.views > 10
  ORDER BY engagement_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики видео
CREATE OR REPLACE FUNCTION get_video_stats(car_uuid UUID)
RETURNS TABLE (
  total_views INTEGER,
  total_likes INTEGER,
  total_saves INTEGER,
  total_shares INTEGER,
  total_messages INTEGER,
  engagement_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.views as total_views,
    c.likes as total_likes,
    COALESCE(c.saves, 0) as total_saves,
    COALESCE(c.shares, 0) as total_shares,
    COALESCE(c.messages_count, 0) as total_messages,
    ROUND(
      ((c.likes::DECIMAL + COALESCE(c.saves, 0)::DECIMAL) / NULLIF(c.views, 0)) * 100
    , 2) as engagement_rate
  FROM cars c
  WHERE c.id = car_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. ТРИГГЕРЫ
-- ============================================

-- Триггер для автоматического обновления updated_at при изменении просмотров/лайков
CREATE OR REPLACE FUNCTION update_car_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS car_stats_update_trigger ON cars;
CREATE TRIGGER car_stats_update_trigger
  BEFORE UPDATE OF views, likes, saves, shares
  ON cars
  FOR EACH ROW
  EXECUTE FUNCTION update_car_stats_timestamp();

-- ============================================
-- 5. RLS ПОЛИТИКИ (если нужны)
-- ============================================

-- Включаем RLS для таблицы cars (если еще не включено)
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать активные объявления
CREATE POLICY IF NOT EXISTS "Anyone can view active cars"
  ON cars FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id);

-- Политика: только владелец может обновлять
CREATE POLICY IF NOT EXISTS "Users can update own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = seller_id);

-- Политика: только владелец может удалять
CREATE POLICY IF NOT EXISTS "Users can delete own cars"
  ON cars FOR DELETE
  USING (auth.uid() = seller_id);

-- Политика: авторизованные пользователи могут создавать
CREATE POLICY IF NOT EXISTS "Authenticated users can create cars"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Даем права на выполнение функций
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_cars(INTERVAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_high_engagement_cars(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_video_stats(UUID) TO authenticated;

-- ============================================
-- 7. КОММЕНТАРИИ К ТАБЛИЦЕ И ПОЛЯМ
-- ============================================

COMMENT ON TABLE cars IS 'Таблица автомобилей с интеграцией api.video';
COMMENT ON COLUMN cars.video_id IS 'ID видео из api.video';
COMMENT ON COLUMN cars.video_url IS 'HLS streaming URL от api.video';
COMMENT ON COLUMN cars.thumbnail_url IS 'URL миниатюры видео';
COMMENT ON COLUMN cars.views IS 'Количество просмотров видео';
COMMENT ON COLUMN cars.likes IS 'Количество лайков';

-- ============================================
-- 8. ТЕСТОВЫЕ ЗАПРОСЫ (закомментированы)
-- ============================================

-- Тест: получить трендовые авто за последнюю неделю
-- SELECT * FROM get_trending_cars('7 days', 10);

-- Тест: получить авто с высоким engagement
-- SELECT * FROM get_high_engagement_cars(10);

-- Тест: получить статистику конкретного авто
-- SELECT * FROM get_video_stats('uuid-здесь');

-- Тест: инкремент просмотров
-- SELECT increment_views('uuid-здесь');

-- ============================================
-- ГОТОВО! 🎉
-- ============================================

SELECT 
  'SQL схема успешно применена! ✅' as status,
  COUNT(*) as total_cars
FROM cars;

