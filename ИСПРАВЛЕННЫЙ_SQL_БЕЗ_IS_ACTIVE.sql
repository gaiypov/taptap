-- ИСПРАВЛЕННЫЙ SQL СКРИПТ - БЕЗ КОЛОНКИ is_active
-- Выполните этот SQL в Supabase SQL Editor

-- 1. СОЗДАЕМ ТАБЛИЦУ LISTINGS (если не существует)
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('car', 'horse', 'real_estate')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15,2),
  video_url TEXT,
  thumbnail_url TEXT,
  details JSONB DEFAULT '{}',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  ai_score DECIMAL(3,2),
  boost_level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. СОЗДАЕМ ТАБЛИЦУ USERS (если не существует)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. СОЗДАЕМ ТАБЛИЦУ BUSINESS_ACCOUNTS (если не существует)
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. СОЗДАЕМ ТАБЛИЦУ VERIFICATION_CODES (если не существует)
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE
);

-- 5. СОЗДАЕМ ИНДЕКСЫ
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON public.verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.verification_codes(expires_at);

-- 6. ВКЛЮЧАЕМ RLS ДЛЯ ВСЕХ ТАБЛИЦ
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- 7. УДАЛЯЕМ ВСЕ СТАРЫЕ ПОЛИТИКИ
DROP POLICY IF EXISTS "Public can read all listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
DROP POLICY IF EXISTS "Public can read user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Owners can view their own business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Owners can create their own business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Owners can update their own business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Owners can delete their own business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Anyone can create verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can read verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can update verification codes" ON public.verification_codes;

-- 8. СОЗДАЕМ НОВЫЕ ПОЛИТИКИ ДЛЯ LISTINGS
CREATE POLICY "Public can read all listings" ON public.listings
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create listings" ON public.listings
FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own listings" ON public.listings
FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own listings" ON public.listings
FOR DELETE USING (auth.uid() = seller_id);

-- 9. СОЗДАЕМ НОВЫЕ ПОЛИТИКИ ДЛЯ USERS
CREATE POLICY "Public can read user profiles" ON public.users
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- 10. СОЗДАЕМ НОВЫЕ ПОЛИТИКИ ДЛЯ BUSINESS_ACCOUNTS
CREATE POLICY "Owners can view their own business accounts" ON public.business_accounts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can create their own business accounts" ON public.business_accounts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own business accounts" ON public.business_accounts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their own business accounts" ON public.business_accounts
FOR DELETE USING (auth.uid() = user_id);

-- 11. СОЗДАЕМ НОВЫЕ ПОЛИТИКИ ДЛЯ VERIFICATION_CODES
CREATE POLICY "Anyone can create verification codes" ON public.verification_codes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes" ON public.verification_codes
FOR SELECT USING (true);

CREATE POLICY "Anyone can update verification codes" ON public.verification_codes
FOR UPDATE USING (true);

-- 12. ДОБАВЛЯЕМ ТЕСТОВЫЕ ДАННЫЕ (БЕЗ is_active)
INSERT INTO public.listings (id, seller_id, category, title, description, price, video_url, thumbnail_url, details, views, likes, saves)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'car', 'Toyota Camry 2020', 'Отличное состояние', 2500000, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Toyota+Camry', '{"brand": "Toyota", "model": "Camry", "year": 2020, "mileage": 45000, "color": "Белый", "transmission": "Автомат", "fuel_type": "Бензин"}', 120, 15, 3),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'car', 'BMW X5 2019', 'Премиум класс', 4500000, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=BMW+X5', '{"brand": "BMW", "model": "X5", "year": 2019, "mileage": 32000, "color": "Черный", "transmission": "Автомат", "fuel_type": "Бензин"}', 200, 28, 8)
ON CONFLICT (id) DO NOTHING;

-- 13. ПРОВЕРЯЕМ ЧТО ВСЕ СОЗДАНО
SELECT 'listings' as table_name, count(*) as row_count FROM public.listings
UNION ALL
SELECT 'users' as table_name, count(*) as row_count FROM public.users
UNION ALL
SELECT 'business_accounts' as table_name, count(*) as row_count FROM public.business_accounts
UNION ALL
SELECT 'verification_codes' as table_name, count(*) as row_count FROM public.verification_codes;
