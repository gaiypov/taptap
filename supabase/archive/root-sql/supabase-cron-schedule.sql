-- ============================================
-- НАСТРОЙКА CRON ДЛЯ АВТОМАТИЧЕСКОГО УДАЛЕНИЯ
-- ============================================
-- Применить в Supabase Dashboard → SQL Editor

-- Включаем расширение pg_cron (если еще не включено)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Удаляем старое расписание если существует
SELECT cron.unschedule('cleanup-listings-hourly');

-- Создаем новое расписание: каждый час
SELECT cron.schedule(
  'cleanup-listings-hourly',
  '0 * * * *', -- Каждый час в начале часа (00:00, 01:00, 02:00, ...)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.functions_url') || '/cleanup-listings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'timestamp', NOW()
      )
    ) AS request_id;
  $$
);

-- Проверяем, что задача создана
SELECT * FROM cron.job WHERE jobname = 'cleanup-listings-hourly';

-- ============================================
-- АЛЬТЕРНАТИВА: Запуск каждые 4 часа
-- ============================================

-- Раскомментируйте, если хотите запускать реже:
/*
SELECT cron.unschedule('cleanup-listings-hourly');

SELECT cron.schedule(
  'cleanup-listings-4hours',
  '0 */4 * * *', -- Каждые 4 часа
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.functions_url') || '/cleanup-listings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'timestamp', NOW()
      )
    ) AS request_id;
  $$
);
*/

-- ============================================
-- РУЧНОЙ ЗАПУСК ДЛЯ ТЕСТИРОВАНИЯ
-- ============================================

-- Раскомментируйте для ручного тестирования:
/*
SELECT
  net.http_post(
    url := current_setting('app.settings.functions_url') || '/cleanup-listings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'timestamp', NOW()
    )
  ) AS request_id;
*/

-- ============================================
-- ПРОСМОТР ЛОГОВ CRON
-- ============================================

-- Посмотреть последние запуски:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-listings-hourly')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- ============================================
-- НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
-- ============================================

-- Убедитесь, что в Supabase настроены следующие переменные:
-- 1. app.settings.functions_url = https://YOUR_PROJECT.supabase.co/functions/v1
-- 2. app.settings.service_role_key = your_service_role_key
-- 3. APIVIDEO_API_KEY в Edge Function Secrets

-- Проверить текущие настройки:
-- SHOW app.settings.functions_url;
-- SHOW app.settings.service_role_key;

COMMENT ON EXTENSION pg_cron IS 'Расширение для планирования задач в PostgreSQL';

SELECT '✅ Cron расписание настроено!' as status;

