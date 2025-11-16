-- ============================================
-- ТЕСТОВЫЙ SQL СКРИПТ ДЛЯ ПРОВЕРКИ СХЕМЫ
-- ============================================
-- Выполните этот скрипт после применения основной схемы
-- чтобы убедиться, что всё работает

-- ============================================
-- 1. ПРОВЕРКА ПОЛЕЙ ТАБЛИЦЫ CARS
-- ============================================

SELECT 
  '1. Проверка полей таблицы cars' as test_name,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASSED'
    ELSE '❌ FAILED'
  END as status,
  COUNT(*) as fields_found
FROM information_schema.columns 
WHERE table_name = 'cars' 
  AND column_name IN ('video_id', 'thumbnail_url', 'views_before_boost');

-- ============================================
-- 2. ПРОВЕРКА ИНДЕКСОВ
-- ============================================

SELECT 
  '2. Проверка индексов' as test_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASSED'
    ELSE '❌ FAILED'
  END as status,
  COUNT(*) as indexes_found
FROM pg_indexes 
WHERE tablename = 'cars' 
  AND indexname LIKE 'idx_cars_%';

-- ============================================
-- 3. ПРОВЕРКА SQL ФУНКЦИЙ
-- ============================================

SELECT 
  '3. Проверка SQL функций' as test_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASSED'
    ELSE '❌ FAILED'
  END as status,
  COUNT(*) as functions_found
FROM information_schema.routines 
WHERE routine_name IN (
  'increment_views',
  'increment_likes',
  'decrement_likes',
  'get_trending_cars',
  'get_high_engagement_cars',
  'get_video_stats'
);

-- ============================================
-- 4. ПРОВЕРКА ТРИГГЕРОВ
-- ============================================

SELECT 
  '4. Проверка триггеров' as test_name,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASSED'
    ELSE '❌ FAILED'
  END as status,
  COUNT(*) as triggers_found
FROM information_schema.triggers 
WHERE trigger_name = 'car_stats_update_trigger';

-- ============================================
-- 5. ПРОВЕРКА RLS ПОЛИТИК
-- ============================================

SELECT 
  '5. Проверка RLS политик' as test_name,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASSED'
    ELSE '⚠️ WARNING (опционально)'
  END as status,
  COUNT(*) as policies_found
FROM pg_policies 
WHERE tablename = 'cars';

-- ============================================
-- 6. СПИСОК ВСЕХ ПОЛЕЙ ТАБЛИЦЫ CARS
-- ============================================

SELECT 
  '6. Поля таблицы cars:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cars'
ORDER BY ordinal_position;

-- ============================================
-- 7. СПИСОК ВСЕХ ИНДЕКСОВ
-- ============================================

SELECT 
  '7. Индексы таблицы cars:' as info,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'cars'
ORDER BY indexname;

-- ============================================
-- 8. СПИСОК ВСЕХ SQL ФУНКЦИЙ
-- ============================================

SELECT 
  '8. SQL функции:' as info,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%car%' OR 
    routine_name LIKE '%view%' OR 
    routine_name LIKE '%like%' OR
    routine_name LIKE '%trending%' OR
    routine_name LIKE '%engagement%'
  )
ORDER BY routine_name;

-- ============================================
-- 9. ТЕСТ ФУНКЦИИ increment_views
-- ============================================

-- Создаем тестовую запись (если нет)
DO $$
DECLARE
  test_car_id UUID;
BEGIN
  -- Проверяем есть ли хоть одна машина
  SELECT id INTO test_car_id FROM cars LIMIT 1;
  
  IF test_car_id IS NULL THEN
    -- Если нет машин, выводим сообщение
    RAISE NOTICE '⚠️ Нет автомобилей в БД для тестирования функций';
  ELSE
    -- Тестируем функцию
    PERFORM increment_views(test_car_id);
    RAISE NOTICE '✅ Функция increment_views работает! Car ID: %', test_car_id;
  END IF;
END $$;

-- ============================================
-- 10. ИТОГОВЫЙ СТАТУС
-- ============================================

SELECT 
  '🎉 ИТОГОВЫЙ СТАТУС' as summary,
  COUNT(DISTINCT table_name) as tables_ready,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'cars') as indexes_created,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%car%' OR routine_name LIKE '%view%') as functions_created
FROM information_schema.tables 
WHERE table_name = 'cars';

-- ============================================
-- ГОТОВО! 
-- ============================================

SELECT '✅ Проверка завершена! Смотрите результаты выше.' as result;

