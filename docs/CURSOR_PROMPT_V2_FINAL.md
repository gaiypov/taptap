# 🚀 Cursor AI Prompt V2 - Final (с полной архитектурой)

## Контекст проекта

**360° Auto MVP** — TikTok-style видеомаркетплейс для покупки и продажи автомобилей, лошадей и недвижимости.

### Технический стек
- **Frontend:** React Native 0.81 + Expo SDK 54 + Expo Router
- **Backend:** Express.js + Supabase (PostgreSQL)
- **Video:** api.video (HLS streaming)
- **AI:** OpenAI GPT-4 Vision, Google Vision API
- **Auth:** SMS (nikita.kg API)
- **State:** Redux Toolkit + RTK Query

---

## 📐 Архитектура приложения

### Redux Store Structure

```typescript
// lib/store/index.ts
{
  api: apiSlice.reducer,        // RTK Query
  feed: feedReducer,            // Feed state
  auth: authReducer,            // Auth state
  video: videoReducer,          // Video state
  offline: offlineReducer       // Offline mode
}

// lib/store/slices/feedSlice.ts
{
  currentIndex: number,           // Текущий индекс видео
  activeCategory: 'car' | 'horse' | 'real_estate',
  preloadedIndexes: number[],     // Прелоаженные индексы
  viewedListings: string[],       // Просмотренные объявления
  lastViewedTime: Record<string, number>
}

// lib/store/slices/videoSlice.ts
{
  activeVideoId: string | null,
  playingVideoIds: string[],
  mutedVideoIds: string[],        // Массив ID видео без звука
  videoCache: {                    // Кэш URL видео
    [id: string]: { url: string, cachedAt: number }
  }
}

// lib/store/slices/authSlice.ts
{
  currentUser: User | null,
  token: string | null,
  isAuthenticated: boolean
}
```

### Backend API Endpoints

```typescript
// Auth
POST /api/auth/request-code      // { phone: "+996..." }
POST /api/auth/verify-code        // { phone, code: "1234" }

// Listings
GET  /api/listings/feed           // ?category=car&limit=20&offset=0
GET  /api/listings/:id
POST /api/listings                // Create listing
PUT  /api/listings/:id
DELETE /api/listings/:id

// Chat
GET  /api/chat/threads            // User's chat threads
POST /api/chat/start              // { listing_id, buyer_id, seller_id }
GET  /api/chat/thread/:id/messages
POST /api/chat/thread/:id/message // { body: "text" }

// AI Analysis
POST /api/analyze-car             // { videoFrames: string[] }
```

### База данных (Supabase)

**Основные таблицы:**
- `users` - Пользователи
- `listings` - Объявления (с `video_id` от api.video)
- `car_details`, `horse_details`, `real_estate_details` - Детали по категориям
- `listing_likes` - Лайки (ВАЖНО: использовать `listing_likes`, НЕ `likes`)
- `listing_saves` - Избранное (favorites)
- `chat_threads` - Чаты
- `chat_messages` - Сообщения
- `verification_codes` - SMS коды (4 цифры)

**RLS Policies:**
- `listings`: все читают, только владелец изменяет
- `chat_threads`: участники могут читать
- `listing_likes`: все видят, авторизованные могут лайкать

### AI Analysis Algorithm

```typescript
// Для автомобилей:
analyzeCarVideo(videoUri) → {
  1. Извлечение кадров (5 кадров: 0s, 5s, 10s, 20s, 30s)
  2. Параллельный анализ:
     - OpenAI GPT-4: марка, модель, год, цвет
     - Google OCR: пробег (одометр)
     - Google Vision: повреждения
  3. Результат: { brand, model, year, mileage_km, damages, condition }
}

// Для лошадей:
analyzeHorseVideo(videoUri) → {
  breed, age_years, height_cm, color, healthStatus
}

// Для недвижимости:
analyzeRealEstateVideo(videoUri) → {
  property_type, area_m2, rooms, floor, condition
}
```

### Video Preloading Implementation

```typescript
// app/(tabs)/index.tsx
// Прелоадер загружает следующее видео в фоне
const preloadNextVideo = useCallback((currentIndex: number) => {
  const nextIndex = currentIndex + 1;
  if (nextIndex < listings.length && !preloadedIndexes.includes(nextIndex)) {
    dispatch(addPreloadedIndex(nextIndex));
    // Видео загружается через OptimizedVideoPlayer с isPreloaded=true
  }
}, [listings.length, preloadedIndexes, dispatch]);
```

### Currency Conversion

```typescript
// constants/currency.ts
// Конвертация валют (сомы ↔ доллары/евро)
const CURRENCIES = {
  KGS: { symbol: 'сом', rate: 1 },
  USD: { symbol: '$', rate: 89.5 },
  EUR: { symbol: '€', rate: 98.2 }
};
```

---

## 🎯 Задачи для выполнения

### Задача #1: Quick Performance Wins

#### 1. FlashList вместо FlatList

**Файл:** `app/(tabs)/index.tsx`

**Текущий код:**
```typescript
import { FlatList } from 'react-native';

<FlatList
  ref={flatListRef}
  data={listings}
  renderItem={renderItem}
  // ... props
/>
```

**Действие:**
1. Установить: `npm install @shopify/flash-list`
2. Заменить `FlatList` на `FlashList`
3. Добавить `estimatedItemSize={SCREEN_HEIGHT}` для оптимизации

**Ожидаемый результат:** Улучшение производительности на 30-50% для больших списков

---

#### 2. expo-image для кэширования

**Файлы:** `components/VideoFeed/EnhancedVideoCard.tsx`, все компоненты с `<Image>`

**Текущий код:**
```typescript
import { Image } from 'react-native';

<Image source={{ uri: thumbnailUrl }} />
```

**Действие:**
1. Заменить `react-native` Image на `expo-image`
2. Использовать `<Image source={{ uri }} />` из `expo-image`
3. Добавить `cachePolicy="memory-disk"` для кэширования

**Ожидаемый результат:** Автоматическое кэширование изображений, быстрая загрузка

---

#### 3. Skeleton Loaders

**Файл:** `components/common/SkeletonLoader.tsx` (создать)

**Действие:**
1. Создать компонент `SkeletonLoader` с анимацией
2. Использовать в `app/(tabs)/index.tsx` при `loading={true}`
3. Показывать skeleton вместо `ActivityIndicator` для лучшего UX

**Ожидаемый результат:** Улучшенный UX при загрузке

---

#### 4. Haptic Feedback

**Статус:** ✅ Уже реализовано через `expo-haptics`

**Проверить:**
- Использование `Haptics.impactAsync()` в:
  - Лайки (`EnhancedVideoCard.tsx`)
  - Переключение звука
  - Комментарии
  - Поделиться

---

#### 5. Empty States

**Файл:** `app/(tabs)/index.tsx`

**Текущий код:**
```typescript
ListEmptyComponent={
  !loading && listings.length === 0 ? (
    <View style={styles.emptyContainer}>
      <Ionicons name="videocam-off" size={64} />
      <Text>Нет объявлений</Text>
    </View>
  ) : null
}
```

**Действие:**
1. Улучшить дизайн empty state
2. Добавить кнопку "Обновить" или "Создать объявление"
3. Показывать для каждой категории отдельно

---

#### 6. Instant Search

**Файл:** `app/(tabs)/search.tsx`

**Действие:**
1. Добавить debounce (300ms) для поискового запроса
2. Показывать результаты по мере ввода
3. Кэшировать результаты поиска в Redux
4. Показывать историю поиска

---

## 📋 Checklist перед началом работы

- [x] Таблицы: `listing_likes`, `listing_saves` используются
- [x] Onboarding: `IntroCarousel.tsx` существует
- [x] SMS: 4 цифры (исправлено в `authService.ts`)
- [x] Expo: SDK 54 (проверено)
- [x] Redux: структура соответствует (4 slices)

---

## 🔧 Команды для начала работы

```bash
# 1. Скопировать обновленные правила
cp .cursorrules-UPDATED .cursorrules

# 2. Установить FlashList
npm install @shopify/flash-list

# 3. Проверить установку expo-image (уже должно быть)
npm list expo-image

# 4. Начать работу над задачей #1
# Открыть app/(tabs)/index.tsx и заменить FlatList на FlashList
```

---

## 💡 Важные напоминания

1. **Всегда используй `listing_likes`, НЕ `likes`**
2. **Redux slices находятся в `lib/store/slices/`**
3. **Backend API base URL: `http://192.168.1.16:3001/api` (dev)**
4. **SMS код: 4 цифры по умолчанию**
5. **Video ID хранится в `listings.video_id` (api.video ID)**
6. **HLS URL получается через `apiVideo.getHLSUrl(videoId)`**

---

## 🎨 Стиль кода

- Используй TypeScript строгий режим
- Компоненты: PascalCase, функциональные с хуками
- Hooks: `useXxx.ts`, начинаются с `use`
- Services: `xxx.ts`, экспортируют объекты с методами
- Redux: создай action creators через `createSlice`

---

## 📚 Дополнительные ресурсы

- **Архитектура:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Проверка:** [docs/CHECK_REPORT.md](docs/CHECK_REPORT.md)
- **API документация:** см. `docs/ARCHITECTURE.md` раздел "API и интеграции"

---

## 🚀 Готов начать работу!

Скопируй этот промпт в Cursor Chat и начни с задачи #1: FlashList вместо FlatList.

