# 🧠 360AutoMVP - Memory Bank для AI Ассистента

> Comprehensive справочник по проекту для AI ассистента  
> Последнее обновление: 2025-10-14  
> Версия: 2.1 (с Listings System + Business Accounts)

---

## 🎯 СУТЬ ПРОЕКТА

**360AutoMVP** - мобильная платформа для продажи автомобилей и лошадей с:
- 📱 TikTok-стиль видео лентой
- 🤖 AI анализом (автомобили + лошади)
- 🎥 Интеграцией api.video
- 💬 Real-time чатами
- 📊 Автоматическим управлением жизненным циклом объявлений

**Главная фишка**: Продавец снимает 360° видео → AI анализирует → Объявление публикуется → Автоматически управляется (90 дней / 14 дней после продажи)

---

## 📊 ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Frontend (React Native)
```
React Native: 0.81.4
Expo: ~54.0.13
TypeScript: 5.9.2
React: 19.1.0
Expo Router: 6.0.11 (file-based routing)
```

**Ключевые библиотеки:**
- `@supabase/supabase-js` - Backend
- `expo-av` - Video playback
- `expo-camera` - Video recording
- `@api.video/nodejs-client` - Video hosting
- `expo-image-picker` - Галерея
- `expo-linear-gradient` - UI эффекты

### Backend (Node.js + Express)
```
Node.js: 18+
Express: 4.18.2
TypeScript: 5.3.3
JWT: jsonwebtoken 9.0.2
```

**Middleware:**
- `helmet` - Security
- `cors` - Cross-origin
- `compression` - Response compression
- `express-rate-limit` - Rate limiting

### Database & Storage
```
Supabase (PostgreSQL): 2.75.0
Supabase Storage: Videos, Images, Avatars
Real-time: Supabase Realtime
```

### AI & Services
```
Claude (Anthropic) - AI анализ автомобилей/лошадей
OpenAI GPT-4 Vision - Альтернативный анализ
Google Vision API - Детекция объектов
api.video - Video hosting & streaming
SMS Pro API - SMS авторизация
```

### DevOps
```
Supabase Edge Functions (Deno)
pg_cron - Scheduled tasks
Git - Version control
```

---

## 🗂️ СТРУКТУРА ПРОЕКТА

### Корневая структура
```
360AutoMVP/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Feed (главная лента)
│   │   ├── upload.tsx       # Загрузка видео
│   │   ├── search.tsx       # Поиск
│   │   ├── messages.tsx     # Чаты
│   │   └── profile.tsx      # Профиль
│   ├── car/[id].tsx         # Детали автомобиля
│   ├── seller/[id].tsx      # Профиль продавца
│   └── index-with-categories.tsx  # Новая лента с категориями
├── components/              # React Native компоненты
│   ├── Cars/               # Компоненты авто
│   ├── Feed/               # Компоненты ленты
│   │   ├── CategoryTabs.tsx       # Табы категорий
│   │   └── ListingVideoPlayer.tsx # Плеер для listings
│   ├── Listing/            # Компоненты листингов
│   │   └── SoldButton.tsx         # Кнопка "Продано"
│   └── VideoFeed/          # Видео лента
├── services/               # Бизнес логика
│   ├── ai.ts              # AI анализ автомобилей
│   ├── aiHorse.ts         # AI анализ лошадей (НОВОЕ)
│   ├── supabase.ts        # Supabase API
│   ├── auth.ts            # Авторизация
│   └── video.ts           # Video обработка
├── backend/               # Backend API
│   ├── api/
│   │   ├── analyze.ts    # AI endpoints
│   │   ├── auth.ts       # Auth endpoints
│   │   ├── listings.ts   # Listings CRUD (НОВОЕ)
│   │   └── consents.ts   # GDPR
│   ├── middleware/       # Express middleware
│   └── server.ts         # Main server
├── supabase/             # Supabase functions
│   └── functions/
│       └── cleanup-listings/  # Auto cleanup (НОВОЕ)
├── types/                # TypeScript types
│   └── index.ts         # Все типы (включая Listing, HorseDetails)
└── scripts/             # Utility scripts
    └── migrate-to-listings.ts  # Migration script
```

### Важные конфиг файлы
```
app.json                 # Expo configuration + API keys
package.json            # Dependencies
tsconfig.json           # TypeScript config
.env                    # Environment variables (не в git)
eas.json                # EAS Build configuration
```

---

## 🗄️ АРХИТЕКТУРА БАЗЫ ДАННЫХ

### ТАБЛИЦЫ (Supabase PostgreSQL)

#### 1. **users** (Пользователи)
```sql
id: UUID (PK)
phone: TEXT (UNIQUE) - Номер телефона
name: TEXT - Имя
avatar_url: TEXT - URL аватара
is_verified: BOOLEAN - Верифицирован
is_blocked: BOOLEAN - Заблокирован
rating: DECIMAL(3,2) - Рейтинг 0-5
total_sales: INTEGER - Всего продаж
total_purchases: INTEGER - Всего покупок
created_at, updated_at, last_login_at
```

#### 2. **listings** (Универсальные объявления) ⭐ НОВОЕ
```sql
id: UUID (PK)
category: TEXT ('car' | 'horse') - Категория
seller_id: UUID (FK → users)
video_id: TEXT - api.video ID
video_url: TEXT - Streaming URL
thumbnail_url: TEXT
title: TEXT
description: TEXT
price: DECIMAL(12,2)
city: TEXT
location: TEXT
status: TEXT ('active' | 'sold' | 'archived' | 'expired')
created_at, updated_at
sold_at: TIMESTAMP - Дата продажи
expires_at: TIMESTAMP - created_at + 90 дней (auto)
delete_at: TIMESTAMP - sold_at + 14 дней (auto)
likes, views, shares, saves, messages_count: INTEGER
ai_score: DECIMAL(3,2) - 0.00-1.00
ai_condition: TEXT ('excellent' | 'good' | 'fair' | 'poor')
ai_tags: JSONB
ai_analysis_text: TEXT
ai_estimated_price: JSONB - {min: number, max: number}
details: JSONB - Специфичные данные категории
is_promoted, boost_type, boost_expires_at, boost_activated_at
views_before_boost: INTEGER
```

**details для car:**
```json
{
  "brand": "Toyota",
  "model": "Camry",
  "year": 2020,
  "mileage": 45000,
  "transmission": "automatic",
  "fuel_type": "petrol",
  "color": "white",
  "body_type": "sedan",
  "condition": "excellent",
  "additional_images": ["url1", "url2"],
  "ai_damages": [...],
  "ai_features": [...]
}
```

**details для horse:**
```json
{
  "breed": "Ахалтекинская",
  "age": 5,
  "gender": "mare",
  "color": "гнедая",
  "height": 160,
  "training": "trained",
  "purpose": "riding",
  "pedigree": true,
  "health_certificate": true,
  "temperament": "спокойная",
  "vaccinations": ["грипп", "столбняк"],
  "achievements": ["1 место - соревнования 2024"]
}
```

#### 3. **business_accounts** (Бизнес-аккаунты) ⭐ НОВОЕ
```sql
id: UUID (PK)
user_id: UUID (FK → users) UNIQUE
tier: TEXT ('free' | 'lite' | 'business' | 'pro') - Тариф
company_name, company_logo_url, company_description: TEXT
company_phone, company_email, company_website: TEXT
company_address, business_type: TEXT
working_hours: JSONB
is_verified: BOOLEAN - Верификация PRO
verification_documents: TEXT[]
verification_status: TEXT ('pending' | 'approved' | 'rejected')
subscription_started_at, subscription_ends_at: TIMESTAMP
trial_ends_at: TIMESTAMP
is_trial, auto_renew: BOOLEAN
active_listings_count, max_listings: INTEGER
team_members_count, max_team_members: INTEGER
created_at, updated_at: TIMESTAMP
```

**Тарифы:**
- **FREE:** 2-2-1 (авто/лошади/недвижка), 0 сом
- **ЛАЙТ:** 10 объявлений, 300 сом/мес, Boost -20%
- **БИЗНЕС:** 30 объявлений, 500 сом/мес, Приоритет +20%, Boost -30%
- **ПРОФИ:** Безлимит, 1500 сом/мес, Приоритет +50%, Boost -50%, Баннеры

#### 4. **team_members** (Команда бизнеса) ⭐ НОВОЕ
```sql
id: UUID (PK)
business_id: UUID (FK → business_accounts)
user_id: UUID (FK → users)
role: TEXT ('owner' | 'admin' | 'manager')
invited_at, accepted_at: TIMESTAMP
UNIQUE(business_id, user_id)
```

#### 5. **cars** (Старая таблица, постепенно мигрируется)
```sql
Аналогична listings но только для автомобилей
Используется до полной миграции на listings
```

#### 4. **likes, saves** (Взаимодействия)
```sql
user_id: UUID (FK)
listing_id/car_id: UUID (FK)
created_at: TIMESTAMP
UNIQUE(user_id, listing_id)
```

#### 5. **conversations** (Чаты)
```sql
id: UUID (PK)
car_id: UUID (FK)
buyer_id: UUID (FK)
seller_id: UUID (FK)
last_message: TEXT
last_message_at: TIMESTAMP
is_active: BOOLEAN
```

#### 6. **messages** (Сообщения)
```sql
id: UUID (PK)
conversation_id: UUID (FK)
sender_id: UUID (FK)
message: TEXT
message_type: TEXT ('text' | 'image' | 'offer')
offer_amount: DECIMAL
is_read: BOOLEAN
created_at: TIMESTAMP
```

### ФУНКЦИИ (SQL)

#### Для listings:
```sql
increment_listing_views(UUID) - +1 view
increment_listing_likes(UUID) - +1 like
decrement_listing_likes(UUID) - -1 like
get_trending_listings(category, period, limit) - Топ листинги
migrate_cars_to_listings_safe() - Миграция с обработкой ошибок
auto_archive_sold_listings() - Авто-архивация (cron)
```

#### Для cars (старое):
```sql
increment_views(UUID)
increment_likes(UUID)
decrement_likes(UUID)
```

### ТРИГГЕРЫ

```sql
set_listing_expires - Устанавливает expires_at при INSERT
set_listing_delete - Устанавливает delete_at при UPDATE status='sold'
update_listing_timestamp - Обновляет updated_at при любом UPDATE
```

### RLS ПОЛИТИКИ

```sql
"Anyone can view active listings" - Все видят active
"Sellers can view own listings" - Владелец видит свои в любом статусе
"Authenticated users can create" - Создавать могут только auth
"Sellers can update/delete own" - Владелец может изменять/удалять
```

### ИНДЕКСЫ (оптимизация)

```sql
idx_listings_category - По категории
idx_listings_status - По статусу
idx_listings_created_at - По дате (DESC)
idx_listings_delete_at - Partial index для cron
idx_listings_expires_at - Partial index для cron
idx_listings_details - GIN index для JSONB поиска
```

---

## 🔄 ЖИЗНЕННЫЙ ЦИКЛ ОБЪЯВЛЕНИЯ

### Основной flow:
```
СОЗДАНИЕ
  ↓
ACTIVE (до 90 дней)
  ├─→ SOLD (продавец нажал "Продано")
  │    ↓ (14 дней)
  │    ARCHIVED + видео удалено
  │    ↓
  │   (можно реактивировать в течение 14 дней)
  │    ↓
  │   ACTIVE
  │
  └─→ EXPIRED (90 дней без продажи)
       ↓
      (можно реактивировать вручную)
```

### Автоматика:

**При создании:**
```sql
expires_at = created_at + 90 дней (триггер)
status = 'active'
```

**При продаже (POST /api/listings/:id/mark-sold):**
```sql
status = 'sold'
sold_at = NOW()
delete_at = NOW() + 14 дней (триггер)
+ Водяной знак на видео (api.video metadata)
```

**Через 14 дней (cron каждый час):**
```sql
status = 'archived'
+ Видео удаляется из api.video
```

**Через 90 дней (cron каждый час):**
```sql
IF status = 'active' AND expires_at <= NOW()
  THEN status = 'expired'
```

**Реактивация (POST /api/listings/:id/reactivate):**
```sql
IF status = 'sold' AND delete_at > NOW()
  THEN status = 'active', sold_at = NULL, delete_at = NULL
```

---

## 🤖 AI ИНТЕГРАЦИЯ

### Для автомобилей (services/ai.ts)

**Провайдеры (priority order):**
1. **Claude (Anthropic)** - Основной, лучшая точность
2. **OpenAI GPT-4 Vision** - Fallback
3. **Google Vision API** - Детекция объектов
4. **YOLO** - Детекция повреждений (опционально)
5. **Mock** - Для тестирования без API ключей

**Процесс анализа:**
```typescript
1. extractFramesFromVideo(videoUri, maxFrames) 
   → VideoFrame[] (base64)

2. analyzeWithClaude(frames, options)
   → Промпт: Распознать марку, модель, год, повреждения, оценка

3. Result: {
     brand, model, year,
     aiAnalysis: {
       condition: 'excellent' | 'good' | 'fair' | 'poor',
       conditionScore: 0-100,
       damages: Damage[],
       estimatedPrice: {min, max},
       features: string[]
     }
   }

4. Кеширование результата (TEST_CONFIG.ENABLE_CACHING)
```

**Конфигурация (services/ai/config.ts):**
```typescript
AI_CONFIG = {
  MAX_IMAGES_PER_ANALYSIS: 5,
  USE_MOCK: false,
  AVAILABLE_PROVIDERS: ['claude', 'openai', 'google']
}

TEST_CONFIG = {
  DAILY_LIMIT: 50,
  USE_SINGLE_IMAGE: true,
  ENABLE_CLAUDE: true,
  ENABLE_OPENAI: true,
  ENABLE_GOOGLE: true,
  ENABLE_YOLO: false,
  ENABLE_CACHING: true
}
```

### Для лошадей (services/aiHorse.ts) ⭐ НОВОЕ

**Специфика:**
- Распознавание 15+ пород
- Определение 7+ мастей
- Оценка экстерьера
- Body Condition Score (BCS 1-9)
- Темперамент

**Процесс:**
```typescript
1. analyzeHorseVideo(videoUri, onProgress)
2. validateHorseVideoQuality() - Проверка качества
3. analyzeHorseWithClaude/OpenAI/Google
4. Result: HorseAIAnalysis {
     is_horse: boolean,
     confidence: number,
     breed: "Ахалтекинская" | "Неизвестная",
     color: "гнедая" | "вороная" | ...,
     estimated_age: "young" | "adult" | "old",
     estimated_height: 150-170,
     visible_defects: string[],
     quality_score: 0-1,
     tags: string[],
     temperament: string
   }
```

**Промпт для лошадей (excerpt):**
```
Проанализируй видео лошади:
- Породы: Ахалтекинская, Арабская, Орловская, Фризская...
- Масти: Гнедая, Вороная, Серая, Рыжая, Пегая...
- Оценка экстерьера и упитанности (BCS 1-9)
- Видимые дефекты: хромота, шрамы...
```

---

## 📡 API ENDPOINTS

### Backend (Express на порту 3001)

#### Auth
```
POST /api/auth/login - SMS login
POST /api/auth/verify - Verify code
POST /api/auth/logout
GET  /api/auth/me
```

#### AI Analysis
```
POST /api/analyze-car - Анализ автомобиля (frames[])
POST /api/quick-identify - Быстрая идентификация
POST /api/validate-quality - Проверка качества видео
GET  /api/analysis-status/:id - Статус анализа
```

#### Listings ⭐ НОВОЕ
```
GET    /api/listings?category=car&status=active&page=1&limit=20
GET    /api/listings/:id
POST   /api/listings/:id/mark-sold - Отметить как проданное
POST   /api/listings/:id/reactivate - Вернуть в активные
POST   /api/listings/:id/archive - Архивировать вручную
```

#### Consents (GDPR)
```
POST /api/consents/record - Запись согласия
GET  /api/consents/:userId - Получить согласия
```

### Supabase Edge Functions (Deno)

```
POST /functions/v1/cleanup-listings
  → Автоматическая очистка (вызывается cron)
  Response: {
    success: boolean,
    soldArchived: number,
    expired: number,
    videosDeleted: number,
    errors: string[]
  }
```

---

## 🎨 UI/UX КОМПОНЕНТЫ

### Ключевые компоненты:

#### CategoryTabs.tsx ⭐ НОВОЕ
```typescript
<CategoryTabs
  selectedCategory={'car' | 'horse'}
  onCategoryChange={(cat) => setCategory(cat)}
/>
```

#### ListingVideoPlayer.tsx ⭐ НОВОЕ
```typescript
<ListingVideoPlayer
  listing={listing}  // Listing type
  isActive={boolean}
  onLike={(id) => ...}
  onSave={(id) => ...}
  onShare={(id) => ...}
/>

// Автоматически определяет car/horse и показывает правильную инфу
// Overlay "ПРОДАНО" для sold объявлений
```

#### SoldButton.tsx ⭐ НОВОЕ
```typescript
<SoldButton
  listingId={string}
  status={ListingStatus}
  deleteAt={string | undefined}
  onStatusChange={() => refetch()}
/>

// Показывает разные UI для разных статусов:
// - active: кнопка "Отметить как проданное"
// - sold: предупреждение + кнопка "Вернуть в активные"
// - archived/expired: информационный бейдж
```

#### VideoPlayer.tsx
```typescript
// Старый компонент для cars
// Постепенно заменяется на ListingVideoPlayer
```

---

## 🔐 БЕЗОПАСНОСТЬ

### Аутентификация
```typescript
// JWT токены
// SMS коды (TTL 5 минут)
// Session persistence (AsyncStorage)
```

### RLS (Row Level Security)
```sql
// Все таблицы защищены RLS
// Пользователи видят только свои данные или публичные
```

### API Rate Limiting
```typescript
// Express middleware
// 100 requests / 15 минут с одного IP
```

### Env Variables (НЕ В GIT!)
```bash
SUPABASE_SERVICE_ROLE_KEY=secret
APIVIDEO_API_KEY=secret
GOOGLE_VISION_API_KEY=secret
CLAUDE_API_KEY=secret
OPENAI_API_KEY=secret
JWT_SECRET=secret
```

---

## ⚙️ КОНФИГУРАЦИЯ

### app.json (Expo)
```json
{
  "extra": {
    "EXPO_PUBLIC_SUPABASE_URL": "https://thqlfkngyipdscckbhor.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ...",
    "EXPO_PUBLIC_API_VIDEO_KEY": "OhnRGcRvd7YS7H7TV6uwXRNgLvocjuAfGfR2qAebSKv",
    "GOOGLE_VISION_API_KEY": "AIzaSyCDq7xTy4yrPvBr5JjGNUEXaXZ70fVyJGg",
    "EXPO_PUBLIC_AI_MODE": "development",
    "EXPO_PUBLIC_USE_MOCK": "false"
  }
}
```

### Backend .env
```bash
NEXT_PUBLIC_SUPABASE_URL=https://thqlfkngyipdscckbhor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<secret>
APIVIDEO_API_KEY=<secret>
JWT_SECRET=<secret>
PORT=3001
NODE_ENV=development
```

---

## 🚀 DEPLOYMENT

### Frontend (Expo)
```bash
# Development
npx expo start

# Build
eas build --platform ios
eas build --platform android

# Submit
eas submit --platform ios
eas submit --platform android
```

### Backend (Node.js)
```bash
# Local
npm run dev

# Production
npm run build
npm start
```

### Supabase Edge Functions
```bash
supabase functions deploy cleanup-listings
supabase secrets set APIVIDEO_API_KEY=xxx
```

### Cron (pg_cron)
```sql
SELECT cron.schedule(
  'cleanup-listings-hourly',
  '0 * * * *',
  $$ ... $$
);
```

---

## 📚 ВАЖНЫЕ ДОКУМЕНТЫ

### Для разработчиков:
- `QUICK_START.md` - Быстрый старт
- `GUIDE_FOR_BEGINNERS.md` - Для новичков
- `PROJECT_STATUS.md` - Текущий статус
- `LISTINGS_SYSTEM_COMPLETE.md` - Полное описание listings ⭐
- `LISTINGS_MIGRATION_GUIDE.md` - Гайд по миграции ⭐
- `QUICK_START_LISTINGS.md` - Быстрый старт listings ⭐

### API & Интеграции:
- `AI_SERVICE_COMPLETE_GUIDE.md` - AI сервисы
- `APIVIDEO_INTEGRATION_GUIDE.md` - api.video
- `SUPABASE_KEYS_GUIDE.md` - Supabase setup
- `SMS_SETUP.md` - SMS авторизация

### Deployment:
- `DATABASE_DEPLOYMENT_GUIDE.md` - База данных
- `BACKEND_DEPLOYMENT_GUIDE.md` - Backend
- `EAS_CONFIGURATION_GUIDE.md` - Expo builds

### SQL Схемы:
- `supabase-complete-schema.sql` - Полная схема
- `supabase-listings-schema.sql` - Новая listings схема ⭐
- `supabase-cron-schedule.sql` - Cron настройка ⭐
- `supabase-complete-schema-apivideo.sql` - С api.video

---

## 🎯 КЛЮЧЕВЫЕ РЕШЕНИЯ ПРОЕКТА

### 1. Почему Listings вместо Cars?
```
✅ Масштабируемость - легко добавить новые категории
✅ Единый API - один endpoint для всех категорий
✅ Гибкость - JSONB details для любых данных
✅ Меньше дублирования кода
```

### 2. Почему api.video вместо Supabase Storage?
```
✅ HLS streaming - адаптивное качество
✅ CDN по всему миру - быстрая загрузка
✅ Автоматические thumbnails
✅ Player SDK из коробки
```

### 3. Почему Expo Router?
```
✅ File-based routing - проще навигация
✅ Deep linking из коробки
✅ Type-safe routes
✅ Shared layouts
```

### 4. Почему pg_cron вместо отдельного сервера?
```
✅ Нет дополнительной инфраструктуры
✅ Прямой доступ к БД
✅ Надежность - встроено в PostgreSQL
✅ Бесплатно
```

### 5. Почему триггеры для expires_at/delete_at?
```
✅ Автоматика на уровне БД
✅ Невозможно забыть установить
✅ Консистентность данных
✅ Не зависит от backend/frontend
```

---

## 🐛 ИЗВЕСТНЫЕ ISSUES & WORKAROUNDS

### Issue 1: React Native Reanimated warnings
```typescript
// Workaround: Игнорировать в development
LogBox.ignoreLogs(['Reanimated 2']);
```

### Issue 2: Metro bundler port conflict
```bash
# Workaround: Kill process
lsof -ti:8081 | xargs kill -9
npx expo start --clear
```

### Issue 3: Supabase Edge Function cold start
```typescript
// Workaround: Warming запросы
// Или использовать SQL функции для простых операций
```

### Issue 4: AI rate limits
```typescript
// Workaround: Кеширование + fallback провайдеры
TEST_CONFIG.ENABLE_CACHING = true
```

---

## 🔮 БУДУЩИЕ ФИЧИ (TODO)

### Высокий приоритет:
- [ ] Push notifications (за 3 дня до удаления)
- [ ] Email уведомления о статусах
- [ ] История изменений статуса
- [ ] Bulk operations (массовая архивация)
- [ ] Админ панель

### Средний приоритет:
- [ ] Новые категории (недвижимость, техника)
- [ ] Рекомендательная система
- [ ] Шаблоны объявлений
- [ ] Экспорт данных
- [ ] Аналитика по категориям

### Низкий приоритет:
- [ ] Scheduled публикации
- [ ] A/B testing
- [ ] Интеграция с платежами
- [ ] Продление срока за деньги

---

## 📞 КОНТАКТЫ & РЕСУРСЫ

### Суппорт сервисов:
- Supabase: https://supabase.com/dashboard
- api.video: https://dashboard.api.video
- Expo: https://expo.dev
- Anthropic: https://console.anthropic.com

### Документация:
- React Native: https://reactnative.dev/
- Expo Router: https://docs.expo.dev/router/introduction/
- Supabase: https://supabase.com/docs
- api.video: https://docs.api.video/

---

## 🎓 ОБУЧЕНИЕ НОВЫХ РАЗРАБОТЧИКОВ

### Шаг 1: Прочитать
1. `README.md` - Общий overview
2. `QUICK_START.md` - Как запустить
3. Этот `PROJECT_MEMORY_BANK.md` - Понять архитектуру

### Шаг 2: Запустить локально
```bash
npm install
npx expo start
# Откройте в Expo Go
```

### Шаг 3: Изучить код
1. `app/(tabs)/index.tsx` - Главная лента
2. `services/supabase.ts` - API
3. `types/index.ts` - Типы данных
4. `components/` - UI компоненты

### Шаг 4: Сделать тестовую задачу
- Добавить новое поле в listings
- Создать новый фильтр в поиске
- Добавить новый статус

---

## 🏢 СИСТЕМА БИЗНЕС-АККАУНТОВ

### Концепция
Система монетизации через тарифы для профессиональных продавцов.

### Тарифы

| Тариф | Цена | Объявления | Команда | Приоритет | Boost скидка |
|-------|------|------------|---------|-----------|--------------|
| FREE | 0 | 2-2-1* | 1 | - | - |
| ЛАЙТ | 300₽ | 10 | 1 | - | 20% |
| БИЗНЕС | 500₽ | 30 | 3 | +20% | 30% |
| ПРОФИ | 1500₽ | ∞ | ∞ | +50% | 50% |

*2 транспорта / 2 лошади / 1 недвижимость

### Файлы
**SQL:**
- `supabase-business-accounts.sql` - миграция

**Типы:**
- `types/business.ts` - BusinessAccount, TierFeatures, TIER_CONFIGS

**Логика:**
- `lib/business/check-limits.ts` - проверка лимитов
- `lib/business/tier-features.ts` - функции тарифов
- `lib/algorithm/priority-boost.ts` - приоритет в ленте

**UI:**
- `components/Business/UpgradeModal.tsx` - модалка upgrade
- `components/Business/TierSelector.tsx` - выбор тарифа
- `components/Business/BusinessBadge.tsx` - значок в профиле
- `app/(business)/upgrade.tsx` - экран выбора тарифа

### Функции

#### Проверка лимитов
```typescript
import { checkCreateListingLimit } from '@/lib/business/check-limits';

const limitCheck = await checkCreateListingLimit(userId, 'car');
if (!limitCheck.canCreate) {
  // Показать UpgradeModal
  setUpgradeReason(limitCheck.reason);
  setShowUpgrade(true);
}
```

#### Приоритет в ленте
```typescript
import { applyBusinessPriority, loadBusinessAccounts } from '@/lib/algorithm/priority-boost';

// Загрузить бизнес-аккаунты
const businessMap = await loadBusinessAccounts(supabase, userIds);

// Применить приоритет
const withPriority = applyBusinessPriority(listings, businessMap);

// FREE: score * 1.0
// БИЗНЕС: score * 1.2 (+20%)
// ПРОФИ: score * 1.5 (+50%)
```

#### PRO Баннеры
```typescript
import { insertProBanners } from '@/lib/algorithm/priority-boost';

// Вставить баннеры каждое 10-е видео
const finalFeed = insertProBanners(sorted, proBanners);
```

### Триггеры upgrade
Автоматически показывать UpgradeModal:

**FREE → ЛАЙТ:**
- 3+ транспорта
- 3+ лошади
- 2+ недвижимости

**ЛАЙТ → БИЗНЕС:**
- 10+ объявлений

**БИЗНЕС → ПРОФИ:**
- 30+ объявлений

```typescript
import { shouldShowUpgradePrompt } from '@/lib/business/tier-features';

if (shouldShowUpgradePrompt(tier, activeCount)) {
  // Показать modal
}
```

### SQL функции
- `can_create_listing(user_id, category)` - проверка возможности создания
- `update_business_listings_count()` - автосчетчик объявлений
- `update_team_members_count()` - автосчетчик команды

### Views
- `business_stats` - агрегированная аналитика

### Документация
- `BUSINESS_ACCOUNTS_GUIDE.md` - полное руководство
- `BUSINESS_ACCOUNTS_SUMMARY.md` - краткое резюме
- `IMPLEMENTATION_COMPLETE_BUSINESS.md` - статус реализации

---

## 💡 ЛУЧШИЕ ПРАКТИКИ ПРОЕКТА

### Code Style
```typescript
// 1. Всегда типизировать
const fetchListings = async (): Promise<Listing[]> => { ... }

// 2. Использовать type guards
if (isCarListing(listing)) {
  // TypeScript знает что listing.details это CarDetails
}

// 3. Обработка ошибок
try {
  await supabase.from('listings').insert(data);
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Ошибка', 'Не удалось создать объявление');
}

// 4. Оптимистичные обновления UI
setListings(prev => prev.map(l => 
  l.id === id ? { ...l, likes: l.likes + 1 } : l
));
await api.like(id); // Отправляем в БД
```

### Database
```sql
-- 1. Всегда используйте индексы для WHERE/ORDER BY
CREATE INDEX idx_name ON table(column);

-- 2. Используйте partial indexes
CREATE INDEX idx_name ON table(column) WHERE condition;

-- 3. RLS для всех таблиц
ALTER TABLE table ENABLE ROW LEVEL SECURITY;

-- 4. Транзакции для связанных операций
BEGIN;
  UPDATE listings SET status = 'sold' WHERE id = $1;
  INSERT INTO notifications VALUES (...);
COMMIT;
```

### React Native
```typescript
// 1. useCallback для функций в зависимостях
const handleLike = useCallback((id: string) => { ... }, []);

// 2. useMemo для тяжелых вычислений
const filtered = useMemo(() => 
  listings.filter(l => l.status === 'active'), 
  [listings]
);

// 3. FlatList для длинных списков
<FlatList
  data={listings}
  keyExtractor={item => item.id}
  renderItem={renderItem}
  onEndReached={loadMore}
  windowSize={5}
/>

// 4. Оптимизация изображений
<Image 
  source={{ uri }}
  resizeMode="cover"
  cachePolicy="memory-disk"
/>
```

---

## 🔄 CHANGELOG

### Version 2.0 (2025-10-13) - Listings System
```
✨ NEW:
- Универсальная таблица listings (car + horse)
- AI анализ лошадей (services/aiHorse.ts)
- Автоматическое управление жизненным циклом
- SoldButton компонент с реактивацией
- CategoryTabs для переключения категорий
- API endpoints для mark-sold/reactivate
- Supabase Edge Function cleanup-listings
- pg_cron автоудаление
- Миграционный скрипт migrate-to-listings.ts

🔄 CHANGED:
- Статус 'deleted' → 'archived'
- Статус 'moderation'/'rejected' → 'archived'
- ai_score теперь DECIMAL(3,2) вместо INTEGER

📚 DOCS:
- LISTINGS_SYSTEM_COMPLETE.md
- LISTINGS_MIGRATION_GUIDE.md
- QUICK_START_LISTINGS.md
- PROJECT_MEMORY_BANK.md (этот файл)
```

### Version 1.0 (2024-12) - Initial Release
```
✨ Initial features:
- TikTok-style video feed
- AI car analysis
- Real-time chat
- Search & filters
- User profiles
```

---

## ✅ ЧЕКЛИСТ ДЛЯ AI АССИСТЕНТА

При работе с проектом всегда проверяй:

- [ ] Используется ли новая таблица `listings` или старая `cars`?
- [ ] Какие статусы используются: новые (active/sold/archived/expired) или старые?
- [ ] Нужна ли поддержка категорий (car/horse)?
- [ ] Используется ли TypeScript типы из `types/index.ts`?
- [ ] Есть ли RLS политики для новых таблиц?
- [ ] Настроены ли триггеры для автоматики?
- [ ] Есть ли индексы для производительности?
- [ ] Обрабатываются ли ошибки?
- [ ] Используется ли correct API endpoint (старый vs новый)?
- [ ] Документация актуальна?

---

## 🔐 ЛОГИКА АВТОРИЗАЦИИ И USER FLOW

### Passwordless SMS Авторизация
- **Только SMS OTP** (без паролей)
- Через Supabase Auth
- Авто-вход после первой авторизации
- Юридические документы отображаются ПЕРЕД отправкой кода
- SMS через SMS Pro API (Bat.Bat)

### Действия БЕЗ авторизации:
❌ **Гостевой режим НЕ поддерживает:**
- Лайки
- Комментарии  
- Сообщения продавцам
- Сохранение в избранное
- Создание объявлений

✅ **Гостевой режим поддерживает:**
- Просмотр ленты
- Просмотр деталей объявлений
- Поделиться объявлением

### Действия С авторизацией:
✅ Всё что выше ПЛЮС:
- Лайки (сохраняются в БД)
- Комментарии
- Сообщения продавцам
- Избранное
- Создание объявлений
- Личный профиль
- История просмотров

### Локализация (i18n)
**Для Кыргызстана:**
- **По умолчанию:** Русский язык
- **Доступные языки:** Русский 🇷🇺, Кыргызский 🇰🇬
- **Смена языка:** В настройках профиля
- **Технология:** Custom hook `useTranslation` + AsyncStorage

**Структура переводов:**
```
lib/i18n/
├── config.ts                 # Конфигурация локалей
├── useTranslation.ts         # Хук локализации
└── translations/
    ├── ru.ts                 # Русский (default)
    ├── ky.ts                 # Кыргызский
    ├── uz.ts                 # Узбекский
    ├── kk.ts                 # Казахский
    └── tj.ts                 # Таджикский
```

### Onboarding Flow
1. **Welcome Screen** - слайды о приложении
2. **Permissions Screen** - запрос геолокации и уведомлений
3. **Main Feed** - сразу на русском языке

**Файлы:**
- `app/(onboarding)/welcome.tsx`
- `app/(onboarding)/permissions.tsx`

### Auth Components
```
components/Auth/
├── PhoneInput.tsx          # Ввод номера телефона
├── CodeInput.tsx           # Ввод SMS кода
├── LegalLinks.tsx          # Ссылки на юр. документы
└── SMSAuthModal.tsx        # Модальное окно авторизации
```

### Permissions
```
lib/permissions/
└── request-permissions.ts  # Запрос геолокации и уведомлений
```

---

**Этот документ - единственный источник правды о проекте.**  
**Обновляй его при любых значительных изменениях!**

**Last updated:** 2025-10-14  
**Maintainer:** AI Assistant + Development Team  
**Version:** 2.1 (с User Flow и Локализацией)

