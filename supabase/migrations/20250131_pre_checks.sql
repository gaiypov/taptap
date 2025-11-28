-- ========================================
-- PRE-MIGRATION CHECKS
-- Run this BEFORE applying 20250131_critical_database_fixes.sql
-- ========================================

-- ========================================
-- CHECK 1: listing_likes.user_id type and invalid data
-- ========================================
SELECT
  'CHECK 1: listing_likes.user_id' as check_name,
  data_type as current_type,
  CASE
    WHEN data_type = 'text' THEN '⚠️ Needs conversion to UUID'
    WHEN data_type = 'uuid' THEN '✅ Already UUID - skip conversion'
    ELSE '❓ Unknown type'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'listing_likes'
  AND column_name = 'user_id';

-- Count invalid user_ids that will be DELETED
SELECT
  'CHECK 1b: Invalid user_ids to delete' as check_name,
  COUNT(*) as invalid_records,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No invalid records - safe'
    WHEN COUNT(*) < 100 THEN '⚠️ ' || COUNT(*) || ' records will be deleted'
    ELSE '🔴 ' || COUNT(*) || ' records will be deleted - REVIEW!'
  END as impact
FROM public.listing_likes
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ========================================
-- CHECK 2: Duplicate likes (will be deleted)
-- ========================================
WITH duplicates AS (
  SELECT user_id, listing_id, COUNT(*) as count
  FROM public.listing_likes
  GROUP BY user_id, listing_id
  HAVING COUNT(*) > 1
)
SELECT
  'CHECK 2: Duplicate likes' as check_name,
  COUNT(*) as duplicate_pairs,
  SUM(count - 1) as records_to_delete,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No duplicates - safe'
    WHEN COUNT(*) < 50 THEN '⚠️ ' || COUNT(*) || ' duplicate pairs will be cleaned'
    ELSE '🔴 ' || COUNT(*) || ' duplicate pairs - REVIEW!'
  END as impact
FROM duplicates;

-- ========================================
-- CHECK 3: Duplicate saves (will be deleted)
-- ========================================
WITH duplicates AS (
  SELECT user_id, listing_id, COUNT(*) as count
  FROM public.listing_saves
  GROUP BY user_id, listing_id
  HAVING COUNT(*) > 1
)
SELECT
  'CHECK 3: Duplicate saves' as check_name,
  COUNT(*) as duplicate_pairs,
  SUM(count - 1) as records_to_delete,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No duplicates - safe'
    WHEN COUNT(*) < 50 THEN '⚠️ ' || COUNT(*) || ' duplicate pairs will be cleaned'
    ELSE '🔴 ' || COUNT(*) || ' duplicate pairs - REVIEW!'
  END as impact
FROM duplicates;

-- ========================================
-- CHECK 4: Table sizes (for performance estimation)
-- ========================================
SELECT
  'CHECK 4: Table sizes' as check_name,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
  CASE
    WHEN pg_total_relation_size(schemaname||'.'||tablename) < 100*1024*1024 THEN '✅ Small (<100MB) - fast migration'
    WHEN pg_total_relation_size(schemaname||'.'||tablename) < 1024*1024*1024 THEN '⚠️ Medium (<1GB) - use CONCURRENTLY'
    ELSE '🔴 Large (>1GB) - use NOT VALID + CONCURRENTLY'
  END as recommendation
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('listings', 'listing_likes', 'listing_saves', 'comments', 'chat_messages', 'chat_threads')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ========================================
-- CHECK 5: Existing indexes (to avoid duplicates)
-- ========================================
SELECT
  'CHECK 5: Existing indexes' as check_name,
  indexname,
  tablename,
  CASE
    WHEN indexname LIKE 'idx_listings_%' THEN '✅ Will be skipped (IF NOT EXISTS)'
    WHEN indexname LIKE 'idx_comments_%' THEN '✅ Will be skipped (IF NOT EXISTS)'
    WHEN indexname LIKE 'idx_chat_%' THEN '✅ Will be skipped (IF NOT EXISTS)'
    ELSE '✅ Other index'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_listings_seller_user_id',
    'idx_listings_category_status_created_at',
    'idx_listings_business_id',
    'idx_listings_active_created_at',
    'idx_comments_listing_id',
    'idx_comments_user_id',
    'idx_comments_parent_id',
    'idx_promotions_listing_id',
    'idx_promotions_ends_at',
    'idx_boost_transactions_listing_status',
    'idx_chat_messages_thread_created_at',
    'idx_chat_threads_participants',
    'idx_chat_threads_listing_id',
    'idx_listing_saves_user_listing',
    'idx_listing_saves_listing_id',
    'idx_listing_likes_listing_id'
  );

-- ========================================
-- CHECK 6: Existing RLS policies (will be dropped/recreated)
-- ========================================
SELECT
  'CHECK 6: Existing RLS policies' as check_name,
  tablename,
  policyname,
  cmd as command,
  CASE
    WHEN policyname IN ('public_can_select_active', 'insert_listing_authenticated', 'update_listing_owner', 'delete_listing_owner') THEN '⚠️ Will be replaced'
    WHEN policyname LIKE 'chat_%' THEN '⚠️ Will be replaced'
    WHEN policyname LIKE 'listing_likes_%' THEN '⚠️ Will be replaced'
    WHEN policyname LIKE 'listing_saves_%' THEN '⚠️ Will be replaced'
    ELSE '✅ Will remain'
  END as impact
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('listings', 'chat_threads', 'chat_messages', 'listing_saves', 'listing_likes')
ORDER BY tablename, policyname;

-- ========================================
-- CHECK 7: RLS enabled status
-- ========================================
SELECT
  'CHECK 7: RLS enabled' as check_name,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS already enabled'
    ELSE '⚠️ RLS will be enabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('listings', 'chat_threads', 'chat_messages', 'listing_saves', 'listing_likes')
ORDER BY tablename;

-- ========================================
-- CHECK 8: Foreign key constraints status
-- ========================================
SELECT
  'CHECK 8: FK constraints' as check_name,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE
    WHEN tc.constraint_name = 'listing_likes_user_id_fkey' THEN '✅ Will be skipped if exists'
    ELSE '✅ Existing FK'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('listing_likes', 'listing_saves', 'comments', 'chat_messages')
ORDER BY tc.table_name, tc.constraint_name;

-- ========================================
-- CHECK 9: Active connections and locks
-- ========================================
SELECT
  'CHECK 9: Active connections' as check_name,
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active_queries,
  COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
  CASE
    WHEN COUNT(*) FILTER (WHERE state = 'active') > 20 THEN '🔴 High activity - wait for off-peak'
    WHEN COUNT(*) FILTER (WHERE state = 'active') > 10 THEN '⚠️ Moderate activity - proceed with caution'
    ELSE '✅ Low activity - safe to proceed'
  END as recommendation
FROM pg_stat_activity
WHERE datname = current_database();

-- ========================================
-- SUMMARY & RECOMMENDATIONS
-- ========================================
SELECT
  '========================================' as summary,
  'SUMMARY & RECOMMENDATIONS' as section,
  '========================================' as line;

-- Final decision helper
WITH checks AS (
  SELECT
    COUNT(*) FILTER (WHERE pg_total_relation_size('public.listings') > 1024*1024*1024) as large_tables,
    (SELECT COUNT(*) FROM public.listing_likes WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as invalid_likes,
    (SELECT COUNT(DISTINCT user_id || listing_id)
     FROM public.listing_likes
     GROUP BY user_id, listing_id
     HAVING COUNT(*) > 1) as duplicate_likes
)
SELECT
  'RECOMMENDATION' as decision,
  CASE
    WHEN large_tables > 0 THEN '🔴 Use CONCURRENTLY strategy (tables > 1GB)'
    WHEN invalid_likes > 100 OR duplicate_likes > 50 THEN '⚠️ Review data cleanup impact first'
    ELSE '✅ Safe to apply standard migration'
  END as recommendation,
  CASE
    WHEN large_tables > 0 THEN 'Switch to safe migration version with CONCURRENTLY and NOT VALID'
    WHEN invalid_likes > 100 THEN 'Backup ' || invalid_likes || ' invalid records before deletion'
    WHEN duplicate_likes > 50 THEN 'Review ' || duplicate_likes || ' duplicate pairs'
    ELSE 'Proceed with standard migration - all checks passed'
  END as action
FROM checks;
