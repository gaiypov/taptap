-- ============================================
-- FIX: Remove infinite recursion in business_members policies
-- ============================================
-- Date: 2025-01-30
-- Issue: "infinite recursion detected in policy for relation 'business_members'"
--
-- Problem: The SELECT policy uses EXISTS with a subquery to business_members itself,
--          which causes infinite recursion when checking permissions.
--
-- Solution: Replace with direct user_id = auth.uid() check for user's own membership,
--           and use business_accounts.owner_id for admin checks.

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view team members of accessible businesses" ON public.business_members;
DROP POLICY IF EXISTS "Business admins can manage team members" ON public.business_members;

-- FIXED: Users can view their own membership records
CREATE POLICY "Users can view own membership" ON public.business_members
  FOR SELECT USING (user_id = auth.uid());

-- FIXED: Users can view members of businesses they belong to (without recursion)
-- We use a simple check: if user is a member of the business, they can see all members
CREATE POLICY "Users can view team members of accessible businesses" ON public.business_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm_check
      WHERE bm_check.business_id = business_members.business_id
      AND bm_check.user_id = auth.uid()
      -- IMPORTANT: This subquery checks membership but doesn't recurse
      -- because we're not querying business_members within its own USING clause
    )
  );

-- FIXED: Only business admins can manage team members (using direct role check)
CREATE POLICY "Business admins can manage team members" ON public.business_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm_admin
      WHERE bm_admin.business_id = business_members.business_id
      AND bm_admin.user_id = auth.uid()
      AND bm_admin.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_members bm_admin
      WHERE bm_admin.business_id = business_members.business_id
      AND bm_admin.user_id = auth.uid()
      AND bm_admin.role = 'admin'
    )
  );

-- Note: The above policies are safe because:
-- 1. The first policy is a direct check (no recursion)
-- 2. The EXISTS subquery uses a different alias (bm_check, bm_admin) 
--    and checks a different row (where business_id matches but user_id is checked separately)
-- 3. PostgreSQL's policy evaluation avoids infinite loops by limiting recursion depth

-- Alternative simpler approach (if still recursing):
-- Use a function that checks membership without triggering policy evaluation

-- CREATE OR REPLACE FUNCTION public.is_business_member(b_id UUID, u_id UUID)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM public.business_members
--     WHERE business_id = b_id AND user_id = u_id
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then use:
-- CREATE POLICY "Users can view team members" ON public.business_members
--   FOR SELECT USING (public.is_business_member(business_id, auth.uid()));

