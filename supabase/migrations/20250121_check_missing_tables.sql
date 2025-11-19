-- ============================================
-- Проверка отсутствующих таблиц для Realtime
-- 360° Marketplace — Kyrgyzstan 2025
-- ============================================

-- Проверяем, существуют ли таблицы listing_likes и listing_saves
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Таблица существует'
    ELSE '❌ Таблица не существует'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('listing_likes', 'listing_saves', 'likes', 'saves')
ORDER BY table_name;

-- Проверяем все таблицы, связанные с лайками и сохранениями
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%like%' 
    OR table_name LIKE '%save%'
    OR table_name LIKE '%favorite%'
  )
ORDER BY table_name;

