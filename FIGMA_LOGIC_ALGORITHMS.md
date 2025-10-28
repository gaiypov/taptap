# 360Auto - Логика, Алгоритмы и Навигация

## 🧠 Алгоритмы и бизнес-логика

### 1. 🤖 AI Анализ автомобиля

#### Процесс анализа
```
1. Пользователь записывает 360° видео
   ↓
2. Извлечение ключевых кадров (каждые 2 секунды)
   ↓
3. Отправка кадров в AI модели:
   - GPT-4 Vision: Общая оценка, марка/модель
   - Claude: Детальный анализ повреждений
   - Google Cloud Vision: OCR номеров, технические характеристики
   ↓
4. Обработка результатов:
   - Определение марки и модели
   - Оценка состояния кузова (0-100%)
   - Поиск повреждений и дефектов
   - Оценка цены (мин-макс диапазон)
   ↓
5. Сохранение в базу данных
   ↓
6. Публикация объявления
```

#### Критерии оценки состояния

**Excellent (90-100%):**
- Нет видимых повреждений
- Оригинальная краска
- Чистый салон
- Все системы работают

**Good (75-89%):**
- Минимальные царапины
- Незначительный износ салона
- Мелкие сколы краски

**Fair (50-74%):**
- Видимые повреждения кузова
- Заметный износ интерьера
- Следы ремонта
- Требуется косметический ремонт

**Poor (0-49%):**
- Серьезные повреждения
- Ржавчина
- Неисправности
- Требуется капитальный ремонт

---

### 2. 📊 Алгоритм ленты (Feed Algorithm)

#### Факторы ранжирования

**Priority Score = Σ(factors × weights)**

```javascript
factors = {
  recency: 0.3,        // Новизна объявления
  engagement: 0.25,    // Лайки + сохранения + просмотры
  quality: 0.20,       // AI score автомобиля
  relevance: 0.15,     // Соответствие интересам пользователя
  promoted: 0.10       // Промо-объявления
}
```

#### Логика показа

```
FOR each user session:
  1. Загрузить первые 10 видео по алгоритму
  2. Предзагрузить следующие 5 видео
  3. При достижении 7-го видео:
     - Загрузить еще 10 видео
     - Удалить первые 3 из памяти
  4. Track просмотры:
     - View считается после 3 секунд показа
     - Like/Save моментально
  5. Обновить рекомендации на основе действий
```

#### Персонализация

**User Interest Profile:**
- Марки, которые просматривает
- Ценовой диапазон
- География (город)
- Тип кузова
- История поисков

**Boost Factors:**
- +50% если марка в избранном
- +30% если цена в диапазоне пользователя
- +20% если город совпадает
- +10% если высокий AI score

---

### 3. 🔍 Алгоритм поиска

#### Поисковый запрос

**Query Processing:**
```
1. Normalize input:
   "тайота камри 2020" → ["toyota", "camry", "2020"]

2. Tokenization:
   - Brand: toyota
   - Model: camry
   - Year: 2020

3. Full-text search по полям:
   - cars.brand (weight: 3)
   - cars.model (weight: 3)
   - cars.description (weight: 1)
   - cars.year (weight: 2)

4. Apply filters:
   - Price range
   - Location
   - Transmission
   - Year range

5. Sort by relevance score DESC
```

#### Relevance Score

```sql
SELECT *,
  (
    -- Text match score
    ts_rank(search_vector, query) * 10 +
    
    -- Exact brand/model match
    CASE WHEN brand ILIKE query THEN 5 ELSE 0 END +
    CASE WHEN model ILIKE query THEN 5 ELSE 0 END +
    
    -- AI quality bonus
    (ai_score / 100) * 2 +
    
    -- Recency bonus (last 7 days)
    CASE 
      WHEN created_at > NOW() - INTERVAL '7 days' THEN 3
      WHEN created_at > NOW() - INTERVAL '30 days' THEN 1
      ELSE 0 
    END +
    
    -- Engagement bonus
    (likes + saves * 2 + views / 100)
    
  ) AS relevance_score
FROM cars
WHERE status = 'active'
ORDER BY relevance_score DESC
```

---

### 4. 💬 Real-time чат

#### Архитектура

```
Client (React Native)
    ↓ WebSocket
Supabase Realtime
    ↓ PostgreSQL Triggers
Messages Table
    ↓ Broadcast
All connected clients
```

#### Message Flow

```
User A types message
    ↓
1. Optimistic UI update (instant)
    ↓
2. Send to Supabase via API
    ↓
3. Insert into messages table
    ↓
4. Trigger: Update conversation.last_message
    ↓
5. Broadcast via WebSocket to User B
    ↓
6. User B receives → Update UI
    ↓
7. Mark as delivered
    ↓
8. User B opens chat → Mark as read
```

#### Unread Counter Logic

```javascript
// Подсчет непрочитанных
SELECT conversation_id, COUNT(*) as unread
FROM messages
WHERE 
  sender_id != current_user_id
  AND is_read = false
GROUP BY conversation_id
```

#### Typing Indicator

```javascript
// Отправка typing события
const sendTyping = debounce(() => {
  supabase.channel(`conversation:${id}`)
    .send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id, is_typing: true }
    })
}, 300)

// Авто-снятие через 3 секунды
setTimeout(() => {
  send({ is_typing: false })
}, 3000)
```

---

### 5. ❤️ Likes & Saves

#### Optimistic Updates

```javascript
// 1. Instant UI update (optimistic)
setCars(prev => prev.map(car => 
  car.id === carId 
    ? { ...car, likes: car.likes + 1, isLiked: true }
    : car
))

// 2. Send to backend
try {
  await db.likeCar(userId, carId)
} catch (error) {
  // 3. Rollback on error
  setCars(prev => prev.map(car => 
    car.id === carId 
      ? { ...car, likes: car.likes - 1, isLiked: false }
      : car
  ))
}
```

#### Database Operations

```sql
-- Like car
INSERT INTO likes (user_id, car_id)
VALUES ($1, $2)
ON CONFLICT (user_id, car_id) DO NOTHING;

-- Update counter
UPDATE cars 
SET likes = likes + 1 
WHERE id = $2;

-- Unlike car
DELETE FROM likes 
WHERE user_id = $1 AND car_id = $2;

-- Update counter
UPDATE cars 
SET likes = likes - 1 
WHERE id = $2;
```

---

### 6. 🎥 Video Upload & Processing

#### Upload Flow

```
1. User records video (max 60 sec)
   ↓
2. Compress video:
   - Target: 720p, 30fps
   - Codec: H.264
   - Bitrate: 2 Mbps
   - Max size: 15 MB
   ↓
3. Generate thumbnail:
   - Extract frame at 2 seconds
   - Resize to 400x600
   - Quality: 80%
   ↓
4. Upload to Supabase Storage:
   - Bucket: videos
   - Path: userId/videoId.mp4
   - Public: false (presigned URLs)
   ↓
5. Upload thumbnail:
   - Bucket: thumbnails
   - Path: userId/videoId.jpg
   - Public: true
   ↓
6. AI Analysis (async)
   ↓
7. Create car record in DB
   ↓
8. Publish to feed
```

#### Progress Tracking

```javascript
const uploadVideo = async (uri) => {
  const formData = new FormData()
  formData.append('file', {
    uri,
    type: 'video/mp4',
    name: 'video.mp4'
  })
  
  return axios.post('/upload', formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      setProgress(percentCompleted)
    }
  })
}
```

---

### 7. 🔔 Notifications

#### Типы уведомлений

**1. New Message**
```
Trigger: Новое сообщение в чате
Title: "Новое сообщение от {seller_name}"
Body: Первые 50 символов сообщения
Action: Open chat screen
Badge: Increment unread count
```

**2. Like**
```
Trigger: Лайк на объявление
Title: "{user_name} понравился ваш автомобиль"
Body: "{car_brand} {car_model}"
Action: Open car details
```

**3. Price Drop**
```
Trigger: Цена на сохраненное авто снижена
Title: "Цена снижена!"
Body: "{car_brand} {car_model} теперь {new_price}"
Action: Open car details
```

#### Push Implementation

```javascript
// Register device token
const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync()
  
  if (status !== 'granted') return
  
  const token = await Notifications.getExpoPushTokenAsync()
  
  // Save to backend
  await api.saveDeviceToken(userId, token)
}

// Handle notification tap
Notifications.addNotificationResponseReceivedListener(response => {
  const { screen, params } = response.notification.request.content.data
  
  navigation.navigate(screen, params)
})
```

---

### 8. 📈 Analytics & Tracking

#### События для трекинга

**User Actions:**
- `video_view` - Просмотр видео >3 сек
- `video_complete` - Досмотрено до конца
- `like_car` - Лайк
- `save_car` - Сохранение
- `share_car` - Поделиться
- `message_sent` - Отправка сообщения
- `search_query` - Поисковый запрос
- `filter_applied` - Применен фильтр
- `car_uploaded` - Загружено видео
- `profile_view` - Просмотр профиля

**System Events:**
- `app_open` - Открытие приложения
- `session_duration` - Длительность сессии
- `video_upload_success` - Успешная загрузка
- `video_upload_fail` - Ошибка загрузки
- `ai_analysis_complete` - AI анализ завершен

#### Implementation

```javascript
// Track event
analytics.track('video_view', {
  car_id: car.id,
  car_brand: car.brand,
  car_model: car.model,
  video_duration: duration,
  watch_time: watchTime,
  user_id: currentUser.id,
  timestamp: new Date().toISOString()
})

// Track screen view
analytics.screen('Home Feed', {
  user_id: currentUser.id,
  tab: 'home'
})
```

---

### 9. 🛡️ Security & Validation

#### Input Validation

**Phone Number:**
```javascript
const validatePhone = (phone) => {
  // Kyrgyzstan format: +996 XXX XXX XXX
  const regex = /^\+996[0-9]{9}$/
  return regex.test(phone)
}
```

**Price:**
```javascript
const validatePrice = (price) => {
  return (
    price >= 10000 &&      // Min 10k сом
    price <= 100000000 &&  // Max 100M сом
    price % 1000 === 0     // Кратно 1000
  )
}
```

**Video:**
```javascript
const validateVideo = (file) => {
  const maxSize = 50 * 1024 * 1024 // 50 MB
  const allowedTypes = ['video/mp4', 'video/quicktime']
  
  return (
    file.size <= maxSize &&
    allowedTypes.includes(file.type)
  )
}
```

#### Rate Limiting

```javascript
// Supabase RLS policies

-- Max 10 объявлений в день
CREATE POLICY "limit_cars_per_day"
ON cars FOR INSERT
WITH CHECK (
  (
    SELECT COUNT(*)
    FROM cars
    WHERE seller_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 day'
  ) < 10
);

-- Max 100 сообщений в час
CREATE POLICY "limit_messages_per_hour"
ON messages FOR INSERT
WITH CHECK (
  (
    SELECT COUNT(*)
    FROM messages
    WHERE sender_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 hour'
  ) < 100
);
```

---

### 10. 🎯 Recommendation Engine

#### User Preference Learning

```javascript
// Собираем данные о действиях пользователя
const userPreferences = {
  viewedBrands: ['Toyota', 'Honda', 'Mazda'],
  viewedPriceRange: [1000000, 3000000],
  likedCars: [carId1, carId2, ...],
  savedCars: [carId3, carId4, ...],
  searchHistory: ['camry', 'accord', ...],
  locationPreference: 'Бишкек'
}

// Вычисляем preference score для каждого авто
const calculateRelevance = (car, preferences) => {
  let score = 0
  
  // Brand preference
  if (preferences.viewedBrands.includes(car.brand)) {
    score += 30
  }
  
  // Price range
  if (
    car.price >= preferences.viewedPriceRange[0] &&
    car.price <= preferences.viewedPriceRange[1]
  ) {
    score += 25
  }
  
  // Location match
  if (car.location === preferences.locationPreference) {
    score += 20
  }
  
  // High AI score
  if (car.ai_score >= 80) {
    score += 15
  }
  
  // Recently posted
  const daysSincePosted = (Date.now() - car.created_at) / (1000 * 60 * 60 * 24)
  if (daysSincePosted <= 7) {
    score += 10
  }
  
  return score
}
```

#### Collaborative Filtering

```javascript
// "Пользователи, которые смотрели это авто, также смотрели..."

const getSimilarCars = async (carId) => {
  // 1. Найти пользователей, которые лайкнули это авто
  const usersWhoLiked = await db.query(`
    SELECT user_id 
    FROM likes 
    WHERE car_id = $1
  `, [carId])
  
  // 2. Найти другие авто, которые эти пользователи лайкали
  const similarCars = await db.query(`
    SELECT car_id, COUNT(*) as score
    FROM likes
    WHERE user_id IN (${usersWhoLiked})
      AND car_id != $1
    GROUP BY car_id
    ORDER BY score DESC
    LIMIT 10
  `, [carId])
  
  return similarCars
}
```

---

## 🔄 Навигационная схема

### Screen Navigation Map

```
App Launch
    ↓
┌─────────────────┐
│   Auth Check    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  YES        NO
    │         │
    │    ┌────┴─────────┐
    │    │ Auth Screen  │
    │    └──────────────┘
    │
    ↓
┌─────────────────────────────────┐
│         Tab Navigator           │
├─────┬────────┬────────┬─────────┤
│Home │ Search │ Upload │Messages │ Profile
└──┬──┴────┬───┴────┬───┴────┬────┴────┬───
   │       │        │        │         │
   ↓       ↓        ↓        ↓         ↓
[Video] [Search] [Camera] [Chats] [Profile]
   │       │        │        │         │
   │       │        │        │         │
   ↓       ↓        ↓        ↓         ↓
[Car    [Filters] [Process] [Chat]  [Settings]
Details]  Modal     Screen   Screen
   │
   ↓
[Seller Profile]
```

### Navigation Rules

**Deep Linking:**
```
360auto://car/[id]           → Car Details
360auto://profile/[id]       → User Profile
360auto://chat/[id]          → Chat Screen
360auto://search?q=[query]   → Search Results
```

**Back Navigation:**
- Home → Exit app (confirm dialog)
- Car Details → Home
- Chat → Messages list
- Profile (other) → Previous screen
- Search Results → Search screen

**Tab Persistence:**
- Каждый таб сохраняет свой navigation stack
- Переключение табов = pause + resume
- Deep link сбрасывает stack таба

---

## 🎮 Gestures & Interactions

### Touch Interactions

**Home Feed:**
```
- Swipe Up/Down: Переключить видео
- Tap Center: Pause/Play
- Long Press: Show options menu
- Double Tap: Quick like (heart animation)
- Swipe Right: Share
- Swipe Left: Skip
```

**Search Results:**
```
- Tap Card: Open details
- Swipe Right on Card: Quick save
- Pull Down: Refresh
```

**Chat:**
```
- Long Press Message: Copy/Delete options
- Swipe Left Message: Quick reply
- Pull Down: Load more messages
```

**Filters:**
```
- Tap Chip: Toggle selection
- Swipe Down: Dismiss modal
```

---

## ⚡ Performance Optimizations

### Video Feed

**Optimization Strategy:**
```
1. Lazy Loading:
   - Load 3 videos ahead
   - Unload 3 videos behind
   - Keep current + 1 ahead + 1 behind in memory

2. Video Preloading:
   - Preload next video when current reaches 50%
   - Use lower quality for preload
   - Upgrade to HD when active

3. Thumbnail Caching:
   - Cache thumbnails indefinitely
   - Use progressive JPEG (blur → sharp)
```

### Image Loading

```javascript
// Progressive image loading
<Image
  source={{ uri: thumbnail_url }}
  placeholder={{ uri: blur_url }}
  transition={300}
  cachePolicy="memory-disk"
/>
```

### Database Queries

```sql
-- Index for fast lookups
CREATE INDEX idx_cars_status_created 
ON cars(status, created_at DESC);

CREATE INDEX idx_cars_brand_model 
ON cars(brand, model);

CREATE INDEX idx_messages_conversation 
ON messages(conversation_id, created_at DESC);

-- Materialized view for popular cars
CREATE MATERIALIZED VIEW popular_cars AS
SELECT *,
  (likes * 2 + saves * 3 + views / 100) as popularity_score
FROM cars
WHERE status = 'active'
ORDER BY popularity_score DESC;

REFRESH MATERIALIZED VIEW popular_cars; -- Refresh every hour
```

---

## 🧪 Edge Cases & Error Handling

### Network Errors

```javascript
// Retry strategy with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
      await sleep(delay)
    }
  }
}

// Offline queue
const offlineQueue = []

const sendMessage = async (message) => {
  if (!navigator.onLine) {
    // Queue for later
    offlineQueue.push(message)
    showToast('Сообщение будет отправлено при подключении')
    return
  }
  
  try {
    await api.sendMessage(message)
  } catch (error) {
    offlineQueue.push(message)
  }
}

// Process queue when back online
window.addEventListener('online', () => {
  offlineQueue.forEach(message => {
    sendMessage(message)
  })
  offlineQueue.length = 0
})
```

### Video Upload Failures

```javascript
const handleUploadFailure = (error, videoUri) => {
  // Log error
  console.error('Upload failed:', error)
  
  // Save draft locally
  await AsyncStorage.setItem(
    `draft_${Date.now()}`,
    JSON.stringify({ videoUri, timestamp: Date.now() })
  )
  
  // Show recovery option
  Alert.alert(
    'Ошибка загрузки',
    'Видео сохранено как черновик. Попробовать еще раз?',
    [
      { text: 'Позже', style: 'cancel' },
      { text: 'Повторить', onPress: () => retryUpload(videoUri) }
    ]
  )
}
```

### Empty States

**All screens должны иметь empty states:**
- Home Feed: "Нет объявлений. Будьте первым!"
- Search: "Ничего не найдено. Попробуйте другие фильтры"
- Messages: "Нет сообщений. Начните общение"
- Saved: "Нет сохраненных. Лайкайте авто в ленте"
- Profile Cars: "Нет активных объявлений"

---

## 📊 Success Metrics

### Key Performance Indicators (KPI)

**Engagement:**
- Daily Active Users (DAU)
- Session Duration (target: >5 min)
- Videos Viewed per Session (target: >10)
- Like Rate (target: >10%)
- Message Response Rate (target: >50%)

**Conversion:**
- Chat Initiation Rate (target: >15%)
- Video Upload Completion (target: >80%)
- Search to Detail View (target: >30%)

**Retention:**
- Day 1 Retention (target: >50%)
- Day 7 Retention (target: >30%)
- Day 30 Retention (target: >20%)

**Performance:**
- App Load Time (target: <2s)
- Video Start Time (target: <1s)
- Search Response Time (target: <500ms)

---

## 🔮 Future Enhancements

### Phase 2 Features

1. **AR View**: Виртуальный осмотр в AR
2. **Test Drive Booking**: Запись на тест-драйв
3. **Financing Calculator**: Калькулятор кредита
4. **Compare Cars**: Сравнение до 3 авто
5. **Price Alerts**: Уведомления о снижении цены
6. **Video Calls**: Видеозвонки с продавцом
7. **Insurance Quotes**: Оценка страховки
8. **Service History**: История обслуживания
9. **Trade-In**: Обмен старого авто
10. **Dealer Network**: Интеграция с дилерами

---

**Этот документ описывает все ключевые алгоритмы и логику работы приложения 360Auto.**

Используйте его вместе с основным design brief для полного понимания системы.

