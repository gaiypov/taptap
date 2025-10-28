# 360Auto - UI/UX Design Brief для Figma

## 📱 Обзор проекта

**Название:** 360Auto  
**Тип:** Мобильное приложение (iOS/Android)  
**Концепция:** TikTok для продажи автомобилей - вертикальные 360° видео-обзоры авто с AI-анализом состояния и встроенным чатом

### Целевая аудитория
- **Покупатели:** 25-45 лет, ищут подержанные автомобили, хотят видеть реальное состояние перед осмотром
- **Продавцы:** Частные лица и дилеры, желающие быстро продать автомобиль с максимальной прозрачностью
- **География:** Кыргызстан (русскоязычный интерфейс)

---

## 🎨 Дизайн-система

### Цветовая палитра

#### Основные цвета
```
Primary Red: #FF3B30 (Главный акцент, кнопки, активные элементы)
Secondary Red: #FF6B35 (Градиенты, hover состояния)
```

#### Фоновые цвета
```
Background Primary: #000000 (Основной фон)
Background Secondary: #1C1C1E (Карточки, модули)
Background Tertiary: #2C2C2E (Inputs, вторичные поверхности)
```

#### Текстовые цвета
```
Text Primary: #FFFFFF (Основной текст)
Text Secondary: #8E8E93 (Вторичный текст, подписи)
Text Tertiary: #666666 (Disabled текст)
```

#### Статусные цвета
```
Success: #34C759 (Успешные операции)
Warning: #FF9500 (Предупреждения)
Error: #FF3B30 (Ошибки)
Info Blue: #0A84FF (Информация, AI Badge, верификация)
```

### Типографика

#### Шрифты
- **Основной:** SF Pro (системный iOS) / Roboto (системный Android)
- **Fallback:** System Default

#### Размеры текста
```
Display Large: 32px, Bold (Заголовки экранов)
Title: 24px, Bold (Секции, подзаголовки)
Headline: 20px, Semibold (Карточки, важная информация)
Body Large: 18px, Regular (Основной контент)
Body: 16px, Regular (Стандартный текст)
Body Small: 14px, Regular (Описания)
Caption: 13px, Regular (Подписи)
Footnote: 12px, Regular (Мелкий текст)
```

### Spacing (отступы)
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
xxl: 48px
```

### Border Radius (скругления)
```
Small: 8px (Chips, badges)
Medium: 12px (Кнопки, cards)
Large: 16px (Модальные окна)
Extra Large: 20px (Inputs)
Round: 50% (Аватары, круглые кнопки)
```

### Shadows (тени)
```
Small: 
  offset: (0, 1)
  blur: 2px
  opacity: 0.22

Medium:
  offset: (0, 2)
  blur: 4px
  opacity: 0.25

Large:
  offset: (0, 4)
  blur: 8px
  opacity: 0.30
```

### Анимации
```
Fast: 200ms (Hover, ripple)
Normal: 300ms (Transitions, модалки)
Slow: 500ms (Сложные анимации)
```

---

## 📐 Структура приложения

### Навигация

#### Bottom Tab Bar (5 вкладок)
1. **Home (Лента)** - icon: play-circle
2. **Search (Поиск)** - icon: search
3. **Upload (Камера)** - icon: add-circle (центральная, увеличенная)
4. **Messages (Чаты)** - icon: chatbubbles
5. **Profile (Профиль)** - icon: person

**Дизайн Tab Bar:**
- Высота: 80px
- Фон: rgba(28, 28, 30, 0.95) с blur эффектом
- Активная вкладка: #FF3B30
- Неактивная вкладка: #8E8E93
- Центральная кнопка: 56x56px, круглая, градиент (#FF3B30 → #FF6B35)
- Позиция: Fixed bottom, всегда видна

---

## 🖼️ Экраны и User Flow

### 1. 🏠 Home Screen (Главная лента)

**Концепция:** TikTok-стиль - полноэкранное вертикальное видео с overlay информацией

#### Layout
```
┌─────────────────────┐
│   [Video Fullscreen]│ ← 360° видео автомобиля
│                     │
│  👤 Seller Info     │ ← Overlay, bottom-left
│  🚗 Car Info        │
│  🤖 AI Score Badge  │
│                     │
│            [💬 Chat]│ ← FAB button, bottom-right
└─────────────────────┘
```

#### Компоненты

**Video Player:**
- Размер: Fullscreen (100vw x 100vh)
- Авто-воспроизведение при активности
- Loop: Да
- Жесты: Swipe вверх/вниз = переключение видео
- Тап: Пауза/Воспроизведение

**Seller Info (Overlay Top-Left):**
```
[Avatar 32px] [Name] [✓ Verified Icon]
```
- Avatar: Круг 32x32px, border 2px #FFF
- Name: 16px, Semibold, #FFF
- Verified Icon: Синяя галочка 16px (#0A84FF)
- Тап: Переход на профиль продавца

**Car Info (Overlay Bottom-Left):**
```
Toyota Camry 2020               ← Title: 18px, Bold
150 000 км • Бишкек             ← Details: 14px, Regular
[Состояние: 85%]                ← AI Badge
```
- Title: Brand + Model + Year
- Details: Пробег + Город
- AI Badge: Pill-образный, градиент синий, icon 🤖

**Chat Button (Overlay Bottom-Right):**
- Размер: 56x56px
- Форма: Круг
- Цвет: rgba(255, 59, 48, 0.9)
- Icon: Chatbubble 28px, #FFF
- Shadow: Large
- Анимация: Scale on tap

**Actions Side Bar (Right Edge):**
```
│ [♥️ 1.2k] │ ← Like
│ [💾 234]  │ ← Save
│ [↗️ Share]│ ← Share
```
- Позиция: Right: 16px, Bottom: 120px
- Размер иконок: 28px
- Цвет: #FFF, активный: #FF3B30
- Spacing: 24px между кнопками

**Loading State:**
- Центр экрана: Spinner + "Загрузка автомобилей..."

**Empty State:**
- Icon: car-outline 60px, #8E8E93
- Text: "Нет доступных автомобилей"
- Subtext: "Будьте первым, кто добавит объявление!"

---

### 2. 🔍 Search Screen (Поиск)

#### Layout
```
┌─────────────────────┐
│ ПОИСК              │ ← Header
├─────────────────────┤
│ [🔍 Search Bar] [⚙]│ ← Search + Filter button
├─────────────────────┤
│ [Toyota] [Honda]... │ ← Quick filters (horizontal scroll)
├─────────────────────┤
│ ┌─────────────────┐ │
│ │[Img] Car info   │ │ ← Results (vertical list)
│ │     Price       │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │[Img] Car info   │ │
│ └─────────────────┘ │
└─────────────────────┘
```

#### Компоненты

**Header:**
- Высота: 60px + Safe Area Top
- Title: "Поиск", 32px, Bold
- Background: #000

**Search Bar:**
- Height: 48px
- Background: #1C1C1E
- Border Radius: 12px
- Padding: 16px
- Icon: search 20px, #8E8E93, left
- Placeholder: "Марка, модель..."
- Right icons: [Loading Spinner] [Clear X]

**Filter Button:**
- Size: 48x48px
- Background: #FF3B30
- Icon: options (sliders) 20px, #FFF
- Badge: Синий кружок с числом активных фильтров

**Quick Filters (Chips):**
- Horizontal ScrollView
- Padding: 16px horizontal
- Chip:
  - Inactive: Background #1C1C1E, Text #8E8E93
  - Active: Background #FF3B30, Text #FFF
  - Height: 36px
  - Border Radius: 20px
  - Padding: 16px horizontal

**Search Result Card:**
```
┌──────────────────────────────┐
│ [Image]  Brand Model Year    │
│  80x80   150k км • Бишкек    │
│          [Состояние: 85%]    │
│          2 500 000 сом    [>]│
└──────────────────────────────┐
```
- Height: Auto (min 104px)
- Background: #1C1C1E
- Border Radius: 12px
- Padding: 12px
- Image: 80x80px, Border Radius 8px
- Title: 16px, Semibold
- Details: 14px, #8E8E93
- Price: 18px, Bold, #FF3B30
- Chevron: 20px, #8E8E93

**Empty State:**
- Icon: search-outline 60px
- Text: "Начните поиск" или "Ничего не найдено"
- Button: "Сбросить фильтры" (если фильтры активны)

---

### 3. ⚙️ Filters Modal (Модальное окно фильтров)

#### Layout
```
┌─────────────────────┐
│ [Отмена] ФИЛЬТРЫ [Сбросить]│ ← Header
├─────────────────────┤
│                     │
│ МАРКА               │ ← Section title
│ [Toyota] [Honda]... │ ← Grid chips
│                     │
│ ЦЕНА                │
│ [До 500 тыс]        │ ← List items
│ [500 тыс - 1 млн]   │
│ [1 млн - 2 млн]     │
│                     │
│ ГОД ВЫПУСКА         │
│ [2020-2025]         │
│                     │
│ ГОРОД               │
│ [Бишкек] [Ош]...    │
│                     │
│ КОРОБКА ПЕРЕДАЧ     │
│ [Автомат] [Механика]│
│                     │
├─────────────────────┤
│ [ПРИМЕНИТЬ]         │ ← Footer button
└─────────────────────┘
```

#### Компоненты

**Modal:**
- Presentation: Page Sheet (iOS style)
- Background: #000
- Animation: Slide from bottom

**Header:**
- Height: 60px + Safe Area
- Background: #000
- Border Bottom: 1px, #1C1C1E
- Layout: [Cancel] [Title] [Reset]
  - Cancel: 16px, #8E8E93
  - Title: 18px, Semibold, #FFF
  - Reset: 16px, #FF3B30

**Section:**
- Margin: 32px bottom
- Title: 18px, Semibold, #FFF, Margin 16px bottom

**Grid Chips (Марка, Город):**
- Flex Wrap: wrap
- Gap: 8px
- Chip:
  - Inactive: #1C1C1E, #8E8E93
  - Active: #FF3B30, #FFF
  - Padding: 16px horizontal, 12px vertical
  - Border Radius: 20px

**List Items (Цена, Год, КПП):**
- Height: 52px
- Background: #1C1C1E (inactive), #FF3B30 (active)
- Border Radius: 12px
- Padding: 16px
- Text: 16px, #8E8E93 (inactive), #FFF (active)
- Margin: 8px bottom

**Footer:**
- Height: 72px + Safe Area Bottom
- Background: #000
- Border Top: 1px, #1C1C1E
- Padding: 20px

**Apply Button:**
- Height: 52px
- Background: Gradient (#FF3B30 → #FF6B35)
- Border Radius: 12px
- Text: "Применить", 16px, Semibold, #FFF
- Shadow: Medium

---

### 4. 💬 Messages Screen (Чаты)

#### Layout
```
┌─────────────────────┐
│ СООБЩЕНИЯ          │ ← Header
├─────────────────────┤
│ ┌─────────────────┐ │
│ │👤 Name     12:30│ │ ← Conversation item
│ │  Toyota Camry   │ │
│ │  Last message.. │[img]│
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │👤 Name     Вчера│ │
│ └─────────────────┘ │
└─────────────────────┘
```

#### Компоненты

**Header:**
- Height: 108px (60px title + 48px padding)
- Title: "Сообщения", 32px, Bold
- Border Bottom: 1px, #1C1C1E

**Conversation Item:**
```
[Avatar]  [Name]           [Time]
  56px    [Car: Brand Model]
          [Last message...]   [Thumb]
                              56px
```
- Height: Auto (min 88px)
- Padding: 16px
- Border Bottom: 1px, #1C1C1E

- Avatar: 56px circle
- Name: 16px, Semibold, #FFF
- Time: 13px, #8E8E93, right-aligned
- Car Info: 13px, #FF3B30
- Last Message: 14px, #8E8E93, truncate 1 line
- Car Thumbnail: 56x56px, Border Radius 8px, right

**States:**
- Normal: Background transparent
- Pressed: Background #1C1C1E
- Unread: Bold name, blue dot indicator

**Empty State:**
- Icon: chatbubbles-outline 60px
- Text: "Нет сообщений"
- Subtext: "Начните общение с продавцом"

---

### 5. 💬 Chat Screen (Диалог)

#### Layout
```
┌─────────────────────┐
│ [<] 👤 Name    [🚗] │ ← Header
│     Toyota Camry    │
├─────────────────────┤
│                     │
│ [Bubble Other]      │ ← Messages
│      [Bubble Own]   │
│ [Bubble Other]      │
│                     │
│                     │
├─────────────────────┤
│ [Input] [Send]      │ ← Footer
└─────────────────────┘
```

#### Компоненты

**Header:**
- Height: 72px + Safe Area
- Background: #1C1C1E
- Border Bottom: 1px, #2C2C2E
- Layout: [Back] [Avatar + Info] [Car Icon]
  - Back: Chevron left 24px
  - Avatar: 40px circle
  - Name: 16px, Semibold, #FFF
  - Car Info: 13px, #8E8E93
  - Car Icon: car-outline 24px, tap → car details

**Message Bubble:**
```
Own Message (Right):
  Background: #FF3B30
  Text: #FFF
  Max Width: 75%
  Padding: 12px
  Border Radius: 16px, bottom-right 4px
  Time: 11px, rgba(255,255,255,0.7), bottom-right

Other Message (Left):
  Background: #2C2C2E
  Text: #FFF
  Max Width: 75%
  Padding: 12px
  Border Radius: 16px, bottom-left 4px
  Time: 11px, #8E8E93, bottom-right
```

**Input Footer:**
- Height: Auto (min 56px) + Safe Area Bottom
- Background: #1C1C1E
- Border Top: 1px, #2C2C2E
- Padding: 12px
- Layout: [Input] [Send Button]

**Input:**
- Background: #2C2C2E
- Border Radius: 20px
- Padding: 10px 16px
- Text: 16px, #FFF
- Placeholder: "Сообщение...", #8E8E93
- Multiline: Yes
- Max Height: 100px

**Send Button:**
- Size: 40x40px
- Background: #FF3B30
- Icon: send 20px, #FFF
- Border Radius: 20px
- Disabled: Opacity 0.5

---

### 6. 👤 Profile Screen (Профиль продавца)

#### Layout
```
┌─────────────────────┐
│                     │
│  [Gradient Header]  │ ← Hero section
│   [Avatar 80px]     │
│   Name ✓            │
│   ⭐ 4.8            │
│                     │
├─────────────────────┤
│ [12 продаж] [8 авто]│ ← Stats
│ [⭐ 4.8 рейтинг]    │
├─────────────────────┤
│ [НАПИСАТЬ]          │ ← CTA Button
├─────────────────────┤
│ АКТИВНЫЕ ОБЪЯВЛЕНИЯ │ ← Section
│ ┌─────┬─────┬─────┐ │
│ │[img]│[img]│[img]│ │ ← Grid 3 columns
│ └─────┴─────┴─────┘ │
└─────────────────────┘
```

#### Компоненты

**Hero Header:**
- Height: 280px (includes Safe Area)
- Background: Linear Gradient (#FF3B30 → #FF6B35)
- Position: Fixed top during scroll (with parallax effect)

**Avatar:**
- Size: 80px circle
- Border: 4px #FFF
- Position: Center, bottom edge of gradient

**Name:**
- 24px, Bold, #FFF
- Verified Icon: 20px, #0A84FF

**Rating:**
- ⭐ Icon + Number
- 16px, #FFF

**Stats Bar:**
- Height: 80px
- Background: #1C1C1E
- Border Radius: 12px
- Margin: 16px
- Layout: 3 columns (equal width)
- Each stat:
  - Number: 20px, Bold, #FFF
  - Label: 13px, #8E8E93

**Message Button:**
- Height: 52px
- Background: Gradient (#FF3B30 → #FF6B35)
- Border Radius: 12px
- Margin: 16px horizontal
- Text: "Написать", 16px, Semibold, #FFF
- Icon: chatbubble 20px

**Section Title:**
- 20px, Semibold, #FFF
- Margin: 24px top, 16px bottom
- Padding: 0 16px

**Car Grid:**
- Columns: 3
- Gap: 8px
- Padding: 16px

**Grid Item:**
- Aspect Ratio: 1:1
- Border Radius: 8px
- Image: Cover fit
- Overlay on press

---

### 7. 🚗 Car Details Screen

#### Layout
```
┌─────────────────────┐
│ [<]          [⋮]    │ ← Nav
│                     │
│  [Video Player]     │ ← Hero video
│                     │
├─────────────────────┤
│ Toyota Camry 2020   │ ← Info section
│ 2 500 000 сом       │
│                     │
│ 150 000 км • Бишкек │
│                     │
│ [AI АНАЛИЗ CARD]    │ ← AI Score card
│ Состояние: Отличное │
│ Оценка: 85%         │
│ • Кузов без повреж. │
│ • Двигатель ✓       │
│                     │
│ ОПИСАНИЕ            │
│ Lorem ipsum...      │
│                     │
│ ХАРАКТЕРИСТИКИ      │
│ Год: 2020           │
│ Пробег: 150 000 км  │
│ КПП: Автомат        │
│ Топливо: Бензин     │
│                     │
│ ПРОДАВЕЦ            │
│ [Avatar] Name ✓     │
│ ⭐ 4.8 • 12 продаж  │
│                     │
├─────────────────────┤
│ [💬 Написать] [♥️]  │ ← Footer actions
└─────────────────────┘
```

#### Компоненты

**Navigation:**
- Height: 44px + Safe Area
- Position: Absolute top, transparent background
- Blur effect: Yes
- Back: Chevron 24px, #FFF, left
- Menu: Ellipsis vertical 24px, #FFF, right

**Video Hero:**
- Height: 60vh
- Controls: Custom overlay
- Playback bar at bottom

**Info Section:**
- Padding: 20px
- Background: #000

**Title:**
- 24px, Bold, #FFF
- Margin: 0 0 8px

**Price:**
- 28px, Bold, #FF3B30
- Margin: 0 0 16px

**Details:**
- 16px, #8E8E93

**AI Analysis Card:**
- Background: Linear Gradient (rgba(10, 132, 255, 0.1) → rgba(10, 132, 255, 0.05))
- Border: 1px, #0A84FF
- Border Radius: 16px
- Padding: 20px
- Margin: 24px 0

- Title: "AI Анализ", 18px, Semibold, #0A84FF
- Score: 85%, 32px, Bold, #0A84FF
- Status: "Отличное", 16px, #FFF
- Features List:
  - Icon: checkmark-circle 16px, #34C759
  - Text: 14px, #FFF

**Description:**
- Title: 18px, Semibold, #FFF, Margin 24px 0 12px
- Text: 16px, #8E8E93, Line Height 1.5

**Specs Table:**
- Title: 18px, Semibold, #FFF
- Rows:
  - Height: 48px
  - Border Bottom: 1px, #1C1C1E
  - Layout: [Label] [Value]
  - Label: 16px, #8E8E93, left
  - Value: 16px, #FFF, right

**Seller Card:**
- Background: #1C1C1E
- Border Radius: 12px
- Padding: 16px
- Layout: [Avatar] [Name + Stats] [Chevron]
- Tap: Navigate to profile

**Footer Actions:**
- Height: 72px + Safe Area Bottom
- Background: #000
- Border Top: 1px, #1C1C1E
- Padding: 16px
- Layout: [Message Button 70%] [Like Button 30%]

**Message Button:**
- Height: 52px
- Background: Gradient (#FF3B30 → #FF6B35)
- Icon: chatbubble 20px
- Text: "Написать", 16px, Semibold

**Like Button:**
- Size: 52x52px
- Background: #1C1C1E
- Icon: heart 24px
- Active: #FF3B30 fill

---

### 8. 📸 Upload Flow (Загрузка видео)

#### 8.1 Camera Screen

```
┌─────────────────────┐
│ [X]          [⚙️]    │ ← Nav
│                     │
│                     │
│   [Camera Preview]  │ ← Fullscreen
│                     │
│                     │
│ ───────────────────│
│ [Gallery] [⏺️ REC] [↻]│ ← Controls
└─────────────────────┘
```

**Components:**
- Camera: Fullscreen native camera
- Nav:
  - Close: X 24px, top-left
  - Settings: Gear 24px, top-right
- Controls Bar:
  - Height: 120px + Safe Area
  - Background: rgba(0,0,0,0.7)
  - Gallery: Icon 32px, left
  - Record: Circle 72px, center, #FF3B30
  - Flip: Icon 32px, right

#### 8.2 Processing Screen

```
┌─────────────────────┐
│                     │
│   [⏳ Spinner]       │
│                     │
│   Анализ авто...    │ ← Status text
│   45%               │ ← Progress
│ [────────○         ]│ ← Progress bar
│                     │
└─────────────────────┘
```

**Components:**
- Centered content
- Spinner: 64px, #FF3B30
- Status: 18px, Semibold, #FFF
- Progress: 24px, Bold, #FF3B30
- Progress Bar:
  - Width: 80%
  - Height: 8px
  - Background: #333
  - Fill: #FF3B30
  - Border Radius: 4px

#### 8.3 Review & Publish

```
┌─────────────────────┐
│ [<] ПУБЛИКАЦИЯ  [✓] │
│                     │
│ [Video Preview]     │
│                     │
│ AI РЕЗУЛЬТАТЫ       │
│ Toyota Camry 2020   │
│ Состояние: 85%      │
│ Цена: 2.3-2.7 млн   │
│                     │
│ ДЕТАЛИ              │
│ [Input: Цена]       │
│ [Input: Город]      │
│ [TextArea: Описание]│
│                     │
│ [ОПУБЛИКОВАТЬ]      │
└─────────────────────┘
```

---

### 9. 🔐 Auth Screen (Авторизация)

```
┌─────────────────────┐
│                     │
│   [360Auto Logo]    │
│                     │
│   Добро пожаловать  │
│   в 360Auto         │
│                     │
│   [Input: Телефон]  │
│   +996 ___ __ __    │
│                     │
│   [ПОЛУЧИТЬ КОД]    │
│                     │
│   Продолжая, вы     │
│   соглашаетесь с... │
│                     │
└─────────────────────┘
```

#### Verification Code Screen

```
┌─────────────────────┐
│ [<]                 │
│                     │
│   Введите код       │
│                     │
│   Код отправлен на  │
│   +996 555 123 456  │
│                     │
│   [ ][ ][ ][ ][ ][ ]│ ← 6 boxes
│                     │
│   Отправить снова   │
│   через 00:45       │
│                     │
└─────────────────────┘
```

---

## 🎯 UI/UX Принципы

### Design Principles

1. **Mobile First**
   - Оптимизация для односторонней работы
   - Важные элементы в зоне большого пальца
   - FAB для главных действий

2. **Visual Hierarchy**
   - Крупные акцентные элементы (цена, AI score)
   - Контрастные цвета для CTA
   - Четкое разделение секций

3. **Feedback & States**
   - Loading: Skeleton screens, spinners
   - Success: Зеленая галочка, конфетти
   - Error: Красный текст, shake animation
   - Pressed: Scale 0.95, opacity 0.7

4. **Accessibility**
   - Минимальный размер тапабельной области: 44x44px
   - Контрастность текста: минимум 4.5:1
   - Поддержка VoiceOver / TalkBack
   - Dark mode only (less eye strain)

5. **Performance**
   - Lazy loading изображений
   - Progressive image loading (blur → sharp)
   - Optimistic UI updates (likes, saves)
   - Smooth 60fps animations

---

## 🔄 User Flows

### Flow 1: Просмотр и лайк авто

```
Home → Swipe через видео → Tap ♥️ → Animation → Continue browsing
```

### Flow 2: Начать чат с продавцом

```
Home → Видео авто → Tap 💬 Chat Button → 
Chat Screen → Type message → Send → 
Real-time chat
```

### Flow 3: Поиск по фильтрам

```
Search Tab → Tap Filter Button → 
Filters Modal → Select Brand + Price + City → 
Apply → Results List → 
Tap Car → Car Details
```

### Flow 4: Загрузка авто

```
Upload Tab → Record Video (360°) → 
Stop Recording → Processing (AI Analysis) → 
Review Results → Enter Price & Details → 
Publish → Success → 
View in Feed
```

### Flow 5: Покупка авто

```
Home → Find Car → View Details → 
Read AI Analysis → 
Tap Message Seller → Chat → 
Negotiate → 
Meet in person → 
Deal closed
```

---

## 📊 Components Library

### Buttons

**Primary Button:**
- Background: Gradient (#FF3B30 → #FF6B35)
- Height: 52px
- Border Radius: 12px
- Text: 16px, Semibold, #FFF
- Shadow: Medium
- States: Normal, Pressed (scale 0.95), Disabled (opacity 0.5)

**Secondary Button:**
- Background: #1C1C1E
- Border: 1px, #FF3B30
- Height: 52px
- Text: 16px, Semibold, #FF3B30

**Text Button:**
- Background: Transparent
- Text: 16px, Semibold, #FF3B30
- Underline on press

**Icon Button:**
- Size: 40x40px
- Background: rgba(28, 28, 30, 0.8)
- Icon: 24px
- Border Radius: 20px

**FAB (Floating Action Button):**
- Size: 56x56px
- Background: Gradient
- Icon: 28px, #FFF
- Shadow: Large
- Position: Fixed bottom-right
- Elevation: High

### Inputs

**Text Input:**
- Height: 52px
- Background: #1C1C1E
- Border: 1px, transparent
- Border Radius: 12px
- Padding: 16px
- Text: 16px, #FFF
- Placeholder: #8E8E93
- Focus: Border #FF3B30

**Search Input:**
- Height: 48px
- Background: #1C1C1E
- Border Radius: 12px
- Icon: search, left
- Clear button: right

**TextArea:**
- Min Height: 120px
- Multiline: Yes
- Other styles: Same as Text Input

### Cards

**Car Card (List):**
- Height: 104px
- Background: #1C1C1E
- Border Radius: 12px
- Padding: 12px
- Shadow: Small
- Layout: [Image 80x80] [Content] [Chevron]

**AI Analysis Card:**
- Background: Gradient (Blue transparent)
- Border: 1px, #0A84FF
- Border Radius: 16px
- Padding: 20px
- Icon: sparkles, #0A84FF

### Badges & Pills

**AI Score Badge:**
- Background: rgba(10, 132, 255, 0.2)
- Border: 1px, #0A84FF
- Border Radius: 16px
- Padding: 6px 12px
- Text: 12px, Semibold, #0A84FF

**Verified Badge:**
- Icon: checkmark-circle 16px, #0A84FF
- Inline with name

**Filter Badge:**
- Size: 20x20px circle
- Background: #0A84FF
- Position: Top-right corner
- Number: 12px, Bold, #FFF

### Avatars

**Small:** 32px
**Medium:** 40px
**Large:** 56px
**Extra Large:** 80px

- Border Radius: 50%
- Border: Optional 2px #FFF
- Fallback: ui-avatars.com API

### Icons

**Size:**
- Small: 16px
- Medium: 20px
- Large: 24px
- Extra Large: 28px

**Style:** Ionicons (outline style)

---

## 🖼️ Image Guidelines

### Video Thumbnails
- Aspect Ratio: 9:16 (vertical)
- Resolution: 1080x1920px
- Format: WebP/JPEG
- Quality: 80%

### Car Images
- Aspect Ratio: 4:3
- Resolution: 800x600px
- Format: WebP/JPEG

### Avatars
- Aspect Ratio: 1:1
- Resolution: 200x200px
- Format: WebP/JPEG

---

## ⚡ Animations

### Micro-interactions

**Button Press:**
- Duration: 200ms
- Scale: 0.95
- Opacity: 0.7

**Like Animation:**
- Icon scale: 0 → 1.2 → 1
- Color: #8E8E93 → #FF3B30
- Duration: 300ms
- Easing: Spring

**Swipe Card:**
- Vertical swipe threshold: 50px
- Transition: Slide + Fade
- Duration: 300ms

**Modal Present:**
- From: Bottom (translateY: 100%)
- To: Center (translateY: 0)
- Duration: 300ms
- Easing: Ease-out

**Loading Skeleton:**
- Shimmer animation
- Direction: Left to right
- Duration: 1500ms
- Loop: Infinite

---

## 📱 Responsive Breakpoints

### Sizes
- Small phones: 320px - 375px width
- Medium phones: 375px - 414px width
- Large phones: 414px - 480px width
- Tablets: 768px+ width

### Adaptations
- Tab Bar: Always visible on phones, side navigation on tablets
- Grid columns: 3 on phones, 4-6 on tablets
- Modal: Full screen on small phones, sheet on larger devices

---

## 🎭 States & Variants

### Component States

**Interactive Elements:**
- Default (rest)
- Hover (not on mobile)
- Pressed / Active
- Focused
- Disabled
- Loading

**Data States:**
- Empty state
- Loading state
- Error state
- Success state

### Empty States

**Design:**
- Icon: 60-80px, #8E8E93
- Title: 20px, Semibold, #FFF
- Description: 16px, #8E8E93
- Action button: Optional

---

## 📐 Layout Grid

### Padding/Margins
- Screen padding: 16px (left/right)
- Section spacing: 24px (vertical)
- Component spacing: 16px (between items)
- List item spacing: 12px

### Safe Areas
- Top: Include status bar + nav bar
- Bottom: Include home indicator (iOS)
- Sides: 16px minimum

---

## 🔤 Copy & Tone of Voice

### Tone
- Дружелюбный
- Профессиональный
- Прозрачный
- Лаконичный

### Examples

**Success Messages:**
- ✅ "Готово!"
- ✅ "Объявление опубликовано"
- ✅ "Сообщение отправлено"

**Errors:**
- ❌ "Что-то пошло не так"
- ❌ "Не удалось загрузить видео"
- ❌ "Проверьте подключение к интернету"

**Empty States:**
- "Пока ничего нет"
- "Нет сохраненных авто"
- "Начните с поиска"

---

## 🎨 Design Deliverables

### Figma Structure

```
📁 360Auto Design System
  ├─ 🎨 Design Tokens (Colors, Typography, Spacing)
  ├─ 🧩 Components
  │   ├─ Buttons
  │   ├─ Inputs
  │   ├─ Cards
  │   ├─ Badges
  │   └─ Icons
  ├─ 📱 Screens
  │   ├─ 1. Onboarding & Auth
  │   ├─ 2. Home Feed
  │   ├─ 3. Search & Filters
  │   ├─ 4. Upload Flow
  │   ├─ 5. Messages & Chat
  │   ├─ 6. Profile
  │   └─ 7. Car Details
  ├─ 🔄 Flows
  │   ├─ User Journey Maps
  │   └─ Interaction Flows
  └─ 📐 Templates & Layouts
```

### Artboards

**Sizes:**
- iPhone 14 Pro: 393 x 852 px
- iPhone 14 Pro Max: 430 x 932 px
- iPhone SE: 375 x 667 px

### Exports

**Assets:**
- @1x, @2x, @3x (iOS)
- mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi (Android)
- Format: PNG (icons), WebP (images)

---

## ✅ Checklist для дизайнера

### Research & Planning
- [ ] Изучить конкурентов (Kolesa.kz, Mashina.kg, Avtoelon)
- [ ] Проанализировать TikTok UX patterns
- [ ] Собрать референсы (Pinterest, Dribbble, Mobbin)
- [ ] Создать User Personas
- [ ] Построить Information Architecture

### Design System
- [ ] Создать Color Palette
- [ ] Определить Typography Scale
- [ ] Создать Spacing System
- [ ] Разработать Icon Set
- [ ] Создать Component Library

### Screens Design
- [ ] Onboarding (3 экрана)
- [ ] Auth (Phone + Code)
- [ ] Home Feed
- [ ] Search + Filters Modal
- [ ] Car Details
- [ ] Messages List
- [ ] Chat Screen
- [ ] Profile (Own + Other users)
- [ ] Upload Flow (Camera → Processing → Publish)
- [ ] Settings
- [ ] Notifications

### States & Variants
- [ ] Empty states для всех экранов
- [ ] Loading states (Skeletons)
- [ ] Error states
- [ ] Success feedback
- [ ] Dark mode only

### Interactions & Animations
- [ ] Button states
- [ ] Swipe interactions
- [ ] Pull-to-refresh
- [ ] Modal presentations
- [ ] Transitions between screens

### Prototype
- [ ] High-fidelity clickable prototype
- [ ] Main user flows working
- [ ] Micro-interactions
- [ ] Готово к тестированию

### Handoff
- [ ] Экспорт assets (всех размеров)
- [ ] Design tokens в JSON
- [ ] Style guide document
- [ ] Annotations для разработчиков
- [ ] Zeplin / Figma dev mode

---

## 🚀 Next Steps

1. **Фаза 1: Research (1 неделя)**
   - Конкурентный анализ
   - User interviews
   - Создание personas

2. **Фаза 2: Design System (1 неделя)**
   - Цвета, типографика, компоненты
   - Figma library setup

3. **Фаза 3: Low-fidelity (1 неделя)**
   - Wireframes всех экранов
   - User flows
   - Обсуждение с командой

4. **Фаза 4: High-fidelity (2-3 недели)**
   - Детальный дизайн всех экранов
   - Все состояния и варианты
   - Иконки и иллюстрации

5. **Фаза 5: Prototype (1 неделя)**
   - Интерактивный прототип
   - Анимации

6. **Фаза 6: Testing & Iteration (1-2 недели)**
   - Usability testing
   - Правки по фидбеку
   - Финальная версия

7. **Фаза 7: Handoff (3-5 дней)**
   - Экспорт assets
   - Developer documentation
   - Design QA

---

## 📞 Контакты и вопросы

При возникновении вопросов:
- Уточнить user flow
- Обсудить edge cases
- Согласовать финальные макеты перед разработкой

**Приоритет:** Сначала mobile iOS, затем Android, веб - опционально

---

## 🎯 Цели дизайна

### Business Goals
- ✅ Увеличить доверие покупателей через AI-анализ
- ✅ Ускорить процесс продажи через удобный чат
- ✅ Повысить engagement через TikTok-формат

### User Goals
- ✅ Быстро найти подходящий автомобиль
- ✅ Увидеть реальное состояние до осмотра
- ✅ Легко связаться с продавцом
- ✅ Получить справедливую оценку своего авто (AI)

### UX Goals
- ✅ Интуитивная навигация (< 3 тапов до цели)
- ✅ Быстрая загрузка (< 2 сек initial load)
- ✅ Понятные действия (без обучения)
- ✅ Приятное визуальное впечатление

---

**Успехов в дизайне! 🎨✨**

Этот документ является living document и может обновляться по мере развития проекта.

Last updated: 2025-10-11

