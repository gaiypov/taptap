-- Migration: Add slot system for monetization
-- Date: 2025-01-15
-- Description: Adds free_limit and paid_slots fields for simple monetization

DO $$ 
BEGIN
  -- Add free_limit column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'free_limit'
  ) THEN
    ALTER TABLE public.users ADD COLUMN free_limit INTEGER DEFAULT 1;
    COMMENT ON COLUMN public.users.free_limit IS 'Number of free listing slots';
  END IF;

  -- Add paid_slots column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'paid_slots'
  ) THEN
    ALTER TABLE public.users ADD COLUMN paid_slots INTEGER DEFAULT 0;
    COMMENT ON COLUMN public.users.paid_slots IS 'Number of paid listing slots purchased';
  END IF;

  -- Set default values for existing users
  UPDATE public.users 
  SET 
    free_limit = 1,
    paid_slots = 0
  WHERE free_limit IS NULL OR paid_slots IS NULL;

  RAISE NOTICE 'Migration completed: Slot system fields added to users table';
END $$;

