-- Fix RLS policies for users, listing_saves, chat_threads
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. USERS TABLE - Allow users to update their own row
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view user profiles (for seller info)
CREATE POLICY "Anyone can view user profiles"
ON users FOR SELECT
USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id OR id = current_setting('request.jwt.claims', true)::json->>'sub')
WITH CHECK (auth.uid()::text = id OR id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Allow insert for new users (from backend)
CREATE POLICY "Allow insert for authenticated"
ON users FOR INSERT
WITH CHECK (true);

-- ============================================
-- 2. LISTING_SAVES TABLE - Create if not exists
-- ============================================

CREATE TABLE IF NOT EXISTS listing_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE listing_saves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own saves" ON listing_saves;
DROP POLICY IF EXISTS "Users can create own saves" ON listing_saves;
DROP POLICY IF EXISTS "Users can delete own saves" ON listing_saves;

-- Create policies
CREATE POLICY "Users can view own saves"
ON listing_saves FOR SELECT
USING (user_id::text = auth.uid()::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own saves"
ON listing_saves FOR INSERT
WITH CHECK (user_id::text = auth.uid()::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own saves"
ON listing_saves FOR DELETE
USING (user_id::text = auth.uid()::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_listing_saves_user_id ON listing_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_saves_listing_id ON listing_saves(listing_id);

-- ============================================
-- 3. CHAT_THREADS TABLE - Fix RLS
-- ============================================

-- Enable RLS
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can create threads" ON chat_threads;

-- Allow users to view threads they're part of
CREATE POLICY "Users can view own threads"
ON chat_threads FOR SELECT
USING (
  buyer_id::text = auth.uid()::text OR
  seller_id::text = auth.uid()::text OR
  buyer_id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
  seller_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Allow users to create threads
CREATE POLICY "Users can create threads"
ON chat_threads FOR INSERT
WITH CHECK (
  buyer_id::text = auth.uid()::text OR
  buyer_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Allow users to update their threads
CREATE POLICY "Users can update own threads"
ON chat_threads FOR UPDATE
USING (
  buyer_id::text = auth.uid()::text OR
  seller_id::text = auth.uid()::text OR
  buyer_id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
  seller_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- ============================================
-- 4. VERIFY POLICIES
-- ============================================

-- Check that policies are created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'listing_saves', 'chat_threads')
ORDER BY tablename, policyname;
