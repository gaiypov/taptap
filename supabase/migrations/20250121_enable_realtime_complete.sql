-- ============================================
-- 360⁰ Marketplace - Enable Realtime (Complete)
-- Production Ready — Kyrgyzstan 2025
-- ============================================

-- ============================================
-- 1. ПРОВЕРКА И ВКЛЮЧЕНИЕ RLS
-- ============================================

-- Убеждаемся, что RLS включен на всех нужных таблицах
DO $$ 
BEGIN
  -- Chat tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_threads') THEN
    ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Listings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
    ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Interactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_likes') THEN
    ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_saves') THEN
    ALTER TABLE public.listing_saves ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- 2. ВКЛЮЧЕНИЕ REALTIME
-- ============================================

-- Включаем Realtime на всех нужных таблицах
-- Realtime автоматически уважает RLS политики!

DO $$ 
BEGIN
  -- Chat threads
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_threads') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE chat_threads;
    EXCEPTION WHEN OTHERS THEN
      -- Таблица уже добавлена, игнорируем ошибку
      NULL;
    END;
  END IF;
  
  -- Chat messages
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  -- Listings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE listings;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  -- Listing likes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_likes') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE listing_likes;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  -- Listing saves
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_saves') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE listing_saves;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- ============================================
-- 3. ПРОВЕРКА RLS ПОЛИТИК
-- ============================================

-- Проверяем наличие RLS политик для chat_threads
DO $$ 
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'chat_threads';
  
  IF policy_count = 0 THEN
    RAISE WARNING '⚠️ Нет RLS политик для chat_threads! Выполните миграцию 20250120_chat_rls_policies.sql';
  ELSE
    RAISE NOTICE '✅ RLS политики для chat_threads: %', policy_count;
  END IF;
END $$;

-- Проверяем наличие RLS политик для chat_messages
DO $$ 
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'chat_messages';
  
  IF policy_count = 0 THEN
    RAISE WARNING '⚠️ Нет RLS политик для chat_messages! Выполните миграцию 20250120_chat_rls_policies.sql';
  ELSE
    RAISE NOTICE '✅ RLS политики для chat_messages: %', policy_count;
  END IF;
END $$;

-- Проверяем наличие RLS политик для listings
DO $$ 
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'listings';
  
  IF policy_count = 0 THEN
    RAISE WARNING '⚠️ Нет RLS политик для listings! Выполните миграцию 20250102_rls_fixes.sql';
  ELSE
    RAISE NOTICE '✅ RLS политики для listings: %', policy_count;
  END IF;
END $$;

-- ============================================
-- 4. ПРОВЕРКА REALTIME ПОДПИСОК
-- ============================================

-- Показываем таблицы, включенные в Realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('chat_threads', 'chat_messages', 'listings', 'listing_likes', 'listing_saves')
ORDER BY tablename;

-- ============================================
-- 5. КОММЕНТАРИИ
-- ============================================

COMMENT ON PUBLICATION supabase_realtime IS 
  'Realtime publication для 360° Marketplace. Автоматически уважает RLS политики.';

