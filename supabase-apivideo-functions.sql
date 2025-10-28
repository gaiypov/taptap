-- SQL функции для интеграции api.video
-- Лайки, просмотры и прочее

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

-- Функция инкремента лайков (альтернативный способ)
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
    -- Engagement score = (likes * 10 + messages_count * 20) / NULLIF(views, 0)
    ROUND(
      ((c.likes * 10.0) + (c.messages_count * 20.0)) / NULLIF(c.views, 0.1)
    , 2) as engagement_score,
    c.views,
    c.likes,
    c.messages_count
  FROM cars c
  WHERE 
    c.status = 'active'
    AND c.video_url IS NOT NULL
    AND c.views > 10 -- Минимум 10 просмотров для валидной статистики
  ORDER BY engagement_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Добавление поля video_id если его нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'cars' 
    AND column_name = 'video_id'
  ) THEN
    ALTER TABLE cars ADD COLUMN video_id TEXT;
    COMMENT ON COLUMN cars.video_id IS 'ID видео из api.video';
  END IF;
END $$;

-- Индекс для быстрого поиска по video_id
CREATE INDEX IF NOT EXISTS idx_cars_video_id ON cars(video_id) WHERE video_id IS NOT NULL;

-- Индекс для трендовых авто (по просмотрам и дате)
CREATE INDEX IF NOT EXISTS idx_cars_trending ON cars(views DESC, created_at DESC) 
WHERE status = 'active' AND video_url IS NOT NULL;

-- Функция для получения статистики видео
CREATE OR REPLACE FUNCTION get_video_stats(car_uuid UUID)
RETURNS TABLE (
  total_views INTEGER,
  total_likes INTEGER,
  total_saves INTEGER,
  total_shares INTEGER,
  total_messages INTEGER,
  avg_watch_time DECIMAL,
  engagement_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.views as total_views,
    c.likes as total_likes,
    c.saves as total_saves,
    c.shares as total_shares,
    c.messages_count as total_messages,
    0.0 as avg_watch_time, -- TODO: implement if needed
    ROUND(
      ((c.likes::DECIMAL + c.saves::DECIMAL) / NULLIF(c.views, 0)) * 100
    , 2) as engagement_rate
  FROM cars c
  WHERE c.id = car_uuid;
END;
$$ LANGUAGE plpgsql;

-- Функция для обновления метрик видео (массово)
CREATE OR REPLACE FUNCTION update_video_metrics()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Здесь можно добавить логику для синхронизации
  -- статистики между api.video и Supabase
  
  -- Пример: обновление последнего просмотра
  UPDATE cars
  SET updated_at = NOW()
  WHERE video_url IS NOT NULL
    AND updated_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

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

-- Комментарии к функциям
COMMENT ON FUNCTION increment_views IS 'Увеличить счетчик просмотров для автомобиля';
COMMENT ON FUNCTION increment_likes IS 'Увеличить счетчик лайков для автомобиля';
COMMENT ON FUNCTION get_trending_cars IS 'Получить трендовые автомобили за период';
COMMENT ON FUNCTION get_high_engagement_cars IS 'Получить автомобили с высоким engagement';
COMMENT ON FUNCTION get_video_stats IS 'Получить подробную статистику видео';

-- Grant permissions для authenticated users
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_cars(INTERVAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_high_engagement_cars(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_video_stats(UUID) TO authenticated;

