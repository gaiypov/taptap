-- ============================================
-- Migration: Add AI fields to listings table
-- Supports: AI analysis, API.video integration, draft status
-- ============================================

-- Add AI analysis fields
DO $$
BEGIN
  -- Add video_player_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'video_player_url'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN video_player_url TEXT;
    COMMENT ON COLUMN public.listings.video_player_url IS 'API.video player URL (iframe embed)';
  END IF;

  -- Add video_thumbnail_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'video_thumbnail_url'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN video_thumbnail_url TEXT;
    COMMENT ON COLUMN public.listings.video_thumbnail_url IS 'API.video thumbnail URL';
  END IF;

  -- Add ai_summary JSONB field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN ai_summary JSONB;
    COMMENT ON COLUMN public.listings.ai_summary IS 'Full AI analysis response (JSON)';
  END IF;

  -- Add ai_make field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'ai_make'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN ai_make TEXT;
    COMMENT ON COLUMN public.listings.ai_make IS 'AI detected make/brand (BMW, Toyota, etc.)';
  END IF;

  -- Add ai_model field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'ai_model'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN ai_model TEXT;
    COMMENT ON COLUMN public.listings.ai_model IS 'AI detected model (3 series, Camry, etc.)';
  END IF;

  -- Add ai_year field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'ai_year'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN ai_year INTEGER;
    COMMENT ON COLUMN public.listings.ai_year IS 'AI detected year';
  END IF;

  -- Add ai_color field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'ai_color'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN ai_color TEXT;
    COMMENT ON COLUMN public.listings.ai_color IS 'AI detected color';
  END IF;

  -- Add ai_damage JSONB field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'ai_damage'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN ai_damage JSONB;
    COMMENT ON COLUMN public.listings.ai_damage IS 'AI detected damage areas (JSON)';
  END IF;

  -- Add ai_quality_score field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'ai_quality_score'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN ai_quality_score INTEGER CHECK (ai_quality_score >= 0 AND ai_quality_score <= 100);
    COMMENT ON COLUMN public.listings.ai_quality_score IS 'AI video quality score (0-100)';
  END IF;

  -- Add ai_confidence field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'ai_confidence'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100);
    COMMENT ON COLUMN public.listings.ai_confidence IS 'AI model confidence (0-100)';
  END IF;

  -- Add user_id field (alias for seller_user_id, for compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
    COMMENT ON COLUMN public.listings.user_id IS 'User ID (owner of listing)';

    -- Copy data from seller_user_id if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'listings'
      AND column_name = 'seller_user_id'
    ) THEN
      UPDATE public.listings SET user_id = seller_user_id WHERE seller_user_id IS NOT NULL AND user_id IS NULL;
    END IF;
  END IF;

  -- Update status constraint to include 'draft'
  -- First, drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND constraint_name = 'listings_status_check'
  ) THEN
    ALTER TABLE public.listings DROP CONSTRAINT listings_status_check;
  END IF;

  -- Add new constraint with 'draft' status
  ALTER TABLE public.listings ADD CONSTRAINT listings_status_check
    CHECK (status IN ('draft', 'pending_review', 'active', 'rejected', 'archived', 'published'));

  -- Update default status to 'draft' for new listings (if status column exists)
  -- Note: We can't change the default of an existing column easily, so we'll handle this in application code
END $$;

-- Create indexes for AI fields
CREATE INDEX IF NOT EXISTS idx_listings_ai_make ON public.listings(ai_make);
CREATE INDEX IF NOT EXISTS idx_listings_ai_model ON public.listings(ai_model);
CREATE INDEX IF NOT EXISTS idx_listings_ai_year ON public.listings(ai_year);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_video_id ON public.listings(video_id);

-- Add comments
COMMENT ON TABLE public.listings IS 'Listings table with AI analysis support for auto, horse, and real_estate categories';
COMMENT ON COLUMN public.listings.status IS 'draft → published/active → archived';

