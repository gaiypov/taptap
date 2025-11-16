# 🚀 360⁰ Auto Marketplace

**Маркетплейс для продажи автомобилей, лошадей и недвижимости в Кыргызстане**

---

## 📦 Структура Проекта

```
360auto-marketplace/
├── backend/       # Node.js API Server (Express + Supabase)
├── mobile/         # React Native App (Expo Router)
└── shared/         # Shared TypeScript Types
```

---

## ✅ Что Готово

- ✅ **3 отдельных репозитория** разделены по функциям
- ✅ **Backend** - полностью настроен с Supabase
- ✅ **Mobile** - React Native с Expo Router
- ✅ **Shared** - общие типы TypeScript
- ✅ **Все ключи API** настроены и подключены
- ✅ **Документация** на русском и английском

---

## 🚀 Быстрый Старт

### 1. Установите зависимости

```bash
# Backend
cd backend && npm install

# Mobile
cd mobile && npm install

# Shared
cd shared && npm install
```

### 2. Запустите Redis

```bash
redis-server
```

### 3. Запустите Backend

```bash
cd backend
npm run dev

# ✅ http://localhost:3001
```

### 4. Запустите Mobile

```bash
cd mobile
npm start

# 📱 Сканируйте QR код в Expo Go
```

---

## 📚 Документация

- **[ИНСТРУКЦИЯ_ДЛЯ_ЗАПУСКА.md](./ИНСТРУКЦИЯ_ДЛЯ_ЗАПУСКА.md)** - Подробная инструкция на русском
- **[START_HERE.md](./START_HERE.md)** - Quick Start
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete Setup Guide
- **[QUICK_START.md](./QUICK_START.md)** - 5-Minute Setup

---

## 🔑 Настроенные Ключи

**Supabase:**

- URL: `https://thqlfkngyipdscckbhor.supabase.co`
- Service Role Key: настроен
- Anon Key: настроен

**Другие API:**

- ✅ SMS Service (smspro.nikita.kg)
- ✅ API.Video
- ✅ Google Vision API

---

## 📱 Скрипты

### Backend

```bash
npm run dev         # Разработка
npm run dev:watch   # С автоперезагрузкой
npm run build       # Сборка
npm run start       # Продакшн
npm run lint        # Проверка кода
npm run lint:fix    # Автоисправление
```

### Mobile

```bash
npm start           # Запуск Expo
npm run android     # Android
npm run ios         # iOS
npm run web         # Web
npm run lint:fix    # Исправить ошибки
```

---

## 🏗️ Архитектура

### Backend (`backend/`)

- Express.js API Server
- Supabase для базы данных
- Bull Queue для задач
- JWT аутентификация
- SMS сервис для подтверждения номера

### Mobile (`mobile/`)

- React Native + Expo
- Expo Router (навигация)
- Zustand (состояние)
- Supabase Client
- Камера + видео

### Shared (`shared/`)

- TypeScript типы
- Общие константы
- Утилиты

---

## 🔧 Технологии

- **Backend:** Node.js, Express, TypeScript, Supabase
- **Mobile:** React Native, Expo, TypeScript
- **Database:** PostgreSQL (Supabase)
- **Queue:** Bull + Redis
- **Auth:** JWT, SMS

---

## 📞 Контакты

**Команда:** 360⁰ Marketplace Team  
**Лицензия:** MIT

---

## 🎯 Следующие Шаги

1. Изучите [ИНСТРУКЦИЯ_ДЛЯ_ЗАПУСКА.md](./ИНСТРУКЦИЯ_ДЛЯ_ЗАПУСКА.md)
2. Установите зависимости
3. Запустите Redis
4. Запустите backend и mobile
5. Начните разработку!

---

**Готово к запуску! 🚀**
