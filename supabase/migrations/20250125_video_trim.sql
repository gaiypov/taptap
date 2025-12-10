-- Добавляем поля для обрезки видео
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS video_trim_start DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_trim_end DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS video_original_duration DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS video_trimmed_duration DECIMAL(10, 2);

-- Индекс для поиска необработанных видео
CREATE INDEX IF NOT EXISTS idx_listings_needs_trim
ON listings (video_trim_start, video_trim_end)
WHERE video_trim_start > 0 OR video_trim_end IS NOT NULL;

-- Комментарии
COMMENT ON COLUMN listings.video_trim_start IS 'Начало обрезки видео в секундах';
COMMENT ON COLUMN listings.video_trim_end IS 'Конец обрезки видео в секундах';
COMMENT ON COLUMN listings.video_original_duration IS 'Оригинальная длительность видео';
COMMENT ON COLUMN listings.video_trimmed_duration IS 'Длительность после обрезки';
