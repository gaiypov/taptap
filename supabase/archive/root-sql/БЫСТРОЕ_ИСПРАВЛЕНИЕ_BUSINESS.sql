-- БЫСТРОЕ ИСПРАВЛЕНИЕ: Разрешить чтение business_accounts

-- Удалить ограничивающую политику
DROP POLICY IF EXISTS "Users can view their own business account" ON business_accounts;

-- Создать публичную политику
CREATE POLICY "Anyone can view business accounts"
  ON business_accounts FOR SELECT
  USING (true);

-- Проверка
SELECT 'Политика применена! Теперь все могут видеть бизнес-аккаунты.' as status;
