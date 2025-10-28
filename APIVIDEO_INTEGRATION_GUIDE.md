# 📹 Интеграция api.video - Полное руководство

## 📋 Оглавление

1. [Обзор](#обзор)
2. [Что такое api.video](#что-такое-apivideo)
3. [Установка](#установка)
4. [Конфигурация](#конфигурация)
5. [Компоненты](#компоненты)
6. [База данных](#база-данных)
7. [Использование](#использование)
8. [API Reference](#api-reference)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Обзор

api.video - это облачная платформа для хостинга, обработки и стриминга видео. Интегрирована в 360Auto для:

- ✅ **Загрузка видео** - с прогресс-баром и оптимизацией
- ✅ **HLS стриминг** - адаптивное качество для любой скорости
- ✅ **Автоматические миниатюры** - генерация thumbnail'ов
- ✅ **Кодирование** - конвертация в множество форматов
- ✅ **CDN доставка** - быстрая загрузка по всему миру
- ✅ **Аналитика** - просмотры, лайки, engagement

---

## 📺 Что такое api.video

**api.video** - это Video API платформа, которая предоставляет:

### Ключевые возможности:

1. **Upload API** - загрузка видео через API
2. **Live Streaming** - прямые трансляции
3. **Player SDK** - встраиваемый плеер
4. **Video Encoding** - автоматическое кодирование
5. **CDN Distribution** - глобальная доставка контента
6. **Analytics** - детальная статистика

### Почему api.video для 360Auto?

- 🚀 **Быстро** - загрузка и обработка за секунды
- 💰 **Доступно** - free tier до 1 TB трафика
- 📱 **Мобильно** - SDK для React Native
- 🌍 **Глобально** - CDN в 100+ странах
- 📊 **Аналитика** - встроенная статистика

---

## 🔧 Установка

### Пакеты установлены:

```bash
npm install @api.video/nodejs-client axios
```

### Файлы созданы:

```
services/
  └── apiVideo.ts          # Основной сервис

components/
  ├── Upload/
  │   └── VideoUploader.tsx   # Загрузка видео
  └── VideoFeed/
      ├── TikTokStyleFeed.tsx # TikTok-style лента
      └── VideoPlayer.tsx     # Обновлен с api.video

supabase-apivideo-functions.sql  # SQL функции
```

---

## ⚙️ Конфигурация

### 1. Получить API ключи

Зарегистрируйтесь на [api.video](https://dashboard.api.video):

1. Создайте аккаунт
2. Создайте проект
3. Получите API Key и Upload Token

### 2. Добавить в `.env` или EAS Secrets

```bash
# api.video Configuration
EXPO_PUBLIC_APIVIDEO_API_KEY=your_api_key_here
EXPO_PUBLIC_APIVIDEO_UPLOAD_TOKEN=your_upload_token_here
```

### 3. Настроить EAS Secrets (для production)

```bash
# Добавить секреты
eas secret:create --name APIVIDEO_API_KEY --value "your_api_key" --type string
eas secret:create --name APIVIDEO_UPLOAD_TOKEN --value "your_upload_token" --type string
```

### 4. Применить SQL схему

```bash
psql -h your-supabase-host -U postgres -d postgres < supabase-apivideo-functions.sql
```

---

## 🧩 Компоненты

### 1. VideoUploader

Компонент для загрузки видео с камеры или галереи.

**Файл:** `components/Upload/VideoUploader.tsx`

**Использование:**

```tsx
import VideoUploader from '@/components/Upload/VideoUploader';

export default function UploadScreen() {
  const handleUploadComplete = (videoId: string, videoUrl: string) => {
    console.log('Video uploaded!', videoId);
    // Сохранить в БД, перейти на другой экран, и т.д.
  };

  return (
    <VideoUploader
      onUploadComplete={handleUploadComplete}
      carId="optional-car-id"
    />
  );
}
```

**Функции:**

- Запись видео с камеры
- Выбор видео из галереи
- Прогресс-бар загрузки
- Предпросмотр перед загрузкой
- Автоматическое сохранение в Supabase

### 2. TikTokStyleFeed

Вертикальная лента видео в стиле TikTok.

**Файл:** `components/VideoFeed/TikTokStyleFeed.tsx`

**Использование:**

```tsx
import TikTokStyleFeed from '@/components/VideoFeed/TikTokStyleFeed';

export default function FeedScreen() {
  return <TikTokStyleFeed />;
}
```

**Особенности:**

- ✅ Вертикальный scroll с snap
- ✅ Автоплей активного видео
- ✅ Pause при уходе с экрана
- ✅ Preloading следующих видео
- ✅ Лайки, сохранения, шеринг
- ✅ Трекинг просмотров

### 3. VideoPlayer (обновлен)

Улучшенный плеер с трекингом api.video.

**Файл:** `components/VideoFeed/VideoPlayer.tsx`

**Обновления:**

- ✅ Поддержка `video_id` из api.video
- ✅ Автоматический HLS URL
- ✅ Трекинг просмотров (>3 сек)
- ✅ Синхронизация с api.video метриками

---

## 🗄️ База данных

### Обновления схемы:

```sql
-- Добавлено поле video_id
ALTER TABLE cars ADD COLUMN video_id TEXT;

-- Индексы
CREATE INDEX idx_cars_video_id ON cars(video_id);
CREATE INDEX idx_cars_trending ON cars(views DESC, created_at DESC);
```

### SQL Функции:

#### `increment_views(listing_id UUID)`

Увеличить счетчик просмотров:

```typescript
await db.incrementViews(carId);
```

#### `increment_likes(car_uuid UUID)`

Увеличить счетчик лайков:

```typescript
await supabase.rpc('increment_likes', { car_uuid: carId });
```

#### `get_trending_cars(time_period, limit)`

Получить трендовые авто за период:

```typescript
const { data } = await supabase.rpc('get_trending_cars', {
  time_period: '7 days',
  result_limit: 20
});
```

#### `get_high_engagement_cars(limit)`

Получить авто с высоким engagement:

```typescript
const { data } = await supabase.rpc('get_high_engagement_cars', {
  result_limit: 20
});
```

---

## 💻 Использование

### Загрузка видео

```typescript
import apiVideoService from '@/services/apiVideo';

// 1. Загрузить видео
const result = await apiVideoService.uploadVideo(
  fileUri,
  (progress) => {
    console.log(`Загружено: ${progress.percentage}%`);
  }
);

console.log('Video ID:', result.videoId);

// 2. Получить URLs
const hlsUrl = apiVideoService.getHLSUrl(result.videoId);
const thumbnailUrl = apiVideoService.getThumbnailUrl(result.videoId);

// 3. Сохранить в Supabase
await db.updateCar(carId, {
  video_id: result.videoId,
  video_url: hlsUrl,
  thumbnail_url: thumbnailUrl,
});
```

### Получение информации о видео

```typescript
const videoInfo = await apiVideoService.getVideo(videoId);

console.log('Title:', videoInfo.title);
console.log('HLS URL:', videoInfo.hls);
console.log('Thumbnail:', videoInfo.thumbnail);
```

### Обновление метаданных

```typescript
await apiVideoService.updateVideo(videoId, {
  title: 'Toyota Camry 2020',
  description: 'Отличное состояние',
  tags: ['toyota', 'camry', 'sedan'],
  metadata: {
    price: '1500000',
    mileage: '50000',
  }
});
```

### Трекинг просмотров

```typescript
// Автоматически в VideoPlayer
// Вручную:
await apiVideoService.incrementViews(videoId);
```

### Удаление видео

```typescript
await apiVideoService.deleteVideo(videoId);
```

---

## 📚 API Reference

### `apiVideoService`

#### Методы:

| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `createVideo()` | `metadata` | `{ videoId, uploadToken }` | Создать новое видео |
| `uploadVideo()` | `fileUri, onProgress?` | `VideoMetadata` | Загрузить видео |
| `uploadWithToken()` | `fileUri, token, onProgress?` | `VideoMetadata` | Загрузить с upload token |
| `getVideo()` | `videoId` | `VideoMetadata & VideoAssets` | Получить информацию |
| `updateVideo()` | `videoId, updates` | `void` | Обновить метаданные |
| `deleteVideo()` | `videoId` | `void` | Удалить видео |
| `getHLSUrl()` | `videoId` | `string` | HLS streaming URL |
| `getMp4Url()` | `videoId, quality?` | `string` | MP4 download URL |
| `getThumbnailUrl()` | `videoId, time?` | `string` | Thumbnail URL |
| `getEmbedUrl()` | `videoId` | `string` | Embed iframe URL |
| `listVideos()` | `page?, pageSize?` | `VideoMetadata[]` | Список всех видео |
| `getVideoStats()` | `videoId` | `{ views, likes }` | Статистика |
| `incrementLikes()` | `videoId` | `void` | +1 лайк |
| `incrementViews()` | `videoId` | `void` | +1 просмотр |

#### Типы:

```typescript
interface VideoMetadata {
  videoId: string;
  title?: string;
  description?: string;
  public?: boolean;
  tags?: string[];
  metadata?: Record<string, string>;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface VideoAssets {
  hls: string;
  mp4: string;
  thumbnail: string;
  iframe: string;
}
```

---

## 🎯 Best Practices

### 1. Оптимизация загрузки

```typescript
// ✅ ХОРОШО: Сжатие видео перед загрузкой
import * as ImageManipulator from 'expo-image-manipulator';

const compressedVideo = await ImageManipulator.manipulateAsync(
  videoUri,
  [],
  { compress: 0.8 } // 80% качества
);
```

### 2. Обработка ошибок

```typescript
// ✅ ХОРОШО: Retry логика
async function uploadWithRetry(uri: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiVideoService.uploadVideo(uri);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. Кэширование миниатюр

```typescript
// ✅ ХОРОШО: Кэширование для офлайн режима
import * as FileSystem from 'expo-file-system';

const cacheThumbnail = async (videoId: string) => {
  const url = apiVideoService.getThumbnailUrl(videoId);
  const localUri = `${FileSystem.cacheDirectory}thumb_${videoId}.jpg`;
  
  await FileSystem.downloadAsync(url, localUri);
  return localUri;
};
```

### 4. Preloading видео

```typescript
// ✅ ХОРОШО: Preload следующих 2-3 видео
useEffect(() => {
  const preloadNextVideos = async () => {
    const nextVideos = videos.slice(currentIndex + 1, currentIndex + 4);
    
    nextVideos.forEach(video => {
      if (video.video_id) {
        // Prefetch HLS manifest
        fetch(apiVideoService.getHLSUrl(video.video_id));
      }
    });
  };
  
  preloadNextVideos();
}, [currentIndex]);
```

### 5. Аналитика

```typescript
// ✅ ХОРОШО: Трекинг engagement
const trackVideoEngagement = async (videoId: string, watchTime: number, totalDuration: number) => {
  const percentWatched = (watchTime / totalDuration) * 100;
  
  if (percentWatched > 25) {
    await analytics.track('video_watched_25', { videoId });
  }
  
  if (percentWatched > 50) {
    await apiVideoService.incrementViews(videoId);
    await analytics.track('video_watched_50', { videoId });
  }
  
  if (percentWatched > 75) {
    await analytics.track('video_watched_75', { videoId });
  }
};
```

---

## 🚨 Troubleshooting

### Проблема: Видео не загружается

**Решение:**

1. Проверьте API ключи в `.env`
2. Убедитесь, что файл существует: `await FileSystem.getInfoAsync(uri)`
3. Проверьте размер файла (макс ~500MB)
4. Проверьте формат видео (поддерживаются: MP4, MOV, AVI, и т.д.)

### Проблема: Видео не воспроизводится

**Решение:**

1. Проверьте, что используется HLS URL: `apiVideoService.getHLSUrl(videoId)`
2. Убедитесь, что видео обработано на api.video (может занять несколько минут)
3. Проверьте интернет соединение
4. Попробуйте в другом плеере

### Проблема: Низкое качество видео

**Решение:**

1. Увеличьте bitrate при записи
2. Используйте более высокое разрешение (1080p)
3. Проверьте настройки качества в api.video dashboard
4. Убедитесь, что HLS выбирает правильное качество

### Проблема: Медленная загрузка

**Решение:**

1. Сожмите видео перед загрузкой
2. Используйте chunked upload для больших файлов
3. Проверьте скорость интернета
4. Попробуйте загрузить через Wi-Fi

---

## 📊 Метрики и мониторинг

### Dashboard api.video

Откройте [dashboard.api.video](https://dashboard.api.video) для просмотра:

- 📹 Всех загруженных видео
- 📊 Статистики просмотров
- 💾 Использованного storage
- 🌐 Трафика CDN
- 💰 Billing и лимиты

### Supabase метрики

```sql
-- Топ видео по просмотрам
SELECT 
  video_id,
  brand,
  model,
  views,
  likes,
  (likes::DECIMAL / NULLIF(views, 0)) * 100 as engagement_rate
FROM cars
WHERE video_id IS NOT NULL
ORDER BY views DESC
LIMIT 20;

-- Динамика загрузок
SELECT 
  DATE(created_at) as date,
  COUNT(*) as videos_uploaded
FROM cars
WHERE video_id IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

---

## 🔐 Безопасность

### Upload Tokens

Используйте **delegated upload tokens** для безопасной загрузки без API ключа:

```typescript
// Backend создает upload token
const uploadToken = await apiVideo.uploadTokens.create({
  ttl: 3600, // 1 час
});

// Frontend использует token
await apiVideoService.uploadWithToken(fileUri, uploadToken);
```

### RLS Policies

Убедитесь, что пользователи видят только свои видео:

```sql
CREATE POLICY "Users can view own videos"
  ON cars FOR SELECT
  USING (auth.uid() = seller_id OR public = true);
```

---

## 💡 Roadmap

### Планируемые улучшения:

- [ ] **Live Streaming** - прямые трансляции с авторынков
- [ ] **Video Editor** - встроенный редактор видео
- [ ] **AI Captions** - автоматические субтитры
- [ ] **360° Video** - поддержка панорамного видео
- [ ] **Video Analytics** - детальная аналитика по каждому видео
- [ ] **Плейлисты** - создание подборок видео
- [ ] **Shorts** - короткие вертикальные видео (<60 сек)

---

## 📞 Поддержка

### api.video

- 📧 Email: support@api.video
- 📖 Документация: https://docs.api.video
- 💬 Discord: https://discord.gg/api-video

### 360Auto

- Проверьте логи в Supabase
- Проверьте webhook логи в `webhook_logs`
- Свяжитесь с командой разработки

---

## 📝 Changelog

### v1.0.0 (Октябрь 2025)

- ✅ Базовая интеграция api.video
- ✅ VideoUploader компонент
- ✅ TikTokStyleFeed компонент
- ✅ VideoPlayer с трекингом
- ✅ SQL функции для аналитики
- ✅ TypeScript типы
- ✅ Документация

---

**Последнее обновление:** Октябрь 2025  
**Версия:** 1.0.0  
**Статус:** ✅ Production Ready

