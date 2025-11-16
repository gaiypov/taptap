-- СРОЧНОЕ ИСПРАВЛЕНИЕ RLS ДЛЯ LISTINGS
-- Выполните этот SQL в Supabase SQL Editor

-- 1. Включаем RLS для таблицы listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем все существующие политики
DROP POLICY IF EXISTS "Public can read all listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Sellers can view own listings" ON public.listings;
DROP POLICY IF EXISTS "Sellers can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Sellers can delete own listings" ON public.listings;

-- 3. Создаем новые политики
CREATE POLICY "Public can read all listings" ON public.listings
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create listings" ON public.listings
FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own listings" ON public.listings
FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own listings" ON public.listings
FOR DELETE USING (auth.uid() = seller_id);

-- 4. Проверяем что политики созданы
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'listings';
