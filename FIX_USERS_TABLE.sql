-- ============================================
-- СРОЧНОЕ ИСПРАВЛЕНИЕ: Удаление foreign key constraint
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor
-- ============================================

-- 1. Удаляем foreign key constraint если он существует
DO $$ 
DECLARE
  fk_constraint_name TEXT;
BEGIN
  -- Ищем все foreign key constraints на таблице users
  FOR fk_constraint_name IN 
    SELECT constraint_name
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I CASCADE', fk_constraint_name);
    RAISE NOTICE 'Dropped constraint: %', fk_constraint_name;
  END LOOP;
END $$;

-- 2. Убеждаемся, что id имеет DEFAULT gen_random_uuid()
ALTER TABLE public.users 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Проверяем результат
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE WARNING '⚠️ Foreign key constraints still exist!';
  ELSE
    RAISE NOTICE '✅ All foreign key constraints removed successfully';
  END IF;
  
  -- Проверяем DEFAULT
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'id'
    AND column_default LIKE '%gen_random_uuid%'
  ) THEN
    RAISE NOTICE '✅ id column has DEFAULT gen_random_uuid()';
  ELSE
    RAISE WARNING '⚠️ id column DEFAULT may not be set correctly';
  END IF;
END $$;


