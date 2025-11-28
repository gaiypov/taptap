-- ============================================
-- User Balance & Transactions System
-- Revolut-style wallet for 360Auto
-- ============================================

-- ============================================
-- 1. CREATE USER_BALANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_balance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0 CHECK (balance >= 0),
  currency VARCHAR(5) DEFAULT 'KGS',
  total_deposited DECIMAL(12,2) DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_balance IS 'User wallet balance for boost and payments';
COMMENT ON COLUMN public.user_balance.balance IS 'Current available balance';
COMMENT ON COLUMN public.user_balance.total_deposited IS 'Lifetime total deposited';
COMMENT ON COLUMN public.user_balance.total_spent IS 'Lifetime total spent on boosts';

-- ============================================
-- 2. CREATE BALANCE_TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('topup', 'boost', 'refund', 'bonus')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- boost_transaction_id or payment_id
  reference_type VARCHAR(20), -- 'boost', 'payment'
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.balance_transactions IS 'All balance changes history';
COMMENT ON COLUMN public.balance_transactions.type IS 'topup = пополнение, boost = списание, refund = возврат, bonus = бонус';

-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_balance_user_id ON public.user_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON public.balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON public.balance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON public.balance_transactions(created_at DESC);

-- ============================================
-- 4. TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_user_balance_updated_at ON public.user_balance;
CREATE TRIGGER update_user_balance_updated_at
  BEFORE UPDATE ON public.user_balance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Get or create user balance
CREATE OR REPLACE FUNCTION get_or_create_user_balance(p_user_id UUID)
RETURNS public.user_balance AS $$
DECLARE
  v_balance public.user_balance;
BEGIN
  SELECT * INTO v_balance FROM public.user_balance WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_balance (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING * INTO v_balance;
  END IF;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Top up balance
CREATE OR REPLACE FUNCTION topup_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'Пополнение баланса',
  p_reference_id UUID DEFAULT NULL
)
RETURNS public.balance_transactions AS $$
DECLARE
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
  v_transaction public.balance_transactions;
BEGIN
  -- Get or create balance
  PERFORM get_or_create_user_balance(p_user_id);

  -- Get current balance
  SELECT balance INTO v_balance_before FROM public.user_balance WHERE user_id = p_user_id FOR UPDATE;
  v_balance_after := v_balance_before + p_amount;

  -- Update balance
  UPDATE public.user_balance
  SET
    balance = v_balance_after,
    total_deposited = total_deposited + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_before, balance_after,
    description, reference_id, reference_type, status
  )
  VALUES (
    p_user_id, 'topup', p_amount, v_balance_before, v_balance_after,
    p_description, p_reference_id, 'payment', 'success'
  )
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Spend from balance (for boost)
CREATE OR REPLACE FUNCTION spend_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS public.balance_transactions AS $$
DECLARE
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
  v_transaction public.balance_transactions;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO v_balance_before
  FROM public.user_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance_before IS NULL THEN
    RAISE EXCEPTION 'User balance not found';
  END IF;

  IF v_balance_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance: % < %', v_balance_before, p_amount;
  END IF;

  v_balance_after := v_balance_before - p_amount;

  -- Update balance
  UPDATE public.user_balance
  SET
    balance = v_balance_after,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_before, balance_after,
    description, reference_id, reference_type, status
  )
  VALUES (
    p_user_id, 'boost', -p_amount, v_balance_before, v_balance_after,
    p_description, p_reference_id, 'boost', 'success'
  )
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund to balance
CREATE OR REPLACE FUNCTION refund_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT 'Возврат средств',
  p_reference_id UUID DEFAULT NULL
)
RETURNS public.balance_transactions AS $$
DECLARE
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
  v_transaction public.balance_transactions;
BEGIN
  -- Get current balance
  SELECT balance INTO v_balance_before FROM public.user_balance WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance_before IS NULL THEN
    RAISE EXCEPTION 'User balance not found';
  END IF;

  v_balance_after := v_balance_before + p_amount;

  -- Update balance
  UPDATE public.user_balance
  SET
    balance = v_balance_after,
    total_spent = total_spent - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO public.balance_transactions (
    user_id, type, amount, balance_before, balance_after,
    description, reference_id, reference_type, status
  )
  VALUES (
    p_user_id, 'refund', p_amount, v_balance_before, v_balance_after,
    p_description, p_reference_id, 'boost', 'success'
  )
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.user_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- User balance policies
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_balance;
CREATE POLICY "Users can view own balance" ON public.user_balance
  FOR SELECT USING (user_id = auth.uid());

-- Balance transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.balance_transactions;
CREATE POLICY "Users can view own transactions" ON public.balance_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Service role full access
DROP POLICY IF EXISTS "Service role full access user_balance" ON public.user_balance;
CREATE POLICY "Service role full access user_balance" ON public.user_balance
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access balance_transactions" ON public.balance_transactions;
CREATE POLICY "Service role full access balance_transactions" ON public.balance_transactions
  FOR ALL USING (true);

-- ============================================
-- 7. GRANTS
-- ============================================
GRANT SELECT ON public.user_balance TO authenticated;
GRANT SELECT ON public.balance_transactions TO authenticated;

GRANT EXECUTE ON FUNCTION get_or_create_user_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION topup_balance(UUID, DECIMAL, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION spend_balance(UUID, DECIMAL, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refund_balance(UUID, DECIMAL, TEXT, UUID) TO authenticated;
