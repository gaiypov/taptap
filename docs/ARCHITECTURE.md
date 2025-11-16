# 🏗️ Архитектура приложения 360° Auto MVP

## 📋 Оглавление
1. [Общий обзор](#общий-обзор)
2. [Навигация и роуты](#навигация-и-роуты)
3. [API и интеграции](#api-и-интеграции)
4. [Алгоритмы работы](#алгоритмы-работы)
5. [Путь покупателя](#путь-покупателя)
6. [Путь продавца](#путь-продавца)
7. [Технический стек](#технический-стек)

---

## 🎯 Общий обзор

**360° Auto MVP** — TikTok-style видеомаркетплейс для покупки и продажи:
- 🚗 Автомобилей
- 🐎 Лошадей
- 🏠 Недвижимости

### Ключевые особенности
- Вертикальная видео-лента (TikTok-style)
- AI-анализ видео для автоматического заполнения данных
- Реал-тайм чаты между покупателями и продавцами
- HLS стриминг через api.video
- SMS-авторизация (Кыргызстан, Казахстан, Россия, Узбекистан, Таджикистан)

---

## 🗺️ Навигация и роуты

### Структура роутов (Expo Router)

```
app/
├── splash.tsx                          # Splash screen (2 сек)
├── _layout.tsx                         # Root layout с Redux Provider
│
├── (onboarding)/                      # Онбординг (группа)
│   ├── IntroCarousel.tsx             # 3 слайда онбординга
│   ├── welcome.tsx                    # Старый экран приветствия
│   └── permissions.tsx                # Запрос разрешений
│
├── (auth)/                            # Авторизация (группа)
│   ├── intro.tsx                      # Экран входа
│   ├── phone.tsx                      # Ввод номера телефона
│   └── verify.tsx                     # Ввод 4-значного кода
│
├── (tabs)/                            # Главные табы
│   ├── index.tsx                      # 📱 Главная (видео-лента)
│   ├── search.tsx                     # 🔍 Поиск и фильтры
│   ├── upload.tsx                     # ➕ Создать объявление
│   ├── favorites.tsx                  # ❤️ Избранное
│   ├── messages.tsx                   # 💬 Сообщения
│   └── profile.tsx                    # 👤 Профиль
│
├── camera.tsx                         # Экран записи видео
├── camera/
│   └── process.tsx                    # Обработка и AI-анализ видео
│
├── chat/
│   └── [conversationId].tsx          # Чат с продавцом
│
├── profile/
│   ├── [id].tsx                       # Профиль пользователя
│   ├── edit.tsx                        # Редактирование профиля
│   └── my-listings.tsx                # Мои объявления
│
└── legal/                             # Юридические страницы
    ├── terms.tsx
    ├── privacy.tsx
    └── consent.tsx
```

### Навигационные потоки

#### 🚀 Первый запуск
```
Splash (2 сек) 
  → IntroCarousel (3 слайда)
    → Главная лента /(tabs)/index
```

#### 🔐 Авторизация
```
Главная лента
  → Попытка действия (лайк, комментарий, чат)
    → (auth)/intro
      → (auth)/phone (выбор страны, ввод номера)
        → (auth)/verify (4-значный код)
          → Возврат на главную
```

#### 📹 Создание объявления
```
(upload) → Запрос разрешений
  → camera.tsx (запись/выбор видео)
    → camera/process.tsx (AI-анализ)
      → Предпросмотр
        → Публикация
          → Главная лента
```

#### 💬 Чат
```
Видео карточка → Написать продавцу
  → chat/[conversationId].tsx
    → Supabase Realtime подписка
```

---

## 🔌 API и интеграции

### Backend API (Express.js на порту 3001)

**Base URL:** `http://192.168.1.16:3001/api` (dev) или production URL

#### 🔐 Authentication API

```
POST /api/auth/request-code
  Body: { phone: "+996..." }
  Response: { success: true, data: { phone, message } }

POST /api/auth/verify-code
  Body: { phone: "+996...", code: "1234" }
  Response: { success: true, data: { user, token, codeLength } }

POST /api/auth/validate
  Headers: { Authorization: "Bearer <token>" }
  Response: { success: true, user: {...} }
```

#### 📋 Listings API

```
GET /api/listings/feed
  Query: { category?: "car"|"horse"|"real_estate", limit, offset }
  Response: { success: true, data: Listing[] }

GET /api/listings/:id
  Response: { success: true, data: Listing }

POST /api/listings
  Headers: { Authorization: "Bearer <token>" }
  Body: { category, video_id, title, price, details, ... }
  Response: { success: true, data: Listing }

PUT /api/listings/:id
DELETE /api/listings/:id
```

#### 💬 Chat API

```
GET /api/chat/threads
  Headers: { Authorization: "Bearer <token>" }
  Response: { success: true, data: ChatThread[] }

POST /api/chat/start
  Body: { listing_id, buyer_id, seller_id }
  Response: { success: true, data: { thread_id } }

GET /api/chat/thread/:id/messages
  Response: { success: true, data: Message[] }

POST /api/chat/thread/:id/message
  Body: { body: "текст сообщения" }
  Response: { success: true, data: Message }
```

#### 🤖 AI Analysis API

```
POST /api/analyze-car
  Body: { videoFrames: string[] (base64), metadata: {...} }
  Response: { 
    brand, model, year, mileage_km, 
    price_estimate, damages, condition, ...
  }
```

#### 📹 Video Slideshow API

```
POST /api/video/create-from-photos
  Body: { photos: string[], musicType: string }
  Response: { jobId: string }

GET /api/video/video-status/:jobId
  Response: { status: "processing"|"completed", videoUrl?, error? }
```

### Внешние интеграции

#### 🎥 api.video (HLS Streaming)
- **Создание видео:** `POST https://ws.api.video/videos`
- **Загрузка:** `POST https://ws.api.video/videos/{videoId}/source`
- **HLS URL:** `https://cdn.api.video/vod/{videoId}/hls/manifest.m3u8`
- **Thumbnail:** `https://cdn.api.video/vod/{videoId}/thumbnail.jpg`

**Сервис:** `services/apiVideo.ts`

#### 🗄️ Supabase
- **База данных:** PostgreSQL (RLS policies)
- **Storage:** Видео и изображения (buckets: `videos`, `thumbnails`, `avatars`)
- **Realtime:** WebSocket подписки на `chat_messages`
- **Auth:** JWT токены (через backend)

**Сервис:** `services/supabase.ts`

#### 📱 SMS (nikita.kg API)
- **URL:** `https://smspro.nikita.kg/api/message`
- **Метод:** POST
- **Auth:** Basic Auth (login/password)
- **Sender:** `bat-bat.kg`

**Сервис:** `backend/services/smsService.ts`

#### 🤖 AI Services
- **OpenAI GPT-4 Vision:** Распознавание марки/модели
- **Google Vision OCR:** Распознавание пробега (одометр)
- **Google Vision Detection:** Обнаружение повреждений
- **Claude (Anthropic):** Альтернатива OpenAI

**Сервисы:** 
- `services/ai.ts` (мобильный)
- `backend/services/aiService.ts` (backend)

---

## ⚙️ Алгоритмы работы

### 1️⃣ Загрузка и публикация видео

```
1. Пользователь нажимает "Создать" → (upload)
2. Выбор категории (авто/лошадь/недвижимость)
3. Запись или выбор видео → camera.tsx
4. Переход в camera/process.tsx:
   
   a) Извлечение кадров из видео (expo-video-thumbnails)
      → 5 кадров: [0s, 5s, 10s, 20s, 30s]
   
   b) AI-анализ (параллельно):
      - OpenAI: определение марки/модели/года
      - Google OCR: распознавание пробега
      - Google Vision: обнаружение повреждений
      → Результат: Partial<Car> объект
   
   c) Загрузка видео на api.video:
      - Создание записи видео → получение videoId + uploadToken
      - Chunked upload файла
      - Получение HLS URL и thumbnail
   
   d) Предпросмотр с AI-данными
      → Пользователь редактирует/подтверждает
   
   e) Публикация:
      - POST /api/listings
      - Сохранение в Supabase (listings + car_details/horse_details/real_estate_details)
      - Уведомление: "Объявление опубликовано"
```

### 2️⃣ Видео-лента (Feed)

```
1. Загрузка списка (app/(tabs)/index.tsx):
   - Redux: activeCategory ('car' | 'horse' | 'real_estate')
   - GET /api/listings/feed?category={category}
   - Маппинг в FeedListing[]

2. Оптимизированный рендеринг:
   - FlatList с windowSize={3}
   - OptimizedVideoPlayer для каждого видео
   - Прелоадер: загрузка следующего видео в фоне

3. Автовоспроизведение:
   - Только активное видео (isActive=true)
   - Остальные на паузе
   - При скролле: pause старого, play нового

4. Управление звуком:
   - Redux: mutedVideoIds[]
   - toggleMuteVideo(id) → добавляет/убирает из массива
   - OptimizedVideoPlayer реагирует на isMuted

5. Кэширование:
   - Redux: videoCache { id: { url, cachedAt } }
   - SQLite: offline cache для оффлайн просмотра
```

### 3️⃣ AI-анализ видео

```typescript
Алгоритм analyzeCarVideo(videoUri):

1. Извлечение кадров:
   - extractFramesFromVideo(videoUri)
   - Результат: string[] (base64 кадры)

2. Параллельный анализ (Promise.all):

   a) OpenAI GPT-4 Vision:
      - Вход: первый кадр (data URL)
      - Промпт: "Определи марку, модель, год, цвет"
      - Ответ: { brand, model, year, color }

   b) Google Vision OCR:
      - Вход: кадр с одометром (кадр #3 или #0)
      - API: documents.detect_text
      - Поиск паттерна: /^\d+.*км/i
      - Результат: mileage_km (число)

   c) Google Vision Object Detection:
      - Вход: первый кадр
      - API: images.annotate (objectLocalization)
      - Поиск: повреждения, царапины, вмятины
      - Результат: damages[] array

3. Формирование результата:
   {
     brand: string,
     model: string,
     year: number,
     mileage_km: number,
     damages: Damage[],
     condition: "excellent" | "good" | "fair" | "poor",
     conditionScore: number (0-100)
   }

4. Кэширование результата:
   - Ключ: videoUri hash
   - Значение: результат анализа
   - TTL: 24 часа
```

### 4️⃣ Чат (Realtime)

```
1. Создание чата:
   - Покупатель нажимает "Написать продавцу"
   - Проверка авторизации
   - POST /api/chat/start
     { listing_id, buyer_id, seller_id }
   - Получение thread_id

2. Загрузка сообщений:
   - GET /api/chat/thread/:thread_id/messages
   - Отображение в FlatList

3. Realtime подписка:
   - Supabase channel: `chat:${thread_id}`
   - Слушаем: INSERT на `chat_messages` where `thread_id=eq.${thread_id}`
   - При новом сообщении: добавление в state + автоскролл

4. Отправка сообщения:
   - POST /api/chat/thread/:thread_id/message
   - Body: { body: "текст" }
   - Оптимистичное обновление UI
   - Realtime уведомит других участников
```

### 5️⃣ Поиск и фильтры

```
1. Полнотекстовый поиск (FTS):
   - Supabase: pg_trgm extension
   - Индексы на: title, description, brand, model
   - Запрос: .textSearch('fts_vector', query)

2. Фильтры:
   - Цена: .gte('price', minPrice).lte('price', maxPrice)
   - Год: .gte('year', minYear).lte('year', maxYear)
   - Регион: .eq('city', city)
   - Состояние: .eq('condition', condition)

3. Комбинированный запрос:
   ```
   supabase
     .from('listings')
     .select('*, seller:users(*), car_details(*)')
     .textSearch('fts_vector', query)
     .gte('price', minPrice)
     .eq('category', 'car')
     .order('created_at', { ascending: false })
   ```
```

---

## 🛒 Путь покупателя

### Флоу покупателя (неавторизованного)

```
1. Splash Screen (2 сек)
   ↓
2. IntroCarousel (3 слайда)
   ↓
3. Главная лента (app/(tabs)/index.tsx)
   - Категории: 🚗 Авто / 🐎 Лошади / 🏠 Недвижимость
   - Вертикальная прокрутка видео
   - Автовоспроизведение активного видео
   
4. Просмотр видео:
   - Двойной тап → лайк (локально, без сохранения)
   - Переключение звука → Redux state
   - Просмотр без ограничений
   
5. Попытка действия:
   - Комментарий → редирект на (auth)/intro
   - Избранное → редирект на (auth)/intro
   - Написать продавцу → редирект на (auth)/intro
```

### Флоу покупателя (авторизованного)

```
1. Авторизация:
   (auth)/intro
     → (auth)/phone (ввод номера + выбор страны)
       → SMS код отправлен
         → (auth)/verify (ввод 4-значного кода)
           → JWT токен сохранен
             → Возврат на главную

2. Главная лента (полный функционал):
   - ❤️ Лайк → POST /api/listings/:id/like (сохранение в БД)
   - 💬 Комментарии → BottomSheet с комментариями
   - ⭐ Избранное → POST /api/favorites/:id
   - 📤 Поделиться → Share API
   - ✉️ Написать продавцу → chat/[conversationId]
   - 🔇 Без звука → Redux toggle

3. Поиск (app/(tabs)/search.tsx):
   - Поле поиска по тексту
   - Фильтры: цена, год, регион, состояние
   - Результаты в формате ленты

4. Избранное (app/(tabs)/favorites.tsx):
   - GET /api/favorites
   - Список сохраненных объявлений

5. Чат (chat/[conversationId].tsx):
   - Список диалогов → (tabs)/messages.tsx
   - Открытие чата → Supabase Realtime
   - Отправка сообщений
   - Уведомления о новых сообщениях
```

---

## 🏪 Путь продавца

### Флоу продавца

```
1. Авторизация (аналогично покупателю)

2. Создание объявления:
   (tabs)/upload.tsx
     ↓
   Выбор категории (авто/лошадь/недвижимость)
     ↓
   camera.tsx
     - Запись видео (expo-camera)
     - Или выбор из галереи (expo-image-picker)
     ↓
   camera/process.tsx
     
     a) Извлечение кадров (5 кадров)
     b) AI-анализ:
        - Определение характеристик
        - Распознавание пробега (для авто)
        - Обнаружение повреждений
     c) Загрузка на api.video:
        - Создание видео → videoId
        - Upload файла → HLS URL
     d) Предпросмотр:
        - AI-данные (редактируемые)
        - Цена, описание
        - Локация
     ↓
   Публикация:
     POST /api/listings
     {
       category: "car",
       video_id: "vi...",
       title: "Mercedes-Benz C200",
       price: 1500000,
       car_details: {
         brand: "Mercedes-Benz",
         model: "C200",
         year: 2020,
         mileage_km: 45000,
         damages: [...]
       },
       seller_user_id: currentUser.id
     }
     ↓
   Успех → Уведомление
     ↓
   Главная лента (объявление видно всем)

3. Управление объявлениями:
   (tabs)/profile.tsx
     → "Мои объявления"
       → profile/my-listings.tsx
         - GET /api/listings?seller_id=...
         - Редактирование (PUT)
         - Удаление (DELETE)
         - Статистика: просмотры, лайки

4. Общение с покупателями:
   (tabs)/messages.tsx
     - Список активных чатов
     - Уведомления о новых сообщениях
     - Ответы покупателям
```

### AI-анализ для продавца

**Для автомобилей:**
```typescript
{
  brand: "Mercedes-Benz",      // OpenAI GPT-4
  model: "C200",               // OpenAI GPT-4
  year: 2020,                  // OpenAI GPT-4
  mileage_km: 45000,           // Google OCR
  damages: [                    // Google Vision
    { type: "scratch", location: "front_bumper", severity: "minor" },
    { type: "dent", location: "rear_door", severity: "moderate" }
  ],
  condition: "good",            // Вычисляется на основе damages
  conditionScore: 75           // 0-100
}
```

**Для лошадей:**
```typescript
{
  breed: "Arabian",            // AI распознавание породы
  age_years: 5,                // Оценка по внешнему виду
  height_cm: 150,              // AI измерение
  color: "bay",                // AI распознавание
  healthStatus: "healthy"      // AI оценка здоровья
}
```

**Для недвижимости:**
```typescript
{
  property_type: "apartment",  // AI классификация
  area_m2: 65,                 // AI измерение
  rooms: 2,                    // AI подсчет
  floor: 5,                    // OCR (если видно)
  condition: "good"            // AI оценка состояния
}
```

---

## 🛠️ Технический стек

### Frontend (Mobile)
- **Framework:** React Native 0.81 + Expo SDK 54
- **Routing:** Expo Router (file-based)
- **State Management:** Redux Toolkit
- **UI:** React Native компоненты + Ionicons
- **Video Player:** expo-video (useVideoPlayer hook)
- **Camera:** expo-camera, expo-image-picker
- **Storage:** AsyncStorage + SQLite (оффлайн кэш)
- **HTTP Client:** Fetch API + axios
- **Animations:** react-native-reanimated, Animated API
- **Haptics:** expo-haptics

### Backend
- **Framework:** Express.js (Node.js)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (S3-compatible)
- **Realtime:** Supabase Realtime (WebSocket)
- **Auth:** JWT tokens
- **SMS:** nikita.kg API
- **Video:** api.video (HLS streaming)
- **AI:** OpenAI GPT-4 Vision, Google Vision API, Claude

### Инфраструктура
- **Database:** Supabase PostgreSQL
- **File Storage:** Supabase Storage buckets
- **CDN:** api.video CDN (для видео)
- **Backend Hosting:** (настраивается)

---

## 📊 База данных (Supabase)

### Основные таблицы

```sql
-- Пользователи
users (
  id UUID PRIMARY KEY,
  phone VARCHAR UNIQUE,
  name VARCHAR,
  avatar_url TEXT,
  created_at TIMESTAMP
)

-- Объявления
listings (
  id UUID PRIMARY KEY,
  seller_user_id UUID REFERENCES users(id),
  category VARCHAR, -- 'car', 'horse', 'real_estate'
  video_id VARCHAR, -- api.video ID
  video_url TEXT,
  thumbnail_url TEXT,
  title VARCHAR,
  price DECIMAL,
  city VARCHAR,
  status VARCHAR, -- 'draft', 'published', 'sold'
  created_at TIMESTAMP
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

-- Детали лошади
horse_details (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  breed VARCHAR,
  age_years INTEGER,
  height_cm INTEGER,
  color VARCHAR
)

-- Детали недвижимости
real_estate_details (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  property_type VARCHAR,
  area_m2 DECIMAL,
  rooms INTEGER,
  floor INTEGER
)

-- Чат-треды
chat_threads (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Сообщения
chat_messages (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES chat_threads(id),
  sender_id UUID REFERENCES users(id),
  body TEXT,
  created_at TIMESTAMP
)

-- Избранное
favorites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  created_at TIMESTAMP,
  UNIQUE(user_id, listing_id)
)

-- Лайки
likes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  created_at TIMESTAMP,
  UNIQUE(user_id, listing_id)
)

-- Коды верификации
verification_codes (
  id UUID PRIMARY KEY,
  phone VARCHAR,
  code VARCHAR,
  expires_at TIMESTAMP,
  is_used BOOLEAN
)
```

### RLS (Row Level Security) Policies

- **listings:** Все могут читать, только владелец может изменять
- **chat_threads:** Участники могут читать
- **chat_messages:** Участники треда могут читать/писать
- **favorites:** Пользователь видит только свои
- **users:** Публичные поля доступны всем, приватные только владельцу

---

## 🔄 Redux Store Structure

```typescript
{
  feed: {
    currentIndex: number,           // Индекс текущего видео
    activeCategory: 'car' | 'horse' | 'real_estate',
    preloadedIndexes: number[]      // Индексы прелоаженных видео
  },
  
  video: {
    activeVideoId: string | null,
    playingVideoIds: string[],      // Видео в воспроизведении
    mutedVideoIds: string[],        // Видео без звука
    videoCache: {                   // Кэш URL видео
      [id: string]: { url: string, cachedAt: number }
    }
  },
  
  user: {
    currentUser: User | null,
    token: string | null
  },
  
  favorites: {
    items: string[]                 // ID избранных объявлений
  }
}
```

---

## 🎯 Ключевые алгоритмы производительности

### 1. Прелоадинг видео
- Загружаем следующее видео в фоне, когда пользователь смотрит текущее
- Используем `isPreloaded` флаг для оптимизации

### 2. Виртуализация списка
- `FlatList` с `windowSize={3}` (показываем только 3 экрана)
- `removeClippedSubviews={true}` для освобождения памяти

### 3. Кэширование
- Redux кэш для часто используемых данных
- SQLite кэш для оффлайн режима
- AsyncStorage для токенов и настроек

### 4. Оптимизация изображений
- Компрессия перед загрузкой
- Ленивая загрузка превью
- Placeholder'ы во время загрузки

---

## 📝 Заключение

Приложение использует современный стек технологий и оптимизировано для производительности. Основные принципы:

- ✅ Модульная архитектура
- ✅ Разделение ответственности (mobile/backend)
- ✅ Оптимизация для мобильных устройств
- ✅ Оффлайн поддержка
- ✅ Реал-тайм коммуникация
- ✅ AI-автоматизация

**Версия:** 1.0.0  
**Обновлено:** 28 января 2025
