-- ============================================
-- 360⁰ Marketplace - Likes & Favorites System
-- Production Ready for Kyrgyzstan Launch
-- ============================================

-- ============================================
-- 1. LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.listing_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate likes
  UNIQUE(listing_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_likes_listing_id ON public.listing_likes(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_likes_user_id ON public.listing_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_likes_created_at ON public.listing_likes(created_at DESC);

-- ============================================
-- 2. FAVORITES/SAVES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.listing_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate saves
  UNIQUE(listing_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_saves_listing_id ON public.listing_saves(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_saves_user_id ON public.listing_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_saves_created_at ON public.listing_saves(created_at DESC);

-- ============================================
-- 3. TRIGGERS FOR AUTO-UPDATE COUNTERS
-- ============================================

-- Trigger function to increment likes_count when like is added
CREATE OR REPLACE FUNCTION increment_listing_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings
  SET likes_count = COALESCE(likes_count, 0) + 1,
      updated_at = NOW()
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to decrement likes_count when like is removed
CREATE OR REPLACE FUNCTION decrement_listing_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = OLD.listing_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if exist
DROP TRIGGER IF EXISTS trigger_increment_listing_likes ON public.listing_likes;
DROP TRIGGER IF EXISTS trigger_decrement_listing_likes ON public.listing_likes;

-- Create triggers
CREATE TRIGGER trigger_increment_listing_likes
  AFTER INSERT ON public.listing_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_listing_likes_count();

CREATE TRIGGER trigger_decrement_listing_likes
  AFTER DELETE ON public.listing_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_listing_likes_count();

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_saves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view likes" ON public.listing_likes;
DROP POLICY IF EXISTS "Users can like listings" ON public.listing_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON public.listing_likes;

DROP POLICY IF EXISTS "Users can view own saves" ON public.listing_saves;
DROP POLICY IF EXISTS "Users can save listings" ON public.listing_saves;
DROP POLICY IF EXISTS "Users can unsave own saves" ON public.listing_saves;

-- Listing Likes Policies
CREATE POLICY "Anyone can view likes" ON public.listing_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like listings" ON public.listing_likes
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can unlike own likes" ON public.listing_likes
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Listing Saves Policies
CREATE POLICY "Users can view own saves" ON public.listing_saves
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can save listings" ON public.listing_saves
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can unsave own saves" ON public.listing_saves
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE public.listing_likes IS 'User likes for listings (replaces old likes table)';
COMMENT ON TABLE public.listing_saves IS 'User saved/favorited listings (replaces old saves table)';
COMMENT ON COLUMN public.listing_likes.listing_id IS 'References listings table';
COMMENT ON COLUMN public.listing_saves.listing_id IS 'References listings table';

