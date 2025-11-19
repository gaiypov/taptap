-- ============================================
-- Migration: Add video_hls_url column to listings table
-- Date: 2025-01-17
-- Purpose: Support HLS video streaming URLs for direct video playback
-- ============================================

-- Add video_hls_url column if it doesn't exist
DO $$
BEGIN
  -- Add video_hls_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'video_hls_url'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN video_hls_url TEXT;
    COMMENT ON COLUMN public.listings.video_hls_url IS 'HLS streaming URL for direct video playback (e.g., from api.video)';
  END IF;
END $$;

