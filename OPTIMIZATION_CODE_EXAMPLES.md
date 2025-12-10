# 💻 Готовые примеры кода для оптимизации

## 📦 1. PremiumButton - Готовые паттерны

### Паттерн 1: Карточки в списках (SimilarListings, ForYouSection)

**БЫЛО (components/Feed/SimilarListings.tsx:144):**
```tsx
<TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
  <Image source={{ uri: listing.thumbnail_url }} />
  <View style={styles.info}>
    <Text>{getTitle()}</Text>
    <Text>{formatPrice(listing.price)} сом</Text>
  </View>
</TouchableOpacity>
```

**СТАЛО:**
```tsx
import { ScalePress } from '@/components/animations/PremiumAnimations';
import * as Haptics from 'expo-haptics';

<ScalePress scale={0.97}>
  <Pressable
    style={styles.card}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
  >
    <Image source={{ uri: listing.thumbnail_url }} />
    <View style={styles.info}>
      <Text>{getTitle()}</Text>
      <Text>{formatPrice(listing.price)} сом</Text>
    </View>
  </Pressable>
</ScalePress>
```

---

### Паттерн 2: Кнопки действий (TikTokStyleFeed)

**БЫЛО (components/VideoFeed/TikTokStyleFeed.tsx:377):**
```tsx
<TouchableOpacity
  style={styles.actionButton}
  onPress={() => handleLike(car)}
>
  <Ionicons
    name={car.isLiked ? 'heart' : 'heart-outline'}
    size={32}
    color={car.isLiked ? ultra.accent : '#FFFFFF'}
  />
  <Text style={styles.actionText}>{car.likes}</Text>
</TouchableOpacity>
```

**СТАЛО:**
```tsx
import { ScalePress, Bounce } from '@/components/animations/PremiumAnimations';
import * as Haptics from 'expo-haptics';

<ScalePress scale={0.9}>
  <Bounce trigger={car.isLiked}>
    <Pressable
      style={styles.actionButton}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        handleLike(car);
      }}
    >
      <Ionicons
        name={car.isLiked ? 'heart' : 'heart-outline'}
        size={32}
        color={car.isLiked ? ultra.accent : '#FFFFFF'}
      />
      <Text style={styles.actionText}>{car.likes}</Text>
    </Pressable>
  </Bounce>
</ScalePress>
```

---

### Паттерн 3: Текстовые кнопки (ForYouSection "Все →")

**БЫЛО (components/Feed/ForYouSection.tsx:149):**
```tsx
<TouchableOpacity onPress={handleSeeAll} activeOpacity={0.7}>
  <Text style={styles.seeAllText}>Все →</Text>
</TouchableOpacity>
```

**СТАЛО:**
```tsx
import { ScalePress } from '@/components/animations/PremiumAnimations';
import * as Haptics from 'expo-haptics';

<ScalePress scale={0.95}>
  <Pressable
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleSeeAll();
    }}
  >
    <Text style={styles.seeAllText}>Все →</Text>
  </Pressable>
</ScalePress>
```

---

## 🎨 2. Moti анимации - Готовые паттерны

### Паттерн 1: FadeIn для карточек (появление списка)

**components/Feed/SimilarListings.tsx:86-91**
```tsx
import { FadeIn } from '@/components/animations/PremiumAnimations';

const renderSimilarCard = useCallback(({ item, index }: { item: any; index: number }) => (
  <FadeIn
    delay={index * 80}  // Задержка для каждой карточки
    duration={400}       // Длительность анимации
  >
    <ScalePress scale={0.97}>
      <SimilarCard
        listing={item}
        onPress={() => handleCardPress(item)}
      />
    </ScalePress>
  </FadeIn>
), [handleCardPress]);
```

---

### Паттерн 2: Shimmer для загрузки

**components/Feed/ForYouSection.tsx:124-134**
```tsx
import { Shimmer } from '@/components/animations/PremiumAnimations';

if (loading) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.scrollContent}>
        {/* Shimmer карточки */}
        {[0, 1, 2].map(i => (
          <View key={i} style={styles.card}>
            <Shimmer width={CARD_WIDTH} height={CARD_WIDTH} borderRadius={16} />
            <View style={styles.info}>
              <Shimmer width={CARD_WIDTH * 0.7} height={14} borderRadius={4} />
              <Shimmer width={CARD_WIDTH * 0.5} height={16} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
```

**components/Comments/CommentsList.tsx:197-213 (замена ActivityIndicator):**
```tsx
import { Shimmer } from '@/components/animations/PremiumAnimations';

if (loading) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Комментарии</Text>
      </View>
      <View style={styles.loadingContainer}>
        {/* Shimmer скелетоны комментариев */}
        {[0, 1, 2].map(i => (
          <View key={i} style={styles.commentSkeleton}>
            <Shimmer width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Shimmer width="60%" height={14} borderRadius={4} />
              <Shimmer width="90%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
              <Shimmer width="70%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Добавить стиль:
const styles = StyleSheet.create({
  commentSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // ... остальные стили
});
```

---

### Паттерн 3: Glow для важных элементов

**components/Feed/ForYouSection.tsx:240-245 (Score Badge):**
```tsx
import { Glow } from '@/components/animations/PremiumAnimations';

{/* Score Badge с свечением */}
{score > 70 && (
  <Glow
    intensity={0.6}      // Интенсивность свечения (0-1)
    color={ultra.accent} // Цвет свечения
  >
    <View style={styles.scoreBadge}>
      <Ionicons name="heart" size={10} color="#FFF" />
      <Text style={styles.scoreText}>{score}%</Text>
    </View>
  </Glow>
)}
```

**Для premium листингов (можно добавить в VideoCard):**
```tsx
import { Glow } from '@/components/animations/PremiumAnimations';

{listing.is_premium && (
  <View style={styles.premiumContainer}>
    <Glow intensity={0.8} color="#FFD700">
      <View style={styles.premiumBadge}>
        <Ionicons name="star" size={14} color="#FFD700" />
        <Text style={styles.premiumText}>Premium</Text>
      </View>
    </Glow>
  </View>
)}
```

---

### Паттерн 4: Pulse для CTA кнопок

**components/Comments/CommentsList.tsx:266-278 (кнопка отправки):**
```tsx
import { Pulse } from '@/components/animations/PremiumAnimations';

<Pulse
  enabled={!!newComment.trim()}  // Пульсирует только когда есть текст
  duration={1500}                // Длительность пульса
>
  <TouchableOpacity
    style={[
      styles.sendButton,
      (!newComment.trim() || submitting) && styles.sendButtonDisabled,
    ]}
    onPress={handleAddComment}
    disabled={!newComment.trim() || submitting}
  >
    {submitting ? (
      <ActivityIndicator size="small" color="#FFF" />
    ) : (
      <Ionicons name="send" size={20} color="#FFF" />
    )}
  </TouchableOpacity>
</Pulse>
```

---

### Паттерн 5: Bounce для лайков

**components/VideoFeed/TikTokStyleFeed.tsx:377-387:**
```tsx
import { Bounce } from '@/components/animations/PremiumAnimations';

<Bounce
  trigger={car.isLiked}  // Анимация при изменении isLiked
  scale={1.2}            // Насколько увеличивается
>
  <TouchableOpacity
    style={styles.actionButton}
    onPress={() => handleLike(car)}
  >
    <Ionicons
      name={car.isLiked ? 'heart' : 'heart-outline'}
      size={32}
      color={car.isLiked ? ultra.accent : '#FFFFFF'}
    />
    <Text style={styles.actionText}>{car.likes}</Text>
  </TouchableOpacity>
</Bounce>
```

---

## 🔄 3. LazyLoad - Готовые паттерны

### Паттерн 1: Модальные окна

**Любой компонент с модалкой:**
```tsx
import { LazyLoad } from '@/components/common/LazyLoad';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <View>
      {/* Контент компонента */}

      {/* LazyLoad для модалки */}
      {showModal && (
        <LazyLoad>
          <EditCommentModal
            comment={selectedComment}
            onClose={() => setShowModal(false)}
            onUpdate={handleUpdate}
          />
        </LazyLoad>
      )}
    </View>
  );
}
```

---

### Паттерн 2: Комментарии (подгрузка по требованию)

**В DetailScreen или VideoCard:**
```tsx
import { LazyLoad } from '@/components/common/LazyLoad';
import { Shimmer } from '@/components/animations/PremiumAnimations';

function DetailScreen() {
  const [showComments, setShowComments] = useState(false);

  return (
    <View>
      {/* Основной контент */}

      <TouchableOpacity onPress={() => setShowComments(true)}>
        <Text>Показать комментарии ({commentsCount})</Text>
      </TouchableOpacity>

      {/* LazyLoad для комментариев */}
      {showComments && (
        <LazyLoad
          fallback={
            <View style={{ padding: 16 }}>
              <Shimmer width="100%" height={60} borderRadius={8} />
              <Shimmer width="100%" height={60} borderRadius={8} style={{ marginTop: 8 }} />
            </View>
          }
        >
          <CommentsList listingId={listingId} />
        </LazyLoad>
      )}
    </View>
  );
}
```

---

### Паттерн 3: Фильтры (подгрузка по требованию)

**В SearchScreen:**
```tsx
import { LazyLoad } from '@/components/common/LazyLoad';

function SearchScreen() {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <View>
      {/* Поисковая строка */}

      <TouchableOpacity onPress={() => setShowFilters(true)}>
        <Ionicons name="filter" size={24} />
      </TouchableOpacity>

      {/* LazyLoad для фильтров */}
      {showFilters && (
        <LazyLoad>
          <AdvancedFiltersModal
            visible={showFilters}
            onClose={() => setShowFilters(false)}
            onApply={handleApplyFilters}
          />
        </LazyLoad>
      )}
    </View>
  );
}
```

---

### Паттерн 4: Вкладки (подгрузка неактивных вкладок)

**В Profile или TabView:**
```tsx
import { LazyLoad } from '@/components/common/LazyLoad';

function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('listings');

  return (
    <View>
      {/* Табы */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab('listings')}>
          <Text>Объявления</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('favorites')}>
          <Text>Избранное</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('settings')}>
          <Text>Настройки</Text>
        </TouchableOpacity>
      </View>

      {/* LazyLoad для вкладок */}
      {activeTab === 'listings' && (
        <LazyLoad threshold={0.3}>
          <ListingsTab userId={userId} />
        </LazyLoad>
      )}
      {activeTab === 'favorites' && (
        <LazyLoad threshold={0.3}>
          <FavoritesTab userId={userId} />
        </LazyLoad>
      )}
      {activeTab === 'settings' && (
        <LazyLoad threshold={0.3}>
          <SettingsTab userId={userId} />
        </LazyLoad>
      )}
    </View>
  );
}
```

---

## 📐 4. Responsive - Готовые паттерны

### Паттерн 1: Адаптивные размеры карточек

**components/Feed/SimilarListings.tsx:24-25**
```tsx
import { responsive, device } from '@/utils/responsive';

// БЫЛО:
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.38;

// СТАЛО:
const CARD_WIDTH = device.isTablet
  ? responsive.wp(25)  // 25% ширины на планшетах
  : responsive.wp(38); // 38% на телефонах

const CARD_HEIGHT = responsive.verticalScale(CARD_WIDTH);
```

---

### Паттерн 2: Адаптивные отступы и размеры шрифтов

**components/Feed/ForYouSection.tsx:284-414 (styles)**
```tsx
import { responsive } from '@/utils/responsive';

const styles = StyleSheet.create({
  container: {
    marginVertical: responsive.verticalScale(16),
  },
  title: {
    fontSize: responsive.moderateScale(18, 0.3),
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: responsive.scale(16),
    gap: responsive.scale(12),
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: responsive.moderateScale(16, 0.3),
    padding: responsive.scale(12),
  },
  cardTitle: {
    fontSize: responsive.moderateScale(14, 0.3),
    fontWeight: '700',
    marginBottom: responsive.verticalScale(4),
  },
  cardPrice: {
    fontSize: responsive.moderateScale(16, 0.3),
    fontWeight: '800',
  },
});
```

---

### Паттерн 3: Условные размеры для разных устройств

**components/VideoFeed/EnhancedVideoCard.tsx (styles)**
```tsx
import { responsive, device } from '@/utils/responsive';

const styles = StyleSheet.create({
  infoCard: {
    bottom: device.isTablet
      ? responsive.verticalScale(160)
      : Platform.select({ ios: 140, android: 130 }),
    left: responsive.scale(20),
    right: device.isTablet
      ? responsive.wp(30)  // Больше места для панели на планшетах
      : responsive.scale(120),
    borderRadius: responsive.moderateScale(24, 0.3),
  },

  title: {
    fontSize: device.isSmallDevice
      ? responsive.moderateScale(16, 0.3)  // Маленькие телефоны
      : responsive.moderateScale(20, 0.3), // Обычные и большие
    fontWeight: '800',
  },

  price: {
    fontSize: device.isTablet
      ? responsive.moderateScale(36, 0.3)  // Больше на планшетах
      : responsive.moderateScale(30, 0.3),
    fontWeight: '900',
  },

  actionsPanel: {
    right: responsive.scale(16),
    bottom: responsive.verticalScale(160),
    gap: device.isTablet
      ? responsive.verticalScale(24)  // Больше расстояние на планшетах
      : responsive.verticalScale(20),
  },

  actionIconContainer: {
    width: responsive.moderateScale(44, 0.3),
    height: responsive.moderateScale(44, 0.3),
    borderRadius: responsive.moderateScale(22, 0.3),
  },
});
```

---

### Паттерн 4: Адаптивные Grid Layout

**Для списков с несколькими колонками:**
```tsx
import { responsive, device } from '@/utils/responsive';

const NUM_COLUMNS = device.isTablet ? 3 : 2;
const ITEM_WIDTH = (responsive.screenWidth - responsive.scale(16 * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

<LegendList
  data={items}
  renderItem={renderItem}
  numColumns={NUM_COLUMNS}
  key={NUM_COLUMNS} // Важно для пересоздания при изменении колонок
  columnWrapperStyle={styles.row}
/>

const styles = StyleSheet.create({
  row: {
    gap: responsive.scale(16),
    paddingHorizontal: responsive.scale(16),
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.4,
  },
});
```

---

## 🎯 5. Комбинированные паттерны (All-in-One)

### Супер-оптимизированная карточка

```tsx
import { FadeIn, ScalePress, Glow } from '@/components/animations/PremiumAnimations';
import { responsive, device } from '@/utils/responsive';
import * as Haptics from 'expo-haptics';

const SuperCard = ({ item, index, isPremium }) => (
  <FadeIn delay={index * 80} duration={400}>
    <ScalePress scale={0.97}>
      <Pressable
        style={[
          styles.card,
          { width: device.isTablet ? responsive.wp(25) : responsive.wp(90) }
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item);
        }}
      >
        {/* Image */}
        <Image source={{ uri: item.thumbnail_url }} style={styles.image} />

        {/* Premium Badge с Glow */}
        {isPremium && (
          <View style={styles.badgeContainer}>
            <Glow intensity={0.8} color="#FFD700">
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            </Glow>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.price}>{formatPrice(item.price)} сом</Text>
        </View>
      </Pressable>
    </ScalePress>
  </FadeIn>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: responsive.moderateScale(16, 0.3),
    backgroundColor: ultra.card,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: responsive.verticalScale(200),
  },
  badgeContainer: {
    position: 'absolute',
    top: responsive.scale(8),
    right: responsive.scale(8),
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: responsive.scale(8),
    paddingVertical: responsive.verticalScale(4),
    borderRadius: responsive.moderateScale(12, 0.3),
    gap: responsive.scale(4),
  },
  premiumText: {
    fontSize: responsive.moderateScale(11, 0.3),
    fontWeight: '700',
    color: '#FFD700',
  },
  info: {
    padding: responsive.scale(12),
  },
  title: {
    fontSize: responsive.moderateScale(14, 0.3),
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  price: {
    fontSize: responsive.moderateScale(16, 0.3),
    fontWeight: '800',
    color: ultra.accentSecondary,
    marginTop: responsive.verticalScale(4),
  },
});
```

---

## ⚡ Быстрое применение

### Шаг 1: Импорты (добавить в начало файла)
```tsx
// Анимации
import {
  FadeIn,
  ScalePress,
  Shimmer,
  Glow,
  Bounce,
  Pulse
} from '@/components/animations/PremiumAnimations';

// LazyLoad
import { LazyLoad } from '@/components/common/LazyLoad';

// Responsive
import { responsive, device } from '@/utils/responsive';

// Haptics
import * as Haptics from 'expo-haptics';
```

### Шаг 2: Заменить компоненты
1. `TouchableOpacity` → `ScalePress + Pressable + Haptics`
2. `ActivityIndicator` в loading → `Shimmer`
3. Важные badges → обернуть в `Glow`
4. Списки карточек → обернуть renderItem в `FadeIn`
5. Модалки → обернуть в `LazyLoad`

### Шаг 3: Обновить размеры
1. `SCREEN_WIDTH * 0.38` → `responsive.wp(38)`
2. `fontSize: 16` → `fontSize: responsive.moderateScale(16, 0.3)`
3. `padding: 12` → `padding: responsive.scale(12)`
4. `marginVertical: 16` → `marginVertical: responsive.verticalScale(16)`

---

**Готово!** Теперь у вас есть все готовые примеры для быстрого применения 🚀
