-- Migration: Add RPC function to increment paid_slots
-- Date: 2025-01-15
-- Description: Creates function to safely increment paid_slots for a user

CREATE OR REPLACE FUNCTION increment_paid_slots(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    paid_slots = COALESCE(paid_slots, 0) + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

COMMENT ON FUNCTION increment_paid_slots IS 'Increments paid_slots for a user by 1';

