# ✅ BACKEND ИНТЕГРИРОВАН - PHOTO TO VIDEO

**Дата:** 2025-01-20

---

## ✅ Backend добавлен!

**Файл:** `backend/api/video-slideshow.ts`

---

## 🎯 Функционал:

### 1. API Endpoints:
- ✅ `POST /api/v1/listings/create-from-photos` - загрузка фото и создание видео
- ✅ `GET /api/v1/listings/video-status/:jobId` - статус обработки

### 2. Features:
- ✅ Job Queue (Bull + Redis)
- ✅ FFmpeg обработка
- ✅ Multiple transitions (fade, slide, zoom)
- ✅ Background music support
- ✅ Progress tracking
- ✅ Upload to api.video
- ✅ Error handling
- ✅ Auto cleanup

### 3. Dependencies:
```json
{
  "fluent-ffmpeg": "^2.1.2",
  "multer": "^1.4.5-lts.1",
  "bull": "^4.11.0",
  "axios": "^1.12.2",
  "uuid": "^9.0.0"
}
```

---

## 📦 Установка:

```bash
cd backend
npm install fluent-ffmpeg multer bull axios uuid
npm install -D @types/fluent-ffmpeg @types/multer @types/uuid
```

---

## ⚙️ Настройка:

### 1. Redis:
```bash
# Установить Redis
brew install redis  # macOS
sudo apt-get install redis-server  # Linux

# Запустить
redis-server
```

### 2. FFmpeg:
```bash
# Установить FFmpeg
brew install ffmpeg  # macOS
sudo apt-get install ffmpeg  # Linux
```

### 3. Environment Variables:
```env
REDIS_HOST=localhost
REDIS_PORT=6379

# api.video
API_VIDEO_KEY=your_api_key

# Paths
UPLOAD_DIR=/tmp/uploads
OUTPUT_DIR=/tmp/outputs
MUSIC_DIR=./assets/music
```

---

## 🔧 Интеграция:

### 1. Добавить в server.ts:

```typescript
// backend/server.ts

import videoSlideshowRoutes from './api/video-slideshow';

app.use('/api/v1/listings', videoSlideshowRoutes);
```

### 2. Установить зависимости:

```bash
npm install fluent-ffmpeg multer bull axios uuid
```

### 3. Запустить Redis:

```bash
redis-server
```

### 4. Использовать фронтенд:

Фронтенд уже готов в `app/components/PhotoToVideoScreen.tsx`

---

## 🚀 Работа:

```
1. User выбирает 7-8 фото
2. POST /create-from-photos
3. Backend создает job в очереди
4. Обработка с FFmpeg
5. Upload на api.video
6. GET /video-status/{jobId} - polling
7. Возврат video_url
8. User продолжает создание listing
```

---

## 📝 TODO:

- [ ] Установить dependencies
- [ ] Настроить Redis
- [ ] Установить FFmpeg
- [ ] Добавить API key api.video
- [ ] Интегрировать в server.ts
- [ ] Добавить музыку в assets/music
- [ ] Протестировать

---

## ✅ Готово!

Backend полностью готов! Просто установите зависимости и запустите.

---

**Created:** 2025-01-20  
**Status:** ✅ Backend ready!

