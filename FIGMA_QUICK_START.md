# 360Auto - Quick Start для UI/UX Дизайнера

## 🚀 Быстрый старт

### Что это за приложение?

**360Auto** - это TikTok для продажи автомобилей:
- 📱 Вертикальные видео-обзоры авто (360° съемка)
- 🤖 AI анализ состояния автомобиля
- 💬 Встроенный чат с продавцами
- 🔍 Умный поиск с фильтрами
- 📸 Загрузка видео через камеру

### Целевая аудитория
👥 **Возраст:** 25-45 лет  
🌍 **Регион:** Кыргызстан  
💼 **Профиль:** Покупатели и продавцы подержанных автомобилей  
📱 **Платформа:** iOS/Android (mobile-first)

---

## 🎨 Дизайн в 1 минуту

### Цвета
```
🔴 Red:   #FF3B30  (главный цвет - кнопки, акценты)
⚫ Black:  #000000  (фон)
⚪ White:  #FFFFFF  (текст)
🔵 Blue:   #0A84FF  (AI элементы, инфо)
```

### Типографика
```
SF Pro Display (iOS) / Roboto (Android)

32px Bold   → Заголовки экранов
18px Semibold → Подзаголовки
16px Regular → Основной текст
13px Regular → Вторичный текст
```

### Стиль
- 🌑 **Темная тема only**
- 🔴 **Красные акценты** (как YouTube, TikTok)
- ✨ **Градиенты** на кнопках (#FF3B30 → #FF6B35)
- 📐 **Скругления:** 12px для кнопок, 8px для карточек
- 💫 **Плавные анимации:** 300ms

---

## 📱 5 Главных экранов

### 1️⃣ HOME (Лента видео)
```
┌─────────────────────┐
│                     │
│  [FULLSCREEN VIDEO] │ ← 360° видео авто
│                     │
│  👤 Продавец ✓      │ ← Overlay информация
│  🚗 Toyota Camry    │
│  🤖 Состояние: 85%  │
│              [💬]   │ ← Кнопка чата
└─────────────────────┘

Ключевые моменты:
✅ Swipe вверх/вниз = переключение видео
✅ Tap = пауза/воспроизведение  
✅ FAB кнопка чата - всегда видна
✅ Информация не закрывает видео
```

### 2️⃣ SEARCH (Поиск)
```
┌─────────────────────┐
│ 🔍 [Search]    [⚙️] │ ← Поиск + Фильтры
│ [Toyota][Honda]...  │ ← Быстрые фильтры
├─────────────────────┤
│ ┌─────────────────┐ │
│ │[img] Car info   │ │ ← Результаты
│ │     2.5M сом    │ │
│ └─────────────────┘ │
└─────────────────────┘

Ключевые моменты:
✅ Поиск с автодополнением
✅ Красная кнопка фильтров (с badge счетчиком)
✅ Chips для быстрого выбора марок
✅ Карточки с ценой и AI score
```

### 3️⃣ UPLOAD (Загрузка)
```
┌─────────────────────┐
│ [X]          [⚙️]    │
│                     │
│   [CAMERA VIEW]     │ ← Превью камеры
│                     │
│ [🖼️] [⏺️ REC] [🔄] │ ← Управление
└─────────────────────┘

После записи:
┌─────────────────────┐
│   ⏳ Анализ...      │
│   AI обрабатывает   │
│   [████████░░] 85%  │ ← Progress bar
└─────────────────────┘

Ключевые моменты:
✅ Большая красная кнопка записи
✅ AI анализ с прогресс-баром
✅ Автоопределение марки и модели
```

### 4️⃣ MESSAGES (Чаты)
```
┌─────────────────────┐
│ СООБЩЕНИЯ           │
├─────────────────────┤
│ 👤 Айбек      12:30 │
│   Toyota Camry   [📷]│
│   Последнее сооб... │
├─────────────────────┤
│ 👤 Азамат     Вчера │
│   Honda Accord   [📷]│
└─────────────────────┘

Внутри чата:
┌─────────────────────┐
│ [<] 👤 Айбек   [🚗] │
│                     │
│ [Bubble left]       │
│      [Bubble right] │
│                     │
│ [Input]      [Send] │
└─────────────────────┘

Ключевые моменты:
✅ Real-time обновления
✅ Превью автомобиля в списке
✅ Красные пузыри для своих сообщений
✅ Переход к авто и профилю одним тапом
```

### 5️⃣ PROFILE (Профиль)
```
┌─────────────────────┐
│  [Red Gradient]     │ ← Hero section
│    [Avatar 80px]    │
│    Айбек Султанов ✓ │
│    ⭐ 4.8           │
├─────────────────────┤
│ 12 продаж | 8 авто  │ ← Статистика
├─────────────────────┤
│ [НАПИСАТЬ]          │ ← CTA кнопка
├─────────────────────┤
│ АКТИВНЫЕ ОБЪЯВЛЕНИЯ │
│ [🚗] [🚗] [🚗]      │ ← Сетка 3x3
└─────────────────────┘

Ключевые моменты:
✅ Градиентный header (#FF3B30 → #FF6B35)
✅ Статистика в карточках
✅ Верификация (синяя галочка)
✅ Сетка автомобилей
```

---

## 🔄 User Flow (Главный сценарий)

```
1. Открыть приложение
   ↓
2. Свайпать видео в ленте
   ↓
3. Найти интересный автомобиль
   ↓
4. Посмотреть AI анализ (оценку состояния)
   ↓
5. Тап на 💬 Chat Button
   ↓
6. Написать продавцу
   ↓
7. Договориться о встрече
   ↓
8. ✅ Сделка!
```

---

## 🎯 Ключевые UI Элементы

### 1. Primary Button
```
┌──────────────────┐
│   ОПУБЛИКОВАТЬ   │ ← Градиент #FF3B30 → #FF6B35
└──────────────────┘
Height: 52px
Border Radius: 12px
Shadow: Да
```

### 2. Search Input
```
┌────────────────────────┐
│ 🔍 Марка, модель...    │
└────────────────────────┘
Background: #1C1C1E
Height: 48px
Border Radius: 12px
```

### 3. AI Score Badge
```
┌──────────────────┐
│ 🤖 Состояние: 85% │ ← Синий, прозрачный фон
└──────────────────┘
Background: rgba(10, 132, 255, 0.2)
Border: 1px #0A84FF
```

### 4. Video Overlay
```
Gradient от transparent (top) к black (bottom)
Высота: 200px от низа
Opacity: 60%
```

### 5. Tab Bar
```
┌──────┬──────┬──────┬──────┬──────┐
│  🏠  │  🔍  │  ⊕   │  💬  │  👤  │
│ Home │Search│Upload│ Msg  │Profile│
└──────┴──────┴──────┴──────┴──────┘

Height: 80px + Safe Area (34px)
Background: rgba(28, 28, 30, 0.95) + blur
Center button: 56px, красный градиент, выступает
```

---

## ✨ Микро-анимации

### ❤️ Like Animation
```
Тап → Сердце:
  0ms:   scale(0)
  100ms: scale(1.3) + rotate(15deg)  🎯
  200ms: scale(0.9) + rotate(-10deg)
  300ms: scale(1) + rotate(0)
  
Цвет: #8E8E93 → #FF3B30
Duration: 300ms
```

### 📱 Button Press
```
Тап вниз:
  scale(0.96) + opacity(0.7)
  Duration: 150ms
  
Отпускание:
  scale(1) + opacity(1)
  Duration: 150ms
```

### 📜 Swipe Video
```
Swipe вверх:
  Current video: translateY(-100%) + fade out
  Next video: translateY(0) + fade in
  Duration: 300ms
  Easing: ease-out
```

---

## 📐 Важные размеры

### Safe Areas
```
iPhone 14 Pro:
  Top: 59px (status bar + notch)
  Bottom: 34px (home indicator)
  
Всегда учитывать при позиционировании!
```

### Tap Targets
```
Минимум: 44x44px
Рекомендуемо: 48x48px и больше

FAB button: 56x56px ✅
Icons: 40x40px tap area ✅
```

### Spacing
```
Screen padding: 16px (left/right)
Between sections: 24px
Between items: 12px
Component padding: 16px

Всё кратно 8px! 4, 8, 12, 16, 24, 32, 48
```

### Border Radius
```
Small (badges): 8px
Medium (buttons): 12px
Large (cards): 16px
Pills (chips): 20px
Circles (avatars): 50%
```

---

## 🎨 Компоненты для создания

### Must-Have Components

1. **Buttons**
   - Primary (градиент)
   - Secondary (outline)
   - Icon button
   - FAB

2. **Inputs**
   - Text input
   - Search input
   - Text area

3. **Cards**
   - Video card
   - Search result card
   - AI analysis card
   - Profile card

4. **Navigation**
   - Tab bar
   - Nav bar
   - Modal header

5. **Badges & Chips**
   - Filter chip
   - AI badge
   - Verified badge
   - Notification badge

6. **List Items**
   - Conversation item
   - Message bubble

7. **Feedback**
   - Loading spinner
   - Skeleton screen
   - Toast notification
   - Empty state

8. **Overlays**
   - Video overlay gradient
   - Modal backdrop
   - Bottom sheet

---

## ⚠️ Частые ошибки (избегайте)

### ❌ НЕ ДЕЛАЙТЕ:
- Светлую тему (только dark mode!)
- Мелкий текст < 12px
- Маленькие tap targets < 44px
- Низкий контраст текста
- Забывать Safe Area
- Использовать не системные шрифты
- Слишком яркие цвета (кроме акцентов)

### ✅ ДЕЛАЙТЕ:
- Крупные, читаемые элементы
- Очевидные tap areas
- Плавные переходы (300ms)
- Feedback на действия пользователя
- Empty states для всех экранов
- Loading states (skeleton screens)

---

## 📋 Checklist перед отправкой

### Файл Figma
- [ ] Components созданы и организованы
- [ ] Variants настроены (default, pressed, disabled...)
- [ ] Auto Layout применен везде где можно
- [ ] Naming conventions соблюдены
- [ ] Colors из единой палитры
- [ ] Text styles созданы

### Экраны
- [ ] iPhone 14 Pro (393x852) - основной
- [ ] Safe Areas учтены (+59px top, +34px bottom)
- [ ] Tab Bar правильной высоты (80px + safe)
- [ ] Все 5 табов готовы
- [ ] Auth flow (2-3 экрана)
- [ ] Модалки и bottom sheets

### States
- [ ] Empty states для каждого экрана
- [ ] Loading states (skeletons)
- [ ] Error states
- [ ] Success feedback
- [ ] Disabled states кнопок

### Interactions
- [ ] Prototype работает (главный flow)
- [ ] Transitions настроены (300ms)
- [ ] Animations описаны в notes
- [ ] Tap targets >= 44px
- [ ] Gesture areas обозначены

### Handoff
- [ ] Style guide экспортирован
- [ ] Assets экспортированы (@1x, @2x, @3x)
- [ ] Specs и annotations добавлены
- [ ] Dev mode Figma настроен
- [ ] Готово к разработке! 🚀

---

## 📚 Референсы для вдохновения

### Похожие приложения
- **TikTok** - вертикальные видео, swipe навигация
- **Instagram Reels** - overlay информация
- **YouTube Shorts** - управление видео
- **Telegram** - чат интерфейс
- **Airbnb** - карточки, фильтры
- **Авто.ру** - автомобильные объявления

### Дизайн системы
- **iOS Human Interface Guidelines** - базовые принципы
- **Material Design** (частично для Android)
- **Ant Design Mobile** - компоненты

### Где искать референсы
- Mobbin.com - мобильные UI паттерны
- Dribbble.com/shots/mobile - дизайн концепты
- UIJar.com - real app screenshots
- Pttrns.com - mobile patterns

---

## 💬 Вопросы? Уточнения?

### Обязательно уточните перед началом:

1. **Брендинг:**
   - Есть ли логотип? Какой?
   - Нужны ли иллюстрации?
   - Какой tone of voice?

2. **Приоритеты:**
   - Сначала iOS или Android?
   - Какие экраны самые важные?
   - Нужна ли web-версия?

3. **Сроки:**
   - Когда дедлайн?
   - Поэтапная сдача?
   - Review процесс?

4. **Технические ограничения:**
   - Размеры видео файлов?
   - Поддержка старых устройств?
   - Offline mode?

---

## 🎯 Итоговое резюме

### Приложение в 3 предложения:
1. **360Auto** - это TikTok для продажи автомобилей
2. Вертикальные **360° видео** с **AI анализом** состояния
3. **Встроенный чат** для быстрой связи с продавцом

### Дизайн в 3 слова:
1. **Dark** (черный фон)
2. **Red** (красные акценты #FF3B30)
3. **Simple** (минимализм, TikTok-style)

### Главная задача:
Сделать **максимально простой** и **интуитивный** интерфейс для просмотра и покупки автомобилей через видео.

---

## 📂 Структура документации

Вы получили 4 документа:

1. **FIGMA_QUICK_START.md** (этот файл)
   → Быстрый старт, основы

2. **FIGMA_DESIGN_PROMPT.md**
   → Полный дизайн brief, все экраны детально

3. **FIGMA_LOGIC_ALGORITHMS.md**
   → Алгоритмы, бизнес-логика, навигация

4. **FIGMA_SPECIFICATIONS.md**
   → Точные размеры, цвета, спецификации

**Начните с этого файла, затем изучите остальные для деталей!**

---

## 🚀 Приступайте к работе!

### Рекомендуемый порядок:

**Неделя 1: Research & Setup**
1. Изучить документацию
2. Посмотреть референсы (TikTok, Instagram, Авто.ру)
3. Создать Figma файл
4. Настроить Design System (colors, typography, components)

**Неделя 2: Wireframes**
5. Сделать low-fidelity для всех экранов
6. Согласовать user flow с командой
7. Получить feedback

**Неделя 3-4: High-Fidelity**
8. Детальный дизайн всех экранов
9. Все states (empty, loading, error)
10. Создать все components

**Неделя 5: Prototype & Polish**
11. Интерактивный prototype
12. Animations
13. Final review

**Неделя 6: Handoff**
14. Экспорт assets
15. Style guide
16. Developer handoff

---

**Удачи! Создайте крутой дизайн! 🎨✨**

Questions? Check the detailed docs or ask the team!

Last updated: 2025-10-11

