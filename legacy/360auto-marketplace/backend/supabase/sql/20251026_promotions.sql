-- ============================================
-- 360⁰ Marketplace - Promotions System
-- Production Ready for Kyrgyzstan Launch
-- ============================================

-- ============================================
-- 1. PROMOTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_amount DECIMAL(10,2),
  payment_currency VARCHAR(5) DEFAULT 'KZT',
  payment_reference VARCHAR(255), -- External payment system reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure ends_at is after started_at
  CONSTRAINT promotions_end_after_start CHECK (ends_at > started_at),
  
  -- Ensure payment_amount is positive when paid
  CONSTRAINT promotions_payment_amount_check CHECK (
    (payment_status = 'paid' AND payment_amount > 0) OR 
    payment_status != 'paid'
  )
);

-- ============================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================

-- Promotions indexes
CREATE INDEX IF NOT EXISTS idx_promotions_listing_id ON public.promotions(listing_id);
CREATE INDEX IF NOT EXISTS idx_promotions_payment_status ON public.promotions(payment_status);
CREATE INDEX IF NOT EXISTS idx_promotions_started_at ON public.promotions(started_at);
CREATE INDEX IF NOT EXISTS idx_promotions_ends_at ON public.promotions(ends_at);
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON public.promotions(created_at);

-- Composite index for active promotions
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(payment_status, ends_at) 
WHERE payment_status = 'paid' AND ends_at > NOW();

-- ============================================
-- 3. TRIGGERS
-- ============================================

-- Trigger to update updated_at
CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON public.promotions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update listing is_boosted when promotion status changes
CREATE OR REPLACE FUNCTION update_listing_boost_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update is_boosted based on active promotions
    UPDATE public.listings
    SET is_boosted = EXISTS(
        SELECT 1 FROM public.promotions
        WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
        AND payment_status = 'paid'
        AND ends_at > NOW()
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listing_boost_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_boost_status();

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Function to check if listing has active promotion
CREATE OR REPLACE FUNCTION has_active_promotion(listing_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.promotions
        WHERE listing_id = $1
        AND payment_status = 'paid'
        AND ends_at > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get active promotion for listing
CREATE OR REPLACE FUNCTION get_active_promotion(listing_id UUID)
RETURNS TABLE(
    id UUID,
    started_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    payment_amount DECIMAL(10,2),
    payment_currency VARCHAR(5)
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.started_at, p.ends_at, p.payment_amount, p.payment_currency
    FROM public.promotions p
    WHERE p.listing_id = $1
    AND p.payment_status = 'paid'
    AND p.ends_at > NOW()
    ORDER BY p.started_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to create promotion
CREATE OR REPLACE FUNCTION create_promotion(
    p_listing_id UUID,
    p_duration_days INTEGER,
    p_payment_amount DECIMAL(10,2),
    p_payment_currency VARCHAR(5) DEFAULT 'KZT'
)
RETURNS UUID AS $$
DECLARE
    promotion_id UUID;
    ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate end date
    ends_at := NOW() + INTERVAL '1 day' * p_duration_days;
    
    -- Insert promotion
    INSERT INTO public.promotions (
        listing_id,
        ends_at,
        payment_amount,
        payment_currency
    )
    VALUES (
        p_listing_id,
        ends_at,
        p_payment_amount,
        p_payment_currency
    )
    RETURNING id INTO promotion_id;
    
    RETURN promotion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark promotion as paid
CREATE OR REPLACE FUNCTION mark_promotion_paid(
    p_promotion_id UUID,
    p_payment_reference VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.promotions
    SET 
        payment_status = 'paid',
        payment_reference = p_payment_reference,
        started_at = NOW(), -- Start promotion when paid
        updated_at = NOW()
    WHERE id = p_promotion_id
    AND payment_status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Promotion not found or already processed';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get expired promotions
CREATE OR REPLACE FUNCTION get_expired_promotions()
RETURNS TABLE(
    id UUID,
    listing_id UUID,
    ends_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.listing_id, p.ends_at
    FROM public.promotions p
    WHERE p.payment_status = 'paid'
    AND p.ends_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired promotions
CREATE OR REPLACE FUNCTION cleanup_expired_promotions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Get count of expired promotions
    SELECT COUNT(*) INTO expired_count
    FROM public.promotions
    WHERE payment_status = 'paid'
    AND ends_at <= NOW();
    
    -- Update listing boost status for expired promotions
    UPDATE public.listings
    SET is_boosted = FALSE, updated_at = NOW()
    WHERE id IN (
        SELECT listing_id FROM public.promotions
        WHERE payment_status = 'paid'
        AND ends_at <= NOW()
    );
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. VIEWS
-- ============================================

-- View for active promotions with listing details
CREATE OR REPLACE VIEW public.active_promotions AS
SELECT 
    p.id,
    p.listing_id,
    p.started_at,
    p.ends_at,
    p.payment_amount,
    p.payment_currency,
    l.title,
    l.category,
    l.price,
    l.currency,
    l.status
FROM public.promotions p
JOIN public.listings l ON p.listing_id = l.id
WHERE p.payment_status = 'paid'
AND p.ends_at > NOW()
AND l.status = 'active';

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE public.promotions IS 'Promotion campaigns for boosting listings';
COMMENT ON COLUMN public.promotions.payment_status IS 'Payment status: pending -> paid/failed';
COMMENT ON COLUMN public.promotions.payment_reference IS 'External payment system reference ID';
COMMENT ON COLUMN public.promotions.started_at IS 'When promotion actually started (when payment was confirmed)';
COMMENT ON COLUMN public.promotions.ends_at IS 'When promotion expires';

COMMENT ON FUNCTION has_active_promotion(UUID) IS 'Check if listing has active paid promotion';
COMMENT ON FUNCTION get_active_promotion(UUID) IS 'Get active promotion details for listing';
COMMENT ON FUNCTION create_promotion(UUID, INTEGER, DECIMAL, VARCHAR) IS 'Create new promotion with specified duration';
COMMENT ON FUNCTION mark_promotion_paid(UUID, VARCHAR) IS 'Mark promotion as paid and start it';
COMMENT ON FUNCTION cleanup_expired_promotions() IS 'Clean up expired promotions and update listing boost status';
