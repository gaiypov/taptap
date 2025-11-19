-- Скрипт для создания тестовых видео напрямую в Supabase SQL Editor
-- Запустите этот скрипт в Supabase Dashboard > SQL Editor

-- 1. Убедитесь, что тестовый пользователь существует
INSERT INTO public.users (id, name, phone, avatar_url, is_verified, rating)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Тестовый Пользователь',
  '+996555123456',
  'https://i.pravatar.cc/150?img=1',
  true,
  4.8
)
ON CONFLICT (id) DO NOTHING;

-- 2. Создаем тестовые видео для автомобилей
INSERT INTO public.listings (id, category, title, description, price, seller_user_id, video_url, video_player_url, thumbnail_url, video_thumbnail_url, status, currency, location, city)
VALUES
  (
    gen_random_uuid(),
    'car',
    'Toyota Camry 2020 - Отличное состояние',
    'Toyota Camry 2020 года в отличном состоянии. Пробег 45,000 км. Один владелец. Все документы в порядке.',
    2500000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    'published',
    'KGS',
    'Бишкек',
    'Бишкек'
  ),
  (
    gen_random_uuid(),
    'car',
    'BMW X5 2019 - Премиум класс',
    'BMW X5 2019 года. Полная комплектация, кожаный салон, навигация. Пробег 60,000 км.',
    4500000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    'published',
    'KGS',
    'Бишкек',
    'Бишкек'
  ),
  (
    gen_random_uuid(),
    'car',
    'Honda Civic 2021 - Экономичный',
    'Honda Civic 2021 года. Низкий расход топлива, отличное состояние. Пробег 30,000 км.',
    1800000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    'published',
    'KGS',
    'Ош',
    'Ош'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Создаем детали для автомобилей
INSERT INTO public.car_details (listing_id, make, model, year, mileage_km)
SELECT id, 'Toyota', 'Camry', 2020, 45000 FROM public.listings WHERE title = 'Toyota Camry 2020 - Отличное состояние'
UNION ALL
SELECT id, 'BMW', 'X5', 2019, 60000 FROM public.listings WHERE title = 'BMW X5 2019 - Премиум класс'
UNION ALL
SELECT id, 'Honda', 'Civic', 2021, 30000 FROM public.listings WHERE title = 'Honda Civic 2021 - Экономичный'
ON CONFLICT (listing_id) DO NOTHING;

-- 4. Создаем тестовые видео для лошадей
INSERT INTO public.listings (id, category, title, description, price, seller_user_id, video_url, video_player_url, thumbnail_url, video_thumbnail_url, status, currency, location, city)
VALUES
  (
    gen_random_uuid(),
    'horse',
    'Арабский скакун - Чистокровный',
    'Чистокровный арабский скакун, 5 лет. Отличная родословная, участвовал в соревнованиях.',
    500000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    'published',
    'KGS',
    'Нарын',
    'Нарын'
  ),
  (
    gen_random_uuid(),
    'horse',
    'Ахалтекинская лошадь - Элитная',
    'Ахалтекинская лошадь, 4 года. Редкая порода, отличное здоровье, дрессирована.',
    750000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
    'published',
    'KGS',
    'Каракол',
    'Каракол'
  ),
  (
    gen_random_uuid(),
    'horse',
    'Орловский рысак - Спортивная',
    'Орловский рысак, 6 лет. Опыт в скачках, отличная форма, спокойный характер.',
    400000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    'published',
    'KGS',
    'Талас',
    'Талас'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Создаем детали для лошадей
INSERT INTO public.horse_details (listing_id, breed, age_years, gender, height_cm)
SELECT id, 'Arabian', 5, 'stallion', 160 FROM public.listings WHERE title = 'Арабский скакун - Чистокровный'
UNION ALL
SELECT id, 'Akhal-Teke', 4, 'mare', 155 FROM public.listings WHERE title = 'Ахалтекинская лошадь - Элитная'
UNION ALL
SELECT id, 'Orlov Trotter', 6, 'gelding', 165 FROM public.listings WHERE title = 'Орловский рысак - Спортивная'
ON CONFLICT (listing_id) DO NOTHING;

-- 6. Создаем тестовые видео для недвижимости
INSERT INTO public.listings (id, category, title, description, price, seller_user_id, video_url, video_player_url, thumbnail_url, video_thumbnail_url, status, currency, location, city)
VALUES
  (
    gen_random_uuid(),
    'real_estate',
    '3-комнатная квартира в центре Бишкека',
    'Просторная 3-комнатная квартира в центре города. Ремонт, мебель, бытовая техника. Отличное расположение.',
    8500000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
    'published',
    'KGS',
    'Бишкек',
    'Бишкек'
  ),
  (
    gen_random_uuid(),
    'real_estate',
    'Частный дом с участком - Загородный',
    'Частный дом 150 кв.м на участке 10 соток. Гараж, баня, сад. Тихий район, хорошая инфраструктура.',
    12000000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    'published',
    'KGS',
    'Бишкек',
    'Бишкек'
  ),
  (
    gen_random_uuid(),
    'real_estate',
    'Студия в новостройке - Современная',
    'Современная студия 35 кв.м в новостройке. Чистовая отделка, готова к заселению. Рядом метро, магазины.',
    3500000,
    '550e8400-e29b-41d4-a716-446655440000',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreet.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreet.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreet.jpg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreet.jpg',
    'published',
    'KGS',
    'Бишкек',
    'Бишкек'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Создаем детали для недвижимости
INSERT INTO public.real_estate_details (listing_id, property_type, area_sqm, rooms, floor, total_floors)
SELECT id, 'apartment', 85, 3, 5, 9 FROM public.listings WHERE title = '3-комнатная квартира в центре Бишкека'
UNION ALL
SELECT id, 'house', 150, 4, 1, 1 FROM public.listings WHERE title = 'Частный дом с участком - Загородный'
UNION ALL
SELECT id, 'apartment', 35, 1, 12, 15 FROM public.listings WHERE title = 'Студия в новостройке - Современная'
ON CONFLICT (listing_id) DO NOTHING;

-- Проверка результатов
SELECT
  category,
  COUNT(*) as count,
  COUNT(CASE WHEN video_url IS NOT NULL OR video_player_url IS NOT NULL THEN 1 END) as with_video
FROM public.listings
WHERE seller_user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND status = 'published'
GROUP BY category;

