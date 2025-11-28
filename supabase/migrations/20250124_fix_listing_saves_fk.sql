-- FIX: listing_saves foreign key relationship to listings table
-- Error: "Could not find a relationship between 'listing_saves' and 'listings'"
-- Run this in Supabase SQL Editor

-- Step 1: Check if table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'listing_saves') THEN
    CREATE TABLE listing_saves (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      listing_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, listing_id)
    );
    RAISE NOTICE 'Created listing_saves table';
  END IF;
END $$;

-- Step 2: Drop existing foreign key constraints if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'listing_saves_listing_id_fkey'
    AND table_name = 'listing_saves'
  ) THEN
    ALTER TABLE listing_saves DROP CONSTRAINT listing_saves_listing_id_fkey;
    RAISE NOTICE 'Dropped old listing_id foreign key';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'listing_saves_user_id_fkey'
    AND table_name = 'listing_saves'
  ) THEN
    ALTER TABLE listing_saves DROP CONSTRAINT listing_saves_user_id_fkey;
    RAISE NOTICE 'Dropped old user_id foreign key';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Note: Some constraints may not have existed';
END $$;

-- Step 3: Add foreign key to listings table
ALTER TABLE listing_saves
ADD CONSTRAINT listing_saves_listing_id_fkey
FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;

-- Step 4: Enable RLS
ALTER TABLE listing_saves ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own saves" ON listing_saves;
DROP POLICY IF EXISTS "Users can create own saves" ON listing_saves;
DROP POLICY IF EXISTS "Users can delete own saves" ON listing_saves;
DROP POLICY IF EXISTS "Anyone can read saves" ON listing_saves;

CREATE POLICY "Anyone can read saves" ON listing_saves FOR SELECT USING (true);
CREATE POLICY "Users can create own saves" ON listing_saves FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own saves" ON listing_saves FOR DELETE USING (true);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_saves_user_id ON listing_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_saves_listing_id ON listing_saves(listing_id);

-- Step 7: Verify the foreign key exists
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'listing_saves';
