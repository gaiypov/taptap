-- ============================================
-- FIX: Chat RLS Policies - Permission Denied
-- ============================================
-- Исправление проблемы: permission denied for table chat_messages

-- 1. Проверка и включение RLS
ALTER TABLE IF EXISTS public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Удаление существующих политик
DROP POLICY IF EXISTS "Users can access own threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can create chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can update own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can view messages in own threads" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in own threads" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own threads" ON public.chat_messages;

-- 3. Пересоздание политик для chat_threads

-- Просмотр: пользователи видят свои треды
CREATE POLICY "Users can access own threads" ON public.chat_threads
  FOR SELECT
  USING (
    -- Текущий пользователь - покупатель
    buyer_id = auth.uid()
    OR
    -- Текущий пользователь - продавец
    seller_id = auth.uid()
    OR
    -- Пользователь в команде бизнес-аккаунта
    (
      business_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.business_id = chat_threads.business_id
        AND tm.user_id = auth.uid()
      )
    )
  );

-- Создание: пользователи создают треды как покупатели
CREATE POLICY "Users can create chat threads" ON public.chat_threads
  FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND auth.uid() IS NOT NULL
  );

-- Обновление: пользователи обновляют свои треды
CREATE POLICY "Users can update own chat threads" ON public.chat_threads
  FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR (
      business_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.business_id = chat_threads.business_id
        AND tm.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR (
      business_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.business_id = chat_threads.business_id
        AND tm.user_id = auth.uid()
      )
    )
  );

-- 4. Пересоздание политик для chat_messages

-- Просмотр: пользователи видят сообщения в своих тредах
CREATE POLICY "Users can view messages in own threads" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
      AND (
        ct.buyer_id = auth.uid()
        OR ct.seller_id = auth.uid()
        OR (
          ct.business_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.business_id = ct.business_id
            AND tm.user_id = auth.uid()
          )
        )
      )
    )
  );

-- Отправка: пользователи отправляют сообщения
CREATE POLICY "Users can send messages in own threads" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
      AND (
        ct.buyer_id = auth.uid()
        OR ct.seller_id = auth.uid()
        OR (
          ct.business_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.business_id = ct.business_id
            AND tm.user_id = auth.uid()
          )
        )
      )
    )
  );

-- Обновление: пользователи обновляют сообщения (например, отметка о прочтении)
CREATE POLICY "Users can update messages in own threads" ON public.chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
      AND (
        ct.buyer_id = auth.uid()
        OR ct.seller_id = auth.uid()
        OR (
          ct.business_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.business_id = ct.business_id
            AND tm.user_id = auth.uid()
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
      AND (
        ct.buyer_id = auth.uid()
        OR ct.seller_id = auth.uid()
        OR (
          ct.business_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.business_id = ct.business_id
            AND tm.user_id = auth.uid()
          )
        )
      )
    )
  );

-- 5. Добавление индексов для производительности (если не существуют)
CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_id ON public.chat_threads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_seller_id ON public.chat_threads(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_business_id ON public.chat_threads(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_members_business_user ON public.team_members(business_id, user_id);

-- 6. Комментарии
COMMENT ON TABLE public.chat_threads IS 'Chat threads between users. RLS enabled - users can only access their own threads.';
COMMENT ON TABLE public.chat_messages IS 'Messages within chat threads. RLS enabled - users can only access messages in their threads.';

-- 7. SECURITY: Защита SECURITY DEFINER функций от анонимных запросов
-- Если в будущем будут добавлены helper-функции, нужно явно отозвать права:

-- Пример защиты существующей функции update_chat_thread_expiry
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_chat_thread_expiry') THEN
    REVOKE EXECUTE ON FUNCTION public.update_chat_thread_expiry() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.update_chat_thread_expiry() FROM public;
    GRANT EXECUTE ON FUNCTION public.update_chat_thread_expiry() TO authenticated;
  END IF;
END $$;

-- Пример защиты функции cleanup_expired_chat_threads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_chat_threads') THEN
    REVOKE EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() FROM public;
    -- Эта функция должна выполняться только service_role (не authenticated)
  END IF;
END $$;

-- 8. SECURITY: Дополнительные проверки безопасности

-- Убедимся что RLS включен и нельзя обойти через direct access
ALTER TABLE public.chat_threads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;

-- Комментарии для безопасности
COMMENT ON TABLE public.chat_threads IS 'Chat threads with RLS. SECURITY: Only authenticated users can access their own threads. Anonymous access denied.';
COMMENT ON TABLE public.chat_messages IS 'Chat messages with RLS. SECURITY: Only authenticated users can access messages in their threads. Anonymous access denied.';

-- 9. Проверка что auth работает (для debug)
-- SELECT auth.uid(); -- должно вернуть UUID текущего пользователя
-- SELECT auth.role(); -- должно вернуть 'authenticated' или 'anon'

-- Тест политик (выполнять как authenticated user):
-- SELECT * FROM chat_threads WHERE buyer_id = auth.uid() OR seller_id = auth.uid();
-- SELECT * FROM chat_messages WHERE EXISTS (
--   SELECT 1 FROM chat_threads
--   WHERE id = thread_id
--   AND (buyer_id = auth.uid() OR seller_id = auth.uid())
-- );
