-- ============================================
-- Опциональные составные индексы для оптимизации
-- ============================================
-- ВАЖНО: Добавлять только если запросы медленные (>100ms)
-- Мониторить производительность перед добавлением
-- Индексы занимают место и могут замедлить INSERT/UPDATE
-- ============================================

-- ============================================
-- 1. Chat Messages: thread_id + created_at
-- ============================================
-- Оптимизирует: GET /threads/:threadId/messages
-- Приоритет: ВЫСОКИЙ (часто используется)
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created 
  ON chat_messages(thread_id, created_at DESC);

-- ============================================
-- 2. Chat Threads: buyer_id + last_message_at
-- ============================================
-- Оптимизирует: GET /threads (сортировка по last_message_at)
-- Приоритет: СРЕДНИЙ (добавить если запросы медленные)
CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_last_message 
  ON chat_threads(buyer_id, last_message_at DESC NULLS LAST)
  WHERE buyer_id IS NOT NULL;

-- ============================================
-- 3. Chat Threads: seller_id + last_message_at
-- ============================================
-- Оптимизирует: GET /threads (сортировка по last_message_at)
-- Приоритет: СРЕДНИЙ (добавить если запросы медленные)
CREATE INDEX IF NOT EXISTS idx_chat_threads_seller_last_message 
  ON chat_threads(seller_id, last_message_at DESC NULLS LAST)
  WHERE seller_id IS NOT NULL;

-- ============================================
-- 4. Chat Threads: business_id + last_message_at
-- ============================================
-- Оптимизирует: GET /threads (бизнес-чаты)
-- Приоритет: СРЕДНИЙ (добавить если запросы медленные)
CREATE INDEX IF NOT EXISTS idx_chat_threads_business_last_message 
  ON chat_threads(business_id, last_message_at DESC NULLS LAST)
  WHERE business_id IS NOT NULL;

-- ============================================
-- 5. Listings: seller_id + created_at
-- ============================================
-- Оптимизирует: GET /listings (личные объявления пользователя)
-- Приоритет: СРЕДНИЙ (добавить если запросы медленные)
CREATE INDEX IF NOT EXISTS idx_listings_seller_created 
  ON listings(seller_id, created_at DESC)
  WHERE seller_id IS NOT NULL;

-- ============================================
-- 6. Listing Likes: user_id + created_at
-- ============================================
-- Оптимизирует: GET /favorites (лайки пользователя)
-- Приоритет: СРЕДНИЙ (добавить если запросы медленные)
CREATE INDEX IF NOT EXISTS idx_listing_likes_user_created 
  ON listing_likes(user_id, created_at DESC);

-- ============================================
-- 7. Listing Saves: user_id + created_at
-- ============================================
-- Оптимизирует: GET /favorites (сохраненные объявления)
-- Приоритет: СРЕДНИЙ (добавить если запросы медленные)
CREATE INDEX IF NOT EXISTS idx_listing_saves_user_created 
  ON listing_saves(user_id, created_at DESC);

-- ============================================
-- 8. Business Members: user_id + created_at
-- ============================================
-- Оптимизирует: GET /business/members (сортировка по дате)
-- Приоритет: НИЗКИЙ (добавить только если запросы медленные)
CREATE INDEX IF NOT EXISTS idx_business_members_user_created 
  ON business_members(user_id, created_at ASC);

-- ============================================
-- 9. Consent Audit Log: user_id + created_at
-- ============================================
-- Оптимизирует: GET /consents/audit (история согласий)
-- Приоритет: НИЗКИЙ (добавить только если запросы медленные)
CREATE INDEX IF NOT EXISTS idx_consent_audit_user_created 
  ON consent_audit_log(user_id, created_at DESC);

-- ============================================
-- ПРИМЕЧАНИЯ
-- ============================================
-- 1. Перед применением проверьте медленные запросы:
--    SELECT * FROM pg_stat_statements 
--    WHERE mean_exec_time > 100 
--    ORDER BY mean_exec_time DESC;
--
-- 2. Мониторьте размер индексов:
--    SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
--    FROM pg_stat_user_indexes
--    WHERE indexname LIKE 'idx_%_created' OR indexname LIKE 'idx_%_last_message'
--    ORDER BY pg_relation_size(indexrelid) DESC;
--
-- 3. Проверьте использование индексов:
--    SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
--    FROM pg_stat_user_indexes
--    WHERE indexname LIKE 'idx_%_created' OR indexname LIKE 'idx_%_last_message'
--    ORDER BY idx_scan DESC;
--
-- 4. Если индекс не используется (idx_scan = 0), рассмотрите его удаление:
--    DROP INDEX IF EXISTS idx_name;

