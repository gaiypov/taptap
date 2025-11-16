-- ============================================
-- 360Auto Security & Moderation System
-- Обновления базы данных для системы защиты
-- ============================================

-- 1. Добавить новые поля в таблицу users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_dealer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  ADD COLUMN IF NOT EXISTS dealer_type VARCHAR(50), -- 'salon', 'reseller', 'individual'
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS company_license VARCHAR(100);

-- 2. Создать таблицу жалоб/репортов
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('car', 'user', 'message')),
  target_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  moderator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(reporter_id, target_type, target_id) -- Один пользователь может пожаловаться только раз
);

-- 3. Создать таблицу логов модерации контента
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('car', 'image', 'video')),
  target_id UUID NOT NULL,
  
  -- Результаты AI модерации
  is_approved BOOLEAN NOT NULL,
  needs_review BOOLEAN NOT NULL,
  reasons TEXT[],
  
  -- Оценки контента (0-100)
  safe_score INTEGER CHECK (safe_score >= 0 AND safe_score <= 100),
  adult_score INTEGER CHECK (adult_score >= 0 AND adult_score <= 100),
  violence_score INTEGER CHECK (violence_score >= 0 AND violence_score <= 100),
  racy_score INTEGER CHECK (racy_score >= 0 AND racy_score <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Создать таблицу rate limiting событий
CREATE TABLE IF NOT EXISTS public.rate_limit_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  action_type VARCHAR(50) NOT NULL, -- 'upload', 'message', 'like'
  limit_exceeded INTEGER NOT NULL, -- На сколько превышен лимит
  user_tier VARCHAR(20) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON public.moderation_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_user ON public.rate_limit_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_created_at ON public.rate_limit_violations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_is_dealer ON public.users(is_dealer);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON public.users(trust_score DESC);

-- 6. Row Level Security (RLS) политики

-- Reports: пользователи могут создавать жалобы
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Пользователи могут видеть свои жалобы
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Администраторы могут видеть все жалобы
-- TODO: Добавить проверку роли администратора
-- CREATE POLICY "Admins can view all reports" ON public.reports
--   FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Moderation logs: только для чтения (система создает)
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System only can insert moderation logs" ON public.moderation_logs
  FOR INSERT WITH CHECK (false); -- Только через service role

-- Rate limit violations: только для чтения
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System only can insert rate limit violations" ON public.rate_limit_violations
  FOR INSERT WITH CHECK (false); -- Только через service role

-- 7. Функция для автоматического скрытия контента при множественных жалобах
CREATE OR REPLACE FUNCTION auto_hide_reported_content()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Подсчитываем количество жалоб на этот контент
  SELECT COUNT(*) INTO report_count
  FROM public.reports
  WHERE target_type = NEW.target_type
    AND target_id = NEW.target_id
    AND status = 'pending';
  
  -- Если >= 3 жалоб - автоматически скрываем контент
  IF report_count >= 3 AND NEW.target_type = 'car' THEN
    UPDATE public.cars
    SET status = 'archived'
    WHERE id = NEW.target_id AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического скрытия
DROP TRIGGER IF EXISTS trigger_auto_hide_reported_content ON public.reports;
CREATE TRIGGER trigger_auto_hide_reported_content
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_hide_reported_content();

-- 8. Функция для обновления Trust Score
CREATE OR REPLACE FUNCTION update_trust_score(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  user_record RECORD;
  report_count INTEGER;
  account_age_days INTEGER;
BEGIN
  -- Получаем данные пользователя
  SELECT * INTO user_record
  FROM public.users
  WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Телефон верифицирован (+15)
  IF user_record.phone IS NOT NULL THEN
    score := score + 15;
  END IF;
  
  -- Есть аватар (+5)
  IF user_record.avatar_url IS NOT NULL THEN
    score := score + 5;
  END IF;
  
  -- Дилер и верифицирован (+10)
  IF user_record.is_dealer AND user_record.is_verified THEN
    score := score + 10;
  END IF;
  
  -- Возраст аккаунта (макс +20)
  account_age_days := EXTRACT(DAY FROM NOW() - user_record.created_at);
  score := score + LEAST(20, FLOOR(account_age_days / 15.0));
  
  -- Успешные продажи (макс +30)
  score := score + LEAST(30, COALESCE(user_record.total_sales, 0) * 3);
  
  -- Рейтинг (макс +20)
  IF user_record.rating >= 4.5 THEN
    score := score + 20;
  ELSIF user_record.rating >= 4.0 THEN
    score := score + 15;
  ELSIF user_record.rating >= 3.5 THEN
    score := score + 10;
  ELSIF user_record.rating >= 3.0 THEN
    score := score + 5;
  END IF;
  
  -- Жалобы (макс -50)
  SELECT COUNT(*) INTO report_count
  FROM public.reports
  WHERE reported_user_id = user_id_param AND status = 'action_taken';
  
  score := score - LEAST(50, report_count * 10);
  
  -- Ограничиваем 0-100
  score := GREATEST(0, LEAST(100, score));
  
  -- Обновляем в таблице
  UPDATE public.users
  SET trust_score = score
  WHERE id = user_id_param;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 9. Представление для статистики модерации
CREATE OR REPLACE VIEW moderation_statistics AS
SELECT 
  DATE(created_at) as date,
  target_type,
  COUNT(*) as total_checks,
  SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN needs_review THEN 1 ELSE 0 END) as review_count,
  SUM(CASE WHEN NOT is_approved AND NOT needs_review THEN 1 ELSE 0 END) as rejected_count,
  AVG(safe_score) as avg_safe_score
FROM public.moderation_logs
GROUP BY DATE(created_at), target_type
ORDER BY date DESC;

-- 10. Представление для статистики жалоб
CREATE OR REPLACE VIEW report_statistics AS
SELECT 
  DATE(created_at) as date,
  target_type,
  reason,
  COUNT(*) as report_count,
  SUM(CASE WHEN status = 'action_taken' THEN 1 ELSE 0 END) as action_count
FROM public.reports
GROUP BY DATE(created_at), target_type, reason
ORDER BY date DESC, report_count DESC;

-- 11. Комментарии для документации
COMMENT ON TABLE public.reports IS 'Жалобы пользователей на контент';
COMMENT ON TABLE public.moderation_logs IS 'Логи автоматической модерации через AI';
COMMENT ON TABLE public.rate_limit_violations IS 'Нарушения лимитов действий пользователей';
COMMENT ON COLUMN public.users.is_dealer IS 'Пользователь является дилером/автосалоном';
COMMENT ON COLUMN public.users.trust_score IS 'Оценка доверия 0-100';
COMMENT ON FUNCTION update_trust_score IS 'Пересчитать Trust Score для пользователя';

-- ============================================
-- Готово! Система защиты установлена
-- ============================================

