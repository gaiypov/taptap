-- ============================================
-- 360⁰ Marketplace - Chat RLS Policies
-- Enable RLS and create comprehensive policies for chat_threads and chat_messages
-- ============================================

-- ============================================
-- 1. ADD BUSINESS_ID COLUMN IF NOT EXISTS
-- ============================================

-- Add business_id column to chat_threads if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chat_threads' 
    AND column_name = 'business_id'
  ) THEN
    ALTER TABLE public.chat_threads 
    ADD COLUMN business_id UUID REFERENCES public.business_accounts(id) ON DELETE SET NULL;
    
    -- Create index for business_id
    CREATE INDEX IF NOT EXISTS idx_chat_threads_business_id ON public.chat_threads(business_id);
  END IF;
END $$;

-- ============================================
-- 2. ENABLE RLS ON CHAT TABLES
-- ============================================

ALTER TABLE IF EXISTS public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Users can access own threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can view own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can create chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can update own chat threads" ON public.chat_threads;

DROP POLICY IF EXISTS "Users can send messages in own threads" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in own threads" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own threads" ON public.chat_messages;

-- ============================================
-- 4. CHAT_THREADS POLICIES
-- ============================================

-- Users can view threads where they are buyer, seller, or team member
CREATE POLICY "Users can access own threads" ON public.chat_threads
  FOR SELECT USING (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid() 
    OR (
      business_id IS NOT NULL
      AND business_id IN (
        SELECT business_id 
        FROM public.team_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create threads as buyers
CREATE POLICY "Users can create chat threads" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Users can update threads they participate in (e.g., update last_message, unread_count)
CREATE POLICY "Users can update own chat threads" ON public.chat_threads
  FOR UPDATE USING (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid() 
    OR (
      business_id IS NOT NULL
      AND business_id IN (
        SELECT business_id 
        FROM public.team_members 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid() 
    OR (
      business_id IS NOT NULL
      AND business_id IN (
        SELECT business_id 
        FROM public.team_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 5. CHAT_MESSAGES POLICIES
-- ============================================

-- Users can view messages in threads they participate in
CREATE POLICY "Users can view messages in own threads" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
      AND (
        ct.buyer_id = auth.uid() 
        OR ct.seller_id = auth.uid() 
        OR (
          ct.business_id IS NOT NULL
          AND ct.business_id IN (
            SELECT business_id 
            FROM public.team_members 
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Users can send messages in threads they participate in
CREATE POLICY "Users can send messages in own threads" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
      AND (
        ct.buyer_id = auth.uid() 
        OR ct.seller_id = auth.uid() 
        OR (
          ct.business_id IS NOT NULL
          AND ct.business_id IN (
            SELECT business_id 
            FROM public.team_members 
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Users can update messages in threads they participate in (e.g., mark as read, edit)
CREATE POLICY "Users can update messages in own threads" ON public.chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
      AND (
        ct.buyer_id = auth.uid() 
        OR ct.seller_id = auth.uid() 
        OR (
          ct.business_id IS NOT NULL
          AND ct.business_id IN (
            SELECT business_id 
            FROM public.team_members 
            WHERE user_id = auth.uid()
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
          AND ct.business_id IN (
            SELECT business_id 
            FROM public.team_members 
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON POLICY "Users can access own threads" ON public.chat_threads IS 
  'Users can view threads where they are buyer, seller, or team member of the business';
COMMENT ON POLICY "Users can create chat threads" ON public.chat_threads IS 
  'Users can create threads as buyers';
COMMENT ON POLICY "Users can update own chat threads" ON public.chat_threads IS 
  'Users can update threads they participate in (e.g., last_message, unread_count)';
COMMENT ON POLICY "Users can view messages in own threads" ON public.chat_messages IS 
  'Users can view messages in threads they participate in';
COMMENT ON POLICY "Users can send messages in own threads" ON public.chat_messages IS 
  'Users can send messages in threads they participate in';
COMMENT ON POLICY "Users can update messages in own threads" ON public.chat_messages IS 
  'Users can update messages in threads they participate in (e.g., mark as read)';

