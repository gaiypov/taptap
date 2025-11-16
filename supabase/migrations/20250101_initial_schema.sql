-- ============================================
-- 360⁰ Marketplace - Core Tables
-- Production Ready for Kyrgyzstan Launch
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption

-- ============================================
-- 1. USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER CHECK (age >= 18),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. BUSINESS ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone_public VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add tax_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_accounts' 
    AND column_name = 'tax_id'
  ) THEN
    ALTER TABLE public.business_accounts ADD COLUMN tax_id VARCHAR(20);
    COMMENT ON COLUMN public.business_accounts.tax_id IS 'ИНН (Individual Tax Number) for Kyrgyzstan entities';
  END IF;
  
  -- Add verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_accounts' 
    AND column_name = 'verified'
  ) THEN
    ALTER TABLE public.business_accounts ADD COLUMN verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- 3. BUSINESS MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_members (
  business_id UUID REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('admin', 'seller')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (business_id, user_id)
);

-- ============================================
-- 4. LISTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(20) CHECK (category IN ('car', 'horse', 'real_estate')) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL CHECK (price > 0),
  currency VARCHAR(5) DEFAULT 'KZT',
  location_text VARCHAR(255) NOT NULL,
  video_id VARCHAR(255), -- api.video reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to listings if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add business_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'business_id'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN business_id UUID REFERENCES public.business_accounts(id) ON DELETE SET NULL;
  END IF;
  
  -- Migrate seller_id to seller_user_id if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'seller_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'seller_user_id'
  ) THEN
    -- Rename seller_id to seller_user_id
    ALTER TABLE public.listings RENAME COLUMN seller_id TO seller_user_id;
  END IF;
  
  -- Add seller_user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'seller_user_id'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN seller_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  
  -- Add constraint if it doesn't exist (only if both columns exist)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'seller_user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'business_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND constraint_name = 'listings_seller_or_business'
  ) THEN
    ALTER TABLE public.listings ADD CONSTRAINT listings_seller_or_business CHECK (
      (seller_user_id IS NOT NULL AND business_id IS NULL) OR 
      (seller_user_id IS NULL AND business_id IS NOT NULL)
    );
  END IF;
  
  -- Add video_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'video_status'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN video_status VARCHAR(20) DEFAULT 'uploading';
    ALTER TABLE public.listings ADD CONSTRAINT listings_video_status_check 
      CHECK (video_status IN ('uploading', 'processing', 'ready', 'failed'));
  END IF;
  
  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN status VARCHAR(20) DEFAULT 'pending_review';
    ALTER TABLE public.listings ADD CONSTRAINT listings_status_check 
      CHECK (status IN ('pending_review', 'active', 'rejected', 'archived'));
  END IF;
  
  -- Add is_boosted column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'is_boosted'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN is_boosted BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add counter columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'views_count'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'messages_count'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN messages_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add latitude and longitude columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN latitude DECIMAL(10,8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN longitude DECIMAL(11,8);
  END IF;
END $$;

-- ============================================
-- 5. CAR DETAILS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.car_details (
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE PRIMARY KEY,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  mileage_km INTEGER NOT NULL CHECK (mileage_km >= 0),
  vin VARCHAR(17),
  damage_report TEXT, -- AI output
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. HORSE DETAILS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.horse_details (
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE PRIMARY KEY,
  breed VARCHAR(100) NOT NULL,
  age_years INTEGER NOT NULL CHECK (age_years >= 0 AND age_years <= 50),
  gender VARCHAR(20) CHECK (gender IN ('stallion', 'mare', 'gelding')),
  training_level VARCHAR(50),
  health_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. REAL ESTATE DETAILS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.real_estate_details (
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE PRIMARY KEY,
  property_type VARCHAR(20) CHECK (property_type IN ('apartment', 'house', 'land', 'commercial')) NOT NULL,
  rooms INTEGER CHECK (rooms >= 0),
  area_m2 DECIMAL(10,2) CHECK (area_m2 > 0),
  address_text TEXT,
  is_owner BOOLEAN DEFAULT TRUE, -- is owner or agent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Business accounts indexes
-- Create indexes only if columns exist
DO $$ 
BEGIN
  -- Create tax_id index if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_accounts' 
    AND column_name = 'tax_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_business_accounts_tax_id ON public.business_accounts(tax_id);
  END IF;
  
  -- Create verified index if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_accounts' 
    AND column_name = 'verified'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_business_accounts_verified ON public.business_accounts(verified);
  END IF;
END $$;

-- Business members indexes
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_role ON public.business_members(role);

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at);

-- Create conditional indexes for listings (only if columns exist)
DO $$ 
BEGIN
  -- Create location index if both columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'latitude'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'longitude'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(latitude, longitude);
  END IF;
  
  -- Create business_id index if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'business_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listings_business_id ON public.listings(business_id);
  END IF;
  
  -- Create seller_user_id index if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'seller_user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listings_seller_user_id ON public.listings(seller_user_id);
  END IF;
  
  -- Create status index if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
  END IF;
  
  -- Create is_boosted index if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'is_boosted'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listings_is_boosted ON public.listings(is_boosted);
  END IF;
END $$;

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON public.listings USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON public.listings USING gin(description gin_trgm_ops);

-- Car details indexes
CREATE INDEX IF NOT EXISTS idx_car_details_make ON public.car_details(make);
CREATE INDEX IF NOT EXISTS idx_car_details_model ON public.car_details(model);
CREATE INDEX IF NOT EXISTS idx_car_details_year ON public.car_details(year);
CREATE INDEX IF NOT EXISTS idx_car_details_mileage ON public.car_details(mileage_km);

-- Horse details indexes
CREATE INDEX IF NOT EXISTS idx_horse_details_breed ON public.horse_details(breed);
CREATE INDEX IF NOT EXISTS idx_horse_details_age ON public.horse_details(age_years);
CREATE INDEX IF NOT EXISTS idx_horse_details_gender ON public.horse_details(gender);

-- Real estate details indexes
CREATE INDEX IF NOT EXISTS idx_real_estate_details_property_type ON public.real_estate_details(property_type);
CREATE INDEX IF NOT EXISTS idx_real_estate_details_rooms ON public.real_estate_details(rooms);
CREATE INDEX IF NOT EXISTS idx_real_estate_details_area ON public.real_estate_details(area_m2);

-- ============================================
-- 9. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_accounts_updated_at BEFORE UPDATE ON public.business_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_car_details_updated_at BEFORE UPDATE ON public.car_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_horse_details_updated_at BEFORE UPDATE ON public.horse_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_real_estate_details_updated_at BEFORE UPDATE ON public.real_estate_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. FUNCTIONS FOR COUNTERS
-- ============================================

-- Drop old functions if they exist with different signatures
-- Note: PostgreSQL requires exact signature match, so we drop with common variations

-- Drop with listing_id parameter name (new version)
DROP FUNCTION IF EXISTS increment_views(listing_id UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_likes(listing_id UUID) CASCADE;
DROP FUNCTION IF EXISTS decrement_likes(listing_id UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_comments(listing_id UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_messages(listing_id UUID) CASCADE;

-- Drop with old parameter names (car_uuid, car_id, listing_uuid, etc.)
DROP FUNCTION IF EXISTS increment_views(car_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_likes(car_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS decrement_likes(car_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_comments(car_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_messages(car_uuid UUID) CASCADE;

DROP FUNCTION IF EXISTS increment_views(car_id UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_likes(car_id UUID) CASCADE;
DROP FUNCTION IF EXISTS decrement_likes(car_id UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_comments(car_id UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_messages(car_id UUID) CASCADE;

DROP FUNCTION IF EXISTS increment_views(listing_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_likes(listing_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS decrement_likes(listing_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_comments(listing_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_messages(listing_uuid UUID) CASCADE;

-- Generic drop by name only (PostgreSQL will remove all overloads if exists)
DO $$ 
BEGIN
  -- Try to drop by exact name if it exists with any signature
  EXECUTE 'DROP FUNCTION IF EXISTS increment_views(UUID) CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS increment_likes(UUID) CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS decrement_likes(UUID) CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS increment_comments(UUID) CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS increment_messages(UUID) CASCADE';
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if function doesn't exist
    NULL;
END $$;

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_views(listing_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.listings 
    SET views_count = views_count + 1, updated_at = NOW()
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment likes
CREATE OR REPLACE FUNCTION increment_likes(listing_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.listings 
    SET likes_count = likes_count + 1, updated_at = NOW()
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement likes
CREATE OR REPLACE FUNCTION decrement_likes(listing_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.listings 
    SET likes_count = GREATEST(likes_count - 1, 0), updated_at = NOW()
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment comments
CREATE OR REPLACE FUNCTION increment_comments(listing_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.listings 
    SET comments_count = comments_count + 1, updated_at = NOW()
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment messages
CREATE OR REPLACE FUNCTION increment_messages(listing_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.listings 
    SET messages_count = messages_count + 1, updated_at = NOW()
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. COMMENTS
-- ============================================

COMMENT ON TABLE public.users IS 'User accounts for 360⁰ marketplace';
COMMENT ON TABLE public.business_accounts IS 'Business accounts for dealers, salons, stables, agencies';
COMMENT ON TABLE public.business_members IS 'Team members of business accounts';
COMMENT ON TABLE public.listings IS 'Main listings table for all categories';
COMMENT ON TABLE public.car_details IS 'Car-specific details for car listings';
COMMENT ON TABLE public.horse_details IS 'Horse-specific details for horse listings';
COMMENT ON TABLE public.real_estate_details IS 'Real estate-specific details for property listings';

COMMENT ON COLUMN public.business_accounts.tax_id IS 'ИНН (Individual Tax Number) for Kyrgyzstan entities';
COMMENT ON COLUMN public.listings.is_boosted IS 'Derived from active paid promotions';
COMMENT ON COLUMN public.listings.status IS 'pending_review -> active/rejected -> archived';
COMMENT ON COLUMN public.listings.video_status IS 'api.video processing status';
