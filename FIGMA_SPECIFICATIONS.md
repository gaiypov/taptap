# 360Auto - Точные спецификации для Figma

## 📱 Размеры и сетки

### Базовые размеры экранов

```
iPhone 14 Pro (основной):
  Width: 393px
  Height: 852px
  Safe Area Top: 59px
  Safe Area Bottom: 34px
  Status Bar: 54px

iPhone 14 Pro Max:
  Width: 430px
  Height: 932px
  Safe Area Top: 59px
  Safe Area Bottom: 34px

iPhone SE (минимальная поддержка):
  Width: 375px
  Height: 667px
  Safe Area Top: 20px
  Safe Area Bottom: 0px
```

### Grid System

```
Columns: 4
Gutter: 16px
Margin: 16px (left/right)

Horizontal spacing unit: 8px
Vertical spacing unit: 8px

Use 8px grid for everything
```

---

## 🎨 Точная цветовая палитра

### HEX коды

```
PRIMARY COLORS
━━━━━━━━━━━━━━━━━━━━━━
Red Primary:     #FF3B30
Red Secondary:   #FF6B35
Red Dark:        #E6342A
Red Light:       #FF554A

BACKGROUND COLORS
━━━━━━━━━━━━━━━━━━━━━━
Black:           #000000
Dark Gray 1:     #1C1C1E
Dark Gray 2:     #2C2C2E
Dark Gray 3:     #3A3A3C

TEXT COLORS
━━━━━━━━━━━━━━━━━━━━━━
White:           #FFFFFF
Gray 1:          #8E8E93
Gray 2:          #6E6E73
Gray 3:          #48484A

ACCENT COLORS
━━━━━━━━━━━━━━━━━━━━━━
Blue:            #0A84FF
Green:           #34C759
Yellow:          #FFD60A
Orange:          #FF9F0A
Purple:          #BF5AF2
```

### Opacity Values

```
Full:            100% (1.0)
High:            87%  (0.87)
Medium:          60%  (0.60)
Low:             38%  (0.38)
Disabled:        24%  (0.24)
```

---

## 📏 Typography Scale

### SF Pro Display (iOS)

```
Display Large
  Size: 32px
  Weight: Bold (700)
  Line Height: 38px
  Letter Spacing: 0.37px
  Use: Screen titles

Display Medium  
  Size: 28px
  Weight: Bold (700)
  Line Height: 34px
  Letter Spacing: 0.36px
  Use: Section headers

Title 1
  Size: 24px
  Weight: Bold (700)
  Line Height: 29px
  Letter Spacing: 0.35px
  Use: Card titles, modals

Title 2
  Size: 20px
  Weight: Semibold (600)
  Line Height: 24px
  Letter Spacing: 0.38px
  Use: Subheadings

Headline
  Size: 18px
  Weight: Semibold (600)
  Line Height: 22px
  Letter Spacing: -0.45px
  Use: Important text

Body Large
  Size: 17px
  Weight: Regular (400)
  Line Height: 22px
  Letter Spacing: -0.41px
  Use: Primary body text

Body
  Size: 16px
  Weight: Regular (400)
  Line Height: 21px
  Letter Spacing: -0.32px
  Use: Standard text

Callout
  Size: 15px
  Weight: Regular (400)
  Line Height: 20px
  Letter Spacing: -0.24px
  Use: Secondary text

Footnote
  Size: 13px
  Weight: Regular (400)
  Line Height: 18px
  Letter Spacing: -0.08px
  Use: Captions, timestamps

Caption 1
  Size: 12px
  Weight: Regular (400)
  Line Height: 16px
  Letter Spacing: 0px
  Use: Labels, tags

Caption 2
  Size: 11px
  Weight: Regular (400)
  Line Height: 13px
  Letter Spacing: 0.07px
  Use: Tiny text, badges
```

---

## 🔲 Component Specifications

### 1. Buttons

#### Primary Button
```
Default State:
  Width: Auto (min 120px)
  Height: 52px
  Padding: 0 24px
  Border Radius: 12px
  Background: Linear Gradient
    Start: #FF3B30 (0%)
    End: #FF6B35 (100%)
    Angle: 135deg
  Text:
    Size: 16px
    Weight: Semibold (600)
    Color: #FFFFFF
    Letter Spacing: -0.32px
  Shadow:
    Color: #FF3B30
    Blur: 16px
    Offset: 0, 4px
    Opacity: 40%

Pressed State:
  Transform: scale(0.96)
  Opacity: 0.8
  Transition: 150ms ease-out

Disabled State:
  Opacity: 0.4
  Cursor: not-allowed
```

#### Secondary Button
```
  Height: 52px
  Padding: 0 24px
  Border Radius: 12px
  Border: 1.5px solid #FF3B30
  Background: Transparent
  Text:
    Size: 16px
    Weight: Semibold (600)
    Color: #FF3B30
```

#### Icon Button
```
  Size: 44x44px (minimum tap target)
  Border Radius: 22px
  Background: rgba(28, 28, 30, 0.8)
  Icon Size: 24px
  Icon Color: #FFFFFF
  Backdrop Blur: 10px
```

#### FAB (Floating Action Button)
```
  Size: 56x56px
  Border Radius: 28px
  Background: Linear Gradient (#FF3B30 → #FF6B35)
  Icon Size: 28px
  Icon Color: #FFFFFF
  Shadow:
    Color: #000000
    Blur: 20px
    Offset: 0, 8px
    Opacity: 30%
  Position: Fixed
    Right: 20px
    Bottom: 100px (above tab bar)
```

### 2. Inputs

#### Text Input
```
  Height: 52px
  Padding: 0 16px
  Border Radius: 12px
  Background: #1C1C1E
  Border: 1.5px solid transparent
  Text:
    Size: 16px
    Weight: Regular (400)
    Color: #FFFFFF
  Placeholder:
    Color: #8E8E93
    
  Focus State:
    Border Color: #FF3B30
    Shadow: 0 0 0 4px rgba(255, 59, 48, 0.15)
    
  Error State:
    Border Color: #FF453A
    Background: rgba(255, 69, 58, 0.1)
```

#### Search Input
```
  Height: 48px
  Padding: 0 16px 0 44px
  Border Radius: 12px
  Background: #1C1C1E
  
  Icon (left):
    Size: 20px
    Color: #8E8E93
    Position: Left 16px
    
  Clear Button (right):
    Size: 20px
    Color: #8E8E93
    Position: Right 12px
```

#### Text Area
```
  Min Height: 120px
  Max Height: 200px
  Padding: 16px
  Border Radius: 12px
  Background: #1C1C1E
  Border: 1.5px solid transparent
  Line Height: 1.5
  Resize: Vertical
```

### 3. Cards

#### Video Card (Feed)
```
  Width: 100vw
  Height: 100vh
  Background: #000000
  
  Overlay Gradient:
    Top: rgba(0,0,0,0) to rgba(0,0,0,0.6)
    Height: 200px
    Position: Bottom
    
  Content Area:
    Padding: 20px
    Position: Absolute bottom
    Safe Area: +34px bottom
```

#### Search Result Card
```
  Width: 100% - 32px (16px margins)
  Height: Auto (min 104px)
  Padding: 12px
  Border Radius: 12px
  Background: #1C1C1E
  Margin Bottom: 12px
  
  Layout:
    [Image 80x80] [Content Flex 1] [Chevron 20x20]
    Gap: 12px
    
  Shadow:
    Color: #000000
    Blur: 8px
    Offset: 0, 2px
    Opacity: 25%
```

#### AI Analysis Card
```
  Width: 100% - 32px
  Padding: 20px
  Border Radius: 16px
  Background: Linear Gradient
    Start: rgba(10, 132, 255, 0.15)
    End: rgba(10, 132, 255, 0.05)
    Angle: 135deg
  Border: 1px solid rgba(10, 132, 255, 0.3)
  
  Header:
    Icon: sparkles 24px, #0A84FF
    Title: 18px Semibold, #0A84FF
    Margin: 0 0 16px
    
  Score:
    Size: 48px Bold
    Color: #0A84FF
    Margin: 12px 0
    
  Features List:
    Icon: checkmark-circle 16px, #34C759
    Text: 14px Regular, #FFFFFF
    Gap: 8px
```

### 4. Tab Bar

```
  Height: 80px
  Safe Area: +34px bottom (total 114px)
  Background: rgba(28, 28, 30, 0.95)
  Backdrop Blur: 20px
  Border Top: 0.5px solid rgba(255, 255, 255, 0.1)
  
  Items:
    Width: 20% each (5 tabs)
    Padding: 8px 0
    
  Tab Icon:
    Size: 24px
    Active Color: #FF3B30
    Inactive Color: #8E8E93
    
  Tab Label:
    Size: 11px Regular
    Active Color: #FF3B30
    Inactive Color: #8E8E93
    Margin Top: 4px
    
  Center Tab (Upload):
    Icon Size: 28px
    Container: 56x56px circle
    Position: Top -8px (overlaps bar)
    Background: Linear Gradient
    Shadow: Large
```

### 5. Navigation Bar

```
  Height: 44px
  Safe Area Top: +59px (total 103px)
  Background: #000000 (or transparent with blur)
  Border Bottom: 0.5px solid rgba(255, 255, 255, 0.1)
  
  Title:
    Size: 18px Semibold
    Color: #FFFFFF
    Centered or Left (depending on style)
    
  Back Button:
    Size: 44x44px
    Icon: chevron-left 24px
    Color: #FF3B30
    Position: Left 0
    
  Action Button:
    Size: 44x44px
    Icon: 24px
    Color: #FFFFFF
    Position: Right 0
```

### 6. Avatars

```
Small (32px):
  Size: 32x32px
  Border Radius: 16px
  Border: Optional 2px #FFFFFF
  
Medium (48px):
  Size: 48x48px
  Border Radius: 24px
  
Large (64px):
  Size: 64x64px
  Border Radius: 32px
  
Extra Large (80px):
  Size: 80x80px
  Border Radius: 40px
  Border: 4px #FFFFFF
  Shadow: 0 4px 12px rgba(0,0,0,0.3)

Online Indicator:
  Size: 12x12px
  Border Radius: 6px
  Border: 2px #000000
  Color: #34C759
  Position: Bottom-right corner
```

### 7. Badges & Chips

#### Filter Chip
```
Inactive:
  Height: 36px
  Padding: 0 16px
  Border Radius: 18px
  Background: #1C1C1E
  Text: 14px Regular, #8E8E93
  
Active:
  Background: #FF3B30
  Text: 14px Semibold, #FFFFFF
  Transform: scale(1.02)
```

#### AI Score Badge
```
  Height: 28px
  Padding: 0 12px
  Border Radius: 14px
  Background: rgba(10, 132, 255, 0.2)
  Border: 1px solid #0A84FF
  
  Icon: robot 14px, #0A84FF
  Text: 12px Semibold, #0A84FF
  Gap: 6px
```

#### Verified Badge
```
  Icon: checkmark-circle
  Size: 16px
  Color: #0A84FF
  Inline with text
```

#### Notification Badge
```
  Size: 20x20px
  Min Width: 20px (expands for 2+ digits)
  Border Radius: 10px
  Background: #FF3B30
  Text: 11px Bold, #FFFFFF
  Position: Top-right corner
  Offset: -6px, -6px
  Border: 2px #000000
```

### 8. List Items

#### Conversation Item
```
  Height: Auto (min 88px)
  Padding: 16px
  Border Bottom: 0.5px solid rgba(255, 255, 255, 0.1)
  
  Layout:
    [Avatar 56px] [Content Flex 1] [Thumbnail 56px]
    Gap: 12px
    
  Content:
    Name: 16px Semibold, #FFFFFF
    Time: 13px Regular, #8E8E93 (right-aligned)
    Car Info: 13px Regular, #FF3B30
    Message: 14px Regular, #8E8E93 (truncate)
    
  Unread Indicator:
    Size: 8x8px
    Border Radius: 4px
    Color: #0A84FF
    Position: Left of avatar
```

#### Message Bubble
```
Own Message:
  Max Width: 75%
  Padding: 12px 16px
  Border Radius: 18px 18px 4px 18px
  Background: #FF3B30
  Align: Right
  
  Text:
    Size: 16px Regular
    Color: #FFFFFF
    Line Height: 1.4
    
  Time:
    Size: 11px Regular
    Color: rgba(255,255,255,0.7)
    Margin Top: 4px
    Align: Right

Other Message:
  Max Width: 75%
  Padding: 12px 16px
  Border Radius: 18px 18px 18px 4px
  Background: #2C2C2E
  Align: Left
  
  Text: #FFFFFF
  Time: #8E8E93
```

### 9. Modals

#### Bottom Sheet Modal
```
  Width: 100vw
  Max Height: 90vh
  Border Radius: 16px 16px 0 0
  Background: #000000
  
  Handle:
    Width: 36px
    Height: 5px
    Border Radius: 2.5px
    Background: #8E8E93
    Margin: 12px auto 8px
    
  Header:
    Height: 60px
    Padding: 0 20px
    Border Bottom: 0.5px solid rgba(255, 255, 255, 0.1)
    
    Layout: [Cancel] [Title] [Action]
    Cancel: 16px Regular, #8E8E93
    Title: 18px Semibold, #FFFFFF
    Action: 16px Semibold, #FF3B30
```

#### Full Screen Modal
```
  Width: 100vw
  Height: 100vh
  Background: #000000
  
  Animation:
    Type: Slide from bottom
    Duration: 300ms
    Easing: ease-out
```

### 10. Loading States

#### Spinner
```
Small:
  Size: 20x20px
  Stroke: 2px
  Color: #8E8E93
  
Medium:
  Size: 32px
  Stroke: 3px
  Color: #FF3B30
  
Large:
  Size: 48px
  Stroke: 4px
  Color: #FF3B30
  
Animation:
  Duration: 800ms
  Easing: linear
  Infinite: Yes
```

#### Progress Bar
```
  Width: 100%
  Height: 4px
  Border Radius: 2px
  Background: #2C2C2E
  
  Fill:
    Height: 4px
    Border Radius: 2px
    Background: Linear Gradient (#FF3B30 → #FF6B35)
    
  Indeterminate:
    Width: 40%
    Animation: slide left-right
    Duration: 1500ms
```

#### Skeleton Screen
```
  Background: #1C1C1E
  Border Radius: Match component
  
  Shimmer:
    Background: Linear Gradient
      0%: rgba(255,255,255,0)
      50%: rgba(255,255,255,0.1)
      100%: rgba(255,255,255,0)
    Animation: slide left-right
    Duration: 1500ms
    Infinite: Yes
```

---

## 🎭 Animations Specifications

### Transition Durations

```
Instant:   0ms      (Immediate feedback)
Fast:      150ms    (Micro-interactions)
Normal:    300ms    (Standard transitions)
Slow:      500ms    (Complex animations)
```

### Easing Functions

```
ease-out:        cubic-bezier(0.0, 0.0, 0.2, 1.0)
ease-in:         cubic-bezier(0.4, 0.0, 1.0, 1.0)
ease-in-out:     cubic-bezier(0.4, 0.0, 0.2, 1.0)
spring:          cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

### Animation Examples

#### Button Press
```
Property: transform, opacity
Duration: 150ms
Easing: ease-out

Pressed:
  transform: scale(0.96)
  opacity: 0.7
  
Released:
  transform: scale(1)
  opacity: 1
```

#### Like Heart
```
Duration: 400ms
Easing: spring

Sequence:
  0ms:   scale(0), rotate(0deg)
  100ms: scale(1.3), rotate(15deg)
  200ms: scale(0.9), rotate(-10deg)
  300ms: scale(1.1), rotate(5deg)
  400ms: scale(1), rotate(0deg)
  
Color:
  From: #8E8E93
  To: #FF3B30
```

#### Modal Present
```
Duration: 300ms
Easing: ease-out

Sheet:
  From: translateY(100%)
  To: translateY(0)
  Background opacity: 0 → 0.5

Fullscreen:
  From: translateY(100%)
  To: translateY(0)
```

#### Swipe Card
```
Duration: 300ms
Easing: ease-out

Exit:
  transform: translateY(-100%)
  opacity: 0
  
Enter:
  transform: translateY(100%) → translateY(0)
  opacity: 0 → 1
```

---

## 📐 Spacing System

### Consistent Spacing Scale

```
4px  (xs)   → Tiny gaps, icon padding
8px  (sm)   → Small gaps, chip padding
12px (md-s) → List item gaps
16px (md)   → Standard component padding, screen margins
20px (md-l) → Section padding
24px (lg)   → Large gaps between sections
32px (xl)   → Extra large spacing, hero padding
48px (xxl)  → Major section breaks
64px (3xl)  → Hero sections
```

### Application

```
Screen Padding:
  Horizontal: 16px
  Vertical: 24px (top), 16px (bottom)
  
Card Padding:
  Small: 12px
  Medium: 16px
  Large: 20px
  
List Item:
  Horizontal: 16px
  Vertical: 12px
  Gap: 12px
  
Button:
  Horizontal: 24px
  Vertical: Calculated (for 52px height)
  
Input:
  Horizontal: 16px
  Vertical: Calculated (for 52px height)
```

---

## 🖼️ Image & Asset Guidelines

### Export Sizes

#### Icons
```
@1x:  24x24px   (mdpi)
@2x:  48x48px   (xhdpi, iOS)
@3x:  72x72px   (xxhdpi, iOS)
@4x:  96x96px   (xxxhdpi)

Format: PNG-24 (transparency) or SVG (preferred)
```

#### Thumbnails
```
Small:   400x600px   (16:9 vertical)
Medium:  800x600px   (4:3)
Large:   1080x1920px (9:16 vertical, full video)

Format: WebP (primary), JPEG (fallback)
Quality: 80%
Progressive: Yes
```

#### Avatars
```
Small:   64x64px    (@1x = 32px)
Medium:  96x96px    (@1x = 48px)
Large:   128x128px  (@1x = 64px)
XL:      160x160px  (@1x = 80px)

Format: WebP (primary), JPEG (fallback)
Quality: 85%
```

### Optimization

```
PNG:
  - Use TinyPNG / ImageOptim
  - 8-bit if possible
  - Remove metadata
  
JPEG:
  - Progressive encoding
  - Quality 80-85%
  - Chroma subsampling: 4:2:0
  
WebP:
  - Quality 80%
  - Support fallback to JPEG
  
SVG:
  - Optimize with SVGO
  - Remove unused elements
  - Use viewBox, not width/height
```

---

## ✅ Figma Organization Checklist

### File Structure
```
📁 360Auto Design System
  ├─ 📄 Cover Page (Project info)
  ├─ 🎨 Design Tokens
  │   ├─ Colors
  │   ├─ Typography
  │   ├─ Spacing
  │   ├─ Shadows
  │   └─ Border Radius
  ├─ 🧩 Components
  │   ├─ Buttons
  │   ├─ Inputs
  │   ├─ Cards
  │   ├─ Navigation
  │   ├─ Overlays
  │   └─ Feedback
  ├─ 📱 Mobile Screens (iPhone 14 Pro)
  │   ├─ Auth Flow
  │   ├─ Home Feed
  │   ├─ Search
  │   ├─ Upload
  │   ├─ Messages
  │   ├─ Profile
  │   └─ Settings
  ├─ 📱 Mobile Screens (iPhone SE)
  ├─ 🔄 User Flows
  ├─ 🎭 States & Variants
  └─ 📐 Specs & Annotations
```

### Component Variants
```
Each component should have:
  - Default state
  - Hover state (web)
  - Pressed/Active state
  - Focused state
  - Disabled state
  - Loading state (if applicable)
  - Error state (if applicable)
```

### Auto Layout
```
Use Auto Layout for:
  ✅ Buttons
  ✅ Cards
  ✅ Lists
  ✅ Navigation bars
  ✅ Tab bars
  ✅ Input fields
  ✅ Chips
  
Properties to set:
  - Direction (horizontal/vertical)
  - Spacing (8px increments)
  - Padding (8px increments)
  - Alignment (start/center/end)
  - Fill/Hug content
```

### Naming Conventions
```
Components:
  ComponentName/Variant/State
  Example: Button/Primary/Pressed
  
Frames:
  Screen Name - Device - State
  Example: Home Feed - iPhone 14 Pro - Scrolled
  
Layers:
  descriptive-lowercase-with-hyphens
  Example: car-thumbnail-image
```

---

## 🎯 Design Review Checklist

### Visual Design
- [ ] Все цвета из дизайн-системы
- [ ] Типографика консистентна
- [ ] Spacing кратен 8px
- [ ] Иконки одного стиля (Ionicons)
- [ ] Тени применены правильно
- [ ] Градиенты корректны

### Components
- [ ] Все компоненты - Components в Figma
- [ ] Variants настроены
- [ ] Auto Layout применен
- [ ] Responsive (Hug/Fill)
- [ ] Constraints установлены

### Screens
- [ ] Safe Areas учтены
- [ ] Tab Bar 80px + safe area
- [ ] Navigation Bar правильная высота
- [ ] Status Bar показан
- [ ] Нет выходов за границы

### States
- [ ] Empty states для всех экранов
- [ ] Loading states (skeletons)
- [ ] Error states
- [ ] Success feedback
- [ ] Disabled states

### Interactions
- [ ] Tap targets >= 44x44px
- [ ] Кнопки имеют pressed state
- [ ] Модалки имеют backdrop
- [ ] Transitions определены
- [ ] Animations описаны

### Accessibility
- [ ] Контрастность текста >= 4.5:1
- [ ] Размер текста >= 12px (предпочтительно 14px+)
- [ ] Icons имеют labels
- [ ] Touch targets >= 44x44px
- [ ] Логический порядок элементов

### Annotations
- [ ] Размеры компонентов указаны
- [ ] Spacing обозначен
- [ ] Interactions описаны
- [ ] Special behaviors отмечены
- [ ] Dev notes добавлены

### Export
- [ ] Assets экспортированы (@1x, @2x, @3x)
- [ ] Icons в SVG
- [ ] Images оптимизированы
- [ ] Style guide актуален
- [ ] Prototype работает

---

**Используйте эти спецификации как reference guide при создании дизайна в Figma.**

Все размеры точные и проверенные на реальных устройствах iOS.

Last updated: 2025-10-11

