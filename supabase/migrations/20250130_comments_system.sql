-- ==============================================
-- СИСТЕМА КОММЕНТАРИЕВ
-- Миграция с car_id на listing_id + новые фичи
-- ==============================================

-- Проверяем, что таблица listings существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'listings'
  ) THEN
    RAISE EXCEPTION 'Table public.listings does not exist. Please run initial schema migration first.';
  END IF;
END $$;

-- ==============================================
-- МИГРАЦИЯ СУЩЕСТВУЮЩЕЙ ТАБЛИЦЫ COMMENTS
-- ==============================================

DO $$
BEGIN
  -- Проверяем, существует ли таблица comments
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'comments'
  ) THEN
    -- Переименовываем car_id -> listing_id если car_id существует
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'car_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'listing_id'
    ) THEN
      ALTER TABLE public.comments RENAME COLUMN car_id TO listing_id;
      RAISE NOTICE 'Renamed car_id to listing_id';
    END IF;
    
    -- Переименовываем likes -> likes_count если нужно
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'likes'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'likes_count'
    ) THEN
      ALTER TABLE public.comments RENAME COLUMN likes TO likes_count;
      RAISE NOTICE 'Renamed likes to likes_count';
    END IF;
    
    -- Добавляем is_edited если нет
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'is_edited'
    ) THEN
      ALTER TABLE public.comments ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
      -- Заполняем на основе edited_at
      UPDATE public.comments SET is_edited = TRUE WHERE edited_at IS NOT NULL;
      RAISE NOTICE 'Added is_edited column';
    END IF;
    
    -- Добавляем replies_count если нет
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'replies_count'
    ) THEN
      ALTER TABLE public.comments ADD COLUMN replies_count INTEGER DEFAULT 0;
      RAISE NOTICE 'Added replies_count column';
    END IF;
    
  ELSE
    -- Создаём новую таблицу comments
    CREATE TABLE public.comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      listing_id UUID NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      parent_id UUID,
      text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 1000),
      likes_count INTEGER DEFAULT 0,
      replies_count INTEGER DEFAULT 0,
      is_edited BOOLEAN DEFAULT FALSE,
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created new comments table';
  END IF;
END $$;

-- ==============================================
-- ОЧИСТКА "СИРОТСКИХ" КОММЕНТАРИЕВ
-- (комментарии, ссылающиеся на несуществующие listings)
-- ==============================================

DO $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Удаляем комментарии с несуществующими listing_id
  DELETE FROM public.comments 
  WHERE listing_id IS NOT NULL 
  AND listing_id NOT IN (SELECT id FROM public.listings);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % orphaned comments (listing_id not in listings)', v_deleted_count;
  END IF;
END $$;

-- ==============================================
-- ДОБАВЛЕНИЕ ВНЕШНИХ КЛЮЧЕЙ
-- ==============================================

DO $$
BEGIN
  -- Удаляем старый FK на cars если есть
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'comments' 
    AND constraint_name = 'comments_car_id_fkey'
  ) THEN
    ALTER TABLE public.comments DROP CONSTRAINT comments_car_id_fkey;
    RAISE NOTICE 'Dropped old comments_car_id_fkey';
  END IF;
  
  -- Добавляем FK на listings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'comments' 
    AND constraint_name = 'comments_listing_id_fkey'
  ) THEN
    ALTER TABLE public.comments 
    ADD CONSTRAINT comments_listing_id_fkey 
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added comments_listing_id_fkey';
  END IF;
  
  -- Добавляем self-reference FK на parent_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'comments' 
    AND constraint_name = 'comments_parent_id_fkey'
  ) THEN
    ALTER TABLE public.comments 
    ADD CONSTRAINT comments_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added comments_parent_id_fkey';
  END IF;
END $$;

-- ==============================================
-- ИНДЕКСЫ
-- ==============================================

-- Удаляем старые индексы если есть
DROP INDEX IF EXISTS idx_comments_car_id;

-- Создаём новые индексы
CREATE INDEX IF NOT EXISTS idx_comments_listing_id ON public.comments(listing_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Full-text search
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'comments' 
    AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (to_tsvector('russian', text)) STORED;
    CREATE INDEX idx_comments_search ON public.comments USING GIN(search_vector);
    RAISE NOTICE 'Added full-text search';
  END IF;
END $$;

-- ==============================================
-- ТАБЛИЦА ЛАЙКОВ КОММЕНТАРИЕВ
-- ==============================================

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- ==============================================
-- ТАБЛИЦА РЕАКЦИЙ (ЭМОДЗИ)
-- ==============================================

CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);

-- ==============================================
-- ТРИГГЕРЫ
-- ==============================================

-- Проверяем, что comments_count есть в listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN comments_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added comments_count to listings';
  END IF;
END $$;

-- Триггер для обновления likes_count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_likes_count ON public.comment_likes;
CREATE TRIGGER trigger_comment_likes_count
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Триггер для обновления replies_count
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.comments SET replies_count = COALESCE(replies_count, 0) + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.comments SET replies_count = GREATEST(0, COALESCE(replies_count, 0) - 1) WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_replies_count ON public.comments;
CREATE TRIGGER trigger_comment_replies_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_comment_replies_count();

-- Триггер для обновления comments_count в listings
CREATE OR REPLACE FUNCTION update_listing_comments_count()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_id UUID;
  v_is_deleted BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_listing_id := NEW.listing_id;
    v_is_deleted := COALESCE(NEW.is_deleted, FALSE);
    IF v_is_deleted = FALSE THEN
      UPDATE public.listings 
      SET comments_count = COALESCE(comments_count, 0) + 1 
      WHERE id = v_listing_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_listing_id := OLD.listing_id;
    v_is_deleted := COALESCE(OLD.is_deleted, FALSE);
    IF v_is_deleted = FALSE THEN
      UPDATE public.listings 
      SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1) 
      WHERE id = v_listing_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    v_listing_id := NEW.listing_id;
    -- Если комментарий был удалён
    IF COALESCE(OLD.is_deleted, FALSE) = FALSE AND COALESCE(NEW.is_deleted, FALSE) = TRUE THEN
      UPDATE public.listings 
      SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1) 
      WHERE id = v_listing_id;
    -- Если комментарий был восстановлен
    ELSIF COALESCE(OLD.is_deleted, FALSE) = TRUE AND COALESCE(NEW.is_deleted, FALSE) = FALSE THEN
      UPDATE public.listings 
      SET comments_count = COALESCE(comments_count, 0) + 1 
      WHERE id = v_listing_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_listing_comments_count ON public.comments;
CREATE TRIGGER trigger_listing_comments_count
AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_listing_comments_count();

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.text IS DISTINCT FROM NEW.text THEN
    NEW.is_edited = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_updated_at ON public.comments;
CREATE TRIGGER trigger_comment_updated_at
BEFORE UPDATE OF text ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_comment_updated_at();

-- ==============================================
-- RLS POLICIES
-- ==============================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Comments policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (COALESCE(is_deleted, FALSE) = FALSE);

DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
CREATE POLICY "Users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Comment likes policies
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.comment_likes;
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can manage own likes" ON public.comment_likes;
CREATE POLICY "Users can manage own likes" ON public.comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comment reactions policies
DROP POLICY IF EXISTS "Comment reactions are viewable by everyone" ON public.comment_reactions;
CREATE POLICY "Comment reactions are viewable by everyone" ON public.comment_reactions
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can manage own reactions" ON public.comment_reactions;
CREATE POLICY "Users can manage own reactions" ON public.comment_reactions
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- REALTIME
-- ==============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'comment_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
  END IF;
END $$;

-- ==============================================
-- ГОТОВО
-- ==============================================
DO $$ BEGIN RAISE NOTICE '✅ Comments system migration completed successfully'; END $$;
