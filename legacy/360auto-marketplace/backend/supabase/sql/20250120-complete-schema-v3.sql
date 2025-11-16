-- ============================================
-- 360AutoMVP Complete Database Schema v3.0
-- Production Ready - All Categories + Business Accounts
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption

-- ============================================
-- 1. USERS TABLE (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  
  -- Verification & Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_sales INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON public.users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON public.users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_users_rating ON public.users(rating DESC);

-- ============================================
-- 2. BUSINESS ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'lite', 'business', 'pro')),
  
  -- Company Info
  company_name VARCHAR(255) NOT NULL,
  company_logo_url TEXT,
  company_description TEXT,
  company_address TEXT,
  company_phone VARCHAR(20) NOT NULL,
  company_email VARCHAR(255) NOT NULL,
  company_website TEXT,
  business_type VARCHAR(100) NOT NULL,
  
  -- Working Hours (JSON)
  working_hours JSONB,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[],
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  
  -- Subscription
  subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN DEFAULT TRUE,
  auto_renew BOOLEAN DEFAULT FALSE,
  
  -- Limits
  active_listings_count INTEGER DEFAULT 0,
  max_listings INTEGER DEFAULT 2,
  team_members_count INTEGER DEFAULT 1,
  max_team_members INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for business_accounts
CREATE INDEX IF NOT EXISTS idx_business_accounts_user_id ON public.business_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_business_accounts_tier ON public.business_accounts(tier);
CREATE INDEX IF NOT EXISTS idx_business_accounts_is_verified ON public.business_accounts(is_verified);
CREATE INDEX IF NOT EXISTS idx_business_accounts_subscription_ends_at ON public.business_accounts(subscription_ends_at);

-- ============================================
-- 3. TEAM MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.business_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'manager' CHECK (role IN ('owner', 'admin', 'manager')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_business_id ON public.team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

-- ============================================
-- 4. UNIVERSAL LISTINGS TABLE (Cars, Horses, Real Estate)
-- ============================================

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Category & Business
  category VARCHAR(20) NOT NULL CHECK (category IN ('car', 'horse', 'real_estate')),
  business_id UUID REFERENCES public.business_accounts(id) ON DELETE SET NULL,
  
  -- Seller
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Video & Media
  video_id VARCHAR(255) NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  additional_images TEXT[],
  
  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(10) DEFAULT 'KGS',
  city VARCHAR(100),
  location VARCHAR(255),
  
  -- Status & Dates
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'sold', 'archived', 'expired', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  delete_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  
  -- AI Analysis (Universal)
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_condition VARCHAR(20) CHECK (ai_condition IN ('excellent', 'good', 'fair', 'poor')),
  ai_damages JSONB,
  ai_features TEXT[],
  ai_analysis_text TEXT,
  ai_estimated_price JSONB,
  
  -- Category-specific details (JSON)
  details JSONB NOT NULL,
  
  -- Boost/Promotion
  is_promoted BOOLEAN DEFAULT FALSE,
  boost_type VARCHAR(20) CHECK (boost_type IN ('basic', 'top', 'premium')),
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  boost_activated_at TIMESTAMP WITH TIME ZONE,
  views_before_boost INTEGER DEFAULT 0,
  
  -- Moderation
  moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for listings
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_business_id ON public.listings(business_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_is_promoted ON public.listings(is_promoted) WHERE is_promoted = TRUE;
CREATE INDEX IF NOT EXISTS idx_listings_moderation_status ON public.listings(moderation_status);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings USING GIN (
  to_tsvector('russian', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(city, ''))
);

-- ============================================
-- 5. CHAT SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.business_accounts(id) ON DELETE SET NULL,
  
  -- Thread Info
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  unread_count_buyer INTEGER DEFAULT 0,
  unread_count_seller INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(listing_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_id ON public.chat_threads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_seller_id ON public.chat_threads(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_listing_id ON public.chat_threads(listing_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_business_id ON public.chat_threads(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message_at ON public.chat_threads(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'offer', 'system')),
  offer_amount DECIMAL(12,2),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON public.chat_messages(is_read) WHERE is_read = FALSE;

-- ============================================
-- 6. BOOST/PROMOTION SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.business_accounts(id) ON DELETE SET NULL,
  
  -- Promotion Details
  boost_type VARCHAR(20) NOT NULL CHECK (boost_type IN ('basic', 'top', 'premium')),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(10) DEFAULT 'KGS',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  payment_id UUID,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_listing_id ON public.promotions(listing_id);
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON public.promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_expires_at ON public.promotions(expires_at);

-- ============================================
-- 7. MODERATION SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Moderation Details
  flagged_reasons TEXT[],
  ai_confidence DECIMAL(3,2),
  human_review_required BOOLEAN DEFAULT FALSE,
  
  -- Reviewer
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_listing_id ON public.moderation_queue(listing_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON public.moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned_to ON public.moderation_queue(assigned_to);

-- ============================================
-- 8. INTERACTION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_listing_id ON public.likes(listing_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

CREATE TABLE IF NOT EXISTS public.saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saves_user_id ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_listing_id ON public.saves(listing_id);
CREATE INDEX IF NOT EXISTS idx_saves_created_at ON public.saves(created_at DESC);

CREATE TABLE IF NOT EXISTS public.views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_views_listing_id ON public.views(listing_id);
CREATE INDEX IF NOT EXISTS idx_views_user_id ON public.views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_views_viewed_at ON public.views(viewed_at DESC);

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- 10. PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.business_accounts(id) ON DELETE SET NULL,
  
  -- Payment Details
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KGS',
  payment_type VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  
  -- Transaction
  transaction_id VARCHAR(255),
  external_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Metadata
  metadata JSONB,
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- ============================================
-- 11. VERIFICATION CODES
-- ============================================

CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE,
  ip_address INET,
  attempts INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON public.verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_is_used ON public.verification_codes(is_used);

-- ============================================
-- 12. FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_accounts_updated_at BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_queue_updated_at BEFORE UPDATE ON public.moderation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment/Decrement functions
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET views = views + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_listing_likes(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET likes = likes + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_listing_likes(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET likes = GREATEST(likes - 1, 0) WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_listing_saves(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET saves = saves + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_listing_saves(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET saves = GREATEST(saves - 1, 0) WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update chat thread last message
CREATE OR REPLACE FUNCTION update_chat_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_threads 
  SET 
    last_message = NEW.message,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_thread_on_message AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_thread_last_message();

-- Auto-expire listings
CREATE OR REPLACE FUNCTION expire_old_listings()
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-expire promotions
CREATE OR REPLACE FUNCTION expire_old_promotions()
RETURNS VOID AS $$
BEGIN
  UPDATE public.promotions 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
    AND expires_at < NOW();
    
  -- Remove boost from listings
  UPDATE public.listings 
  SET 
    is_promoted = FALSE,
    boost_type = NULL,
    boost_expires_at = NULL,
    updated_at = NOW()
  WHERE is_promoted = TRUE 
    AND boost_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Anyone can view user profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Business accounts policies
CREATE POLICY "Users can view business accounts" ON public.business_accounts
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own business account" ON public.business_accounts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Team members policies
CREATE POLICY "Users can view team members of accessible businesses" ON public.team_members
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can manage team members" ON public.team_members
  FOR ALL USING (
    business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
    )
  );

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON public.listings
  FOR SELECT USING (
    status = 'active' 
    OR seller_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create listings" ON public.listings
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can update own listings" ON public.listings
  FOR UPDATE USING (
    seller_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own listings" ON public.listings
  FOR DELETE USING (
    seller_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
    )
  );

-- Chat threads policies
CREATE POLICY "Users can view their chat threads" ON public.chat_threads
  FOR SELECT USING (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat threads" ON public.chat_threads
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can view messages in their threads" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE id = thread_id
      AND (
        buyer_id = auth.uid() 
        OR seller_id = auth.uid()
        OR business_id IN (
          SELECT id FROM public.business_accounts 
          WHERE user_id = auth.uid()
          UNION
          SELECT business_id FROM public.team_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can send messages in their threads" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE id = thread_id
      AND (
        buyer_id = auth.uid() 
        OR seller_id = auth.uid()
        OR business_id IN (
          SELECT id FROM public.business_accounts 
          WHERE user_id = auth.uid()
          UNION
          SELECT business_id FROM public.team_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Promotions policies
CREATE POLICY "Users can view promotions for accessible listings" ON public.promotions
  FOR SELECT USING (
    user_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create promotions for own listings" ON public.promotions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id
      AND (
        seller_id = auth.uid()
        OR business_id IN (
          SELECT id FROM public.business_accounts 
          WHERE user_id = auth.uid()
          UNION
          SELECT business_id FROM public.team_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Likes policies (allow anonymous)
CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can like listings" ON public.likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can unlike listings" ON public.likes
  FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- Saves policies (authenticated only)
CREATE POLICY "Users can view own saves" ON public.saves
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can save listings" ON public.saves
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave listings" ON public.saves
  FOR DELETE USING (user_id = auth.uid());

-- Views policies (allow anonymous)
CREATE POLICY "Anyone can create views" ON public.views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own views" ON public.views
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    user_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 14. GRANTS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- 15. STORAGE BUCKETS
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('listings-videos', 'listings-videos', true),
  ('listings-thumbnails', 'listings-thumbnails', true),
  ('avatars', 'avatars', true),
  ('business-logos', 'business-logos', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view listing videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'listings-videos');

CREATE POLICY "Users can upload listing videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listings-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view listing thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'listings-thumbnails');

CREATE POLICY "Users can upload listing thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listings-thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view business logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-logos');

CREATE POLICY "Users can upload business logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- SCHEMA COMPLETE ✅
-- ============================================
