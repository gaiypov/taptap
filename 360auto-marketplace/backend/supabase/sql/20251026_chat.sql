-- ============================================
-- 360⁰ Marketplace - Chat System
-- Production Ready for Kyrgyzstan Launch
-- ============================================

-- ============================================
-- 1. CHAT THREADS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique thread per listing per buyer
  UNIQUE(listing_id, buyer_id)
);

-- ============================================
-- 2. CHAT MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL CHECK (LENGTH(body) > 0 AND LENGTH(body) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure sender is participant in thread
  CONSTRAINT chat_messages_sender_check CHECK (
    sender_id IN (
      SELECT buyer_id FROM public.chat_threads WHERE id = thread_id
      UNION
      SELECT seller_id FROM public.chat_threads WHERE id = thread_id
    )
  )
);

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================

-- Chat threads indexes
CREATE INDEX IF NOT EXISTS idx_chat_threads_listing_id ON public.chat_threads(listing_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_id ON public.chat_threads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_seller_id ON public.chat_threads(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message_at ON public.chat_threads(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_threads_created_at ON public.chat_threads(created_at);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_at ON public.chat_messages(read_at);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger to update last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_chat_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_threads 
    SET last_message_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.thread_id;
    
    -- Increment messages count for listing
    PERFORM increment_messages(
        (SELECT listing_id FROM public.chat_threads WHERE id = NEW.thread_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_thread_last_message_trigger
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_thread_last_message();

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to get unread message count for a user in a thread
CREATE OR REPLACE FUNCTION get_unread_count(thread_id UUID, user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM public.chat_messages
    WHERE thread_id = $1
    AND sender_id != $2
    AND read_at IS NULL;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(thread_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.chat_messages
    SET read_at = NOW()
    WHERE thread_id = $1
    AND sender_id != $2
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create chat thread
CREATE OR REPLACE FUNCTION get_or_create_chat_thread(
    p_listing_id UUID,
    p_buyer_id UUID
)
RETURNS UUID AS $$
DECLARE
    thread_id UUID;
    seller_id UUID;
BEGIN
    -- Get seller_id from listing
    SELECT COALESCE(seller_user_id, 
        (SELECT user_id FROM public.business_members 
         WHERE business_id = listings.business_id 
         AND role = 'admin' 
         LIMIT 1))
    INTO seller_id
    FROM public.listings
    WHERE id = p_listing_id;
    
    IF seller_id IS NULL THEN
        RAISE EXCEPTION 'Listing not found or no seller found';
    END IF;
    
    -- Check if thread already exists
    SELECT id INTO thread_id
    FROM public.chat_threads
    WHERE listing_id = p_listing_id
    AND buyer_id = p_buyer_id;
    
    -- Create thread if doesn't exist
    IF thread_id IS NULL THEN
        INSERT INTO public.chat_threads (listing_id, buyer_id, seller_id)
        VALUES (p_listing_id, p_buyer_id, seller_id)
        RETURNING id INTO thread_id;
    END IF;
    
    RETURN thread_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE public.chat_threads IS 'Chat threads between buyers and sellers per listing';
COMMENT ON TABLE public.chat_messages IS 'Individual messages within chat threads';

COMMENT ON COLUMN public.chat_threads.buyer_id IS 'User who initiated the chat (interested buyer)';
COMMENT ON COLUMN public.chat_threads.seller_id IS 'User who owns the listing (seller)';
COMMENT ON COLUMN public.chat_messages.read_at IS 'Timestamp when message was read by recipient';
