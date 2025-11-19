-- ============================================
-- Добавление отсутствующих таблиц в Realtime
-- 360° Marketplace — Kyrgyzstan 2025
-- ============================================

-- Сначала проверяем, какие таблицы существуют
-- Затем добавляем их в Realtime

DO $$ 
BEGIN
  -- Listing likes (проверяем разные варианты названий)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_likes') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE listing_likes;
      RAISE NOTICE '✅ listing_likes добавлена в Realtime';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ listing_likes уже в Realtime или ошибка: %', SQLERRM;
    END;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE likes;
      RAISE NOTICE '✅ likes добавлена в Realtime';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ likes уже в Realtime или ошибка: %', SQLERRM;
    END;
  ELSE
    RAISE WARNING '⚠️ Таблица listing_likes или likes не найдена';
  END IF;
  
  -- Listing saves (проверяем разные варианты названий)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_saves') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE listing_saves;
      RAISE NOTICE '✅ listing_saves добавлена в Realtime';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ listing_saves уже в Realtime или ошибка: %', SQLERRM;
    END;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saves') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE saves;
      RAISE NOTICE '✅ saves добавлена в Realtime';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ saves уже в Realtime или ошибка: %', SQLERRM;
    END;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE favorites;
      RAISE NOTICE '✅ favorites добавлена в Realtime';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ favorites уже в Realtime или ошибка: %', SQLERRM;
    END;
  ELSE
    RAISE WARNING '⚠️ Таблица listing_saves, saves или favorites не найдена';
  END IF;
END $$;

-- Показываем финальный статус
SELECT 
  tablename,
  '✅ Включен в Realtime' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'chat_threads', 
    'chat_messages', 
    'listings', 
    'listing_likes', 
    'listing_saves',
    'likes',
    'saves',
    'favorites'
  )
ORDER BY tablename;

