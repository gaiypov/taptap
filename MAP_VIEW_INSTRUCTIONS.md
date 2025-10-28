# 🗺️ Map View для Недвижимости - Инструкция

## Что реализовано:

1. ✅ **MapView Component:** `app/components/MapView.tsx`
2. ✅ **ListMapToggle:** `app/components/ListMapToggle.tsx`

---

## Как использовать:

### В Home Screen для категории недвижимости:

```typescript
import { RealEstateMap } from '@/components/MapView';
import { ListMapToggle } from '@/components/ListMapToggle';
import { useState } from 'react';

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Для категории real_estate показываем toggle
  {currentCategory === 'real_estate' && (
    <>
      <ListMapToggle 
        viewMode={viewMode} 
        onToggle={setViewMode} 
      />
      
      {viewMode === 'list' ? (
        <FlatList ... />
      ) : (
        <RealEstateMap 
          listings={listings}
          onMarkerPress={(id) => {
            // Navigate to listing details
            router.push(`/listing/${id}`);
          }}
        />
      )}
    </>
  )}
}
```

---

## Возможности:

### MapView:
- ✅ Markers на карте с ценами
- ✅ Custom marker design (purple circle)
- ✅ Callout preview при tap
- ✅ User location
- ✅ Info box (количество объектов)
- ✅ Навигация к деталям

### ListMapToggle:
- ✅ Переключение List/Map
- ✅ Градиент активной кнопки
- ✅ Плавные переходы
- ✅ Красивый дизайн

---

## Установка зависимостей:

React Native Maps уже установлен через `npm install react-native-maps`.

Для Android нужно добавить в `app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_API_KEY"
        }
      }
    }
  }
}
```

Получить API key: https://console.cloud.google.com/

---

## Пример данных:

Listings должны иметь координаты:
```typescript
interface Listing {
  id: string;
  title: string;
  price: number;
  latitude?: number;  // Обязательно!
  longitude?: number; // Обязательно!
  thumbnail_url?: string;
}
```

---

## Регионы:

- **Bishkek:** 42.8746, 74.5698
- **Osh:** Можно добавить
- **Остальные:** Настраивается в `BISHKEK_REGION`

---

**Created:** 2025-01-20  
**Status:** ✅ Ready to use!

