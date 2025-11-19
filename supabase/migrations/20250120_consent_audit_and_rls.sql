-- ============================================
-- 360⁰ Marketplace - Consent Audit Log & RLS
-- Production Ready for Kyrgyzstan 2025
-- ============================================

-- ============================================
-- 1. CREATE CONSENT AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('accept', 'revoke', 'reconsent_required')),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_consent_audit_log_user_id ON public.consent_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_log_action ON public.consent_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_consent_audit_log_created_at ON public.consent_audit_log(created_at DESC);

-- ============================================
-- 2. UPDATE USER_CONSENTS TABLE (if needed)
-- ============================================

DO $$ 
BEGIN
  -- Check if processing_accepted exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_consents' 
    AND column_name = 'processing_accepted'
  ) THEN
    -- If consent_accepted exists, rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_consents' 
      AND column_name = 'consent_accepted'
    ) THEN
      ALTER TABLE public.user_consents 
      RENAME COLUMN consent_accepted TO processing_accepted;
      
      ALTER TABLE public.user_consents 
      RENAME COLUMN consent_version TO processing_version;
    ELSE
      -- Add new column if neither exists
      ALTER TABLE public.user_consents 
      ADD COLUMN processing_accepted BOOLEAN DEFAULT FALSE;
      
      ALTER TABLE public.user_consents 
      ADD COLUMN processing_version TEXT;
    END IF;
  END IF;
  
  -- Ensure ip_address and user_agent columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_consents' 
    AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE public.user_consents 
    ADD COLUMN ip_address TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_consents' 
    AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE public.user_consents 
    ADD COLUMN user_agent TEXT;
  END IF;
END $$;

-- ============================================
-- 3. ENABLE RLS ON CONSENT TABLES
-- ============================================

ALTER TABLE IF EXISTS public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Users can view own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can manage own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can update own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Only admins see audit" ON public.consent_audit_log;

-- ============================================
-- 5. CREATE RLS POLICIES FOR USER_CONSENTS
-- ============================================

-- Users can view their own consents
CREATE POLICY "Users can view own consents" ON public.user_consents
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Users can manage their own consents (insert)
CREATE POLICY "Users can manage own consents" ON public.user_consents
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own consents (update)
CREATE POLICY "Users can update own consents" ON public.user_consents
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- 6. CREATE RLS POLICIES FOR AUDIT LOG
-- ============================================

-- Audit log is read-only for users (only admins can see it)
CREATE POLICY "Only admins see audit" ON public.consent_audit_log
  FOR SELECT USING (false);

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON TABLE public.consent_audit_log IS 
  'Immutable audit log for all consent actions (accept, revoke, reconsent_required)';
COMMENT ON COLUMN public.consent_audit_log.action IS 
  'Type of action: accept, revoke, or reconsent_required';
COMMENT ON COLUMN public.consent_audit_log.metadata IS 
  'Additional context: IP, user agent, versions, etc.';
COMMENT ON POLICY "Users can view own consents" ON public.user_consents IS 
  'Users can only see their own consent records';
COMMENT ON POLICY "Users can manage own consents" ON public.user_consents IS 
  'Users can create and update their own consent records';
