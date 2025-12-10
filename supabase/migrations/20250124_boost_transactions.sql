-- ============================================
-- Boost Transactions Table
-- For boost/promotion monetization
-- ============================================

-- ============================================
-- 1. CREATE BOOST_TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.boost_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL, -- alias for car_id
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  boost_type VARCHAR(20) NOT NULL CHECK (boost_type IN ('3h', '24h', '7d', '30d')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(5) DEFAULT 'KGS',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  payment_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  duration_hours INTEGER NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  views_before INTEGER DEFAULT 0,
  views_during INTEGER DEFAULT 0,
  views_after INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.boost_transactions IS 'Boost/promotion transactions for listings';
COMMENT ON COLUMN public.boost_transactions.boost_type IS '3h, 24h, 7d, 30d - duration plans';
COMMENT ON COLUMN public.boost_transactions.status IS 'pending -> processing -> success/failed';

-- ============================================
-- 2. ADD BOOST COLUMNS TO LISTINGS TABLE
-- ============================================
DO $$
BEGIN
  -- Add boost_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'boost_type'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN boost_type VARCHAR(20);
  END IF;

  -- Add boost_activated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'boost_activated_at'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN boost_activated_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add boost_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'boost_expires_at'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN boost_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_boost_transactions_user_id ON public.boost_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_car_id ON public.boost_transactions(car_id);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_listing_id ON public.boost_transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_status ON public.boost_transactions(status);
CREATE INDEX IF NOT EXISTS idx_boost_transactions_created_at ON public.boost_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_boost_type ON public.listings(boost_type);
CREATE INDEX IF NOT EXISTS idx_listings_boost_expires_at ON public.listings(boost_expires_at);

-- ============================================
-- 4. TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_boost_transactions_updated_at ON public.boost_transactions;
CREATE TRIGGER update_boost_transactions_updated_at
  BEFORE UPDATE ON public.boost_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to update car boost
CREATE OR REPLACE FUNCTION update_car_boost(
  car_uuid UUID,
  new_boost_type VARCHAR(20),
  new_expires_at TIMESTAMP WITH TIME ZONE,
  new_activated_at TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET
    boost_type = new_boost_type,
    boost_activated_at = new_activated_at,
    boost_expires_at = new_expires_at,
    is_boosted = TRUE,
    updated_at = NOW()
  WHERE id = car_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired boosts
CREATE OR REPLACE FUNCTION cleanup_expired_boosts()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.listings
  SET
    boost_type = NULL,
    boost_activated_at = NULL,
    boost_expires_at = NULL,
    is_boosted = FALSE,
    updated_at = NOW()
  WHERE boost_expires_at IS NOT NULL
    AND boost_expires_at < NOW();

  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.boost_transactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.boost_transactions TO anon;
GRANT ALL ON public.boost_transactions TO authenticated;

-- Policies
DROP POLICY IF EXISTS "Users can view own boost transactions" ON public.boost_transactions;
CREATE POLICY "Users can view own boost transactions" ON public.boost_transactions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own boost transactions" ON public.boost_transactions;
CREATE POLICY "Users can insert own boost transactions" ON public.boost_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access boost_transactions" ON public.boost_transactions;
CREATE POLICY "Service role full access boost_transactions" ON public.boost_transactions
  FOR ALL USING (true);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION update_car_boost(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_boosts() TO authenticated;
