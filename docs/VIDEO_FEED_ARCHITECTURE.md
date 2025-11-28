# Архитектура TikTok-стиль вертикальной видео-ленты

> 📅 Дата анализа: 2025-01-22  
> 📋 Версия: 1.0

## Обзор

Проект использует централизованную систему управления видео через **VideoEngine360V4** для реализации TikTok-стиль вертикальной ленты. Все видео управляются через единый engine на основе индексов, что обеспечивает оптимальную производительность и контроль воспроизведения.

---

## Главный экран ленты

### `app/(tabs)/index.tsx` (1365 строк)

**Описание:** Главный экран приложения с вертикальной видео-лентой в стиле TikTok.

**Функциональность:**
- Использует FlashList для оптимального рендеринга больших списков
- Управляет категориями (Авто, Лошади, Недвижимость)
- Интегрирован с Redux (feedSlice) для глобального состояния
- Использует VideoEngine360V4 для управления воспроизведением
- Обрабатывает onViewableItemsChanged для определения активного видео
- Реализует preloading следующих видео
- Поддерживает pull-to-refresh и автообновление каждые 60 секунд

**Пропсы:** Нет (главный экран)

**Зависимости:**
- `@shopify/flash-list` - FlashList для производительности
- `expo-router` - навигация
- `@reduxjs/toolkit` - Redux store
- `@expo/video` - видео плеер
- `lib/video/videoEngine` - VideoEngine360V4
- `lib/store/slices/feedSlice` - Redux slice для ленты

**Ключевые особенности:**
- `viewabilityConfig.itemVisiblePercentThreshold: 70` - видео запускается когда 70% на экране
- `pagingEnabled` - включен для TikTok-стиль скролла
- `isFeedFocused` - проверка, что feed tab в фокусе (через useSegments)

---

## Hooks для управления видео

### `lib/video/useVideoEngine.ts` (320 строк)

**Описание:** Hook для интеграции компонентов с VideoEngine360V4. Обеспечивает полный lifecycle управления видео с учетом AppState, feed focus и активности карточки.

**Параметры:**
```typescript
interface UseVideoEngineParams {
  id: string;              // listing id
  index: number;           // feed index
  rawUrl: string | null | undefined;
  isVisible: boolean;      // from FlatList onViewableItemsChanged
  isFeedFocused: boolean; // Feed screen is in focus (tab)
}
```

**Возвращает:**
```typescript
interface UseVideoEngineResult {
  player: ReturnType<typeof useVideoPlayer> | null;
  shouldPlay: boolean;
  normalizedUrl: string;
  hasRealVideo: boolean;
  engineState: VideoState | undefined;
}
```

**Функциональность:**
- Нормализует URL один раз через `normalizeVideoUrl()`
- Создает player через `useVideoPlayer` из `@expo/video`
- Регистрирует/обновляет видео в engine
- Привязывает player к engine
- Управляет видимостью через `setActiveIndex`
- Учитывает AppState (active/background/inactive)
- Учитывает isFeedFocused (feed tab в фокусе)

**Видео играет ТОЛЬКО когда:**
1. `isFeedFocused === true` (feed tab в фокусе)
2. `isVisible === true` (currentIndex === index)
3. `AppState === 'active'` (приложение в foreground)

**Зависимости:**
- `@expo/video` - useVideoPlayer
- `lib/video/videoEngine` - VideoEngine360V4
- `lib/video/videoSource` - normalizeVideoUrl, isRealVideo
- `react-native` - AppState

---

### `hooks/useVideo.ts` (127 строк)

**Описание:** Устаревший hook для управления видео (legacy). Используется в старых компонентах.

**Параметры:** Нет

**Возвращает:**
```typescript
interface UseVideoReturn {
  videos: VideoData[];
  loading: boolean;
  error: string | null;
  currentVideo: VideoData | null;
  currentIndex: number;
  playVideo: (index: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  likeVideo: (videoId: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
  loadMoreVideos: () => Promise<void>;
}
```

**Зависимости:**
- `expo-video` (устаревший)

**Статус:** ⚠️ Legacy - рекомендуется использовать useVideoEngine

---

## Ядро видеодвижка

### `lib/video/videoEngine.ts` (815 строк)

**Описание:** Класс VideoEngine360V4 - центральная система управления видео для TikTok-стиль ленты. Production-grade система с index-oriented control, preloading window, memory management и retry logic.

**Архитектура:**
- Singleton паттерн через `getVideoEngine()`
- Управление на основе индексов (index-oriented)
- Preloading window (2 вперед, 1 назад по умолчанию)
- Автоматическая очистка далеких видео
- Retry logic с exponential backoff

**Основные методы:**

```typescript
// Регистрация видео
registerOrUpdateVideo(reg: VideoRegistration): void

// Обновление индекса при изменении данных
updateVideoIndex(id: string, newIndex: number): void

// Привязка player instance
setPlayer(id: string, player: ExpoVideoPlayer | null): void

// Установка активного индекса (из onViewableItemsChanged)
setActiveIndex(index: number): void

// Воспроизведение с retry logic
async play(id: string): Promise<void>

// Пауза
pause(id: string): void

// Пауза всех видео
pauseAll(): void

// Очистка всех видео
clear(): void

// Получение состояния
getState(id: string): VideoState | undefined

// Статистика для отладки
getStats(): { totalVideos, activeIndex, activeId, cachedIds, preloadWindowIndices }
```

**Конфигурация:**
```typescript
interface VideoEngineConfig {
  preloadAhead: number;        // 2 по умолчанию
  preloadBehind: number;       // 1 по умолчанию
  maxCachedVideos: number;     // 5 по умолчанию
  bufferTimeMs: number;        // 500ms iOS, 800ms Android
  loadTimeoutMs: number;       // 10000ms
  maxRetries: number;          // 3
  autoPauseOffScreen: boolean;  // true
}
```

**Зависимости:**
- `@expo/video` - тип ExpoVideoPlayer
- `lib/video/preloadManager` - менеджер предзагрузки

**Особенности:**
- Android warm-up для первого видео (cold start fix)
- Debounced preloading (100ms)
- Автоматическая очистка далеких видео вне preload window
- Retry с exponential backoff (1s, 2s, 4s)
- Обработка Android surface lost errors

---

### `lib/video/videoSource.ts` (290 строк)

**Описание:** Production-grade утилиты для нормализации VideoSource. Поддерживает извлечение URL из любых структур (Optional, объекты, JSON).

**Основные функции:**

```typescript
// Нормализация URL (основная функция)
normalizeVideoUrl(input: unknown): string

// Строгая нормализация (с дополнительными проверками)
normalizeVideoUrlStrict(input: unknown): string

// Проверка валидности URL
isValidVideoSource(source: unknown): source is string

// Проверка реального видео (не placeholder)
isRealVideo(url: string): boolean

// Проверка локального файла
isLocalFile(url: string): boolean

// Проверка blob URL
isBlobUrl(url: string): boolean

// Проверка временного URL
isTemporaryUrl(url: string): boolean

// Проверка устаревшего URL
isStaleUrl(url: string): boolean
```

**Поддержка:**
- Nested Optional до 20 уровней
- Локальные файлы (file://, content://, asset://)
- Blob URLs (blob:)
- Временные URL из camera
- Stale URLs с проверкой expires
- Объекты с вложенными URL
- JSON строки с URL
- Нативные Optional типы (Swift/Objective-C)

**Fallback:** PLACEHOLDER_VIDEO_URL (BigBuckBunny.mp4)

**Зависимости:**
- `@/utils/logger` - appLogger

---

## Компоненты видео-карточек

### `components/VideoFeed/EnhancedVideoCard.tsx` (410 строк)

**Описание:** Основная карточка видео для ленты. Использует EngineVideoPlayer для воспроизведения и отображает UI в стиле TikTok 2025.

**Пропсы:**
```typescript
interface EnhancedVideoCardProps {
  listing: Listing & {
    category?: string;
    is_favorited?: boolean;
    is_saved?: boolean;
    is_liked?: boolean;
    likes_count?: number;
    comments_count?: number;
    video_id?: string;
    video_url?: string;
    thumbnail_url?: string;
    additional_images?: string[];
    media?: { url: string }[];
    details?: Record<string, unknown>;
    location?: string;
    city?: string;
    seller?: { id: string; name?: string; avatar_url?: string };
  };
  index: number;              // Feed index - REQUIRED for VideoEngine360V4
  isActive: boolean;          // Текущее видео активно
  isPreloaded: boolean;       // Видео предзагружено
  isFeedFocused: boolean;    // Feed screen is in focus (tab)
  onLike: () => void;
  onFavorite: () => void;
  onComment: () => void;
  onShare: () => void;
}
```

**UI элементы:**
- Видео через EngineVideoPlayer
- Цена и информация (матовая карточка слева внизу)
- Панель действий справа (TikTok 2025 стиль):
  - Сообщение продавцу
  - Поделиться
  - Лайк (с анимацией при двойном тапе)
  - Комментарий
  - Избранное
  - Mute/Unmute
- Анимация лайка при двойном тапе

**Зависимости:**
- `@expo/video` - VideoView
- `lib/video/useVideoEngine` - через EngineVideoPlayer
- `@reduxjs/toolkit` - для mute состояния
- `expo-router` - навигация
- `expo-haptics` - тактильная обратная связь
- `components/animations/LikeAnimation` - анимация лайка

**Оптимизация:**
- React.memo с кастомной функцией сравнения
- Мемоизация вычислений через useMemo

---

### `components/VideoFeed/EngineVideoPlayer.tsx` (306 строк)

**Описание:** UI-обертка для VideoEngine360V4. Оборачивает @expo/video VideoView и использует useVideoEngine для интеграции с engine.

**Пропсы:**
```typescript
interface EngineVideoPlayerProps {
  id: string;                // listing id
  index: number;             // feed index
  rawUrl: string | null | undefined;
  isVisible: boolean;        // Текущее видео видимо
  isFeedFocused: boolean;    // Feed screen is in focus (tab)
  posterUrl?: string | null;
  mutedByDefault?: boolean;
}
```

**Функциональность:**
- Использует useVideoEngine для интеграции с VideoEngine360V4
- Управляет воспроизведением через shouldPlay из Engine
- Показывает preloader "Грузим красавца..." при буферизации
- Показывает watermark "360" при воспроизведении
- Обработка ошибок с retry кнопкой
- Fallback на poster при отсутствии видео
- Android-оптимизации для mute

**Зависимости:**
- `@expo/video` - VideoView, useVideoPlayer
- `lib/video/useVideoEngine` - интеграция с engine
- `lib/video/videoEngine` - getVideoEngine для fallback
- `expo-image` - Image для poster
- `react-native` - ActivityIndicator, Pressable

**Особенности:**
- Fallback play через 300ms если engine не запустил видео
- React.memo с кастомной функцией сравнения
- Android-specific mute handling

---

### `components/VideoFeed/VideoPlayer.tsx` (102 строки)

**Описание:** Простой компонент видео-плеера. Используется в других местах приложения (не в основной ленте).

**Пропсы:**
```typescript
interface Props {
  url: string | undefined | null;
  isActive: boolean;
  muted?: boolean;
}
```

**Функциональность:**
- Нормализует URL через normalizeVideoUrl
- Создает player через useVideoPlayer
- Управляет play/pause через isActive
- Настраивает loop и muted

**Зависимости:**
- `@expo/video` - VideoView, useVideoPlayer
- `lib/video/videoSource` - normalizeVideoUrl, isRealVideo

**Статус:** ✅ Активен (используется в детальных экранах)

---

### `components/Feed/ListingVideoPlayer.tsx` (434 строки)

**Описание:** Альтернативный компонент для отображения видео с информацией о листинге. Используется в некоторых местах.

**Пропсы:**
```typescript
interface ListingVideoPlayerProps {
  listing: Listing;
  isActive: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
}
```

**Функциональность:**
- Нормализует videoUrl через normalizeVideoUrl
- Создает player через useVideoPlayer
- Управляет play/pause через isActive
- Отображает информацию о листинге (цена, детали, продавец)
- Боковые действия (лайк, комментарий, шаринг, сохранение)

**Зависимости:**
- `@expo/video` - VideoView, useVideoPlayer
- `lib/video/videoSource` - normalizeVideoUrl, isRealVideo
- `@/types` - Listing, isCarListing, isHorseListing

**Статус:** ⚠️ Альтернативная реализация

---

### `components/video/SimpleVideoPlayer.tsx` (209 строк)

**Описание:** Простой автономный видео-плеер. Используется в детальных экранах (например, app/listing/[id].tsx).

**Пропсы:**
```typescript
interface SimpleVideoPlayerProps {
  videoUrl: string | null | undefined;
  posterUrl?: string | null;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}
```

**Функциональность:**
- Автономный плеер (не интегрирован с VideoEngine)
- Управление через autoplay prop
- Показывает poster при отсутствии видео
- Обработка ошибок

**Зависимости:**
- `@expo/video` - VideoView, useVideoPlayer
- `expo-image` - Image для poster

**Статус:** ✅ Активен (используется в детальных экранах)

---

## Альтернативный компонент ленты

### `components/VideoFeed/TikTokStyleFeed.tsx` (590 строк)

**Описание:** Альтернативная реализация TikTok-стиль ленты. Используется в некоторых местах (например, при переходе из детального экрана).

**Пропсы:**
```typescript
interface VideoFeedProps {
  initialCarId?: string;
}
```

**Функциональность:**
- Использует FlatList вместо FlashList
- Загружает только авто с видео
- Использует VideoEngine360V4 для управления
- Отображает информацию об авто и действия

**Зависимости:**
- `@expo/video` - через EngineVideoPlayer
- `lib/video/videoEngine` - VideoEngine360V4
- `expo-router` - навигация
- `expo-linear-gradient` - градиенты

**Статус:** ⚠️ Альтернативная реализация

---

## Redux Store (состояние ленты)

### `lib/store/slices/feedSlice.ts` (68 строк)

**Описание:** Redux slice для состояния ленты. Управляет текущим индексом, активной категорией, предзагруженными индексами и просмотренными объявлениями.

**State:**
```typescript
interface FeedState {
  currentIndex: number;           // Текущий индекс видео
  activeCategory: string;         // Активная категория (cars/horses/real_estate)
  preloadedIndexes: number[];      // Массив предзагруженных индексов
  viewedListings: string[];        // Массив просмотренных ID
  lastViewedTime: Record<string, number>; // ID -> timestamp
}
```

**Actions:**
- `setCurrentIndex(index: number)` - установить текущий индекс
- `setActiveCategory(category: string)` - установить активную категорию
- `addPreloadedIndex(index: number)` - добавить индекс в preload
- `removePreloadedIndex(index: number)` - удалить индекс из preload
- `clearPreloadedIndexes()` - очистить все preload индексы
- `markListingAsViewed(id: string)` - отметить как просмотренное
- `resetFeed()` - сбросить состояние ленты

**Зависимости:**
- `@reduxjs/toolkit` - createSlice

**Использование:**
- В `app/(tabs)/index.tsx` для управления состоянием ленты
- В компонентах через `useAppSelector` и `useAppDispatch`

---

### `lib/store/slices/videoSlice.ts` (72 строки)

**Описание:** Redux slice для состояния видео. Управляет активным видео, играющими видео, muted видео и кэшем URL.

**State:**
```typescript
interface VideoPlayerState {
  activeVideoId: string | null;           // ID активного видео
  playingVideoIds: string[];              // Массив играющих видео
  mutedVideoIds: string[];                // Массив muted видео
  videoCache: Record<string, {            // Кэш URL видео
    url: string;
    cachedAt: number;
  }>;
}
```

**Actions:**
- `setActiveVideo(id: string | null)` - установить активное видео
- `addPlayingVideo(id: string)` - добавить в играющие
- `removePlayingVideo(id: string)` - удалить из играющих
- `toggleMuteVideo(id: string)` - переключить mute
- `cacheVideoUrl({ id, url })` - кэшировать URL
- `clearVideoCache()` - очистить кэш
- `clearOldCache(ageMs: number)` - очистить старый кэш

**Зависимости:**
- `@reduxjs/toolkit` - createSlice

**Использование:**
- В `components/VideoFeed/EnhancedVideoCard.tsx` для mute состояния

---

## Схема потока данных

```
┌─────────────────────────────────────────────────────────────┐
│              app/(tabs)/index.tsx                           │
│  (Главный экран с FlashList)                                │
│  - Управляет категориями                                     │
│  - onViewableItemsChanged → setCurrentIndex                  │
│  - videoEngine.setActiveIndex(index)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         EnhancedVideoCard                                    │
│  (Карточка видео с UI)                                       │
│  - Отображает информацию и действия                         │
│  - Передает isActive, isFeedFocused                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         EngineVideoPlayer                                    │
│  (UI-обертка для VideoView)                                  │
│  - Показывает preloader, watermark, ошибки                  │
│  - Использует useVideoEngine                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         useVideoEngine (hook)                                │
│  (Интеграция с engine)                                       │
│  - Нормализует URL                                           │
│  - Создает player                                            │
│  - Регистрирует в engine                                     │
│  - Учитывает AppState, isFeedFocused, isVisible              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         VideoEngine360V4                                     │
│  (Ядро движка)                                               │
│  - Управляет всеми видео через индексы                      │
│  - Preloading, cleanup, retry logic                         │
│  - setActiveIndex → play/pause всех видео                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         @expo/video                                          │
│  (Нативный видео-плеер)                                      │
│  - VideoView, useVideoPlayer                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Ключевые принципы архитектуры

1. **Централизованное управление**: Все видео управляются через единый VideoEngine360V4
2. **Index-oriented**: Управление на основе индексов, а не ID (для производительности)
3. **Preloading window**: Автоматическая предзагрузка соседних видео
4. **Memory management**: Автоматическая очистка далеких видео
5. **Retry logic**: Автоматические повторы с exponential backoff
6. **State synchronization**: Redux для состояния ленты, engine для воспроизведения
7. **AppState awareness**: Видео останавливается при уходе в background
8. **Feed focus awareness**: Видео играет только когда feed tab в фокусе

---

## Зависимости между модулями

```
app/(tabs)/index.tsx
  ├── lib/store/slices/feedSlice.ts (Redux)
  ├── lib/video/videoEngine.ts (VideoEngine360V4)
  └── components/VideoFeed/EnhancedVideoCard.tsx
      ├── components/VideoFeed/EngineVideoPlayer.tsx
      │   ├── lib/video/useVideoEngine.ts
      │   │   ├── lib/video/videoEngine.ts
      │   │   └── lib/video/videoSource.ts
      │   └── @expo/video
      └── lib/store/slices/videoSlice.ts (Redux)
```

---

## Рекомендации по использованию

### ✅ Используйте для новой разработки:

1. **EnhancedVideoCard** + **EngineVideoPlayer** + **useVideoEngine** - для основной ленты
2. **VideoEngine360V4** - для управления воспроизведением
3. **normalizeVideoUrl** - для нормализации URL
4. **feedSlice** - для состояния ленты
5. **videoSlice** - для mute состояния

### ⚠️ Legacy (старая версия):

1. **useVideo** (hooks/useVideo.ts) - устаревший hook
2. **ListingVideoPlayer** - альтернативная реализация
3. **TikTokStyleFeed** - альтернативная лента (используется в некоторых местах)

### ✅ Для детальных экранов:

1. **SimpleVideoPlayer** - автономный плеер для детальных экранов

---

## Отладка

### Логирование

Все модули используют `appLogger` для логирования:
- `[VideoEngine360V4]` - логи engine
- `[useVideoEngine]` - логи hook
- `[EngineVideoPlayer]` - логи компонента
- `[Feed]` - логи главного экрана

### Статистика engine

```typescript
const engine = getVideoEngine();
const stats = engine.getStats();
// { totalVideos, activeIndex, activeId, cachedIds, preloadWindowIndices }
```

### Состояние видео

```typescript
const engine = getVideoEngine();
const state = engine.getState(videoId);
// { id, index, url, player, isPreloaded, isPlaying, isBuffering, error, retryCount }
```

---

## Производительность

### Оптимизации:

1. **FlashList** вместо FlatList для основной ленты
2. **React.memo** с кастомной функцией сравнения для карточек
3. **Preloading window** - предзагрузка только соседних видео
4. **Memory cleanup** - автоматическая очистка далеких видео
5. **Debounced preloading** - 100ms debounce для preload
6. **Viewability threshold** - 70% для запуска видео (как в TikTok)

### Конфигурация производительности:

```typescript
// FlashList props
estimatedItemSize: SCREEN_HEIGHT
drawDistance: SCREEN_HEIGHT * 2

// Viewability
itemVisiblePercentThreshold: 70
minimumViewTime: 100

// Preloading
preloadAhead: 2
preloadBehind: 1
maxCachedVideos: 5
```

---

## Известные проблемы и решения

### Android surface lost

**Проблема:** Android может потерять surface при переключении между приложениями.

**Решение:** Проверка `player.play` перед вызовом, retry logic с exponential backoff.

### Первое видео не играет

**Проблема:** Первое видео может не запуститься сразу при загрузке.

**Решение:** Инициализация первого видео через 200ms timeout в `app/(tabs)/index.tsx`.

### Optional URL обертки

**Проблема:** URL могут приходить в Optional обертках из нативного кода.

**Решение:** `normalizeVideoUrl` извлекает URL из любых структур (до 20 уровней вложенности).

---

## Миграция с legacy кода

### Замена useVideo на useVideoEngine:

```typescript
// ❌ Старый способ
const { currentVideo, playVideo } = useVideo();

// ✅ Новый способ
const { player, shouldPlay } = useVideoEngine({
  id: listing.id,
  index: index,
  rawUrl: listing.video_url,
  isVisible: isActive,
  isFeedFocused: isFeedFocused,
});
```

### Замена ListingVideoPlayer на EngineVideoPlayer:

```typescript
// ❌ Старый способ
<ListingVideoPlayer
  listing={listing}
  isActive={isActive}
  onLike={handleLike}
/>

// ✅ Новый способ
<EngineVideoPlayer
  id={listing.id}
  index={index}
  rawUrl={listing.video_url}
  isVisible={isActive}
  isFeedFocused={isFeedFocused}
  posterUrl={listing.thumbnail_url}
/>
```

---

## Тестирование

### Unit тесты:

- `lib/video/videoSource.ts` - нормализация URL
- `lib/video/videoEngine.ts` - логика engine

### Integration тесты:

- `useVideoEngine` - интеграция с engine
- `EnhancedVideoCard` - рендеринг карточки

### E2E тесты:

- Скролл ленты
- Переключение видео
- Preloading
- Memory cleanup

---

## Changelog

### 2025-01-22
- Создана документация архитектуры видеодвижка
- Описаны все модули и их зависимости
- Добавлены схемы потока данных
- Добавлены рекомендации по использованию

---

## Контакты

При возникновении вопросов или проблем с видеодвижком, обращайтесь к команде разработки.


