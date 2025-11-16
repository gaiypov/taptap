-- ==============================================
-- СИСТЕМА БИЗНЕС-АККАУНТОВ
-- ==============================================
-- Версия: 1.0
-- Дата: 2025-10-14
-- Описание: Добавляет систему бизнес-аккаунтов с тарифами

-- ==============================================
-- 1. ТАБЛИЦА БИЗНЕС-АККАУНТОВ
-- ==============================================

CREATE TABLE IF NOT EXISTS business_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Tier
  tier TEXT NOT NULL DEFAULT 'free' 
    CHECK (tier IN ('free', 'lite', 'business', 'pro')),
  
  -- Company info
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  company_description TEXT,
  company_address TEXT,
  company_phone TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_website TEXT,
  business_type TEXT NOT NULL,
  working_hours JSONB,
  
  -- Verification (для PRO)
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[],
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  
  -- Subscription
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_trial BOOLEAN DEFAULT FALSE,
  auto_renew BOOLEAN DEFAULT FALSE,
  
  -- Limits
  active_listings_count INTEGER DEFAULT 0,
  max_listings INTEGER DEFAULT 2,
  team_members_count INTEGER DEFAULT 1,
  max_team_members INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Комментарии к полям
COMMENT ON TABLE business_accounts IS 'Бизнес-аккаунты с тарифами и подписками';
COMMENT ON COLUMN business_accounts.tier IS 'Тариф: free, lite, business, pro';
COMMENT ON COLUMN business_accounts.is_trial IS 'Пробный период активен';
COMMENT ON COLUMN business_accounts.auto_renew IS 'Автоматическое продление подписки';

-- ==============================================
-- 2. ТАБЛИЦА ЧЛЕНОВ КОМАНДЫ
-- ==============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES business_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager'
    CHECK (role IN ('owner', 'admin', 'manager')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(business_id, user_id)
);

COMMENT ON TABLE team_members IS 'Члены команды бизнес-аккаунта';
COMMENT ON COLUMN team_members.role IS 'Роль: owner, admin, manager';

-- ==============================================
-- 3. ОБНОВЛЕНИЕ ТАБЛИЦЫ LISTINGS
-- ==============================================

-- Добавляем связь с бизнес-аккаунтом
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='listings' AND column_name='business_id'
  ) THEN
    ALTER TABLE listings 
    ADD COLUMN business_id UUID REFERENCES business_accounts(id);
  END IF;
END $$;

-- Добавляем флаг спонсорства (для PRO баннеров)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='listings' AND column_name='is_sponsored'
  ) THEN
    ALTER TABLE listings
    ADD COLUMN is_sponsored BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

COMMENT ON COLUMN listings.business_id IS 'Связь с бизнес-аккаунтом';
COMMENT ON COLUMN listings.is_sponsored IS 'Флаг спонсируемого баннера (PRO)';

-- ==============================================
-- 4. ИНДЕКСЫ
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_business_user ON business_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_business_tier ON business_accounts(tier);
CREATE INDEX IF NOT EXISTS idx_business_verified ON business_accounts(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_team_business ON team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_team_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_business ON listings(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_sponsored ON listings(is_sponsored) WHERE is_sponsored = TRUE;

-- ==============================================
-- 5. ФУНКЦИЯ: ПРОВЕРКА ВОЗМОЖНОСТИ СОЗДАНИЯ ОБЪЯВЛЕНИЯ
-- ==============================================

CREATE OR REPLACE FUNCTION can_create_listing(
  user_uuid UUID, 
  listing_category TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  business_account business_accounts%ROWTYPE;
  current_count INTEGER;
  category_count INTEGER;
BEGIN
  -- Получаем бизнес-аккаунт
  SELECT * INTO business_account 
  FROM business_accounts 
  WHERE user_id = user_uuid;
  
  -- Если нет бизнес-аккаунта - FREE пользователь
  IF business_account IS NULL THEN
    -- Считаем активные объявления по категории
    SELECT COUNT(*) INTO category_count
    FROM listings
    WHERE seller_id = user_uuid 
      AND status = 'active'
      AND category = listing_category;
    
    -- FREE лимиты по категориям
    IF listing_category = 'car' AND category_count >= 2 THEN
      RETURN FALSE;
    ELSIF listing_category = 'horse' AND category_count >= 2 THEN
      RETURN FALSE;
    ELSIF listing_category = 'realty' AND category_count >= 1 THEN
      RETURN FALSE;
    END IF;
    
    RETURN TRUE;
  END IF;
  
  -- Для PRO - безлимит
  IF business_account.tier = 'pro' THEN
    RETURN TRUE;
  END IF;
  
  -- Проверяем лимит подписки
  IF business_account.subscription_ends_at < NOW() AND 
     (business_account.trial_ends_at IS NULL OR business_account.trial_ends_at < NOW()) THEN
    -- Подписка истекла
    RETURN FALSE;
  END IF;
  
  -- Считаем активные объявления
  SELECT COUNT(*) INTO current_count
  FROM listings
  WHERE seller_id = user_uuid AND status = 'active';
  
  -- Проверяем против лимита тарифа
  IF current_count >= business_account.max_listings THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_create_listing IS 'Проверяет может ли пользователь создать объявление с учетом лимитов';

-- ==============================================
-- 6. ТРИГГЕР: ОБНОВЛЕНИЕ СЧЕТЧИКА ОБЪЯВЛЕНИЙ
-- ==============================================

CREATE OR REPLACE FUNCTION update_business_listings_count()
RETURNS TRIGGER AS $$
BEGIN
  -- При добавлении активного объявления
  IF TG_OP = 'INSERT' AND NEW.status = 'active' AND NEW.business_id IS NOT NULL THEN
    UPDATE business_accounts
    SET active_listings_count = active_listings_count + 1,
        updated_at = NOW()
    WHERE id = NEW.business_id;
  
  -- При обновлении статуса
  ELSIF TG_OP = 'UPDATE' AND NEW.business_id IS NOT NULL THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      -- Стало неактивным
      UPDATE business_accounts
      SET active_listings_count = active_listings_count - 1,
          updated_at = NOW()
      WHERE id = NEW.business_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      -- Стало активным
      UPDATE business_accounts
      SET active_listings_count = active_listings_count + 1,
          updated_at = NOW()
      WHERE id = NEW.business_id;
    END IF;
  
  -- При удалении активного объявления
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' AND OLD.business_id IS NOT NULL THEN
    UPDATE business_accounts
    SET active_listings_count = active_listings_count - 1,
        updated_at = NOW()
    WHERE id = OLD.business_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер если не существует
DROP TRIGGER IF EXISTS update_business_count ON listings;
CREATE TRIGGER update_business_count
  AFTER INSERT OR UPDATE OR DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_listings_count();

-- ==============================================
-- 7. ТРИГГЕР: ОБНОВЛЕНИЕ СЧЕТЧИКА КОМАНДЫ
-- ==============================================

CREATE OR REPLACE FUNCTION update_team_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE business_accounts
    SET team_members_count = team_members_count + 1,
        updated_at = NOW()
    WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE business_accounts
    SET team_members_count = team_members_count - 1,
        updated_at = NOW()
    WHERE id = OLD.business_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_team_count ON team_members;
CREATE TRIGGER update_team_count
  AFTER INSERT OR DELETE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_count();

-- ==============================================
-- 8. ФУНКЦИЯ: ОБНОВЛЕНИЕ UPDATED_AT
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_accounts_updated_at ON business_accounts;
CREATE TRIGGER business_accounts_updated_at
  BEFORE UPDATE ON business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. RLS (Row Level Security)
-- ==============================================

-- Включаем RLS
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Политики для business_accounts
CREATE POLICY "Users can view their own business account"
  ON business_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business account"
  ON business_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business account"
  ON business_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Политики для team_members
CREATE POLICY "Team members can view their teams"
  ON team_members FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM business_accounts 
      WHERE id = team_members.business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can manage team"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_accounts 
      WHERE id = team_members.business_id AND user_id = auth.uid()
    )
  );

-- ==============================================
-- 10. ТЕСТОВЫЕ ДАННЫЕ (ОПЦИОНАЛЬНО)
-- ==============================================

-- Закомментировано для production
-- INSERT INTO business_accounts (user_id, tier, company_name, company_phone, company_email, business_type)
-- VALUES (
--   'test-user-uuid',
--   'business',
--   'Тест Авто',
--   '+996555123456',
--   'test@example.com',
--   'car_dealer'
-- );

-- ==============================================
-- 11. VIEWS ДЛЯ АНАЛИТИКИ
-- ==============================================

CREATE OR REPLACE VIEW business_stats AS
SELECT 
  ba.id as business_id,
  ba.user_id,
  ba.tier,
  ba.company_name,
  ba.active_listings_count,
  COUNT(DISTINCT l.id) as total_listings,
  COUNT(DISTINCT CASE WHEN l.status = 'sold' THEN l.id END) as sold_listings,
  COUNT(DISTINCT CASE WHEN l.created_at >= NOW() - INTERVAL '30 days' THEN l.id END) as listings_last_30_days,
  COALESCE(SUM(l.views), 0) as total_views,
  COALESCE(SUM(l.likes), 0) as total_likes,
  ba.team_members_count
FROM business_accounts ba
LEFT JOIN listings l ON l.business_id = ba.id
GROUP BY ba.id, ba.user_id, ba.tier, ba.company_name, ba.active_listings_count, ba.team_members_count;

COMMENT ON VIEW business_stats IS 'Агрегированная статистика по бизнес-аккаунтам';

-- ==============================================
-- ГОТОВО!
-- ==============================================

-- Проверка установки
DO $$
BEGIN
  RAISE NOTICE '✅ Бизнес-аккаунты установлены успешно!';
  RAISE NOTICE '📊 Таблицы: business_accounts, team_members';
  RAISE NOTICE '🔧 Функции: can_create_listing()';
  RAISE NOTICE '⚡ Триггеры: обновление счетчиков';
  RAISE NOTICE '🔒 RLS: включен';
END $$;

