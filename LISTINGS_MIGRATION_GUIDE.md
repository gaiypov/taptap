# 🚀 GUIDE: Миграция на систему Listings (Авто + Лошади)

## 📋 Обзор

Эта миграция переводит платформу 360Auto с отдельной таблицы `cars` на универсальную таблицу `listings`, которая поддерживает несколько категорий объявлений (автомобили и лошади).

### Основные изменения:

1. **Новая таблица `listings`** - универсальная для всех категорий
2. **Автоматическое управление статусами** - expired через 90 дней, archived через 14 дней после продажи
3. **Поддержка категорий** - car (авто) и horse (лошади)
4. **AI анализ для лошадей** - распознавание породы, масти, оценка экстерьера
5. **Кнопка "Продано"** - с возможностью реактивации в течение 14 дней
6. **Автоматическая очистка** - через Supabase Edge Function и cron

---

## 🗂️ Структура файлов

### SQL схемы:
- `supabase-listings-schema.sql` - основная схема listings
- `supabase-cron-schedule.sql` - настройка автоматической очистки

### Backend API:
- `backend/api/listings.ts` - API endpoints для listings
- `backend/server.ts` - обновлен с новыми маршрутами

### Supabase Edge Functions:
- `supabase/functions/cleanup-listings/index.ts` - функция автоудаления

### TypeScript типы:
- `types/index.ts` - добавлены Listing, HorseDetails, ListingStatus, etc.

### React Native компоненты:
- `components/Listing/SoldButton.tsx` - кнопка управления проданным статусом
- `components/Feed/CategoryTabs.tsx` - табы переключения категорий
- `components/Feed/ListingVideoPlayer.tsx` - плеер для listings
- `app/index-with-categories.tsx` - обновленная главная с категориями

### AI сервисы:
- `services/aiHorse.ts` - AI анализ лошадей

---

## 📝 Пошаговая миграция

### Шаг 1: Применить SQL схему

```bash
# В Supabase Dashboard → SQL Editor
```

Выполните файл `supabase-listings-schema.sql`. Этот файл:
- ✅ Создает таблицу `listings`
- ✅ Настраивает индексы
- ✅ Создает триггеры для автоматического expires_at и delete_at
- ✅ Настраивает RLS политики
- ✅ Создает функцию миграции из `cars` в `listings`

### Шаг 2: Мигрировать данные из cars

```sql
-- Запустите миграцию существующих автомобилей
SELECT migrate_cars_to_listings();

-- Проверьте результат
SELECT 
  category,
  status,
  COUNT(*) as count
FROM listings
GROUP BY category, status;
```

### Шаг 3: Создать дополнительные таблицы

```sql
-- Таблица лайков для listings
CREATE TABLE IF NOT EXISTS listing_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_listing_likes_user_id ON listing_likes(user_id);
CREATE INDEX idx_listing_likes_listing_id ON listing_likes(listing_id);

-- Таблица сохраненных listings
CREATE TABLE IF NOT EXISTS listing_saves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_listing_saves_user_id ON listing_saves(user_id);
CREATE INDEX idx_listing_saves_listing_id ON listing_saves(listing_id);
```

### Шаг 4: Настроить Supabase Edge Function

```bash
# 1. Установить Supabase CLI (если еще нет)
npm install -g supabase

# 2. Залогиниться
supabase login

# 3. Деплой функции
cd supabase/functions
supabase functions deploy cleanup-listings

# 4. Установить секреты
supabase secrets set APIVIDEO_API_KEY=your_api_key_here
```

### Шаг 5: Настроить Cron

```bash
# В Supabase Dashboard → SQL Editor
```

Выполните файл `supabase-cron-schedule.sql`. Это настроит:
- ✅ Ежечасный запуск cleanup-listings
- ✅ Автоматическое удаление проданных объявлений через 14 дней
- ✅ Автоматическое истечение активных объявлений через 90 дней

### Шаг 6: Обновить Backend

```bash
cd backend
npm install

# Убедитесь, что в .env есть:
# NEXT_PUBLIC_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
# APIVIDEO_API_KEY=...

npm run dev
```

### Шаг 7: Обновить Frontend

```bash
# В корне проекта
npm install

# Обновите app/(tabs)/index.tsx
# Замените содержимое на app/index-with-categories.tsx
# или импортируйте компоненты оттуда

npm start
```

---

## 🎯 API Endpoints

### Mark as Sold
```http
POST /api/listings/:id/mark-sold
Authorization: Bearer <token>

Response:
{
  "success": true,
  "listing_id": "uuid",
  "sold_at": "2025-01-15T10:00:00Z",
  "delete_at": "2025-01-29T10:00:00Z",
  "days_until_deletion": 14
}
```

### Reactivate Listing
```http
POST /api/listings/:id/reactivate
Authorization: Bearer <token>

Response:
{
  "success": true,
  "listing_id": "uuid",
  "message": "Объявление снова активно"
}
```

### Archive Listing
```http
POST /api/listings/:id/archive
Authorization: Bearer <token>

Response:
{
  "success": true,
  "listing_id": "uuid"
}
```

### Get Listing
```http
GET /api/listings/:id

Response:
{
  "success": true,
  "listing": {
    "id": "uuid",
    "category": "car",
    "title": "Toyota Camry 2020",
    "price": 1500000,
    ...
  }
}
```

### Get Listings with Filters
```http
GET /api/listings?category=car&status=active&page=1&limit=20

Response:
{
  "success": true,
  "listings": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🐴 Добавление объявления о лошади

### Пример данных для лошади:

```typescript
const horseListingData = {
  category: 'horse',
  seller_id: userId,
  video_id: 'vi123...',
  video_url: 'https://vod.api.video/...',
  title: 'Ахалтекинская кобыла, 5 лет',
  description: 'Породистая кобыла с отличной родословной...',
  price: 500000,
  city: 'Москва',
  details: {
    breed: 'Ахалтекинская',
    age: 5,
    gender: 'mare',
    color: 'гнедая',
    height: 160,
    training: 'trained',
    purpose: 'riding',
    pedigree: true,
    health_certificate: true,
    temperament: 'спокойная',
    vaccinations: ['грипп', 'столбняк'],
    achievements: ['1 место - региональные соревнования 2024']
  }
};
```

### AI анализ лошади:

```typescript
import { analyzeHorseVideo } from '@/services/aiHorse';

const result = await analyzeHorseVideo(videoUri, (stage, progress) => {
  console.log(`${stage}: ${progress}%`);
});

if (result.is_horse) {
  console.log('Порода:', result.breed);
  console.log('Масть:', result.color);
  console.log('Оценка:', result.quality_score);
}
```

---

## ⏰ Временная шкала жизненного цикла объявления

### Сценарий 1: Продано продавцом

```
День 0: Создание объявления
└─> status = 'active'
└─> expires_at = created_at + 90 дней

День 5: Продавец нажал "Продано"
└─> status = 'sold'
└─> sold_at = NOW()
└─> delete_at = sold_at + 14 дней
└─> Водяной знак "ПРОДАНО" на видео

День 19: Автоматическое удаление
└─> status = 'archived'
└─> Видео удаляется из api.video
└─> Запись остается в БД для статистики
```

### Сценарий 2: Истечение срока

```
День 0: Создание объявления
└─> status = 'active'
└─> expires_at = created_at + 90 дней

День 90: Автоматическое истечение
└─> status = 'expired'
└─> Объявление скрывается из ленты
└─> Видео НЕ удаляется
```

### Сценарий 3: Реактивация после продажи

```
День 5: Продано
└─> status = 'sold'

День 10: Продавец передумал
└─> POST /api/listings/:id/reactivate
└─> status = 'active'
└─> sold_at = NULL
└─> delete_at = NULL
```

---

## 🔧 Настройка переменных окружения

### Backend (.env):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
APIVIDEO_API_KEY=your_api_video_key
JWT_SECRET=your_jwt_secret
```

### Supabase Edge Function Secrets:
```bash
supabase secrets set APIVIDEO_API_KEY=your_key
supabase secrets set SUPABASE_URL=https://xxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
```

### React Native (.env):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📊 Мониторинг и логи

### Проверка работы cron:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-listings-hourly')
ORDER BY start_time DESC 
LIMIT 10;
```

### Статистика по категориям:
```sql
SELECT 
  category,
  status,
  COUNT(*) as count,
  AVG(views) as avg_views,
  AVG(likes) as avg_likes
FROM listings
GROUP BY category, status
ORDER BY category, status;
```

### Объявления к удалению:
```sql
-- Проданные, готовые к архивации
SELECT id, title, sold_at, delete_at
FROM listings
WHERE status = 'sold' AND delete_at <= NOW();

-- Истекшие активные
SELECT id, title, created_at, expires_at
FROM listings
WHERE status = 'active' AND expires_at <= NOW();
```

---

## ✅ Чеклист после миграции

- [ ] Таблица `listings` создана и заполнена
- [ ] Все индексы созданы
- [ ] RLS политики работают
- [ ] Edge Function задеплоена
- [ ] Cron настроен и запускается
- [ ] Backend API работает
- [ ] Frontend отображает категории
- [ ] AI анализ для лошадей работает
- [ ] Кнопка "Продано" функциональна
- [ ] Автоудаление тестировано

---

## 🆘 Troubleshooting

### Проблема: Cron не запускается

```sql
-- Проверить, что pg_cron установлен
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Проверить задачи
SELECT * FROM cron.job;

-- Удалить и пересоздать
SELECT cron.unschedule('cleanup-listings-hourly');
-- Затем пересоздайте из supabase-cron-schedule.sql
```

### Проблема: Edge Function не работает

```bash
# Проверить логи
supabase functions logs cleanup-listings

# Переделоить
supabase functions deploy cleanup-listings --no-verify-jwt

# Проверить секреты
supabase secrets list
```

### Проблема: Миграция не работает

```sql
-- Проверить, что функция существует
SELECT proname FROM pg_proc WHERE proname = 'migrate_cars_to_listings';

-- Проверить, что таблица cars существует
SELECT COUNT(*) FROM cars;

-- Запустить миграцию вручную с обработкой ошибок
DO $$
BEGIN
  PERFORM migrate_cars_to_listings();
  RAISE NOTICE 'Migration completed';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Migration error: %', SQLERRM;
END $$;
```

---

## 📚 Дополнительные ресурсы

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [API.video API](https://docs.api.video/)

---

## 🎉 Готово!

После выполнения всех шагов ваша платформа будет поддерживать:
- ✅ Множественные категории (авто + лошади)
- ✅ Автоматическое управление жизненным циклом объявлений
- ✅ AI анализ для обеих категорий
- ✅ Продвинутую систему статусов
- ✅ Автоматическую очистку устаревших данных

