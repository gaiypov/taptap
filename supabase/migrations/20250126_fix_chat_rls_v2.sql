-- ============================================
-- FIX: Chat RLS Policies - Permission Denied (V2)
-- ============================================
-- Улучшенная версия с helper-функцией и тестами

-- 1. Проверка и включение RLS
ALTER TABLE IF EXISTS public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Создание helper-функции для проверки членства в бизнес-команде
-- Это устраняет дублирование EXISTS запросов в политиках
CREATE OR REPLACE FUNCTION public.is_user_in_business_team(
  p_business_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.business_id = p_business_id
    AND tm.user_id = p_user_id
  );
$$;

-- Защита функции от анонимного доступа
REVOKE EXECUTE ON FUNCTION public.is_user_in_business_team(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_user_in_business_team(UUID, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.is_user_in_business_team(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.is_user_in_business_team(UUID, UUID) IS
  'Helper function for RLS policies. Checks if user is member of business team. SECURITY: Requires authentication.';

-- 3. Удаление существующих политик
DROP POLICY IF EXISTS "Users can access own threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can create chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can update own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can view messages in own threads" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in own threads" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own threads" ON public.chat_messages;

-- 4. Пересоздание политик для chat_threads с helper-функцией

-- SELECT: Пользователи видят свои треды
CREATE POLICY "Users can access own threads" ON public.chat_threads
  FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR (
      business_id IS NOT NULL
      AND public.is_user_in_business_team(business_id)
    )
  );

-- INSERT: Пользователи создают треды как покупатели
CREATE POLICY "Users can create chat threads" ON public.chat_threads
  FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND auth.uid() IS NOT NULL
  );

-- UPDATE: Пользователи обновляют свои треды
CREATE POLICY "Users can update own chat threads" ON public.chat_threads
  FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR (
      business_id IS NOT NULL
      AND public.is_user_in_business_team(business_id)
    )
  )
  WITH CHECK (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR (
      business_id IS NOT NULL
      AND public.is_user_in_business_team(business_id)
    )
  );

-- 5. Пересоздание политик для chat_messages с helper-функцией

-- SELECT: Пользователи видят сообщения в своих тредах
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
          AND public.is_user_in_business_team(ct.business_id)
        )
      )
    )
  );

-- INSERT: Пользователи отправляют сообщения
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
          AND public.is_user_in_business_team(ct.business_id)
        )
      )
    )
  );

-- UPDATE: Пользователи обновляют сообщения (отметка о прочтении)
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
          AND public.is_user_in_business_team(ct.business_id)
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
          AND public.is_user_in_business_team(ct.business_id)
        )
      )
    )
  );

-- 6. Добавление индексов для производительности
CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_id ON public.chat_threads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_seller_id ON public.chat_threads(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_business_id ON public.chat_threads(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_members_business_user ON public.team_members(business_id, user_id);

-- 7. Защита существующих SECURITY DEFINER функций
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_chat_thread_expiry') THEN
    REVOKE EXECUTE ON FUNCTION public.update_chat_thread_expiry() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.update_chat_thread_expiry() FROM public;
    GRANT EXECUTE ON FUNCTION public.update_chat_thread_expiry() TO authenticated;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_chat_threads') THEN
    REVOKE EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() FROM public;
  END IF;
END $$;

-- 8. FORCE RLS для максимальной защиты
ALTER TABLE public.chat_threads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;

-- 9. Комментарии
COMMENT ON TABLE public.chat_threads IS 'Chat threads with FORCE RLS. SECURITY: Only authenticated users can access their own threads. Anonymous access denied.';
COMMENT ON TABLE public.chat_messages IS 'Chat messages with FORCE RLS. SECURITY: Only authenticated users can access messages in their threads. Anonymous access denied.';

-- ============================================
-- ТЕСТЫ И ПРОВЕРКИ
-- ============================================

-- Создание функции для тестирования политик
CREATE OR REPLACE FUNCTION public.test_chat_rls_policies()
RETURNS TABLE(
  test_name TEXT,
  status TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_thread_count BIGINT;
  v_message_count BIGINT;
BEGIN
  -- Проверка 1: RLS включен
  BEGIN
    SELECT COUNT(*)::BIGINT INTO v_thread_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('chat_threads', 'chat_messages')
    AND rowsecurity = true;

    IF v_thread_count = 2 THEN
      test_name := 'RLS Enabled Check';
      status := 'PASS';
      message := 'RLS enabled on both tables';
      RETURN NEXT;
    ELSE
      test_name := 'RLS Enabled Check';
      status := 'FAIL';
      message := 'RLS not enabled on all tables';
      RETURN NEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    test_name := 'RLS Enabled Check';
    status := 'ERROR';
    message := SQLERRM;
    RETURN NEXT;
  END;

  -- Проверка 2: Политики созданы
  BEGIN
    SELECT COUNT(*)::BIGINT INTO v_thread_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('chat_threads', 'chat_messages');

    IF v_thread_count >= 6 THEN
      test_name := 'Policies Created Check';
      status := 'PASS';
      message := format('%s policies created', v_thread_count);
      RETURN NEXT;
    ELSE
      test_name := 'Policies Created Check';
      status := 'FAIL';
      message := format('Only %s policies found, expected 6+', v_thread_count);
      RETURN NEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    test_name := 'Policies Created Check';
    status := 'ERROR';
    message := SQLERRM;
    RETURN NEXT;
  END;

  -- Проверка 3: Helper функция существует
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_user_in_business_team') THEN
      test_name := 'Helper Function Check';
      status := 'PASS';
      message := 'is_user_in_business_team() exists';
      RETURN NEXT;
    ELSE
      test_name := 'Helper Function Check';
      status := 'FAIL';
      message := 'is_user_in_business_team() not found';
      RETURN NEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    test_name := 'Helper Function Check';
    status := 'ERROR';
    message := SQLERRM;
    RETURN NEXT;
  END;

  -- Проверка 4: Индексы созданы
  BEGIN
    SELECT COUNT(*)::BIGINT INTO v_thread_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('chat_threads', 'chat_messages')
    AND indexname LIKE 'idx_chat_%';

    IF v_thread_count >= 5 THEN
      test_name := 'Indexes Check';
      status := 'PASS';
      message := format('%s indexes created', v_thread_count);
      RETURN NEXT;
    ELSE
      test_name := 'Indexes Check';
      status := 'WARN';
      message := format('Only %s indexes found', v_thread_count);
      RETURN NEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    test_name := 'Indexes Check';
    status := 'ERROR';
    message := SQLERRM;
    RETURN NEXT;
  END;

  -- Проверка 5: Auth работает (если есть сессия)
  BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NOT NULL THEN
      test_name := 'Auth Session Check';
      status := 'PASS';
      message := format('User authenticated: %s', v_user_id);
      RETURN NEXT;

      -- Подсчет доступных тредов для текущего пользователя
      SELECT COUNT(*)::BIGINT INTO v_thread_count
      FROM public.chat_threads
      WHERE buyer_id = v_user_id OR seller_id = v_user_id;

      test_name := 'User Threads Access';
      status := 'INFO';
      message := format('User has access to %s threads', v_thread_count);
      RETURN NEXT;
    ELSE
      test_name := 'Auth Session Check';
      status := 'WARN';
      message := 'No active auth session (run as authenticated user for full test)';
      RETURN NEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    test_name := 'Auth Session Check';
    status := 'WARN';
    message := 'Auth check skipped (no session)';
    RETURN NEXT;
  END;

  RETURN;
END;
$$;

-- Защита тестовой функции
REVOKE EXECUTE ON FUNCTION public.test_chat_rls_policies() FROM anon;
REVOKE EXECUTE ON FUNCTION public.test_chat_rls_policies() FROM public;
GRANT EXECUTE ON FUNCTION public.test_chat_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_chat_rls_policies() TO service_role;

COMMENT ON FUNCTION public.test_chat_rls_policies() IS
  'Test function for chat RLS policies. Run: SELECT * FROM test_chat_rls_policies();';

-- ============================================
-- ЗАПУСТИТЬ ТЕСТЫ
-- ============================================
-- Раскомментируйте для запуска тестов после применения миграции:
-- SELECT * FROM public.test_chat_rls_policies();

-- ============================================
-- МАНУАЛЬНЫЕ ТЕСТЫ (выполнять как authenticated user)
-- ============================================

-- Проверка 1: auth.uid() не NULL
-- SELECT auth.uid(), auth.role();
-- Ожидается: UUID и 'authenticated'

-- Проверка 2: Доступные треды
-- SELECT COUNT(*) FROM chat_threads WHERE buyer_id = auth.uid() OR seller_id = auth.uid();
-- Ожидается: количество тредов пользователя

-- Проверка 3: Доступные сообщения
-- SELECT COUNT(*) FROM chat_messages cm
-- WHERE EXISTS (
--   SELECT 1 FROM chat_threads ct
--   WHERE ct.id = cm.thread_id
--   AND (ct.buyer_id = auth.uid() OR ct.seller_id = auth.uid())
-- );
-- Ожидается: количество сообщений в тредах пользователя

-- Проверка 4: Helper функция
-- SELECT public.is_user_in_business_team('business-uuid-here');
-- Ожидается: true/false

-- ============================================
-- ДИАГНОСТИКА (для troubleshooting)
-- ============================================

-- Список всех политик
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('chat_threads', 'chat_messages')
-- ORDER BY tablename, policyname;

-- Проверка FORCE RLS
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('chat_threads', 'chat_messages');

-- Список функций SECURITY DEFINER
-- SELECT n.nspname as schema, p.proname as function_name,
--        pg_get_function_identity_arguments(p.oid) as arguments,
--        CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.proname LIKE '%chat%'
-- ORDER BY p.proname;
