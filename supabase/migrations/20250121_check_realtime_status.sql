-- ============================================
-- Проверка статуса Realtime и RLS
-- 360° Marketplace — Kyrgyzstan 2025
-- ============================================

-- ============================================
-- 1. ПРОВЕРКА RLS ВКЛЮЧЕНИЯ
-- ============================================

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Включен'
    ELSE '❌ Выключен'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('chat_threads', 'chat_messages', 'listings', 'listing_likes', 'listing_saves')
ORDER BY tablename;

-- ============================================
-- 2. ПРОВЕРКА RLS ПОЛИТИК
-- ============================================

SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chat_threads', 'chat_messages', 'listings', 'listing_likes', 'listing_saves')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 3. ПРОВЕРКА REALTIME ПОДПИСОК
-- ============================================

SELECT 
  tablename,
  CASE 
    WHEN tablename IS NOT NULL THEN '✅ Включен в Realtime'
    ELSE '❌ Не включен'
  END as realtime_status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('chat_threads', 'chat_messages', 'listings', 'listing_likes', 'listing_saves')
ORDER BY tablename;

-- Если таблиц нет в результате — они не включены в Realtime!

-- ============================================
-- 4. ОБЩИЙ СТАТУС
-- ============================================

SELECT 
  'RLS включен на всех таблицах' as check_name,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ OK'
    ELSE '❌ Проблема'
  END as status,
  COUNT(*) || ' из 5 таблиц' as details
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('chat_threads', 'chat_messages', 'listings', 'listing_likes', 'listing_saves')
  AND rowsecurity = true;

SELECT 
  'RLS политики созданы' as check_name,
  CASE 
    WHEN COUNT(DISTINCT tablename) >= 3 THEN '✅ OK'
    ELSE '⚠️ Проверьте политики'
  END as status,
  COUNT(DISTINCT tablename) || ' таблиц с политиками' as details
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chat_threads', 'chat_messages', 'listings', 'listing_likes', 'listing_saves');

SELECT 
  'Realtime включен' as check_name,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ OK'
    ELSE '❌ Выполните миграцию 20250121_enable_realtime_complete.sql'
  END as status,
  COUNT(*) || ' из 5 таблиц в Realtime' as details
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('chat_threads', 'chat_messages', 'listings', 'listing_likes', 'listing_saves');

