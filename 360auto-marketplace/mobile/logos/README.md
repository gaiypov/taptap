# 🎨 Логотипы 360° - Готовые к использованию

## 📦 Содержимое папки

```
logos/
├── 360-logo.svg          # Основной SVG логотип (200x200)
├── 360-logo.png          # PNG версия
├── favicon.svg           # Favicon (32x32)
├── icon-192.svg          # PWA icon (192x192)
├── icon-512.svg          # PWA icon (512x512)
├── Logo360.tsx           # React компонент
└── README.md             # Эта инструкция
```

---

## 🚀 Использование в Next.js проекте

### 1. Скопировать файлы

```bash
# Скопировать всю папку logos в ваш проект
cp -r logos/ /path/to/your-project/public/logos/

# ИЛИ скопировать только нужные файлы
cp logos/360-logo.svg /path/to/your-project/public/
```

### 2. Использовать в компонентах

#### Вариант A: Через Image (Next.js)

```tsx
import Image from 'next/image';

export function Header() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logos/360-logo.svg"
        alt="360° Logo"
        width={48}
        height={48}
        priority
      />
      <h1>360° - Продай за 60 секунд</h1>
    </div>
  );
}
```

#### Вариант B: Через React компонент

```tsx
// 1. Скопировать Logo360.tsx в components/
cp logos/Logo360.tsx /path/to/your-project/components/

// 2. Использовать в коде
import { Logo360 } from '@/components/Logo360';

export function Header() {
  return (
    <div className="flex items-center gap-2">
      <Logo360 size={48} variant="default" showAIBadge={true} />
      <h1>360°</h1>
    </div>
  );
}
```

#### Вариант C: Inline SVG

```tsx
export function Header() {
  return (
    <div className="flex items-center gap-2">
      <svg width="48" height="48" viewBox="0 0 200 200">
        {/* Скопировать содержимое 360-logo.svg */}
      </svg>
      <h1>360°</h1>
    </div>
  );
}
```

---

## 🎨 Использование Logo360 компонента

### Props

```typescript
interface LogoProps {
  size?: number;           // Размер в пикселях (по умолчанию: 48)
  className?: string;      // Tailwind классы
  variant?: 'default' | 'minimal';  // Вариант отображения
  showAIBadge?: boolean;   // Показать AI бейдж (по умолчанию: true)
}
```

### Примеры

```tsx
// Маленький логотип без AI бейджа
<Logo360 size={32} showAIBadge={false} />

// Большой логотип с эффектами
<Logo360 size={128} variant="default" />

// Минималистичный логотип
<Logo360 size={64} variant="minimal" showAIBadge={false} />

// С Tailwind классами
<Logo360 
  size={48} 
  className="hover:scale-110 transition-transform" 
/>
```

---

## 🌐 Настройка PWA (manifest.json)

```json
{
  "name": "360° - Продай за 60 секунд",
  "short_name": "360°",
  "description": "AI-powered видео маркетплейс",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#E31E24",
  "icons": [
    {
      "src": "/logos/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/logos/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

---

## 📱 Настройка Meta Tags (Next.js)

### В `app/layout.tsx`

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '360° - Продай за 60 секунд',
  description: 'AI-powered видео маркетплейс',
  icons: {
    icon: '/logos/favicon.svg',
    apple: '/logos/icon-192.svg',
  },
  manifest: '/manifest.json',
  themeColor: '#E31E24',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '360°',
  },
  openGraph: {
    title: '360° - Продай за 60 секунд',
    description: 'AI-powered видео маркетплейс',
    images: ['/logos/360-logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '360° - Продай за 60 секунд',
    description: 'AI-powered видео маркетплейс',
    images: ['/logos/360-logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/logos/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logos/icon-192.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 🎨 Цвета бренда

```css
/* Основные цвета 360° */
:root {
  --brand-red-primary: #E31E24;
  --brand-red-secondary: #C32324;
  --brand-gradient: linear-gradient(135deg, #E31E24 0%, #C32324 100%);
}

/* Tailwind конфиг */
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          red: {
            DEFAULT: '#E31E24',
            dark: '#C32324',
          },
        },
      },
    },
  },
};
```

---

## 📐 Размеры логотипа

| Контекст | Размер | Файл |
|----------|--------|------|
| Favicon | 32×32 | `favicon.svg` |
| Навбар | 48×48 | `360-logo.svg` |
| PWA Icon | 192×192 | `icon-192.svg` |
| Splash Screen | 512×512 | `icon-512.svg` |
| Hero Section | 128×128 | `360-logo.svg` |

---

## 🔧 Экспорт из Figma (если нужно обновить)

1. Откройте Figma дизайн
2. Выберите логотип
3. Export → SVG → Export
4. Оптимизируйте через [SVGOMG](https://jakearchibald.github.io/svgomg/)
5. Замените файл в папке `logos/`

---

## 📱 Использование в мобильном приложении

### React Native

```tsx
import { SvgUri } from 'react-native-svg';

export function Logo() {
  return (
    <SvgUri
      uri="/logos/360-logo.svg"
      width={48}
      height={48}
    />
  );
}
```

---

## ✅ Checklist интеграции

- [ ] Скопировать папку `logos/` в `public/`
- [ ] Добавить Logo360 компонент в `components/`
- [ ] Настроить `manifest.json`
- [ ] Добавить meta tags в `layout.tsx`
- [ ] Настроить favicon
- [ ] Добавить цвета бренда в Tailwind
- [ ] Проверить отображение на мобильных
- [ ] Протестировать PWA установку

---

## 🎉 Готово

Теперь у вас есть все логотипы 360° готовые к использованию в вашем Next.js проекте!

**Создано для проекта: 360° - AI-powered видео маркетплейс**  
**Дата: Октябрь 2025**  
**Цвета: #E31E24 → #C32324**

---

## 📞 Поддержка

Если нужны дополнительные размеры или форматы, используйте:

- SVG файлы можно масштабировать без потери качества
- React компонент поддерживает любые размеры через prop `size`
- Для PNG версий используйте online конвертеры

**Удачи с проектом! 🚀**
