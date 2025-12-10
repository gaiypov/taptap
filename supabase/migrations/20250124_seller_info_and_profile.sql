-- ============================================
-- Seller Info & Profile Enhancements
-- Unified Buyer + Seller Account System
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO USERS TABLE
-- ============================================
DO $$
BEGIN
  -- Add bio/description field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.users ADD COLUMN bio TEXT;
    COMMENT ON COLUMN public.users.bio IS 'User bio/description';
  END IF;

  -- Add city field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.users ADD COLUMN city VARCHAR(100);
    COMMENT ON COLUMN public.users.city IS 'User city/location';
  END IF;

  -- Add is_verified field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN public.users.is_verified IS 'Whether user phone is verified';
  END IF;

  -- Add last_seen field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN public.users.last_seen IS 'Last activity timestamp';
  END IF;
END $$;

-- ============================================
-- 2. CREATE SELLER_INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.seller_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_for_listings VARCHAR(20), -- Can be different from profile phone
  response_time_hours INTEGER DEFAULT 24, -- Typical response time
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT seller_info_user_unique UNIQUE(user_id)
);

COMMENT ON TABLE public.seller_info IS 'Additional seller information for users with listings';
COMMENT ON COLUMN public.seller_info.phone_for_listings IS 'Phone number displayed on listings (can differ from profile phone)';
COMMENT ON COLUMN public.seller_info.response_time_hours IS 'Average response time in hours';

-- ============================================
-- 3. CREATE LISTING_STATS TABLE (for tracking calls/messages per listing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.listing_stats (
  listing_id UUID PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  call_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  last_call_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.listing_stats IS 'Statistics for individual listings';

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_seller_info_user_id ON public.seller_info(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_stats_listing_id ON public.listing_stats(listing_id);
CREATE INDEX IF NOT EXISTS idx_users_city ON public.users(city);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON public.users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON public.users(last_seen);

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Auto-update updated_at for seller_info
DROP TRIGGER IF EXISTS update_seller_info_updated_at ON public.seller_info;
CREATE TRIGGER update_seller_info_updated_at
  BEFORE UPDATE ON public.seller_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for listing_stats
DROP TRIGGER IF EXISTS update_listing_stats_updated_at ON public.listing_stats;
CREATE TRIGGER update_listing_stats_updated_at
  BEFORE UPDATE ON public.listing_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. FUNCTIONS
-- ============================================

-- Function to get or create seller_info for a user
CREATE OR REPLACE FUNCTION get_or_create_seller_info(p_user_id UUID)
RETURNS public.seller_info AS $$
DECLARE
  result public.seller_info;
BEGIN
  -- Try to get existing
  SELECT * INTO result FROM public.seller_info WHERE user_id = p_user_id;

  -- Create if not exists
  IF NOT FOUND THEN
    INSERT INTO public.seller_info (user_id) VALUES (p_user_id) RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment call count
CREATE OR REPLACE FUNCTION increment_listing_calls(p_listing_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.listing_stats (listing_id, call_count, last_call_at)
  VALUES (p_listing_id, 1, NOW())
  ON CONFLICT (listing_id) DO UPDATE
  SET call_count = listing_stats.call_count + 1,
      last_call_at = NOW(),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to increment message count
CREATE OR REPLACE FUNCTION increment_listing_messages(p_listing_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.listing_stats (listing_id, message_count, last_message_at)
  VALUES (p_listing_id, 1, NOW())
  ON CONFLICT (listing_id) DO UPDATE
  SET message_count = listing_stats.message_count + 1,
      last_message_at = NOW(),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.seller_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_stats ENABLE ROW LEVEL SECURITY;

-- GRANT permissions
GRANT ALL ON public.seller_info TO authenticated;
GRANT ALL ON public.seller_info TO anon;
GRANT ALL ON public.listing_stats TO authenticated;
GRANT ALL ON public.listing_stats TO anon;

-- Seller info policies
DROP POLICY IF EXISTS "Anyone can view seller_info" ON public.seller_info;
CREATE POLICY "Anyone can view seller_info" ON public.seller_info
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own seller_info" ON public.seller_info;
CREATE POLICY "Users can update own seller_info" ON public.seller_info
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own seller_info" ON public.seller_info;
CREATE POLICY "Users can insert own seller_info" ON public.seller_info
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- For service role (backend)
DROP POLICY IF EXISTS "Service role full access seller_info" ON public.seller_info;
CREATE POLICY "Service role full access seller_info" ON public.seller_info
  FOR ALL USING (true);

-- Listing stats policies
DROP POLICY IF EXISTS "Anyone can view listing_stats" ON public.listing_stats;
CREATE POLICY "Anyone can view listing_stats" ON public.listing_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert listing_stats" ON public.listing_stats;
CREATE POLICY "Anyone can insert listing_stats" ON public.listing_stats
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update listing_stats" ON public.listing_stats;
CREATE POLICY "Anyone can update listing_stats" ON public.listing_stats
  FOR UPDATE USING (true);

-- ============================================
-- 8. VIEW FOR PROFILE WITH STATS
-- ============================================

CREATE OR REPLACE VIEW public.user_profile_with_stats AS
SELECT
  u.id,
  u.name,
  u.phone,
  u.avatar_url,
  u.bio,
  u.city,
  u.is_verified,
  u.last_seen,
  u.created_at,
  u.updated_at,
  si.phone_for_listings,
  si.response_time_hours,
  si.total_sales,
  si.rating,
  si.reviews_count,
  COALESCE(lc.active_listings, 0) as active_listings_count,
  COALESCE(lc.total_listings, 0) as total_listings_count,
  COALESCE(lc.sold_listings, 0) as sold_listings_count
FROM public.users u
LEFT JOIN public.seller_info si ON u.id = si.user_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE status = 'active') as active_listings,
    COUNT(*) as total_listings,
    COUNT(*) FILTER (WHERE status = 'sold') as sold_listings
  FROM public.listings
  WHERE seller_user_id = u.id
) lc ON true;

GRANT SELECT ON public.user_profile_with_stats TO authenticated;
GRANT SELECT ON public.user_profile_with_stats TO anon;
