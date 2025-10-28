-- СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ В AUTH.USERS
-- Выполните этот SQL в Supabase SQL Editor ПЕРЕД основным скриптом

-- ВАЖНО: Этот скрипт создает пользователей в auth.users
-- Выполните его ПЕРЕД основным скриптом

-- 1. Создаем пользователей в auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@example.com',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Тестовый Пользователь", "phone": "+996555123456"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'aibek@example.com',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Айбек Продавец", "phone": "+996555123457"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'nurlan@example.com',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Нурлан Автодилер", "phone": "+996555123458"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Проверяем что пользователи созданы
SELECT id, email, raw_user_meta_data->>'name' as name, raw_user_meta_data->>'phone' as phone
FROM auth.users 
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002'
);
