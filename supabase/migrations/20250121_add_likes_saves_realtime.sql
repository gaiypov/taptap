-- ============================================
-- Добавление таблиц likes и saves в Realtime
-- 360° Marketplace — Kyrgyzstan 2025
-- ============================================

-- Добавляем likes в Realtime
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE likes;
      RAISE NOTICE '✅ likes добавлена в Realtime';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ likes уже в Realtime или ошибка: %', SQLERRM;
    END;
  ELSE
    RAISE WARNING '⚠️ Таблица likes не найдена';
  END IF;
END $$;

-- Добавляем saves в Realtime
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saves') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE saves;
      RAISE NOTICE '✅ saves добавлена в Realtime';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ saves уже в Realtime или ошибка: %', SQLERRM;
    END;
  ELSE
    RAISE WARNING '⚠️ Таблица saves не найдена';
  END IF;
END $$;

-- Показываем финальный статус всех таблиц в Realtime
SELECT 
  tablename,
  '✅ Включен в Realtime' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'chat_threads', 
    'chat_messages', 
    'listings', 
    'likes',
    'saves'
  )
ORDER BY tablename;

