# 🚀 Quick Start: User Flow с Авторизацией и Локализацией

## ✅ Всё готово к использованию!

Реализован полный User Flow с:
- 🌐 Локализация (5 языков)
- 🔐 SMS авторизация (passwordless)
- 🎬 Onboarding (3 экрана)
- 📍 Permissions (геолокация + push)
- 🔄 Интеграция в feed

---

## 🎯 Как это работает

### 1️⃣ Первый запуск приложения

```
Пользователь открывает приложение
  ↓
Показывается Welcome Screen (3 слайда)
  ↓
Запрос Permissions (геолокация + уведомления)
  ↓
Главный Feed
```

### 2️⃣ Повторный запуск

```
Пользователь открывает приложение
  ↓
Проверка onboarding_completed
  ↓
Сразу в Главный Feed
```

### 3️⃣ Действия без авторизации

```
Пользователь листает feed
  ↓
Пытается лайкнуть / написать / прокомментировать
  ↓
Показывается SMS Auth Modal
  ↓
Вводит телефон → получает SMS код → входит
  ↓
Выполняется отложенное действие
```

---

## 📱 Тестирование

### Запуск приложения

```bash
npm start
# или
npx expo start
```

### Сбросить onboarding

```typescript
// В React Native Debugger или через код
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('onboarding_completed');
// Перезапустить приложение
```

### Сбросить авторизацию

```typescript
import { auth } from '@/services/auth';
await auth.signOut();
```

### Сменить язык

```typescript
import { useTranslation } from '@/lib/i18n/useTranslation';

const { changeLanguage } = useTranslation();
changeLanguage('ky'); // ky, ru, uz, kk, tj
```

---

## 🎨 Как добавить Auth Modal в другой экран

### Пример: Экран создания объявления

```tsx
import React, { useState, useEffect } from 'react';
import { View, Button } from 'react-native';
import SMSAuthModal from '@/components/Auth/SMSAuthModal';
import { auth } from '@/services/auth';

export default function CreateListingScreen() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    setCurrentUser(user);
  };

  const handleCreateListing = async () => {
    if (!currentUser) {
      // Показать auth modal
      setShowAuthModal(true);
      return;
    }

    // Создать объявление
    console.log('Создаём объявление');
  };

  const handleAuthSuccess = async () => {
    // Обновить пользователя
    const user = await auth.getCurrentUser();
    setCurrentUser(user);
    
    // Выполнить действие
    console.log('Пользователь авторизован, создаём объявление');
  };

  return (
    <View>
      <Button 
        title="Создать объявление" 
        onPress={handleCreateListing} 
      />

      <SMSAuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        trigger="create"
      />
    </View>
  );
}
```

---

## 🌐 Как использовать переводы

### В компонентах

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation';

function MyComponent() {
  const { t, locale, changeLanguage } = useTranslation();

  return (
    <View>
      {/* Простой перевод */}
      <Text>{t('common.loading')}</Text>

      {/* С параметрами */}
      <Text>
        {t('auth.login.resendTimer', { seconds: '60' })}
      </Text>

      {/* Текущий язык */}
      <Text>Язык: {locale}</Text>

      {/* Сменить язык */}
      <Button 
        title="Кыргызча" 
        onPress={() => changeLanguage('ky')} 
      />
    </View>
  );
}
```

### Добавить новый перевод

1. Открыть `lib/i18n/translations/ru.ts`
2. Добавить новый ключ:

```typescript
export const ru = {
  // ... existing translations
  
  myNewSection: {
    title: 'Заголовок',
    button: 'Кнопка',
  },
};
```

3. Обновить все остальные языки (`ky.ts`, `uz.ts`, `kk.ts`, `tj.ts`)

4. Использовать:

```tsx
<Text>{t('myNewSection.title')}</Text>
```

---

## 🆕 Как добавить новый язык

### Пример: Добавим Азербайджанский (az)

#### 1. Создать файл переводов

`lib/i18n/translations/az.ts`:

```typescript
import { Translations } from './ru';

export const az: Translations = {
  onboarding: {
    welcome: {
      title: '60 saniyə içində satın',
      subtitle: 'Video çəkin → Lenti baxın → Tez satın',
      button: 'Başla',
      skip: 'Keç',
    },
    // ... остальные переводы
  },
  // ... полный набор переводов
};
```

#### 2. Обновить конфиг

`lib/i18n/config.ts`:

```typescript
export const LOCALES = {
  ru: 'Русский',
  ky: 'Кыргызча',
  uz: 'Oʻzbekcha',
  kk: 'Қазақша',
  tj: 'Тоҷикӣ',
  az: 'Azərbaycan', // ← НОВЫЙ ЯЗЫК
} as const;

export const LOCALE_FLAGS = {
  ru: '🇷🇺',
  ky: '🇰🇬',
  uz: '🇺🇿',
  kk: '🇰🇿',
  tj: '🇹🇯',
  az: '🇦🇿', // ← НОВЫЙ ФЛАГ
} as const;
```

#### 3. Готово!

Теперь можно использовать:

```tsx
changeLanguage('az');
```

---

## 📍 Как использовать геолокацию

```tsx
import { getUserLocation } from '@/lib/permissions/request-permissions';

async function getMyLocation() {
  const location = await getUserLocation();
  
  if (location) {
    console.log('Lat:', location.latitude);
    console.log('Lon:', location.longitude);
  } else {
    console.log('Геолокация не разрешена');
  }
}
```

---

## 🔔 Как отправить push уведомление

```tsx
import * as Notifications from 'expo-notifications';
import { hasNotificationPermission } from '@/lib/permissions/request-permissions';

async function sendNotification() {
  const hasPermission = await hasNotificationPermission();
  
  if (!hasPermission) {
    console.log('Push уведомления не разрешены');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Новый лайк!',
      body: 'Кто-то лайкнул ваше объявление',
    },
    trigger: null, // сразу
  });
}
```

---

## 🎨 Кастомизация UI

### Изменить цвета

Все основные цвета используют:
- Primary Red: `#FF3B30`
- Background: `#000000`
- Card Background: `rgba(255, 255, 255, 0.1)`
- Text: `#FFFFFF`
- Secondary Text: `#8E8E93`

### Изменить анимации

В `app/(onboarding)/welcome.tsx`:

```tsx
// Изменить анимацию эмодзи
<Text style={[styles.emoji, { /* custom animation */ }]}>
  🎥
</Text>
```

### Изменить тексты onboarding

В `lib/i18n/translations/ru.ts`:

```typescript
onboarding: {
  welcome: {
    title: 'Ваш новый заголовок',
    subtitle: 'Ваш новый подзаголовок',
  },
}
```

---

## 🐛 Troubleshooting

### Onboarding не показывается

```bash
# Проверить AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
const value = await AsyncStorage.getItem('onboarding_completed');
console.log('Onboarding completed:', value);

# Сбросить
await AsyncStorage.removeItem('onboarding_completed');
```

### SMS код не приходит

Проверить:
1. ✅ Supabase Auth настроен
2. ✅ SMS Provider (Twilio/Vonage) подключен
3. ✅ Правильный формат номера (+996...)

### Геолокация не работает

```bash
# iOS: добавить в Info.plist
<key>NSLocationWhenInUseUsageDescription</key>
<string>Для показа объявлений рядом с вами</string>

# Android: добавить в AndroidManifest.xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### Push уведомления не работают

```bash
# iOS: нужен Apple Developer Account
# Android: работает из коробки

# Проверить разрешение
import * as Notifications from 'expo-notifications';
const { status } = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);
```

---

## 📊 Аналитика (рекомендуется добавить)

### Трекать события

```typescript
// При завершении onboarding
analytics.track('onboarding_completed', {
  skipped: false,
  permissions_granted: {
    location: true,
    notifications: true,
  }
});

// При успешной авторизации
analytics.track('auth_success', {
  method: 'sms',
  trigger: 'like', // like, comment, message, create
});

// При смене языка
analytics.track('language_changed', {
  from: 'ru',
  to: 'ky',
});
```

---

## 🎯 Production Checklist

- [ ] SMS Provider настроен и работает
- [ ] Тестовые номера удалены
- [ ] Юридические документы актуальны
- [ ] Все переводы проверены носителями языка
- [ ] Onboarding протестирован на всех языках
- [ ] Permissions работают на iOS и Android
- [ ] Аналитика подключена
- [ ] Error tracking настроен
- [ ] Push уведомления работают

---

## 📞 Поддержка

Если что-то не работает:

1. Проверьте логи: `npx expo start --clear`
2. Сбросьте кеш: `npm start -- --reset-cache`
3. Переустановите зависимости: `rm -rf node_modules && npm install`

---

## 🎉 Готово!

Приложение полностью готово к использованию!

**Что реализовано:**
- ✅ 5 языков (ru, ky, uz, kk, tj)
- ✅ SMS авторизация
- ✅ Onboarding flow
- ✅ Permissions system
- ✅ Интеграция в feed
- ✅ Красивый UI/UX

**Следующие шаги:**
- 🔥 Добавить аналитику
- 🎨 Кастомизировать под бренд
- 🌍 Добавить больше языков
- 📱 Протестировать на реальных устройствах

Удачи! 🚀

