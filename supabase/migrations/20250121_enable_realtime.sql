-- ============================================
-- 360⁰ Marketplace - Enable Realtime
-- Production Ready — Kyrgyzstan 2025
-- ============================================

-- Включаем Realtime на всех нужных таблицах
-- Realtime автоматически уважает RLS политики!

ALTER PUBLICATION supabase_realtime ADD TABLE chat_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE listings;
ALTER PUBLICATION supabase_realtime ADD TABLE listing_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE listing_saves;

-- Примечание: RLS политики уже должны быть настроены
-- Realtime будет работать только для записей, к которым у пользователя есть доступ

