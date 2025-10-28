# 🎬 Photo to Video Slideshow - Интеграция

**Дата:** 2025-01-20

---

## ✅ Компонент добавлен!

**Файл:** `app/components/PhotoToVideoScreen.tsx`

Это полноценный React Native компонент для создания видео-слайдшоу из 7-8 фото.

---

## 🎯 Возможности:

### 1. Выбор фото:
- ✅ Минимум 7, максимум 8 фото
- ✅ Прямоугольный формат 9:16 (TikTok style)
- ✅ Валидация размера (до 10MB)
- ✅ Remove/reorder фото

### 2. Настройки:
- ✅ Длительность: 3, 4, или 5 сек на фото
- ✅ Переходы: fade, slide, zoom, none
- ✅ Музыка: upbeat, calm, none

### 3. Processing:
- ✅ Real-time progress tracking
- ✅ Upload progress (0-50%)
- ✅ Processing progress (50-100%)
- ✅ Polling каждые 2 секунды
- ✅ Error handling

### 4. UX:
- ✅ Photo preview
- ✅ Drag & drop reorder
- ✅ Animated progress bar
- ✅ Beautiful UI с градиентами

---

## 📦 Dependencies:

Все уже установлены:
- ✅ `expo-image-picker` - выбор фото
- ✅ `expo-av` - видео player
- ✅ `react-native-reanimated` - анимации
- ✅ `expo-linear-gradient` - градиенты

---

## 🚀 Как интегрировать:

### Вариант 1: В Upload Screen

```typescript
// app/(tabs)/upload.tsx

import PhotoToVideoScreen from '@/components/PhotoToVideoScreen';

// Добавить кнопку
<TouchableOpacity onPress={handlePhotoToVideo}>
  <Text>Создать из фото (7-8 шт)</Text>
</TouchableOpacity>

const handlePhotoToVideo = () => {
  navigation.navigate('PhotoToVideo', {
    listingData: {
      category: 'car',
      // ...other data
    }
  });
};
```

### Вариант 2: Direct import

```typescript
import PhotoToVideoScreen from '@/components/PhotoToVideoScreen';

// Use it as a screen
<PhotoToVideoScreen 
  route={{ params: { listingData: {...} }}}
  navigation={navigation}
/>
```

---

## 🔧 Backend API Endpoints:

Компонент использует эти endpoints:

### 1. Create Video from Photos:
```
POST /api/v1/listings/create-from-photos

Body: FormData
- photos: File[] (7-8 файлов)
- settings: JSON string
- listing_data: JSON string (optional)

Response:
{
  success: boolean,
  job_id: string
}
```

### 2. Check Status:
```
GET /api/v1/listings/video-status/{job_id}

Response:
{
  status: 'processing' | 'completed' | 'failed',
  progress: number,
  message: string,
  video_url?: string,
  thumbnail_url?: string,
  error?: string
}
```

---

## ⚙️ Settings Example:

```typescript
{
  duration_per_photo: 4,
  transition: 'fade',
  music: 'upbeat',
  total_duration: 32
}
```

---

## 🎨 UI Features:

1. **Photo Grid** - сетка с превью фото
2. **Settings Panel** - настройки слайдшоу
3. **Progress Modal** - прогресс обработки
4. **Result Preview** - превью готового видео

---

## 📝 TODO:

- [ ] Добавить backend endpoint `/create-from-photos`
- [ ] Добавить ffmpeg обработку на backend
- [ ] Добавить route для PhotoToVideo screen
- [ ] Интегрировать с navigation
- [ ] Протестировать flow

---

## 🔗 Integration Points:

1. **Navigation:** Добавить в router
2. **Upload Flow:** Показать кнопку в Upload screen
3. **Backend:** Реализовать API endpoints
4. **Storage:** Upload фото на S3/CDN
5. **Processing:** Создать job queue для video processing

---

## 💡 Usage Flow:

```
User selects "Create from Photos"
  ↓
Pick 7-8 photos from gallery
  ↓
Configure settings (duration, transition, music)
  ↓
Tap "Create Video"
  ↓
Upload photos + settings to backend
  ↓
Backend processes with ffmpeg
  ↓
Return video URL
  ↓
Navigate to Create Details screen
  ↓
Continue with normal listing creation
```

---

**Created:** 2025-01-20  
**Status:** ✅ Component ready, needs backend integration

