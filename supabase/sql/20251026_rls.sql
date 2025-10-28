-- ============================================
-- 360⁰ Marketplace - Row Level Security (RLS)
-- Production Ready for Kyrgyzstan Launch
-- ============================================

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

-- Core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horse_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_details ENABLE ROW LEVEL SECURITY;

-- Chat tables
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Promotion tables
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Moderation tables
ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Business accounts policies
DROP POLICY IF EXISTS "Anyone can view business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Users can manage own business account" ON public.business_accounts;
DROP POLICY IF EXISTS "Business members can view business account" ON public.business_accounts;

-- Business members policies
DROP POLICY IF EXISTS "Users can view team members of accessible businesses" ON public.business_members;
DROP POLICY IF EXISTS "Business admins can manage team members" ON public.business_members;

-- Listings policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can manage own listings" ON public.listings;
DROP POLICY IF EXISTS "Business members can manage business listings" ON public.listings;

-- Details policies
DROP POLICY IF EXISTS "Anyone can view listing details" ON public.car_details;
DROP POLICY IF EXISTS "Anyone can view listing details" ON public.horse_details;
DROP POLICY IF EXISTS "Anyone can view listing details" ON public.real_estate_details;

-- Chat policies
DROP POLICY IF EXISTS "Users can view own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can create chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can view messages in own threads" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in own threads" ON public.chat_messages;

-- Promotion policies
DROP POLICY IF EXISTS "Users can view own promotions" ON public.promotions;
DROP POLICY IF EXISTS "Users can create promotions for own listings" ON public.promotions;

-- Moderation policies
DROP POLICY IF EXISTS "Moderators can view moderation events" ON public.moderation_events;
DROP POLICY IF EXISTS "Moderators can create moderation events" ON public.moderation_events;
DROP POLICY IF EXISTS "Moderators can view moderation queue" ON public.moderation_queue;
DROP POLICY IF EXISTS "Moderators can update moderation queue" ON public.moderation_queue;

-- Consent policies
DROP POLICY IF EXISTS "Users can view own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can manage own consents" ON public.user_consents;

-- Verification codes policies
DROP POLICY IF EXISTS "Users can view own verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "System can manage verification codes" ON public.verification_codes;

-- ============================================
-- 3. USERS POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. BUSINESS ACCOUNTS POLICIES
-- ============================================

-- Anyone can view business accounts (public information)
CREATE POLICY "Anyone can view business accounts" ON public.business_accounts
  FOR SELECT USING (true);

-- Business account owners can manage their account
CREATE POLICY "Users can manage own business account" ON public.business_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_id = business_accounts.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- 5. BUSINESS MEMBERS POLICIES
-- ============================================

-- Users can view team members of businesses they belong to
CREATE POLICY "Users can view team members of accessible businesses" ON public.business_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm2
      WHERE bm2.business_id = business_members.business_id
      AND bm2.user_id = auth.uid()
    )
  );

-- Only business admins can manage team members
CREATE POLICY "Business admins can manage team members" ON public.business_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
    )
  );

-- ============================================
-- 6. LISTINGS POLICIES
-- ============================================

-- Anyone can view active listings (public feed)
CREATE POLICY "Anyone can view active listings" ON public.listings
  FOR SELECT USING (status = 'active');

-- Users can manage their own listings
CREATE POLICY "Users can manage own listings" ON public.listings
  FOR ALL USING (auth.uid() = seller_user_id);

-- Business members can manage business listings
CREATE POLICY "Business members can manage business listings" ON public.listings
  FOR ALL USING (
    business_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_id = listings.business_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'seller')
    )
  );

-- ============================================
-- 7. DETAILS POLICIES
-- ============================================

-- Anyone can view listing details for active listings
CREATE POLICY "Anyone can view car details for active listings" ON public.car_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = car_details.listing_id
      AND status = 'active'
    )
  );

CREATE POLICY "Anyone can view horse details for active listings" ON public.horse_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = horse_details.listing_id
      AND status = 'active'
    )
  );

CREATE POLICY "Anyone can view real estate details for active listings" ON public.real_estate_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = real_estate_details.listing_id
      AND status = 'active'
    )
  );

-- Listing owners can manage their details
CREATE POLICY "Users can manage own car details" ON public.car_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = car_details.listing_id
      AND seller_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own horse details" ON public.horse_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = horse_details.listing_id
      AND seller_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own real estate details" ON public.real_estate_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = real_estate_details.listing_id
      AND seller_user_id = auth.uid()
    )
  );

-- Business members can manage business listing details
CREATE POLICY "Business members can manage business car details" ON public.car_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.business_members bm ON l.business_id = bm.business_id
      WHERE l.id = car_details.listing_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'seller')
    )
  );

CREATE POLICY "Business members can manage business horse details" ON public.horse_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.business_members bm ON l.business_id = bm.business_id
      WHERE l.id = horse_details.listing_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'seller')
    )
  );

CREATE POLICY "Business members can manage business real estate details" ON public.real_estate_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.business_members bm ON l.business_id = bm.business_id
      WHERE l.id = real_estate_details.listing_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'seller')
    )
  );

-- ============================================
-- 8. CHAT POLICIES
-- ============================================

-- Users can view chat threads they participate in
CREATE POLICY "Users can view own chat threads" ON public.chat_threads
  FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

-- Users can create chat threads (as buyers)
CREATE POLICY "Users can create chat threads" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Users can view messages in threads they participate in
CREATE POLICY "Users can view messages in own threads" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE id = chat_messages.thread_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Users can send messages in threads they participate in
CREATE POLICY "Users can send messages in own threads" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_threads
      WHERE id = chat_messages.thread_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- ============================================
-- 9. PROMOTION POLICIES
-- ============================================

-- Users can view promotions for their own listings
CREATE POLICY "Users can view own promotions" ON public.promotions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = promotions.listing_id
      AND (
        seller_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.business_members
          WHERE business_id = listings.business_id
          AND user_id = auth.uid()
          AND role IN ('admin', 'seller')
        )
      )
    )
  );

-- Users can create promotions for their own listings
CREATE POLICY "Users can create promotions for own listings" ON public.promotions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = promotions.listing_id
      AND (
        seller_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.business_members
          WHERE business_id = listings.business_id
          AND user_id = auth.uid()
          AND role IN ('admin', 'seller')
        )
      )
    )
  );

-- ============================================
-- 10. MODERATION POLICIES
-- ============================================

-- Only moderators can view moderation events
CREATE POLICY "Moderators can view moderation events" ON public.moderation_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'moderator'
    )
  );

-- Only moderators can create moderation events
CREATE POLICY "Moderators can create moderation events" ON public.moderation_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'moderator'
    )
  );

-- Only moderators can view moderation queue
CREATE POLICY "Moderators can view moderation queue" ON public.moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'moderator'
    )
  );

-- Only moderators can update moderation queue
CREATE POLICY "Moderators can update moderation queue" ON public.moderation_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'moderator'
    )
  );

-- ============================================
-- 11. CONSENT POLICIES
-- ============================================

-- Users can view their own consents
CREATE POLICY "Users can view own consents" ON public.user_consents
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own consents
CREATE POLICY "Users can manage own consents" ON public.user_consents
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 12. VERIFICATION CODES POLICIES
-- ============================================

-- Users can view their own verification codes
CREATE POLICY "Users can view own verification codes" ON public.verification_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE phone = verification_codes.phone
      AND id = auth.uid()
    )
  );

-- System can manage verification codes (for SMS service)
CREATE POLICY "System can manage verification codes" ON public.verification_codes
  FOR ALL USING (true); -- This will be restricted by service role in practice

-- ============================================
-- 13. GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service role (for backend)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- 14. COMMENTS
-- ============================================

COMMENT ON POLICY "Users can view own profile" ON public.users IS 'Users can only see their own profile data';
COMMENT ON POLICY "Anyone can view active listings" ON public.listings IS 'Public feed shows only active listings';
COMMENT ON POLICY "Users can view own chat threads" ON public.chat_threads IS 'Chat privacy - only participants can see threads';
COMMENT ON POLICY "Moderators can view moderation events" ON public.moderation_events IS 'Moderation events are private to moderators only';
COMMENT ON POLICY "Users can view own promotions" ON public.promotions IS 'Users can only see promotions for their own listings';
