-- ============================================
-- Remove foreign key constraint from users.id to auth.users
-- This allows us to create users directly in public.users without auth.users
-- ============================================

-- Check if the foreign key constraint exists and remove it
DO $$ 
BEGIN
  -- Drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_name = 'users_id_fkey'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
    RAISE NOTICE 'Dropped foreign key constraint users_id_fkey';
  END IF;
  
  -- Also check for other possible constraint names
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%users%id%'
  ) THEN
    -- Get the constraint name and drop it
    DECLARE
      fk_name TEXT;
    BEGIN
      SELECT constraint_name INTO fk_name
      FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'users' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%users%id%'
      LIMIT 1;
      
      IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', fk_name);
        RAISE NOTICE 'Dropped foreign key constraint: %', fk_name;
      END IF;
    END;
  END IF;
END $$;

-- Ensure id column has DEFAULT gen_random_uuid() (in case it was removed)
ALTER TABLE public.users 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the constraint is removed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%auth%users%'
  ) THEN
    RAISE WARNING 'Foreign key constraint to auth.users still exists!';
  ELSE
    RAISE NOTICE '✅ Foreign key constraint to auth.users removed successfully';
  END IF;
END $$;

