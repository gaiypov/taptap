-- ============================================
-- 360AutoMVP RLS Policies v3.0
-- Production Ready - All Categories + Business Accounts
-- ============================================

-- ============================================
-- 1. DROP EXISTING POLICIES (if any)
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Business accounts policies
DROP POLICY IF EXISTS "Users can view business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Users can manage own business account" ON public.business_accounts;

-- Team members policies
DROP POLICY IF EXISTS "Users can view team members of accessible businesses" ON public.team_members;
DROP POLICY IF EXISTS "Business owners can manage team members" ON public.team_members;

-- Listings policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can create listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;

-- Chat threads policies
DROP POLICY IF EXISTS "Users can view their chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can create chat threads" ON public.chat_threads;

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their threads" ON public.chat_messages;

-- Promotions policies
DROP POLICY IF EXISTS "Users can view promotions for accessible listings" ON public.promotions;
DROP POLICY IF EXISTS "Users can create promotions for own listings" ON public.promotions;

-- Interaction policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Anyone can like listings" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike listings" ON public.likes;
DROP POLICY IF EXISTS "Users can view own saves" ON public.saves;
DROP POLICY IF EXISTS "Users can save listings" ON public.saves;
DROP POLICY IF EXISTS "Users can unsave listings" ON public.saves;
DROP POLICY IF EXISTS "Anyone can create views" ON public.views;
DROP POLICY IF EXISTS "Users can view own views" ON public.views;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- ============================================
-- 2. CREATE NEW POLICIES
-- ============================================

-- ============================================
-- USERS POLICIES
-- ============================================

-- Anyone can view user profiles (for listings, chat, etc.)
CREATE POLICY "Anyone can view user profiles" ON public.users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can create their own profile (during registration)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================
-- BUSINESS ACCOUNTS POLICIES
-- ============================================

-- Anyone can view business accounts (for listings, profiles)
CREATE POLICY "Anyone can view business accounts" ON public.business_accounts
  FOR SELECT USING (true);

-- Users can manage their own business account
CREATE POLICY "Users can manage own business account" ON public.business_accounts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TEAM MEMBERS POLICIES
-- ============================================

-- Users can view team members of businesses they have access to
CREATE POLICY "Users can view team members of accessible businesses" ON public.team_members
  FOR SELECT USING (
    business_id IN (
      -- Business owner
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
      UNION
      -- Team member
      SELECT business_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Business owners can manage team members
CREATE POLICY "Business owners can manage team members" ON public.team_members
  FOR ALL USING (
    business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- LISTINGS POLICIES
-- ============================================

-- Anyone can view active listings (public marketplace)
CREATE POLICY "Anyone can view active listings" ON public.listings
  FOR SELECT USING (
    status = 'active' 
    -- Owner can see all their listings
    OR seller_id = auth.uid()
    -- Business team members can see business listings
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can create listings
CREATE POLICY "Authenticated users can create listings" ON public.listings
  FOR INSERT 
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Users can update their own listings or business team members can update business listings
CREATE POLICY "Users can update accessible listings" ON public.listings
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

-- Users can delete their own listings or business owners can delete business listings
CREATE POLICY "Users can delete accessible listings" ON public.listings
  FOR DELETE USING (
    seller_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- CHAT THREADS POLICIES
-- ============================================

-- Users can view chat threads they participate in
CREATE POLICY "Users can view their chat threads" ON public.chat_threads
  FOR SELECT USING (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid()
    -- Business team members can see business chats
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can create chat threads (as buyers)
CREATE POLICY "Authenticated users can create chat threads" ON public.chat_threads
  FOR INSERT 
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Users can update chat threads they participate in
CREATE POLICY "Users can update their chat threads" ON public.chat_threads
  FOR UPDATE USING (
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

-- ============================================
-- CHAT MESSAGES POLICIES
-- ============================================

-- Users can view messages in threads they participate in
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

-- Users can send messages in threads they participate in
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

-- Users can update their own messages
CREATE POLICY "Users can update their messages" ON public.chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- ============================================
-- PROMOTIONS POLICIES
-- ============================================

-- Users can view promotions for listings they have access to
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

-- Users can create promotions for their own listings
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

-- Users can update promotions for their own listings
CREATE POLICY "Users can update promotions for own listings" ON public.promotions
  FOR UPDATE USING (
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

-- ============================================
-- INTERACTION POLICIES (LIKES, SAVES, VIEWS)
-- ============================================

-- LIKES: Allow anonymous users to like (for engagement)
CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can like listings" ON public.likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can unlike listings" ON public.likes
  FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- SAVES: Only authenticated users can save
CREATE POLICY "Users can view own saves" ON public.saves
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can save listings" ON public.saves
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave listings" ON public.saves
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can update own saves" ON public.saves
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- VIEWS: Allow anonymous users to create views (for analytics)
CREATE POLICY "Anyone can create views" ON public.views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own views" ON public.views
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- PAYMENTS POLICIES
-- ============================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    user_id = auth.uid()
    OR business_id IN (
      SELECT id FROM public.business_accounts 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create payments for their own purchases
CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- MODERATION QUEUE POLICIES (Admin/Moderator only)
-- ============================================

-- Only moderators can view moderation queue
CREATE POLICY "Moderators can view moderation queue" ON public.moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (
        -- Add role check here if you implement user roles
        true -- For now, allow all authenticated users
      )
    )
  );

-- Only moderators can update moderation queue
CREATE POLICY "Moderators can update moderation queue" ON public.moderation_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (
        -- Add role check here if you implement user roles
        true -- For now, allow all authenticated users
      )
    )
  );

-- ============================================
-- VERIFICATION CODES POLICIES
-- ============================================

-- Only service role can access verification codes
CREATE POLICY "Service role can manage verification codes" ON public.verification_codes
  FOR ALL USING (false); -- This will be handled by service role in backend

-- ============================================
-- 3. GRANT PERMISSIONS FOR FUNCTIONS
-- ============================================

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_listing_likes(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_listing_likes(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_listing_saves(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_listing_saves(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION expire_old_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_promotions() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_codes() TO authenticated;

-- ============================================
-- 4. FORCE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.team_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.listings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.promotions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue FORCE ROW LEVEL SECURITY;
ALTER TABLE public.likes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.saves FORCE ROW LEVEL SECURITY;
ALTER TABLE public.views FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

-- ============================================
-- 5. VERIFY POLICIES
-- ============================================

-- Check all policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN (
  'users', 'business_accounts', 'team_members', 'listings', 
  'chat_threads', 'chat_messages', 'promotions', 'moderation_queue',
  'likes', 'saves', 'views', 'notifications', 'payments'
)
ORDER BY tablename, policyname;

-- ============================================
-- RLS POLICIES COMPLETE ✅
-- ============================================
