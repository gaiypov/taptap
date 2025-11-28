# 🛠 Справочник Premium инструментов

## 📚 Оглавление
1. [PremiumAnimations](#premiumanimations) - Moti анимации
2. [PremiumButton](#premiumbutton) - Универсальная кнопка
3. [LazyLoad](#lazyload) - Ленивая загрузка
4. [Responsive](#responsive) - Адаптивный дизайн
5. [Blurhash](#blurhash) - Плейсхолдеры изображений
6. [LegendList](#legendlist) - 60 FPS списки

---

## 1. PremiumAnimations

**Путь:** `components/animations/PremiumAnimations.tsx`

### ScalePress
Анимация масштабирования при нажатии (как iOS кнопки)

```tsx
import { ScalePress } from '@/components/animations/PremiumAnimations';

<ScalePress scale={0.95}>
  <Pressable onPress={onPress}>
    <Text>Нажми меня</Text>
  </Pressable>
</ScalePress>
```

**Параметры:**
- `scale?: number` - Насколько уменьшается (0.9 = 90% размера), default: 0.97
- `children: ReactNode` - Контент

---

### FadeIn
Плавное появление с задержкой

```tsx
import { FadeIn } from '@/components/animations/PremiumAnimations';

<FadeIn delay={100} duration={400}>
  <View><Text>Появляюсь плавно</Text></View>
</FadeIn>
```

**Параметры:**
- `delay?: number` - Задержка перед началом (мс), default: 0
- `duration?: number` - Длительность анимации (мс), default: 300
- `children: ReactNode` - Контент

**Паттерн для списков:**
```tsx
renderItem={({ item, index }) => (
  <FadeIn delay={index * 80} duration={400}>
    <Card item={item} />
  </FadeIn>
)}
```

---

### Shimmer
Скелетон-загрузка с мерцающим эффектом

```tsx
import { Shimmer } from '@/components/animations/PremiumAnimations';

// Прямоугольник
<Shimmer width={200} height={100} borderRadius={8} />

// Круг (аватар)
<Shimmer width={40} height={40} borderRadius={20} />

// Текстовая строка
<Shimmer width="80%" height={14} borderRadius={4} />
```

**Параметры:**
- `width: number | string` - Ширина (px или %)
- `height: number | string` - Высота (px или %)
- `borderRadius?: number` - Скругление углов, default: 4
- `style?: ViewStyle` - Дополнительные стили (margin, etc)

**Паттерн для карточки:**
```tsx
<View style={styles.card}>
  <Shimmer width="100%" height={150} borderRadius={12} />
  <View style={{ padding: 12 }}>
    <Shimmer width="70%" height={14} borderRadius={4} />
    <Shimmer width="50%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
  </View>
</View>
```

---

### Glow
Эффект свечения вокруг элемента

```tsx
import { Glow } from '@/components/animations/PremiumAnimations';

<Glow intensity={0.8} color="#FFD700">
  <View style={styles.premiumBadge}>
    <Text>⭐ Premium</Text>
  </View>
</Glow>
```

**Параметры:**
- `intensity?: number` - Интенсивность свечения (0-1), default: 0.5
- `color?: string` - Цвет свечения, default: '#FFFFFF'
- `children: ReactNode` - Контент

**Паттерны использования:**
```tsx
// Premium элементы
<Glow intensity={0.8} color="#FFD700">
  <Badge>Premium</Badge>
</Glow>

// Высокий рейтинг
<Glow intensity={0.6} color="#FF3B30">
  <Badge>95% match</Badge>
</Glow>

// Новые элементы
<Glow intensity={0.5} color="#34C759">
  <Badge>Новое</Badge>
</Glow>
```

---

### Bounce
Подпрыгивающая анимация (для лайков, добавления в корзину)

```tsx
import { Bounce } from '@/components/animations/PremiumAnimations';

<Bounce trigger={isLiked} scale={1.2}>
  <Ionicons
    name={isLiked ? 'heart' : 'heart-outline'}
    size={32}
    color={isLiked ? '#FF3B30' : '#FFF'}
  />
</Bounce>
```

**Параметры:**
- `trigger: boolean | any` - Когда изменяется, запускается анимация
- `scale?: number` - Насколько увеличивается, default: 1.15
- `children: ReactNode` - Контент

**Паттерны использования:**
```tsx
// Лайки
<Bounce trigger={isLiked} scale={1.2}>
  <LikeButton />
</Bounce>

// Добавление в корзину
<Bounce trigger={inCart} scale={1.15}>
  <CartIcon count={cartCount} />
</Bounce>

// Сохранение в избранное
<Bounce trigger={isSaved}>
  <BookmarkIcon />
</Bounce>
```

---

### Pulse
Пульсирующая анимация (для привлечения внимания к CTA)

```tsx
import { Pulse } from '@/components/animations/PremiumAnimations';

<Pulse enabled={hasText} duration={1500}>
  <TouchableOpacity style={styles.sendButton}>
    <Ionicons name="send" size={20} />
  </TouchableOpacity>
</Pulse>
```

**Параметры:**
- `enabled?: boolean` - Включить/выключить пульсацию, default: true
- `duration?: number` - Длительность одного цикла (мс), default: 1000
- `children: ReactNode` - Контент

**Паттерны использования:**
```tsx
// CTA кнопка (пульсирует когда активна)
<Pulse enabled={canSubmit}>
  <Button>Отправить</Button>
</Pulse>

// Уведомление (пульсирует когда есть новые)
<Pulse enabled={hasNewMessages}>
  <Badge count={unreadCount} />
</Pulse>

// Специальное предложение
<Pulse duration={2000}>
  <Banner>Скидка -50%</Banner>
</Pulse>
```

---

## 2. PremiumButton

**Путь:** `components/ui/PremiumButton.tsx`

Универсальная кнопка с анимациями и haptic feedback

```tsx
import PremiumButton from '@/components/ui/PremiumButton';

<PremiumButton
  variant="primary"
  onPress={handlePress}
  haptic="medium"
  loading={isLoading}
  disabled={!canSubmit}
  icon={<Ionicons name="save" size={20} />}
>
  Сохранить
</PremiumButton>
```

**Параметры:**
- `variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'icon'` - Стиль кнопки
- `onPress: () => void` - Обработчик нажатия
- `haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none'` - Haptic feedback
- `loading?: boolean` - Показать индикатор загрузки
- `disabled?: boolean` - Отключить кнопку
- `icon?: ReactNode` - Иконка слева
- `style?: ViewStyle` - Дополнительные стили
- `children?: ReactNode` - Текст или контент

**Варианты (variant):**
```tsx
// Primary - основная кнопка (синяя, заполненная)
<PremiumButton variant="primary" onPress={onSubmit}>
  Отправить
</PremiumButton>

// Secondary - второстепенная (серая, заполненная)
<PremiumButton variant="secondary" onPress={onCancel}>
  Отмена
</PremiumButton>

// Ghost - прозрачная с обводкой
<PremiumButton variant="ghost" onPress={onEdit}>
  Изменить
</PremiumButton>

// Link - текстовая ссылка
<PremiumButton variant="link" onPress={onMore}>
  Показать еще
</PremiumButton>

// Icon - только иконка (круглая)
<PremiumButton variant="icon" onPress={onSettings}>
  <Ionicons name="settings" size={24} />
</PremiumButton>
```

**Haptic levels:**
- `light` - Легкая вибрация (для мелких действий: переключение, скролл)
- `medium` - Средняя вибрация (для основных действий: лайк, сохранить)
- `heavy` - Сильная вибрация (для важных действий: удалить, подтвердить)
- `selection` - Легкая вибрация для выбора (Android)
- `none` - Без вибрации

---

## 3. LazyLoad

**Путь:** `components/common/LazyLoad.tsx`

Ленивая загрузка компонентов (появляются только когда видимы)

```tsx
import { LazyLoad } from '@/components/common/LazyLoad';

<LazyLoad
  fallback={<Shimmer width="100%" height={200} />}
  threshold={0.5}
>
  <HeavyComponent />
</LazyLoad>
```

**Параметры:**
- `children: ReactNode` - Компонент для ленивой загрузки
- `fallback?: ReactNode` - Что показать во время загрузки, default: null
- `threshold?: number` - Порог видимости (0-1), default: 0.1

**Паттерны использования:**

### Модальные окна
```tsx
{showModal && (
  <LazyLoad>
    <Modal {...props} />
  </LazyLoad>
)}
```

### Комментарии (тяжелые списки)
```tsx
{showComments && (
  <LazyLoad fallback={<Shimmer />}>
    <CommentsList listingId={id} />
  </LazyLoad>
)}
```

### Вкладки (загружаем только активную)
```tsx
{activeTab === 'settings' && (
  <LazyLoad threshold={0.3}>
    <SettingsTab />
  </LazyLoad>
)}
```

### Секции на длинной странице
```tsx
<ScrollView>
  {/* Всегда видимые */}
  <Header />
  <HeroSection />

  {/* LazyLoad для секций ниже */}
  <LazyLoad threshold={0.5}>
    <FeaturesSection />
  </LazyLoad>

  <LazyLoad threshold={0.5}>
    <TestimonialsSection />
  </LazyLoad>

  <LazyLoad threshold={0.5}>
    <FooterSection />
  </LazyLoad>
</ScrollView>
```

**Порог видимости (threshold):**
- `0.1` - Загружается когда 10% элемента стало видимым (по умолчанию, для всего)
- `0.3` - Загружается когда 30% видимо (для средних компонентов)
- `0.5` - Загружается когда 50% видимо (для тяжелых компонентов)
- `1.0` - Загружается когда весь элемент видим (для особо тяжелых)

---

## 4. Responsive

**Путь:** `utils/responsive.ts`

Адаптивный дизайн для разных размеров экранов

### Функции масштабирования:

```tsx
import { responsive, device } from '@/utils/responsive';

// Горизонтальное масштабирование (по ширине)
const padding = responsive.scale(16);  // 16px на базовом экране, масштабируется

// Вертикальное масштабирование (по высоте)
const marginTop = responsive.verticalScale(12);  // 12px на базовом экране

// Умеренное масштабирование (для шрифтов, иконок)
// factor: 0 = не масштабируется, 1 = полное масштабирование
const fontSize = responsive.moderateScale(16, 0.3);  // Масштаб 30%
```

### Проценты от экрана:

```tsx
// Ширина в процентах от экрана
const cardWidth = responsive.wp(90);  // 90% ширины экрана
const imageWidth = responsive.wp(100); // 100% ширины

// Высота в процентах от экрана
const modalHeight = responsive.hp(80);  // 80% высоты экрана
const headerHeight = responsive.hp(10); // 10% высоты
```

### Размеры экрана:

```tsx
// Размеры текущего экрана
const { screenWidth, screenHeight } = responsive;

console.log(screenWidth);  // 375
console.log(screenHeight); // 812
```

### Определение устройства:

```tsx
// Тип устройства
if (device.isTablet) {
  // iPad, планшеты (ширина >= 768px)
}

if (device.isSmallDevice) {
  // Маленькие телефоны (ширина < 375px)
}

if (device.isLargeDevice) {
  // Большие телефоны и планшеты (ширина > 414px)
}

// Ориентация
if (device.isPortrait) {
  // Портретная ориентация
}

if (device.isLandscape) {
  // Альбомная ориентация
}
```

### Паттерны использования:

#### Адаптивные размеры карточек
```tsx
import { responsive, device } from '@/utils/responsive';

const CARD_WIDTH = device.isTablet
  ? responsive.wp(30)  // 30% на планшетах (3 колонки)
  : responsive.wp(90); // 90% на телефонах (1 колонка)

const CARD_HEIGHT = responsive.verticalScale(CARD_WIDTH * 1.4);
```

#### Адаптивные стили
```tsx
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: responsive.scale(16),  // 16px базово
    paddingVertical: responsive.verticalScale(12),
  },

  title: {
    fontSize: responsive.moderateScale(20, 0.3),  // Умеренное масштабирование
    marginBottom: responsive.verticalScale(8),
  },

  // Разные размеры для разных устройств
  card: {
    width: device.isTablet ? responsive.wp(40) : responsive.wp(90),
    height: device.isSmallDevice ? 200 : 300,
    borderRadius: responsive.moderateScale(12, 0.3),
  },
});
```

#### Grid с адаптивными колонками
```tsx
const NUM_COLUMNS = device.isTablet ? 3 : 2;
const SPACING = responsive.scale(16);
const ITEM_WIDTH = (responsive.screenWidth - SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

<LegendList
  data={items}
  numColumns={NUM_COLUMNS}
  key={NUM_COLUMNS}
  columnWrapperStyle={{ gap: SPACING }}
/>
```

---

## 5. Blurhash

**Путь:** `constants/blurhash.ts`

Плейсхолдеры изображений для плавной загрузки

### Константы:

```tsx
import { BLURHASH, IMAGE_TRANSITION, getBlurhashByCategory } from '@/constants/blurhash';

// Базовый blurhash (серый градиент)
BLURHASH.DEFAULT
// "LGFFaXYk^6#M@-5c,1J5@[or[Q6."

// Категории
BLURHASH.CAR          // Синеватый для авто
BLURHASH.HORSE        // Коричневый для лошадей
BLURHASH.REAL_ESTATE  // Зеленоватый для недвижимости

// Переходы для expo-image
IMAGE_TRANSITION.FAST     // 200ms
IMAGE_TRANSITION.MEDIUM   // 400ms (по умолчанию)
IMAGE_TRANSITION.SLOW     // 600ms
```

### Использование:

```tsx
import { Image } from 'expo-image';
import { getBlurhashByCategory, IMAGE_TRANSITION } from '@/constants/blurhash';

// С категорией
<Image
  source={{ uri: listing.thumbnail_url }}
  placeholder={{ blurhash: getBlurhashByCategory(listing.category) }}
  transition={IMAGE_TRANSITION.FAST}
  style={styles.image}
  contentFit="cover"
  cachePolicy="memory-disk"
/>

// Без категории (default)
<Image
  source={{ uri: imageUrl }}
  placeholder={{ blurhash: BLURHASH.DEFAULT }}
  transition={IMAGE_TRANSITION.MEDIUM}
  style={styles.image}
/>

// С кастомным blurhash
<Image
  source={{ uri: imageUrl }}
  placeholder={{ blurhash: "L6Pj0^jE.AyE_3t7t7R**0o#DgR4" }}
  transition={IMAGE_TRANSITION.SLOW}
  style={styles.image}
/>
```

### Генерация своих blurhash:

1. Онлайн: https://blurha.sh/
2. Библиотека: `blurhash` (Node.js)
3. Формат: Строка 20-40 символов (рекомендуется размер 4x3 или 6x4)

**Примеры для разных цветов:**
```tsx
// Синий градиент
"L6Pj0^jE.AyE_3t7t7R**0o#DgR4"

// Красный градиент
"L6PZfSi_.AyE_3t7t7R**0o#DgR4"

// Зеленый градиент
"L6PZfSWB2yk8pyo0adR*.7kCMdnj"

// Серый градиент
"LGFFaXYk^6#M@-5c,1J5@[or[Q6."
```

---

## 6. LegendList

**Путь:** `@legendapp/list` (npm package)

60 FPS списки с signal-based recycling (лучше FlashList)

### Базовое использование:

```tsx
import { LegendList } from '@legendapp/list';

<LegendList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  recycleItems={true}
  drawDistance={SCREEN_HEIGHT * 2}
/>
```

### Параметры:

**Основные:**
- `data: T[]` - Массив данных
- `renderItem: ({ item, index }) => ReactElement` - Рендер функция
- `keyExtractor: (item, index) => string` - Ключ для элемента
- `recycleItems?: boolean` - Переиспользование элементов, default: true
- `drawDistance?: number` - Расстояние рендеринга за пределами экрана (px)

**Для горизонтальных списков:**
- `horizontal?: boolean` - Горизонтальный скролл
- `showsHorizontalScrollIndicator?: boolean` - Показать индикатор
- `snapToInterval?: number` - Привязка к интервалу (для пагинации)

**Для вертикальных списков:**
- `pagingEnabled?: boolean` - Включить пагинацию (как в TikTok)
- `snapToAlignment?: 'start' | 'center' | 'end'` - Выравнивание привязки
- `decelerationRate?: 'fast' | 'normal'` - Скорость замедления
- `onViewableItemsChanged?: (info) => void` - Когда элементы стали видимыми

**Другие:**
- `onRefresh?: () => void` - Pull-to-refresh
- `refreshing?: boolean` - Статус обновления
- `ListEmptyComponent?: ReactElement` - Компонент когда пусто
- `ListHeaderComponent?: ReactElement` - Шапка списка
- `ListFooterComponent?: ReactElement` - Подвал списка
- `contentContainerStyle?: ViewStyle` - Стили контейнера

### Паттерны использования:

#### Вертикальная лента (TikTok style)
```tsx
<LegendList
  data={videos}
  renderItem={renderVideo}
  keyExtractor={(item) => item.id}
  pagingEnabled
  snapToInterval={SCREEN_HEIGHT}
  snapToAlignment="start"
  decelerationRate="fast"
  onViewableItemsChanged={onViewableItemsChanged}
  viewabilityConfig={{
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }}
  recycleItems={true}
  drawDistance={SCREEN_HEIGHT * 2}
/>
```

#### Горизонтальные карточки
```tsx
<LegendList
  data={cards}
  renderItem={renderCard}
  keyExtractor={(item) => item.id}
  horizontal
  showsHorizontalScrollIndicator={false}
  snapToInterval={CARD_WIDTH + 12}  // Ширина карточки + отступ
  decelerationRate="fast"
  contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
  recycleItems={true}
  drawDistance={SCREEN_WIDTH * 2}
/>
```

#### Grid (несколько колонок)
```tsx
<LegendList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  numColumns={2}
  columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
  recycleItems={true}
  drawDistance={500}
/>
```

#### С pull-to-refresh
```tsx
<LegendList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  onRefresh={handleRefresh}
  refreshing={isRefreshing}
  recycleItems={true}
  drawDistance={500}
/>
```

#### С пустым состоянием
```tsx
<LegendList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={
    <View style={styles.emptyContainer}>
      <Text>Нет данных</Text>
    </View>
  }
  recycleItems={true}
/>
```

### Оптимизация производительности:

```tsx
// ✅ ПРАВИЛЬНО: мемоизированный renderItem
const renderItem = useCallback(({ item, index }) => (
  <Card item={item} />
), []);

// ❌ НЕПРАВИЛЬНО: новая функция каждый рендер
<LegendList
  data={items}
  renderItem={({ item }) => <Card item={item} />}  // Пересоздается каждый раз!
/>
```

```tsx
// ✅ ПРАВИЛЬНО: стабильный keyExtractor
const keyExtractor = useCallback((item) => item.id, []);

// ✅ ПРАВИЛЬНО: стабильный viewabilityConfig
const viewabilityConfig = useMemo(() => ({
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 100,
}), []);
```

### drawDistance (расстояние рендеринга):

**Для вертикальных списков:**
- `SCREEN_HEIGHT * 1` - Только видимое (минимальная память, рывки)
- `SCREEN_HEIGHT * 2` - ±1 экран (оптимально для большинства)
- `SCREEN_HEIGHT * 3` - ±1.5 экрана (для быстрого скролла)

**Для горизонтальных списков:**
- `SCREEN_WIDTH * 2` - ±1 экран (оптимально)
- `SCREEN_WIDTH * 3` - ±1.5 экрана (для быстрого скролла)

**Для grid:**
- `500` - Небольшой grid (2-3 колонки)
- `1000` - Большой grid или много данных

---

## 🎯 Быстрая шпаргалка

### Когда использовать что:

| Задача | Инструмент | Пример |
|--------|-----------|--------|
| Кнопка с анимацией | `ScalePress` | Любые кнопки, карточки |
| Появление списка | `FadeIn` | Карточки в feed |
| Загрузка данных | `Shimmer` | Вместо ActivityIndicator |
| Premium элементы | `Glow` | Badges, premium листинги |
| Лайки, избранное | `Bounce` | Иконки сердца, звезды |
| CTA кнопки | `Pulse` | Кнопка "Отправить", "Купить" |
| Модалки | `LazyLoad` | Любые модальные окна |
| Комментарии | `LazyLoad` | Тяжелые списки |
| Вкладки | `LazyLoad` | Профиль, настройки |
| Разные экраны | `responsive` | Размеры, отступы, шрифты |
| Изображения | `blurhash` | Плейсхолдеры для Image |
| Списки | `LegendList` | Все FlatList/ScrollView |

---

## 📝 Чеклист перед применением

- [ ] Импортировать нужные компоненты
- [ ] Добавить `import * as Haptics from 'expo-haptics'` если нужно
- [ ] Заменить `TouchableOpacity` → `ScalePress + Pressable`
- [ ] Заменить `ActivityIndicator` → `Shimmer` в loading
- [ ] Обернуть renderItem в `FadeIn` для списков
- [ ] Обернуть модалки в `LazyLoad`
- [ ] Применить `responsive` для размеров
- [ ] Добавить `blurhash` для `Image`
- [ ] Убедиться что `LegendList` используется везде
- [ ] Протестировать на iOS и Android

---

**Удачи! 🚀**
