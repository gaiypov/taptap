-- ============================================
-- 360⁰ Marketplace - Moderation System
-- Production Ready for Kyrgyzstan Launch
-- ============================================

-- ============================================
-- 1. MODERATION EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  moderator_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- null = auto AI flag
  action VARCHAR(20) NOT NULL CHECK (action IN ('auto_flag', 'approve', 'reject')),
  reason TEXT NOT NULL,
  details JSONB, -- Additional moderation details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure moderator_id is provided for manual actions
  CONSTRAINT moderation_events_moderator_check CHECK (
    (action IN ('approve', 'reject') AND moderator_id IS NOT NULL) OR
    (action = 'auto_flag' AND moderator_id IS NULL)
  )
);

-- ============================================
-- 2. MODERATION QUEUE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure completed_at is after started_at
  CONSTRAINT moderation_queue_completion_check CHECK (
    completed_at IS NULL OR completed_at >= started_at
  )
);

-- ============================================
-- 3. USER CONSENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  version VARCHAR(20) -- Version of consent document
);

-- Add missing columns to user_consents if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add granted column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_consents' 
    AND column_name = 'granted'
  ) THEN
    ALTER TABLE public.user_consents ADD COLUMN granted BOOLEAN NOT NULL DEFAULT TRUE;
    -- Remove default after adding (for future inserts)
    ALTER TABLE public.user_consents ALTER COLUMN granted DROP DEFAULT;
  END IF;
  
  -- Add granted_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_consents' 
    AND column_name = 'granted_at'
  ) THEN
    ALTER TABLE public.user_consents ADD COLUMN granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add consent_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_consents' 
    AND column_name = 'consent_type'
  ) THEN
    ALTER TABLE public.user_consents ADD COLUMN consent_type VARCHAR(50) NOT NULL DEFAULT 'offer_agreement';
    ALTER TABLE public.user_consents ADD CONSTRAINT user_consents_consent_type_check 
      CHECK (consent_type IN (
        'offer_agreement', 
        'personal_data_processing', 
        'marketing_communications',
        'location_tracking',
        'camera_access',
        'microphone_access'
      ));
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'user_consents' 
      AND constraint_name = 'user_consents_user_id_consent_type_key'
    ) THEN
      ALTER TABLE public.user_consents ADD CONSTRAINT user_consents_user_id_consent_type_key 
        UNIQUE(user_id, consent_type);
    END IF;
    
    -- Remove default after adding constraint (for future inserts)
    ALTER TABLE public.user_consents ALTER COLUMN consent_type DROP DEFAULT;
  END IF;
END $$;

-- ============================================
-- 4. VERIFICATION CODES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure code is 6 digits
  CONSTRAINT verification_codes_code_format CHECK (code ~ '^[0-9]{6}$'),
  
  -- Ensure expires_at is in future
  CONSTRAINT verification_codes_expiry_check CHECK (expires_at > created_at)
);

-- Add missing columns to verification_codes if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'verification_codes' 
    AND column_name = 'verified'
  ) THEN
    ALTER TABLE public.verification_codes ADD COLUMN verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Moderation events indexes
CREATE INDEX IF NOT EXISTS idx_moderation_events_listing_id ON public.moderation_events(listing_id);
CREATE INDEX IF NOT EXISTS idx_moderation_events_moderator_id ON public.moderation_events(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_events_action ON public.moderation_events(action);
CREATE INDEX IF NOT EXISTS idx_moderation_events_created_at ON public.moderation_events(created_at);

-- Moderation queue indexes
CREATE INDEX IF NOT EXISTS idx_moderation_queue_listing_id ON public.moderation_queue(listing_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON public.moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned_to ON public.moderation_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON public.moderation_queue(created_at);

-- User consents indexes
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_granted_at ON public.user_consents(granted_at);

-- Create conditional indexes for user_consents (only if columns exist)
DO $$ 
BEGIN
  -- Create granted index if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_consents' 
    AND column_name = 'granted'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_consents_granted ON public.user_consents(granted);
  END IF;
  
  -- Create consent_type index if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_consents' 
    AND column_name = 'consent_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON public.user_consents(consent_type);
  END IF;
END $$;

-- Verification codes indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON public.verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_created_at ON public.verification_codes(created_at);

-- Create conditional index for verified (only if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'verification_codes' 
    AND column_name = 'verified'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_verification_codes_verified ON public.verification_codes(verified);
  END IF;
END $$;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Trigger to add listing to moderation queue when created
CREATE OR REPLACE FUNCTION add_to_moderation_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add to queue if status is pending_review
    IF NEW.status = 'pending_review' THEN
        INSERT INTO public.moderation_queue (listing_id, priority)
        VALUES (NEW.id, 'normal')
        ON CONFLICT (listing_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_to_moderation_queue_trigger
    AFTER INSERT ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION add_to_moderation_queue();

-- Trigger to update moderation queue when listing status changes
CREATE OR REPLACE FUNCTION update_moderation_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Update queue status when listing is moderated
    IF OLD.status = 'pending_review' AND NEW.status IN ('active', 'rejected') THEN
        UPDATE public.moderation_queue
        SET 
            status = 'completed',
            completed_at = NOW()
        WHERE listing_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_moderation_queue_trigger
    AFTER UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_queue();

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Drop old functions if they exist with different signatures
DROP FUNCTION IF EXISTS cleanup_expired_codes() CASCADE;
DROP FUNCTION IF EXISTS verify_sms_code(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS create_verification_code(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS has_user_consent(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS grant_user_consent(UUID, VARCHAR, INET, TEXT, VARCHAR) CASCADE;

-- Generic drop by name (handles all overloads)
DO $$ 
BEGIN
  EXECUTE 'DROP FUNCTION IF EXISTS cleanup_expired_codes() CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS verify_sms_code(VARCHAR, VARCHAR) CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS create_verification_code(VARCHAR) CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS has_user_consent(UUID, VARCHAR) CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS grant_user_consent(UUID, VARCHAR, INET, TEXT, VARCHAR) CASCADE';
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.verification_codes
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to verify SMS code
CREATE OR REPLACE FUNCTION verify_sms_code(
    p_phone VARCHAR(20),
    p_code VARCHAR(6)
)
RETURNS BOOLEAN AS $$
DECLARE
    code_record RECORD;
BEGIN
    -- Get the latest code for this phone
    SELECT * INTO code_record
    FROM public.verification_codes
    WHERE phone = p_phone
    AND expires_at > NOW()
    AND verified = FALSE
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if code exists and matches
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check attempts limit
    IF code_record.attempts >= 3 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if code matches
    IF code_record.code = p_code THEN
        -- Mark as verified
        UPDATE public.verification_codes
        SET verified = TRUE
        WHERE id = code_record.id;
        
        RETURN TRUE;
    ELSE
        -- Increment attempts
        UPDATE public.verification_codes
        SET attempts = attempts + 1
        WHERE id = code_record.id;
        
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create verification code
CREATE OR REPLACE FUNCTION create_verification_code(
    p_phone VARCHAR(20)
)
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Set expiry to 5 minutes from now
    expires_at := NOW() + INTERVAL '5 minutes';
    
    -- Insert new code
    INSERT INTO public.verification_codes (phone, code, expires_at)
    VALUES (p_phone, new_code, expires_at);
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to check user consents
CREATE OR REPLACE FUNCTION has_user_consent(
    p_user_id UUID,
    p_consent_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.user_consents
        WHERE user_id = p_user_id
        AND consent_type = p_consent_type
        AND granted = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to grant user consent
CREATE OR REPLACE FUNCTION grant_user_consent(
    p_user_id UUID,
    p_consent_type VARCHAR(50),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_version VARCHAR(20) DEFAULT '1.0'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_consents (
        user_id, 
        consent_type, 
        granted, 
        ip_address, 
        user_agent, 
        version
    )
    VALUES (
        p_user_id, 
        p_consent_type, 
        TRUE, 
        p_ip_address, 
        p_user_agent, 
        p_version
    )
    ON CONFLICT (user_id, consent_type) 
    DO UPDATE SET 
        granted = TRUE,
        granted_at = NOW(),
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        version = EXCLUDED.version;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE public.moderation_events IS 'Audit trail of moderation actions';
COMMENT ON TABLE public.moderation_queue IS 'Queue of listings awaiting moderation';
COMMENT ON TABLE public.user_consents IS 'User consent records for legal compliance';
COMMENT ON TABLE public.verification_codes IS 'SMS verification codes for authentication';

COMMENT ON COLUMN public.moderation_events.moderator_id IS 'NULL for auto AI flags, user ID for manual moderation';
COMMENT ON COLUMN public.moderation_queue.priority IS 'Priority level for moderation queue';
COMMENT ON COLUMN public.user_consents.consent_type IS 'Type of consent granted by user';
COMMENT ON COLUMN public.verification_codes.attempts IS 'Number of verification attempts made';
