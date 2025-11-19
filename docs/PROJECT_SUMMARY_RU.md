# 📋 Резюме проекта 360° Auto Marketplace

> **Документ для AI моделей (Grok, GPT-5, Claude Code)**  
> Полное техническое описание проекта: логика, алгоритмы, структура, технологии

---

## 🎯 ЧТО МЫ СТРОИМ

**360° Auto Marketplace** — это вертикальный видеомаркетплейс в формате TikTok для покупки и продажи автомобилей, лошадей и недвижимости в Кыргызстане.

### Ключевые особенности:
- 📱 **TikTok-style видео лента** — вертикальная прокрутка видео объявлений
- 🤖 **AI-анализ видео** — автоматическое определение характеристик товара
- 💬 **Реал-тайм чаты** — мгновенная коммуникация между покупателями и продавцами
- 🏢 **Бизнес-аккаунты** — система подписок для дилеров и агентств
- 📍 **Локализация** — SMS-авторизация для Кыргызстана, Казахстана, России, Узбекистана, Таджикистана
- 🚀 **Boost система** — продвижение объявлений с оплатой
- 📊 **Оффлайн режим** — кэширование для работы без интернета

---

## 🏗️ АРХИТЕКТУРА И СТРУКТУРА

### Структура проекта (каноническая)

```
360AutoMVP/
├── app/                    # Expo Router страницы (file-based routing)
│   ├── (tabs)/            # Главные табы: index, search, upload, favorites, messages, profile
│   ├── (auth)/            # Авторизация: intro, phone, verify
│   ├── (onboarding)/      # Онбординг: IntroCarousel
│   ├── (business)/        # Бизнес-аккаунты: setup, upgrade
│   ├── camera/            # Запись и обработка видео
│   ├── chat/              # Чаты с продавцами
│   └── listing/           # Детали объявлений
│
├── components/            # UI компоненты по доменам
│   ├── VideoFeed/         # Видео лента и плеер
│   ├── Auth/              # SMS авторизация
│   ├── Upload/            # Загрузка контента
│   ├── Comments/          # Комментарии
│   ├── Business/          # Бизнес-аккаунты
│   └── common/            # Общие компоненты
│
├── services/              # Клиентские сервисы (критично!)
│   ├── supabase.ts        # Supabase клиент (БД, Auth, Storage)
│   ├── apiVideo.ts        # API.video (HLS стриминг)
│   ├── sms.ts             # SMS nikita.kg
│   ├── ai.ts              # AI анализ (OpenAI, Claude, Google)
│   ├── api.ts             # HTTP клиент для backend
│   └── ...
│
├── backend/               # Express.js API сервер
│   ├── api/               # API роуты
│   │   ├── auth.ts        # Авторизация
│   │   ├── listings.ts    # Объявления
│   │   ├── chat.ts        # Чаты
│   │   ├── analyze.ts     # AI анализ
│   │   └── business.ts   # Бизнес-аккаунты
│   ├── services/          # Backend сервисы
│   │   ├── aiService.ts   # AI анализ (backend)
│   │   ├── smsService.ts  # SMS отправка
│   │   └── supabaseClient.ts
│   └── server.ts          # Express сервер
│
├── lib/                   # State management и утилиты
│   ├── store/             # Redux Toolkit
│   │   ├── slices/
│   │   │   ├── authSlice.ts      # Авторизация
│   │   │   ├── feedSlice.ts      # Лента (currentIndex, activeCategory, preloadedIndexes)
│   │   │   ├── videoSlice.ts     # Видео (activeVideoId, mutedVideoIds, videoCache)
│   │   │   └── offlineSlice.ts   # Оффлайн режим
│   │   └── api/apiSlice.ts       # RTK Query
│   └── ...
│
├── shared/src/            # Общие типы (единый источник правды)
│   └── types/             # TypeScript типы
│
├── supabase/
│   ├── migrations/        # SQL миграции (канонические)
│   └── functions/        # Edge Functions
│
└── docs/                  # Документация
```

### Path Aliases (TypeScript)

```typescript
@components/*  → components/*
@services/*    → services/*
@hooks/*       → hooks/*
@utils/*       → utils/*
@types/*       → types/* (временно, предпочтительно @shared/*)
@shared/*      → shared/src/*
@lib/*         → lib/*
```

---

## ⚙️ ЛОГИКА И АЛГОРИТМЫ

### 1. Алгоритм видео-ленты (Feed Algorithm)

#### Прелоадинг видео
```typescript
// Прелоадим текущее + следующие 2 видео
const preloadIndexes = new Set<number>();
preloadIndexes.add(currentIndex);        // Текущее
preloadIndexes.add(currentIndex + 1);    // Следующее
preloadIndexes.add(currentIndex + 2);    // Через одно
```

**Логика:**
- ✅ Прелоадим **текущее** видео (воспроизведение)
- ✅ Прелоадим **следующие 2** видео (готовность к скроллу)
- ✅ Всегда прелоадим **первый** элемент (быстрый старт)
- ✅ Очищаем старые индексы при смене категории

#### Определение видимого видео
```typescript
const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,  // Видимо когда 50% на экране
  minimumViewTime: 100,              // Минимум 100ms просмотра
};
```

**Логика:**
- ✅ Определяем видимое видео когда **50%** на экране
- ✅ Минимум **100ms** просмотра для активации
- ✅ Автоматически прелоадим **следующее** и **предыдущее**
- ✅ Обновляем Redux состояние (`setCurrentIndex`)

#### Кэширование объявлений
```typescript
const CACHE_DURATION = 30000; // 30 секунд
const listingsCache = {
  [category]: {
    data: FeedListing[],
    timestamp: number
  }
};
```

**Логика:**
- ✅ Кэш на **30 секунд** для каждой категории
- ✅ При смене категории используем кэш если свежий
- ✅ При pull-to-refresh игнорируем кэш
- ✅ Автоматический прелоад первых 3 элементов

#### Алгоритм сортировки (feedAlgorithm.ts)

1. **По приоритету:**
   - С AI-анализом → выше
   - С фотографиями → выше
   - Верифицированные продавцы → выше

2. **По локации:**
   - В городе пользователя → выше
   - В регионе пользователя → выше
   - Другие города → ниже

3. **По дате:**
   - Новые → выше
   - Старые → ниже

4. **По активности:**
   - Больше лайков → выше
   - Больше просмотров → выше

#### Neural Warm-up Engine (lib/videoWarmup.ts)

**Предиктивный прогрев видео:**
- Анализ паттернов скролла пользователя
- Определение направления (вверх/вниз)
- Вычисление задержки прогрева на основе нейронной модели
- QoS режимы: `low`, `mid`, `high` (на основе FPS и stall)
- Fire-and-forget прогрев с таймаутом

---

### 2. AI-анализ видео (Multi-Provider)

#### Алгоритм анализа автомобиля

```typescript
async function analyzeCarVideo(videoUri: string): Promise<Partial<Car>> {
  // Шаг 1: Извлечение кадров (10%)
  const frames = await extractFramesFromVideo(videoUri, 5);
  // Кадры: [0s, 5s, 10s, 20s, 30s]
  
  // Шаг 2: Параллельный анализ (50-70%)
  const [carId, mileage, damages] = await Promise.all([
    analyzeWithOpenAI(frames[0]),           // Марка, модель, год, цвет
    extractMileageWithGoogle(frames[3]),    // OCR одометра
    detectDamagesWithGoogle(frames[0])      // Детекция повреждений
  ]);
  
  // Шаг 3: Комплексный анализ (70-95%)
  const claudeAnalysis = await analyzeWithClaude(frames, {
    brand: carId.brand,
    model: carId.model,
    year: carId.year,
    mileage
  });
  // Результат: condition, conditionScore, estimatedPrice, features
  
  // Шаг 4: Формирование результата (95-100%)
  return {
    brand, model, year, mileage,
    damages,
    aiAnalysis: {
      condition: claudeAnalysis.condition,
      conditionScore: claudeAnalysis.conditionScore,
      estimatedPrice: claudeAnalysis.estimatedPrice,
      features: claudeAnalysis.features
    }
  };
}
```

**Провайдеры AI:**
- **OpenAI GPT-4 Vision** — идентификация марки/модели/года/цвета
- **Google Vision OCR** — распознавание пробега (одометр)
- **Google Vision Object Detection** — детекция повреждений
- **Claude (Anthropic)** — комплексный анализ состояния и оценка цены
- **YOLO (Roboflow)** — дополнительная детекция повреждений (опционально)

**Кэширование:**
- Ключ: hash(videoUri)
- TTL: 24 часа
- Лимиты: daily request limits для тестирования

#### Алгоритм анализа лошадей

Аналогично автомобилям, но с другими промптами:
- Определение породы (Ахалтекинская, Арабская, и т.д.)
- Определение масти (гнедая, вороная, серая, и т.д.)
- Оценка возраста и роста
- Оценка здоровья и конформации
- Body Condition Score (BCS 1-9)

#### Алгоритм анализа недвижимости

- Классификация типа (квартира, дом, участок)
- Измерение площади (AI)
- Подсчет комнат
- Оценка состояния

---

### 3. Алгоритм загрузки и публикации видео

```typescript
// 1. Запись/выбор видео
camera.tsx → expo-camera или expo-image-picker

// 2. Извлечение кадров
extractFramesFromVideo(videoUri, 5)
→ [frame0, frame5, frame10, frame20, frame30]

// 3. AI-анализ (параллельно с загрузкой)
const aiResult = await analyzeCarVideo(videoUri);

// 4. Загрузка на api.video
const { videoId, uploadToken } = await apiVideo.createVideo();
await apiVideo.uploadVideo(videoId, uploadToken, videoFile);
const { hls, thumbnail } = await apiVideo.getVideoAssets(videoId);

// 5. Предпросмотр с AI-данными
→ Пользователь редактирует/подтверждает

// 6. Публикация
POST /api/listings {
  category: "car",
  video_id: videoId,
  video_url: hls,
  thumbnail_url: thumbnail,
  title, price, details,
  car_details: aiResult
}
```

**Важно:**
- ✅ Все видео через **api.video** (HLS стриминг)
- ✅ **НЕ** используем Supabase Storage для видео
- ✅ Chunked upload для больших файлов
- ✅ Retry логика при ошибках

---

### 4. Алгоритм чата (Realtime)

```typescript
// 1. Создание чата
POST /api/chat/start {
  listing_id, buyer_id, seller_id
} → { thread_id }

// 2. Загрузка сообщений
GET /api/chat/thread/:thread_id/messages
→ Message[]

// 3. Realtime подписка (Supabase)
const channel = supabase
  .channel(`chat:${thread_id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `thread_id=eq.${thread_id}`
  }, (payload) => {
    // Новое сообщение → добавление в state
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();

// 4. Отправка сообщения
POST /api/chat/thread/:thread_id/message {
  body: "текст"
} → Message

// 5. Push уведомления
→ Expo Notifications для получателя
```

**Логика:**
- ✅ Оптимистичное обновление UI
- ✅ Realtime синхронизация через Supabase
- ✅ Push уведомления для оффлайн пользователей
- ✅ Автоскролл к новым сообщениям

---

### 5. Алгоритм поиска и фильтров

```typescript
// Полнотекстовый поиск (FTS)
supabase
  .from('listings')
  .select('*, seller:users(*), car_details(*)')
  .textSearch('fts_vector', query)  // pg_trgm extension
  .gte('price', minPrice)
  .lte('price', maxPrice)
  .gte('year', minYear)
  .lte('year', maxYear)
  .eq('city', city)
  .eq('condition', condition)
  .order('created_at', { ascending: false });
```

**Индексы:**
- `fts_vector` — полнотекстовый поиск (title, description, brand, model)
- `price`, `year`, `city`, `condition` — для фильтров

---

### 6. Алгоритм бизнес-аккаунтов

#### Тарифы (Tiers)

```typescript
type BusinessTier = 'free' | 'lite' | 'business' | 'pro';

const TIER_LIMITS = {
  free: {
    max_listings: 2,
    max_team_members: 1,
    features: ['basic_listing']
  },
  lite: {
    max_listings: 10,
    max_team_members: 3,
    features: ['basic_listing', 'analytics']
  },
  business: {
    max_listings: 50,
    max_team_members: 10,
    features: ['basic_listing', 'analytics', 'boost', 'team_management']
  },
  pro: {
    max_listings: -1,  // unlimited
    max_team_members: -1,
    features: ['all', 'verification', 'priority_support']
  }
};
```

#### Логика подписок

- ✅ Пробный период (trial) для новых аккаунтов
- ✅ Автопродление (auto_renew)
- ✅ Проверка лимитов перед публикацией
- ✅ Верификация для PRO (документы)

---

## 🗄️ БАЗА ДАННЫХ (Supabase PostgreSQL)

### Основные таблицы

```sql
-- Пользователи
users (
  id UUID PRIMARY KEY,
  phone VARCHAR UNIQUE,
  name VARCHAR,
  avatar_url TEXT,
  city VARCHAR,
  created_at TIMESTAMPTZ
)

-- Объявления
listings (
  id UUID PRIMARY KEY,
  seller_user_id UUID REFERENCES users(id),
  category VARCHAR,  -- 'car', 'horse', 'real_estate'
  video_id VARCHAR,  -- api.video ID
  video_url TEXT,    -- HLS URL
  thumbnail_url TEXT,
  title VARCHAR,
  price DECIMAL,
  city VARCHAR,
  status VARCHAR,    -- 'draft', 'published', 'sold'
  created_at TIMESTAMPTZ
)

-- Детали автомобиля
car_details (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  brand VARCHAR,
  model VARCHAR,
  year INTEGER,
  mileage_km INTEGER,
  damages JSONB,
  condition VARCHAR,
  condition_score INTEGER
)

-- Лайки (ВАЖНО: listing_likes, НЕ likes!)
listing_likes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, listing_id)
)

-- Избранное
listing_saves (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, listing_id)
)

-- Чат-треды
chat_threads (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Сообщения
chat_messages (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES chat_threads(id),
  sender_id UUID REFERENCES users(id),
  body TEXT,
  created_at TIMESTAMPTZ
)

-- Бизнес-аккаунты
business_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tier VARCHAR,  -- 'free', 'lite', 'business', 'pro'
  company_name VARCHAR,
  max_listings INTEGER,
  max_team_members INTEGER,
  subscription_ends_at TIMESTAMPTZ,
  ...
)

-- Коды верификации
verification_codes (
  id UUID PRIMARY KEY,
  phone VARCHAR,
  code VARCHAR,  -- 4 цифры
  expires_at TIMESTAMPTZ,
  is_used BOOLEAN
)
```

### RLS (Row Level Security)

- **listings:** Все могут читать, только владелец может изменять
- **chat_threads:** Участники могут читать
- **chat_messages:** Участники треда могут читать/писать
- **listing_saves:** Пользователь видит только свои
- **users:** Публичные поля доступны всем, приватные только владельцу

---

## 🔄 REDUX STORE STRUCTURE

```typescript
{
  feed: {
    currentIndex: number,                    // Индекс текущего видео
    activeCategory: 'car' | 'horse' | 'real_estate',
    preloadedIndexes: number[],              // Индексы прелоаженных видео
    viewedListings: string[],                // Просмотренные объявления
    lastViewedTime: Record<string, number>  // ID -> timestamp
  },
  
  video: {
    activeVideoId: string | null,
    playingVideoIds: string[],              // Видео в воспроизведении
    mutedVideoIds: string[],                // Видео без звука
    videoCache: {                           // Кэш URL видео
      [id: string]: { url: string, cachedAt: number }
    }
  },
  
  auth: {
    currentUser: User | null,
    token: string | null
  },
  
  offline: {
    isOnline: boolean,
    cachedListings: FeedListing[]
  }
}
```

---

## 🛠️ ТЕХНОЛОГИИ

### Frontend (Mobile)

- **Framework:** React Native 0.81 + Expo SDK 54
- **Routing:** Expo Router (file-based routing)
- **State Management:** Redux Toolkit + RTK Query
- **UI:** React Native компоненты + Ionicons
- **Video Player:** expo-video (useVideoPlayer hook)
- **Camera:** expo-camera, expo-image-picker
- **Storage:** AsyncStorage + SQLite (оффлайн кэш)
- **HTTP Client:** Fetch API + axios
- **Animations:** react-native-reanimated, Animated API
- **Haptics:** expo-haptics
- **Lists:** @shopify/flash-list (вместо FlatList)

### Backend

- **Framework:** Express.js (Node.js 18+)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (S3-compatible) — только для изображений
- **Realtime:** Supabase Realtime (WebSocket)
- **Auth:** JWT tokens (через backend)
- **SMS:** nikita.kg API (Basic Auth)
- **Video:** api.video (HLS streaming) — **ВСЕ видео здесь**
- **AI:** OpenAI GPT-4 Vision, Claude (Anthropic), Google Vision API, YOLO (Roboflow)
- **Queue:** Bull (Redis) для фоновых задач

### Инфраструктура

- **Database:** Supabase PostgreSQL
- **File Storage:** Supabase Storage (изображения), api.video (видео)
- **CDN:** api.video CDN (для видео)
- **Backend Hosting:** (настраивается)

---

## 🔌 ИНТЕГРАЦИИ

### 1. Supabase

**URL:** `https://thqlfkngyipdscckbhor.supabase.co`  
**Сервис:** `services/supabase.ts`

**Использование:**
- База данных (PostgreSQL)
- Authentication (JWT через backend)
- Storage (изображения, аватары)
- Realtime (WebSocket подписки)

### 2. API.video

**Base URL:** `https://ws.api.video`  
**Сервис:** `services/apiVideo.ts`

**Использование:**
- Создание видео: `POST /videos`
- Загрузка: `POST /videos/{videoId}/source`
- HLS URL: `https://cdn.api.video/vod/{videoId}/hls/manifest.m3u8`
- Thumbnail: `https://cdn.api.video/vod/{videoId}/thumbnail.jpg`

**Важно:** Все видео через api.video, НЕ Supabase Storage!

### 3. SMS (nikita.kg)

**URL:** `https://smspro.nikita.kg/api/message`  
**Сервис:** `backend/services/smsService.ts`

**Использование:**
- Метод: POST
- Auth: Basic Auth (login/password)
- Sender: `bat-bat.kg`
- Формат: 4-значный код

**Страны:** Кыргызстан (+996), Казахстан (+7), Россия (+7), Узбекистан (+998), Таджикистан (+992)

### 4. AI Services

#### OpenAI GPT-4 Vision
- **Задача:** Идентификация марки/модели/года/цвета
- **API:** `https://api.openai.com/v1/chat/completions`
- **Модель:** `gpt-4o`

#### Claude (Anthropic)
- **Задача:** Комплексный анализ состояния и оценка цены
- **API:** `https://api.anthropic.com/v1/messages`
- **Модель:** `claude-sonnet-4-20250514`

#### Google Vision API
- **Задача:** OCR (одометр), Object Detection (повреждения)
- **API:** `https://vision.googleapis.com/v1/images:annotate`
- **Features:** TEXT_DETECTION, OBJECT_LOCALIZATION, LABEL_DETECTION

#### YOLO (Roboflow)
- **Задача:** Дополнительная детекция повреждений
- **Опционально:** Включено через `TEST_CONFIG.ENABLE_YOLO`

---

## 📱 API ENDPOINTS (Backend)

**Base URL:** `http://192.168.1.16:3001/api` (dev) или production URL

### Authentication
```
POST /api/auth/request-code
  Body: { phone: "+996..." }
  Response: { success: true, data: { phone, message } }

POST /api/auth/verify-code
  Body: { phone: "+996...", code: "1234" }
  Response: { success: true, data: { user, token, codeLength } }
```

### Listings
```
GET /api/listings/feed
  Query: { category?: "car"|"horse"|"real_estate", limit, offset }
  Response: { success: true, data: Listing[] }

POST /api/listings
  Headers: { Authorization: "Bearer <token>" }
  Body: { category, video_id, title, price, details, ... }
  Response: { success: true, data: Listing }
```

### Chat
```
POST /api/chat/start
  Body: { listing_id, buyer_id, seller_id }
  Response: { success: true, data: { thread_id } }

GET /api/chat/thread/:id/messages
  Response: { success: true, data: Message[] }

POST /api/chat/thread/:id/message
  Body: { body: "текст сообщения" }
  Response: { success: true, data: Message }
```

### AI Analysis
```
POST /api/analyze-car
  Body: { videoFrames: string[] (base64), metadata: {...} }
  Response: { brand, model, year, mileage_km, price_estimate, damages, condition, ... }
```

### Business Accounts
```
GET /api/business/account
  Headers: { Authorization: "Bearer <token>" }
  Response: { success: true, data: BusinessAccount }

POST /api/business/upgrade
  Body: { tier: "lite"|"business"|"pro" }
  Response: { success: true, data: BusinessAccount }
```

---

## 🎯 КЛЮЧЕВЫЕ АЛГОРИТМЫ ПРОИЗВОДИТЕЛЬНОСТИ

### 1. Прелоадинг видео
- Загружаем следующее видео в фоне
- Используем `isPreloaded` флаг для оптимизации
- Neural warm-up engine для предсказания скролла

### 2. Виртуализация списка
- FlashList с `windowSize={3}` (показываем только 3 экрана)
- `removeClippedSubviews={true}` для освобождения памяти
- React.memo для компонентов

### 3. Кэширование
- Redux кэш для часто используемых данных
- SQLite кэш для оффлайн режима
- AsyncStorage для токенов и настроек
- Кэш объявлений на 30 секунд

### 4. Оптимизация изображений
- Компрессия перед загрузкой
- Ленивая загрузка превью
- Placeholder'ы во время загрузки
- expo-image для автоматического кэширования

### 5. Оффлайн режим
- SQLite кэш для видео URL
- Кэш объявлений в Redux
- Синхронизация при подключении

---

## 📊 БИЗНЕС-ЛОГИКА

### Пользовательские роли

1. **Гость** — просмотр без ограничений, действия требуют авторизации
2. **Пользователь** — полный функционал (лайки, комментарии, чаты, избранное)
3. **Продавец** — создание объявлений, управление объявлениями
4. **Бизнес-аккаунт** — расширенные возможности (аналитика, команда, boost)

### Монетизация

- **Boost система** — продвижение объявлений (платно)
- **Бизнес-подписки** — тарифы lite/business/pro
- **Комиссия** — (планируется)

---

## 🔐 БЕЗОПАСНОСТЬ

- ✅ JWT токены для авторизации
- ✅ RLS (Row Level Security) в Supabase
- ✅ Валидация на backend
- ✅ Rate limiting для API
- ✅ SMS верификация (4-значный код)
- ✅ HTTPS для всех запросов

---

## 📝 ВАЖНЫЕ ЗАМЕЧАНИЯ ДЛЯ РАЗРАБОТКИ

### ✅ DO

- Используй активную структуру (`app/`, `components/`, `services/`)
- Все видео через api.video (НЕ Supabase Storage)
- Импорты через `@` aliases
- TypeScript типы обязательны
- Обработка ошибок везде
- Используй `listing_likes` таблицу, НЕ `likes`
- Используй Redux для глобального состояния
- FlashList вместо FlatList для больших списков

### ❌ DON'T

- Не добавляй код в `legacy/`
- Не дублируй сервисы между mobile и backend
- Не используй FlatList для видео-ленты
- Не храни видео в Supabase Storage
- Не делай прямые сетевые запросы в компонентах (только через services)

---

## 🚀 СТАТУС ПРОЕКТА

**Версия:** 1.0.0  
**Статус:** ✅ Готов к production запуску в Кыргызстане  
**Последнее обновление:** Январь 2025

---

## 📚 ДОПОЛНИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Детальная архитектура
- **[CursorAI-Prompt.md](CursorAI-Prompt.md)** — Полный промпт для AI
- **[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)** — Структура проекта

---

**360° Auto Marketplace** — Готов к масштабированию! 🚀

