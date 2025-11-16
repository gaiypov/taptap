# 360AutoMVP - Complete Cursor AI Prompt

# Комплексный промпт для Cursor AI с учетом всех интеграций

## 🎯 О ПРОЕКТЕ

Ты - AI ассистент для разработки **360 Auto Marketplace** (360AutoMVP).

**Тип проекта:** React Native (Expo) мобильное приложение  
**Категории:** Автомобили, Лошади, Недвижимость  
**Формат:** TikTok-style видео лента + маркетплейс  
**Stack:** TypeScript, Expo Router, Supabase, AI интеграции

---

## 📁 КРИТИЧНАЯ СТРУКТУРА ПРОЕКТА

### ✅ АКТИВНЫЕ ПАПКИ (используй ИХ)

```

360AutoMVP/

├── app/                    # Expo Router страницы - ОСНОВНАЯ РАЗРАБОТКА

│   ├── (tabs)/            # Навигация: index, search, upload, favorites, profile

│   ├── (auth)/            # Авторизация

│   ├── car/[id].tsx       # Детали объявления

│   └── chat/              # Чаты

│

├── components/             # UI компоненты по доменам

│   ├── Auth/              # SMS авторизация

│   ├── VideoFeed/         # Видео лента

│   ├── Upload/            # Загрузка контента

│   ├── Comments/          # Комментарии

│   └── common/            # Общие

│

├── services/              # Клиентские сервисы

│   ├── supabase.ts       # База данных (КРИТИЧНЫЙ)

│   ├── apiVideo.ts       # Видео хостинг (КРИТИЧНЫЙ)

│   ├── sms.ts            # SMS nikita.kg (КРИТИЧНЫЙ)

│   ├── ai/               # AI сервисы (КРИТИЧНЫЙ)

│   │   ├── openai.ts    # OpenAI GPT

│   │   ├── claude.ts    # Claude AI

│   │   ├── google.ts    # Google Vision

│   │   └── yolo.ts      # YOLO детекция

│   └── storage.ts        # AsyncStorage

│

├── backend/               # Express API

│   ├── api/              # Роуты

│   └── services/         # Backend сервисы

│

└── types/                 # TypeScript типы

```

### ❌ НЕ ИСПОЛЬЗУЙ ЭТИ ПАПКИ

```

360-auto/                  # ❌ УСТАРЕВШАЯ - НЕ ТРОГАЙ

360auto-marketplace/       # ⚠️ Целевая архитектура (в разработке)

```

---

## 🔥 ГЛАВНЫЕ ИНТЕГРАЦИИ (ОБЯЗАТЕЛЬНО К ИСПОЛЬЗОВАНИЮ)

### 1. 🗄️ SUPABASE - База данных + Auth + Storage

**Файл:** `services/supabase.ts`

**Таблицы:**

```typescript

// Категории товаров

cars              // Автомобили

horses            // Лошади  

real_estate       // Недвижимость



// Взаимодействия

users             // Пользователи

likes             // Лайки (listing_id, user_id, listing_type)

favorites         // Избранное

comments          // Комментарии с ответами

conversations     // Чаты

messages          // Сообщения



// Бизнес

business_accounts // Тарифы: FREE/LITE/BUSINESS/PRO

promotions        // Boost объявлений

```

**Как использовать:**

```typescript

import { supabase } from '@/services/supabase';



// Чтение

const { data, error } = await supabase

  .from('cars')

  .select('*, users(full_name, avatar_url)')

  .eq('status', 'active')

  .limit(20);



// Создание

const { data, error } = await supabase

  .from('cars')

  .insert({ title: 'BMW X5', price: 2500000, ... });



// Real-time подписка

supabase

  .from('messages')

  .on('INSERT', handleNewMessage)

  .subscribe();

```

**⚠️ ВАЖНО:**

- ВСЕГДА проверяй `error`

- Используй RLS (Row Level Security)

- Проверяй авторизацию: `supabase.auth.getUser()`

---

### 2. 🎥 API.VIDEO - Видео хостинг

**Файл:** `services/apiVideo.ts`

**Зачем:** Все видео загружаются на api.video (НЕ в Supabase Storage)

**Как использовать:**

```typescript

import { uploadVideoToApiVideo } from '@/services/apiVideo';



// Загрузка видео

const videoUrl = await uploadVideoToApiVideo(localVideoUri, {

  title: listing.title,

  tags: ['cars', listing.make],

});



// Сохраняем URL в БД

await supabase.from('cars').update({ 

  video_url: videoUrl  // HLS streaming URL

});

```

**⚠️ ВАЖНО:**

- Все видео через api.video (не Supabase Storage)

- Получаешь HLS URL для плеера

- Автоматические thumbnails

---

### 3. 📱 SMS (nikita.kg) - SMS авторизация

**Файлы:**

- `services/sms.ts` - общий интерфейс

- `services/smsReal.ts` - реальная отправка

- `services/smsTest.ts` - тестовый режим

**Как использовать:**

```typescript

import { sendSMS } from '@/services/sms';



// Отправка кода

await sendSMS('+996555123456', 'Ваш код: 123456');

```

**⚠️ ВАЖНО:**

- Формат: +996 для Кыргызстана

- Rate limit: 3 попытки / 10 минут

- Код: 6 цифр, TTL 5 минут

---

### 4. 🤖 AI СЕРВИСЫ (4 провайдера)

**Папка:** `services/ai/`

#### 4.1 OpenAI GPT

```typescript

import { analyzeWithOpenAI } from '@/services/ai/openai';



const description = await analyzeWithOpenAI({

  prompt: 'Создай описание для BMW X5 2020',

  maxTokens: 150,

});

```

**Когда использовать:**

- Генерация описаний

- Улучшение текстов

- Модерация контента

#### 4.2 Claude AI (Anthropic)

```typescript

import { analyzeWithClaude } from '@/services/ai/claude';



const analysis = await analyzeWithClaude({

  context: 'Анализ рынка авто',

  task: 'Оцени справедливую цену',

});

```

**Когда использовать:**

- Сложный анализ

- Когда GPT-4 дорого

- Контекстный анализ

#### 4.3 Google Vision API

```typescript

import { analyzeImageWithGoogle } from '@/services/ai/google';



const labels = await analyzeImageWithGoogle(imageUri);

// Returns: ['car', 'bmw', 'sedan', 'black']

```

**Когда использовать:**

- Распознавание объектов

- Определение марки/модели авто

- Проверка качества фото

#### 4.4 YOLO (детекция)

```typescript

import { detectWithYolo } from '@/services/ai/yolo';



const objects = await detectWithYolo(imageUri);

```

**Когда использовать:**

- Быстрая детекция

- Локальная обработка

**🧪 Тестовый режим:**

```typescript

import { useTestMode } from '@/services/ai/testMode';



// Для разработки без API ключей

const result = await useTestMode('openai', mockData);

```

**⚠️ ВАЖНО:**

- Всегда используй try-catch

- Максимум 5 AI запросов на действие

- Кэшируй результаты

- Fallback на testMode при ошибках

---

## 🎯 ПРАВИЛА РАЗРАБОТКИ

### 1. ИМПОРТЫ

✅ **ПРАВИЛЬНО:**

```typescript

import { supabase } from '@/services/supabase';

import MyComponent from '@/components/Auth/PhoneInput';

import { Listing } from '@/types';

import { useRouter } from 'expo-router';

```

❌ **НЕПРАВИЛЬНО:**

```typescript

import ... from '../360-auto/...'        // Устаревшая папка

import ... from '../../services/...'     // Используй @ alias

```

### 2. СТРУКТУРА КОМПОНЕНТОВ

```typescript

import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet } from 'react-native';

import { supabase } from '@/services/supabase';



interface Props {

  listing: Listing;

  onPress?: () => void;

}



export default function MyComponent({ listing, onPress }: Props) {

  const [loading, setLoading] = useState(false);

  

  useEffect(() => {

    fetchData();

  }, []);

  

  const fetchData = async () => {

    try {

      setLoading(true);

      const { data, error } = await supabase.from('cars').select('*');

      if (error) throw error;

      // handle data

    } catch (error) {

      console.error('Error:', error);

    } finally {

      setLoading(false);

    }

  };

  

  return (

    <View style={styles.container}>

      <Text>{listing.title}</Text>

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    padding: 16,

  },

});

```

### 3. НАВИГАЦИЯ (Expo Router)

```typescript

import { useRouter } from 'expo-router';



const router = useRouter();



// Переходы

router.push('/car/123');           // Детали

router.push('/chat/456');          // Чат

router.push('/profile/789');       // Профиль

router.back();                     // Назад

```

### 4. ОБРАБОТКА ОШИБОК

```typescript

const handleAction = async () => {

  try {

    setLoading(true);

    

    // Supabase запрос

    const { data, error } = await supabase

      .from('cars')

      .select('*');

    

    if (error) throw error;

    

    // AI запрос с fallback

    try {

      const analysis = await analyzeWithOpenAI(data);

      setAnalysis(analysis);

    } catch (aiError) {

      console.log('AI failed, using fallback');

      const fallback = await useTestMode('openai', data);

      setAnalysis(fallback);

    }

    

  } catch (error) {

    console.error('Error:', error);

    Alert.alert('Ошибка', 'Что-то пошло не так');

  } finally {

    setLoading(false);

  }

};

```

### 5. PERFORMANCE

```typescript

// React.memo для тяжелых компонентов

const VideoCard = React.memo(({ listing }: Props) => {

  return <View>...</View>;

});



// useMemo для вычислений

const filtered = useMemo(() => {

  return listings.filter(l => l.category === category);

}, [listings, category]);



// useCallback для функций

const handleLike = useCallback(async () => {

  // ...

}, [listingId]);

```

---

## 🗂️ КАТЕГОРИИ ТОВАРОВ

### Структура данных

```typescript

// Авто

interface Car {

  id: string;

  title: string;

  make: string;          // Марка: BMW, Mercedes, Toyota

  model: string;         // Модель: X5, E-Class, Camry

  year: number;          // Год: 2020

  mileage: number;       // Пробег: 50000

  price: number;         // Цена: 2500000

  condition: 'new' | 'used';

  transmission: 'auto' | 'manual';

  fuel_type: string;

  color: string;

  city: string;

  video_url: string;     // HLS URL от api.video

  thumbnail_url?: string;

  status: 'active' | 'sold' | 'expired';

  user_id: string;

  likes_count: number;

  views_count: number;

}



// Лошади

interface Horse {

  id: string;

  title: string;

  breed: string;         // Порода

  age: number;           // Возраст

  gender: 'male' | 'female';

  color: string;

  price: number;

  city: string;

  video_url: string;

  // ... остальные поля

}



// Недвижимость

interface RealEstate {

  id: string;

  title: string;

  property_type: 'apartment' | 'house' | 'land';

  area: number;          // Площадь м²

  rooms: number;

  floor: number;

  price: number;

  city: string;

  video_url: string;

  // ... остальные поля

}

```

### Константы категорий

```typescript

const CATEGORIES = [

  { id: 'all', name: 'Все', icon: '🔥', table: 'cars' },

  { id: 'cars', name: 'Авто', icon: '🚗', table: 'cars' },

  { id: 'horses', name: 'Лошади', icon: '🐴', table: 'horses' },

  { id: 'real_estate', name: 'Недвижимость', icon: '🏠', table: 'real_estate' },

];

```

---

## 🎨 UI/UX СТАНДАРТЫ

### Цвета

```typescript

const COLORS = {

  primary: '#FF3B30',      // Красный

  secondary: '#007AFF',    // Синий

  success: '#34C759',      // Зеленый

  warning: '#FF9500',      // Оранжевый

  background: '#000',      // Черный

  surface: '#1C1C1E',      // Темно-серый

  text: '#FFF',            // Белый

  textSecondary: '#8E8E93', // Серый

};

```

### Компоненты

```typescript

// LinearGradient для красивых фонов

import { LinearGradient } from 'expo-linear-gradient';



<LinearGradient

  colors={['#FF3B30', '#FF6B58']}

  style={styles.header}

>

  {/* content */}

</LinearGradient>



// Haptic feedback

import * as Haptics from 'expo-haptics';



onPress={() => {

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  handleAction();

}}



// Иконки (эмодзи предпочтительнее)

<Text style={styles.icon}>🚗</Text>

<Text style={styles.icon}>❤️</Text>

<Text style={styles.icon}>⭐</Text>

```

---

## 🔐 БЕЗОПАСНОСТЬ

### Аутентификация

```typescript

// Проверка авторизации

const { data: { user }, error } = await supabase.auth.getUser();



if (!user) {

  router.replace('/(auth)/login');

  return;

}



// Действия от имени пользователя

await supabase

  .from('cars')

  .insert({ ...data, user_id: user.id });

```

### RLS (Row Level Security)

```sql

-- Пример политики

CREATE POLICY "Users can update own listings"

ON cars FOR UPDATE

USING (auth.uid() = user_id);

```

### Валидация

```typescript

// Всегда валидируй входные данные

if (!title || title.length < 3) {

  Alert.alert('Ошибка', 'Название слишком короткое');

  return;

}



if (price < 0) {

  Alert.alert('Ошибка', 'Цена не может быть отрицательной');

  return;

}

```

---

## 📊 REAL-TIME ФУНКЦИОНАЛ

```typescript

useEffect(() => {

  // Подписка на новые лайки

  const subscription = supabase

    .from('likes')

    .on('INSERT', (payload) => {

      if (payload.new.listing_id === listing.id) {

        setLikesCount(prev => prev + 1);

      }

    })

    .subscribe();

  

  return () => {

    subscription.unsubscribe();

  };

}, [listing.id]);

```

---

## 🎬 ВИДЕО ОБРАБОТКА

### Загрузка видео

```typescript

import { uploadVideoToApiVideo } from '@/services/apiVideo';



const handleVideoUpload = async (videoUri: string) => {

  try {

    setUploading(true);

    

    // 1. Загружаем на api.video

    const videoUrl = await uploadVideoToApiVideo(videoUri, {

      title: listing.title,

      tags: [listing.category, listing.make],

    });

    

    // 2. Сохраняем в Supabase

    const { data, error } = await supabase

      .from('cars')

      .insert({

        ...listing,

        video_url: videoUrl,

      });

    

    if (error) throw error;

    

    Alert.alert('Успешно', 'Объявление создано');

    router.back();

    

  } catch (error) {

    console.error('Upload error:', error);

    Alert.alert('Ошибка', 'Не удалось загрузить видео');

  } finally {

    setUploading(false);

  }

};

```

### Видео из фото (7-8 фото)

```typescript

// Backend роут: /api/video-slideshow

const createVideoFromPhotos = async (photos: string[]) => {

  const response = await fetch('/api/video-slideshow', {

    method: 'POST',

    body: JSON.stringify({ photos }),

  });

  

  const { videoUrl } = await response.json();

  return videoUrl;

};

```

---

## 📦 STORAGE ОГРАНИЧЕНИЯ

```typescript

// services/storage.ts

const LIMITS = {

  USER_DATA: 500_000,      // 500KB

  CACHE: 1_000_000,        // 1MB

  OFFLINE_VIDEOS: 20,      // штук

};



// Проверка перед сохранением

import { checkStorageLimit } from '@/services/storage';



const canSave = await checkStorageLimit('user', dataSize);

if (!canSave) {

  Alert.alert('Ошибка', 'Недостаточно места');

  return;

}

```

---

## 🧪 ТЕСТИРОВАНИЕ

### Тестовый режим AI

```typescript

// Для разработки без API ключей

import { useTestMode } from '@/services/ai/testMode';



const result = await useTestMode('openai', {

  prompt: 'Test prompt',

});

```

### Запуск тестов

```bash

npm test

```

---

## 🚀 ТИПИЧНЫЕ ЗАДАЧИ

### Задача 1: Добавить новое поле в объявление

```typescript

// 1. Обнови тип

interface Car {

  // ... existing fields

  new_field: string;  // Добавь новое поле

}



// 2. Обнови Supabase (SQL)

ALTER TABLE cars ADD COLUMN new_field TEXT;



// 3. Обнови форму

<TextInput

  value={newField}

  onChangeText={setNewField}

  placeholder="Новое поле"

/>



// 4. Сохрани

await supabase.from('cars').insert({

  ...data,

  new_field: newField,

});

```

### Задача 2: Добавить AI анализ

```typescript

import { analyzeWithOpenAI } from '@/services/ai/openai';



const analyzeItem = async (item: Listing) => {

  try {

    const analysis = await analyzeWithOpenAI({

      prompt: `Проанализируй: ${item.title}, цена ${item.price}`,

      maxTokens: 150,

    });

    

    return analysis;

  } catch (error) {

    // Fallback на тестовый режим

    return useTestMode('openai', item);

  }

};

```

### Задача 3: Добавить Real-time обновления

```typescript

useEffect(() => {

  const subscription = supabase

    .from('cars')

    .on('*', (payload) => {

      // INSERT

      if (payload.eventType === 'INSERT') {

        setListings(prev => [payload.new, ...prev]);

      }

      // UPDATE

      if (payload.eventType === 'UPDATE') {

        setListings(prev => 

          prev.map(l => l.id === payload.new.id ? payload.new : l)

        );

      }

      // DELETE

      if (payload.eventType === 'DELETE') {

        setListings(prev => 

          prev.filter(l => l.id !== payload.old.id)

        );

      }

    })

    .subscribe();

  

  return () => subscription.unsubscribe();

}, []);

```

---

## ⚠️ ЧАСТЫЕ ОШИБКИ

### ❌ Ошибка 1: Загрузка видео в Supabase Storage

```typescript

// НЕПРАВИЛЬНО

await supabase.storage.from('videos').upload(path, video);



// ПРАВИЛЬНО

const videoUrl = await uploadVideoToApiVideo(video, metadata);

```

### ❌ Ошибка 2: Отсутствие обработки ошибок

```typescript

// НЕПРАВИЛЬНО

const data = await supabase.from('cars').select('*');



// ПРАВИЛЬНО

const { data, error } = await supabase.from('cars').select('*');

if (error) {

  console.error(error);

  return;

}

```

### ❌ Ошибка 3: Импорт из устаревших папок

```typescript

// НЕПРАВИЛЬНО

import ... from '../360-auto/...'



// ПРАВИЛЬНО

import { supabase } from '@/services/supabase';

```

---

## ✅ ЧЕКЛИСТ ПЕРЕД КОММИТОМ

- [ ] Код в правильной папке (app/, components/, services/)

- [ ] Импорты через @ alias

- [ ] TypeScript типы определены

- [ ] Обработка ошибок есть (try-catch)

- [ ] Используются правильные сервисы (Supabase, api.video, AI)

- [ ] Нет дублирования кода

- [ ] Комментарии для сложной логики

- [ ] Проверена безопасность (auth, RLS)

- [ ] Оптимизация (memo, useMemo при необходимости)

---

## 🎓 ДОПОЛНИТЕЛЬНО

### Environment Variables

```

SUPABASE_URL=...

SUPABASE_ANON_KEY=...

API_VIDEO_KEY=...

OPENAI_API_KEY=...

ANTHROPIC_API_KEY=...

GOOGLE_API_KEY=...

SMS_API_KEY=...

```

### Полезные команды

```bash

# Разработка

npx expo start

npx expo start --clear



# Тесты

npm test



# Линтер

npm run lint



# Build

eas build --platform ios

eas build --platform android

```

---

## 🎯 ЗАКЛЮЧЕНИЕ

### Ключевые принципы

1. **Используй активную структуру** (app/, components/, services/)

2. **Все видео через api.video** (не Supabase Storage)

3. **SMS через nikita.kg** (+996 формат)

4. **4 AI провайдера** (OpenAI, Claude, Google, YOLO)

5. **Supabase для всего остального** (БД, Auth, Storage)

6. **TypeScript типы обязательны**

7. **Обработка ошибок везде**

8. **Real-time через Supabase**

9. **Безопасность (RLS, Auth)**

10. **Performance (memo, useMemo)**

---

**Версия:** 3.0 Complete  
**Дата:** 30 октября 2025  
**Статус:** ✅ Полная интеграция всех сервисов

Этот промпт содержит ВСЕ необходимое для работы с проектом 360AutoMVP!
