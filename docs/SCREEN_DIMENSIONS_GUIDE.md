# 📐 Руководство по работе с размерами экрана

## 🎯 Обзор

Проект использует унифицированную систему для работы с размерами экрана, которая поддерживает:
- ✅ Статические константы для StyleSheet
- ✅ Динамические размеры при изменении ориентации
- ✅ Типобезопасность с TypeScript
- ✅ Оптимизацию производительности

## 📁 Файловая структура

```
utils/
├── constants.ts          # Статические константы (SCREEN_WIDTH, SCREEN_HEIGHT)
├── useScreenDimensions.ts # React хук для динамических размеров
└── helpers.ts            # Утилиты (isTablet, isLandscape, isPortrait)
```

## 🔧 API

### 1. Статические константы (`utils/constants.ts`)

**Использование**: Для `StyleSheet.create()` и других статических вычислений

```typescript
import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_SCALE } from '@/utils/constants';

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
```

**Доступные константы**:
- `SCREEN_WIDTH` - ширина экрана (число)
- `SCREEN_HEIGHT` - высота экрана (число)
- `SCREEN_SCALE` - pixel density (число)
- `SCREEN_FONT_SCALE` - font scale (число)
- `WINDOW_DIMENSIONS` - объект со всеми размерами
- `IS_PORTRAIT` - начальная ориентация (boolean)
- `IS_LANDSCAPE` - начальная ориентация (boolean)

**⚠️ Важно**: Эти значения вычисляются один раз при загрузке модуля. Для динамических изменений используйте хук.

### 2. React Hook (`useScreenDimensions()`)

**Использование**: В функциональных компонентах для реактивного обновления размеров

```typescript
import { useScreenDimensions } from '@/utils/constants';

function MyComponent() {
  const { width, height, isPortrait, isLandscape, scale } = useScreenDimensions();
  
  return (
    <View style={{ width, height }}>
      {isPortrait ? <PortraitLayout /> : <LandscapeLayout />}
    </View>
  );
}
```

**Возвращает**:
```typescript
{
  width: number;        // Текущая ширина
  height: number;       // Текущая высота
  isPortrait: boolean;  // height >= width
  isLandscape: boolean; // width > height
  scale: number;        // Pixel density
  fontScale: number;    // Font scale
}
```

**Особенности**:
- ✅ Автоматически обновляется при изменении ориентации
- ✅ Оптимизирован с `useState` и `useEffect`
- ✅ Правильно очищает подписку при размонтировании

### 3. Синхронная функция (`getScreenDimensions()`)

**Использование**: Для синхронного получения текущих размеров без хука

```typescript
import { getScreenDimensions } from '@/utils/constants';

function getCurrentLayout() {
  const dims = getScreenDimensions();
  return dims.isPortrait ? 'portrait' : 'landscape';
}
```

### 4. Утилиты (`utils/helpers.ts`)

```typescript
import { isTablet, isLandscape, isPortrait } from '@/utils/helpers';

// Проверка планшета
if (isTablet()) {
  // Планшетный UI
}

// Проверка ориентации (синхронно)
if (isLandscape()) {
  // Landscape UI
}
```

**⚠️ Deprecated**: `isLandscape()` и `isPortrait()` помечены как deprecated. Используйте `useScreenDimensions()` или `getScreenDimensions()`.

## 📝 Примеры использования

### Пример 1: Статические стили

```typescript
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/constants';

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  card: {
    width: SCREEN_WIDTH - 32, // С отступами
    marginHorizontal: 16,
  },
});
```

### Пример 2: Адаптивный компонент

```typescript
import { useScreenDimensions } from '@/utils/constants';

function AdaptiveComponent() {
  const { width, isPortrait } = useScreenDimensions();
  
  const columns = isPortrait ? 2 : 4;
  const itemWidth = (width - 48) / columns; // 48 = отступы
  
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {items.map(item => (
        <View key={item.id} style={{ width: itemWidth }}>
          {item.content}
        </View>
      ))}
    </View>
  );
}
```

### Пример 3: Условный рендеринг по ориентации

```typescript
import { useScreenDimensions } from '@/utils/constants';

function VideoPlayer() {
  const { isPortrait } = useScreenDimensions();
  
  return (
    <View>
      {isPortrait ? (
        <PortraitPlayer />
      ) : (
        <LandscapePlayer />
      )}
    </View>
  );
}
```

### Пример 4: Комбинация со стилями

```typescript
import { useScreenDimensions } from '@/utils/constants';

function ResponsiveCard() {
  const { width, isTablet } = useScreenDimensions();
  const isTabletDevice = isTablet(); // Из helpers
  
  const cardWidth = isTabletDevice 
    ? Math.min(width * 0.4, 400) 
    : width - 32;
  
  return (
    <View style={[styles.card, { width: cardWidth }]}>
      {/* Content */}
    </View>
  );
}
```

## 🔄 Миграция существующего кода

### Было:
```typescript
const { width, height } = Dimensions.get('window');
```

### Стало (для статических значений):
```typescript
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/constants';
```

### Стало (для динамических значений):
```typescript
import { useScreenDimensions } from '@/utils/constants';

function Component() {
  const { width, height } = useScreenDimensions();
  // ...
}
```

## ⚡ Производительность

### Оптимизации:
- ✅ Статические константы вычисляются один раз
- ✅ Хук подписывается только на изменения
- ✅ Правильная очистка подписок
- ✅ Минимальные ререндеры благодаря `useState`

### Best Practices:
1. **Используйте статические константы** в `StyleSheet.create()`
2. **Используйте хук** только когда нужна реактивность
3. **Мемоизируйте вычисления** с `useMemo` если используются в зависимостях

```typescript
const { width } = useScreenDimensions();
const itemWidth = useMemo(() => (width - 48) / columns, [width, columns]);
```

## 🎨 iOS/Android специфики

Все размеры работают одинаково на обеих платформах. Для специфичных случаев используйте:

```typescript
import { Platform } from 'react-native';
import { SCREEN_WIDTH } from '@/utils/constants';

const padding = Platform.select({
  ios: SCREEN_WIDTH * 0.05,
  android: SCREEN_WIDTH * 0.03,
  default: 16,
});
```

## 📚 Дополнительные ресурсы

- [React Native Dimensions API](https://reactnative.dev/docs/dimensions)
- [Expo Screen Orientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## ✅ Чеклист использования

- [ ] Используете статические константы в `StyleSheet.create()`?
- [ ] Используете хук только для динамических значений?
- [ ] Правильно очищаете подписки?
- [ ] Мемоизируете тяжелые вычисления на основе размеров?
- [ ] Тестируете на разных размерах экранов и ориентациях?

