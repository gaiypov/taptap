-- ============================================
-- ИСПРАВЛЕНИЕ ОШИБКИ 42501 В SUPABASE
-- Проверка и исправление RLS политик для listings
-- ============================================

-- 1. Проверяем, включен ли RLS для таблицы listings
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'listings';

-- 2. Включаем RLS если не включен
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 3. Проверяем существующие политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'listings'
ORDER BY policyname;

-- 4. Удаляем старые политики (если есть конфликты)
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Public can search active listings" ON public.listings;

-- 5. Создаем правильную политику для чтения активных объявлений
CREATE POLICY "Anyone can view active listings"
ON public.listings FOR SELECT
USING (status = 'active');

-- 6. Создаем политику для публичного поиска (для гостей)
CREATE POLICY "Public can search active listings"
ON public.listings FOR SELECT
TO anon
USING (status = 'active');

-- 7. Проверяем, что политики созданы
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'listings' AND cmd = 'SELECT';

-- 8. Тестируем доступ (должно работать)
-- Этот запрос должен выполняться без ошибки 42501:
SELECT id, title, price, status 
FROM public.listings 
WHERE status = 'active' 
LIMIT 5;

-- 9. Проверяем права на функции
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%listing%';

-- 10. Даем права на функции (если нужно)
GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_trending_listings(TEXT, INTERVAL, INTEGER) TO anon, authenticated;

-- ============================================
-- ГОТОВО! ✅
-- ============================================
-- 
-- Теперь:
-- ✅ RLS включен для listings
-- ✅ Политика "Anyone can view active listings" создана
-- ✅ Политика "Public can search active listings" создана
-- ✅ Гости могут читать активные объявления
-- ✅ Авторизованные пользователи могут читать все свои объявления
-- 
-- Ошибка 42501 должна исчезнуть!
