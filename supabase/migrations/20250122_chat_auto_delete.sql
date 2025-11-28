-- Migration: Auto-delete conversations 14 days after last message
-- This adds a delete_at column and trigger to automatically set expiry
-- Run via: supabase db push or apply manually in Supabase dashboard

-- Step 1: Add delete_at column to chat_threads
ALTER TABLE public.chat_threads
ADD COLUMN IF NOT EXISTS delete_at TIMESTAMPTZ;

-- Step 2: Set initial delete_at for existing threads (14 days from last_message_at)
UPDATE public.chat_threads
SET delete_at = COALESCE(last_message_at, created_at) + INTERVAL '14 days'
WHERE delete_at IS NULL;

-- Step 3: Create trigger function to update delete_at on new messages
CREATE OR REPLACE FUNCTION public.update_chat_thread_expiry()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_threads
  SET
    delete_at = NOW() + INTERVAL '14 days',
    last_message = NEW.body,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger on chat_messages insert
DROP TRIGGER IF EXISTS set_chat_thread_expiry ON public.chat_messages;
CREATE TRIGGER set_chat_thread_expiry
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_thread_expiry();

-- Step 5: Create cleanup function (to be called by scheduled job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_chat_threads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.chat_threads
  WHERE delete_at IS NOT NULL AND delete_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_chat_threads_delete_at
ON public.chat_threads(delete_at)
WHERE delete_at IS NOT NULL;

-- =================================================================
-- SCHEDULED CLEANUP SETUP
-- =================================================================
-- Option A: Using pg_cron (if available in your Supabase plan)
-- Uncomment the following line after enabling pg_cron extension:
-- SELECT cron.schedule('cleanup-expired-chats', '0 3 * * *', 'SELECT public.cleanup_expired_chat_threads();');
-- This runs daily at 3 AM UTC

-- Option B: Using Supabase Edge Function (recommended)
-- Create an Edge Function that calls cleanup_expired_chat_threads()
-- and set up a cron trigger in supabase/functions/cleanup-chats/index.ts

-- Option C: Manual cleanup via backend cron job
-- Call the cleanup function from your backend server on a schedule:
-- SELECT public.cleanup_expired_chat_threads();
-- =================================================================

COMMENT ON COLUMN public.chat_threads.delete_at IS 'Auto-delete timestamp, set to 14 days after last message';
COMMENT ON FUNCTION public.update_chat_thread_expiry() IS 'Trigger function to reset delete_at on new message';
COMMENT ON FUNCTION public.cleanup_expired_chat_threads() IS 'Cleanup function to delete expired chat threads, returns count of deleted rows';
