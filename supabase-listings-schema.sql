-- ============================================
-- НОВАЯ СХЕМА LISTINGS (АВТО + ЛОШАДИ)
-- ============================================
-- Применить в Supabase Dashboard → SQL Editor

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ТАБЛИЦА LISTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Категория
  category TEXT NOT NULL CHECK (category IN ('car', 'horse')),
  
  -- Продавец
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Видео (api.video)
  video_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Общие поля
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  city TEXT,
  location TEXT,
  
  -- Статус и даты
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'archived', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- created_at + 90 дней
  delete_at TIMESTAMP WITH TIME ZONE,  -- sold_at + 14 дней
  
  -- Статистика
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  
  -- AI анализ (общий для всех категорий)
  ai_score DECIMAL(3, 2) CHECK (ai_score >= 0 AND ai_score <= 1), -- 0.00 - 1.00
  ai_condition TEXT CHECK (ai_condition IN ('excellent', 'good', 'fair', 'poor')),
  ai_tags JSONB,
  ai_analysis_text TEXT,
  ai_estimated_price JSONB, -- { "min": 0, "max": 0 }
  
  -- Специфичные данные (JSON для гибкости)
  -- Для авто: brand, model, year, mileage, transmission, fuel_type, color, etc.
  -- Для лошадей: breed, age, gender, color, height, training, purpose, pedigree, etc.
  details JSONB NOT NULL,
  
  -- BOOST
  is_promoted BOOLEAN DEFAULT FALSE,
  boost_type TEXT CHECK (boost_type IN ('basic', 'top', 'premium')),
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  boost_activated_at TIMESTAMP WITH TIME ZONE,
  views_before_boost INTEGER DEFAULT 0
);

-- ============================================
-- 2. ИНДЕКСЫ
-- ============================================

-- Основные индексы
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_video_id ON public.listings(video_id);

-- Индексы для автоудаления
CREATE INDEX IF NOT EXISTS idx_listings_delete_at ON public.listings(delete_at) 
  WHERE delete_at IS NOT NULL AND status = 'sold';
CREATE INDEX IF NOT EXISTS idx_listings_expires_at ON public.listings(expires_at) 
  WHERE expires_at IS NOT NULL AND status = 'active';

-- Индексы для поиска и фильтрации
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_is_promoted ON public.listings(is_promoted) 
  WHERE is_promoted = TRUE;

-- GIN индекс для JSONB поиска
CREATE INDEX IF NOT EXISTS idx_listings_details ON public.listings USING GIN (details);

-- Полнотекстовый поиск
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings USING GIN (
  to_tsvector('russian', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(city, '')
  )
);

-- ============================================
-- 3. ТРИГГЕР: Автоматическое expires_at
-- ============================================

CREATE OR REPLACE FUNCTION set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Устанавливаем expires_at при создании объявления
  NEW.expires_at := NEW.created_at + INTERVAL '90 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_listing_expires ON public.listings;
CREATE TRIGGER set_listing_expires
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION set_expires_at();

-- ============================================
-- 4. ТРИГГЕР: Автоматическое delete_at при продаже
-- ============================================

CREATE OR REPLACE FUNCTION set_delete_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Когда меняется статус на 'sold'
  IF NEW.status = 'sold' AND (OLD.status IS NULL OR OLD.status != 'sold') THEN
    NEW.sold_at := NOW();
    NEW.delete_at := NOW() + INTERVAL '14 days';
  END IF;
  
  -- Когда возвращается в 'active' из 'sold'
  IF NEW.status = 'active' AND OLD.status = 'sold' THEN
    NEW.sold_at := NULL;
    NEW.delete_at := NULL;
  END IF;
  
  -- Обновляем updated_at при любом изменении
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_listing_delete ON public.listings;
CREATE TRIGGER set_listing_delete
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION set_delete_at();

-- ============================================
-- 5. ТРИГГЕР: Автоматическое обновление updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_listing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_listing_timestamp_trigger ON public.listings;
CREATE TRIGGER update_listing_timestamp_trigger
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_timestamp();

-- ============================================
-- 6. ФУНКЦИИ ДЛЯ РАБОТЫ С ЛИСТИНГАМИ
-- ============================================

-- Функция инкремента просмотров
CREATE OR REPLACE FUNCTION increment_listing_views(listing_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET 
    views = views + 1,
    updated_at = NOW()
  WHERE id = listing_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция инкремента лайков
CREATE OR REPLACE FUNCTION increment_listing_likes(listing_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET 
    likes = likes + 1,
    updated_at = NOW()
  WHERE id = listing_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция декремента лайков
CREATE OR REPLACE FUNCTION decrement_listing_likes(listing_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET 
    likes = GREATEST(likes - 1, 0),
    updated_at = NOW()
  WHERE id = listing_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция получения трендовых листингов
CREATE OR REPLACE FUNCTION get_trending_listings(
  listing_category TEXT DEFAULT NULL,
  time_period INTERVAL DEFAULT '7 days',
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  listing_id UUID,
  category TEXT,
  title TEXT,
  price DECIMAL,
  views INTEGER,
  likes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as listing_id,
    l.category,
    l.title,
    l.price,
    l.views,
    l.likes,
    l.created_at
  FROM public.listings l
  WHERE 
    l.created_at >= (NOW() - time_period)
    AND l.status = 'active'
    AND (listing_category IS NULL OR l.category = listing_category)
  ORDER BY l.views DESC, l.likes DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. RLS ПОЛИТИКИ
-- ============================================

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Все могут видеть активные объявления
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

-- Владелец может видеть свои объявления в любом статусе
DROP POLICY IF EXISTS "Sellers can view own listings" ON public.listings;
CREATE POLICY "Sellers can view own listings"
  ON public.listings FOR SELECT
  USING (seller_id = auth.uid());

-- Авторизованные пользователи могут создавать
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
CREATE POLICY "Authenticated users can create listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Владелец может обновлять свои объявления
DROP POLICY IF EXISTS "Sellers can update own listings" ON public.listings;
CREATE POLICY "Sellers can update own listings"
  ON public.listings FOR UPDATE
  USING (seller_id = auth.uid());

-- Владелец может удалять свои объявления
DROP POLICY IF EXISTS "Sellers can delete own listings" ON public.listings;
CREATE POLICY "Sellers can delete own listings"
  ON public.listings FOR DELETE
  USING (seller_id = auth.uid());

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_listing_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_listing_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_listings(TEXT, INTERVAL, INTEGER) TO authenticated;

-- ============================================
-- 9. КОММЕНТАРИИ
-- ============================================

COMMENT ON TABLE public.listings IS 'Универсальная таблица объявлений для автомобилей и лошадей';
COMMENT ON COLUMN public.listings.category IS 'Категория: car - автомобиль, horse - лошадь';
COMMENT ON COLUMN public.listings.status IS 'active - активное, sold - продано, archived - архивировано, expired - истекло время';
COMMENT ON COLUMN public.listings.expires_at IS 'Дата истечения (90 дней с момента создания)';
COMMENT ON COLUMN public.listings.delete_at IS 'Дата удаления (14 дней после продажи)';
COMMENT ON COLUMN public.listings.details IS 'JSON с специфичными данными для категории';

-- ============================================
-- 10. МИГРАЦИЯ ИЗ СТАРОЙ ТАБЛИЦЫ CARS
-- ============================================

-- Функция для миграции существующих авто в новую таблицу
CREATE OR REPLACE FUNCTION migrate_cars_to_listings()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  INSERT INTO public.listings (
    category,
    seller_id,
    video_id,
    video_url,
    thumbnail_url,
    title,
    description,
    price,
    city,
    location,
    status,
    created_at,
    updated_at,
    sold_at,
    likes,
    views,
    shares,
    saves,
    messages_count,
    ai_score,
    ai_condition,
    ai_estimated_price,
    ai_analysis_text,
    is_promoted,
    boost_type,
    boost_expires_at,
    boost_activated_at,
    views_before_boost,
    details
  )
  SELECT 
    'car' as category,
    seller_id,
    COALESCE(video_id, 'legacy-' || id::text) as video_id,
    video_url,
    thumbnail_url,
    brand || ' ' || model || ' ' || year::text as title,
    description,
    price,
    location as city,
    location,
    CASE 
      WHEN status = 'deleted' THEN 'archived'
      WHEN status = 'moderation' THEN 'archived'
      WHEN status = 'rejected' THEN 'archived'
      ELSE status
    END as status,
    created_at,
    updated_at,
    sold_at,
    likes,
    views,
    COALESCE(shares, 0) as shares,
    COALESCE(saves, 0) as saves,
    COALESCE(messages_count, 0) as messages_count,
    ai_score / 100.0 as ai_score, -- Конвертируем из 0-100 в 0.00-1.00
    ai_condition,
    ai_estimated_price,
    ai_analysis_text,
    is_promoted,
    boost_type,
    boost_expires_at,
    boost_activated_at,
    views_before_boost,
    jsonb_build_object(
      'brand', brand,
      'model', model,
      'year', year,
      'mileage', mileage,
      'color', color,
      'transmission', transmission,
      'fuel_type', fuel_type,
      'body_type', body_type,
      'condition', ai_condition,
      'additional_images', additional_images,
      'ai_damages', ai_damages,
      'ai_features', ai_features
    ) as details
  FROM public.cars
  WHERE NOT EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.video_id = COALESCE(cars.video_id, 'legacy-' || cars.id::text)
  );
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Раскомментируйте для выполнения миграции:
-- SELECT migrate_cars_to_listings();

-- ============================================
-- ГОТОВО! 🎉
-- ============================================

SELECT 
  '✅ Схема listings успешно создана!' as status,
  COUNT(*) as total_listings
FROM public.listings;

