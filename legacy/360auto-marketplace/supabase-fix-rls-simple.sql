-- ============================================
-- 360° Marketplace - ПРОСТОЕ ИСПРАВЛЕНИЕ RLS
-- ============================================
-- Этот скрипт исправляет ошибки "permission denied"
-- Выполните его в Supabase Dashboard → SQL Editor
-- ============================================

-- Шаг 1: ОТКЛЮЧИТЬ RLS
ALTER TABLE IF EXISTS listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Шаг 2: РАЗРЕШИТЬ ДОСТУП
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Шаг 3: ПРОВЕРКА
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('listings', 'users');

-- Готово! ✅

