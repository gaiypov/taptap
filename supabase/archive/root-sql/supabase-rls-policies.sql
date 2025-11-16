-- ============================================
-- 360° RLS ПОЛИТИКИ (Row Level Security)
-- Версия: 1.2 (ИСПРАВЛЕНО для listings)
-- Дата: 20 октября 2025
-- ============================================

-- ВАЖНО: Применять ПОСЛЕ создания всех таблиц!

-- ============================================
-- 0. СОЗДАНИЕ НЕДОСТАЮЩИХ ТАБЛИЦ
-- ============================================

-- Таблица лайков для listings
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_car_id ON public.likes(car_id);

-- Таблица сохранений для listings
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);

CREATE INDEX IF NOT EXISTS idx_saves_user_id ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_car_id ON public.saves(car_id);

-- Таблица комментариев для listings
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_car_id ON public.comments(car_id);

-- Таблица просмотров для listings
CREATE TABLE IF NOT EXISTS public.views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  car_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_views_user_id ON public.views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_views_car_id ON public.views(car_id);

-- ============================================
-- 1. ТАБЛИЦА USERS
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Все могут просматривать профили продавцов (для карточек объявлений)
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;
CREATE POLICY "Anyone can view user profiles"
  ON public.users FOR SELECT
  USING (true);

-- Пользователь может обновлять только свой профиль
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Пользователь может создать свой профиль при регистрации
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================
-- 2. ТАБЛИЦА LISTINGS
-- ============================================

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Все могут просматривать активные объявления (даже гости)
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  USING (
    status = 'active' 
    OR seller_id = auth.uid()
  );

-- Владелец может видеть ВСЕ свои объявления (любой статус)
DROP POLICY IF EXISTS "Sellers can view all own listings" ON public.listings;
CREATE POLICY "Sellers can view all own listings"
  ON public.listings FOR SELECT
  USING (seller_id = auth.uid());

-- Авторизованные пользователи могут создавать объявления
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
CREATE POLICY "Authenticated users can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Владелец может обновлять свои объявления
DROP POLICY IF EXISTS "Sellers can update own listings" ON public.listings;
CREATE POLICY "Sellers can update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Владелец может удалять свои объявления
DROP POLICY IF EXISTS "Sellers can delete own listings" ON public.listings;
CREATE POLICY "Sellers can delete own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- Гости могут искать активные объявления (публичный поиск)
DROP POLICY IF EXISTS "Public can search active listings" ON public.listings;
CREATE POLICY "Public can search active listings"
  ON public.listings FOR SELECT
  TO anon
  USING (status = 'active');

-- ============================================
-- 3. ТАБЛИЦА LIKES ✅ РАЗРЕШЕНЫ ДЛЯ ГОСТЕЙ
-- ============================================

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- ✅ Все (включая гостей) могут лайкать
DROP POLICY IF EXISTS "Anyone can like" ON public.likes;
CREATE POLICY "Anyone can like"
  ON public.likes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ✅ Все могут убрать лайк
DROP POLICY IF EXISTS "Anyone can unlike" ON public.likes;
CREATE POLICY "Anyone can unlike"
  ON public.likes FOR DELETE
  TO anon, authenticated
  USING (true);

-- Все могут видеть лайки (для счетчиков)
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
CREATE POLICY "Anyone can view likes"
  ON public.likes FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- 4. ТАБЛИЦА SAVES (Сохраненные) ❌ ЗАПРЕЩЕНО ДЛЯ ГОСТЕЙ
-- ============================================

ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только свои сохраненные
DROP POLICY IF EXISTS "Users can view own saves" ON public.saves;
CREATE POLICY "Users can view own saves"
  ON public.saves FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ❌ ТОЛЬКО авторизованные могут сохранять
DROP POLICY IF EXISTS "Authenticated users can save listings" ON public.saves;
CREATE POLICY "Authenticated users can save listings"
  ON public.saves FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Пользователь может удалять из сохраненных
DROP POLICY IF EXISTS "Users can unsave listings" ON public.saves;
CREATE POLICY "Users can unsave listings"
  ON public.saves FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Пользователь может обновлять заметки в сохраненных
DROP POLICY IF EXISTS "Users can update own saves" ON public.saves;
CREATE POLICY "Users can update own saves"
  ON public.saves FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 5. ТАБЛИЦА COMMENTS (Комментарии) ❌ ЗАПРЕЩЕНО ДЛЯ ГОСТЕЙ
-- ============================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Все могут видеть комментарии к активным объявлениям
DROP POLICY IF EXISTS "Anyone can view comments on active listings" ON public.comments;
CREATE POLICY "Anyone can view comments on active listings"
  ON public.comments FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE id = car_id 
        AND (status = 'active' OR seller_id = auth.uid())
    )
  );

-- ❌ ТОЛЬКО авторизованные могут комментировать
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Автор может удалить свой комментарий
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Владелец объявления может удалить любой комментарий
DROP POLICY IF EXISTS "Listing owners can delete any comment" ON public.comments;
CREATE POLICY "Listing owners can delete any comment"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE id = car_id AND seller_id = auth.uid()
    )
  );

-- ============================================
-- 6. ТАБЛИЦА VIEWS (Просмотры) ✅ РАЗРЕШЕНО ДЛЯ ГОСТЕЙ
-- ============================================

ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- ✅ Все (включая гостей) могут создавать просмотры
DROP POLICY IF EXISTS "Anyone can create views" ON public.views;
CREATE POLICY "Anyone can create views"
  ON public.views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Владелец объявления может видеть статистику просмотров
DROP POLICY IF EXISTS "Listing owners can view stats" ON public.views;
CREATE POLICY "Listing owners can view stats"
  ON public.views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE id = car_id AND seller_id = auth.uid()
    )
  );

-- ============================================
-- 7. GRANT РАЗРЕШЕНИЯ НА ФУНКЦИИ
-- ============================================

-- ✅ Разрешить всем (включая гостей) инкрементить просмотры
GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO anon, authenticated;

-- ✅ Разрешить всем (включая гостей) работать с лайками
GRANT EXECUTE ON FUNCTION increment_listing_likes(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_listing_likes(UUID) TO anon, authenticated;

-- Разрешить всем получать трендовые объявления
GRANT EXECUTE ON FUNCTION get_trending_listings(TEXT, INTERVAL, INTEGER) TO anon, authenticated;

-- ============================================
-- 8. ОПТИМИЗАЦИЯ RLS (производительность)
-- ============================================

-- Включить RLS на уровне строки для всех таблиц
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.listings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.likes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.saves FORCE ROW LEVEL SECURITY;
ALTER TABLE public.comments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.views FORCE ROW LEVEL SECURITY;

-- ============================================
-- 9. ПРОВЕРКА ПОЛИТИК
-- ============================================

-- Проверить все политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('listings', 'users', 'likes', 'saves', 'comments', 'views')
ORDER BY tablename, policyname;

-- ============================================
-- ГОТОВО! ✅
-- ============================================
-- 
-- Созданные таблицы:
-- • likes (с car_id → listings.id)
-- • saves (с car_id → listings.id)
-- • comments (с car_id → listings.id)
-- • views (с car_id → listings.id)
--
-- Созданные политики:
-- • users: 3 политики (view, update, insert)
-- • listings: 6 политик (view, view_own, create, update, delete, search)
-- • likes: 3 политики ✅ РАЗРЕШЕНО ДЛЯ ГОСТЕЙ (like, unlike, view)
-- • saves: 4 политики ❌ ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ
-- • comments: 4 политики ❌ ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ
-- • views: 2 политики ✅ РАЗРЕШЕНО ДЛЯ ГОСТЕЙ
--
-- Всего: 22 политики безопасности ✅
--
-- РАЗРЕШЕНИЯ ДЛЯ ГОСТЕЙ:
-- ✅ Просмотр объявлений
-- ✅ Лайки (счетчики считают!)
-- ✅ Просмотры
-- ✅ Поиск
-- ❌ Комментарии (только авторизованные)
-- ❌ Сохранение (только авторизованные)
-- ❌ Создание объявлений (только авторизованные)
--
-- ПРИМЕЧАНИЕ: Используется car_id для совместимости с существующим кодом,
-- но он ссылается на listings.id (универсальная таблица)
