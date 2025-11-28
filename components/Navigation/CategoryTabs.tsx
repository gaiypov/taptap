/**
 * CategoryTabs - Нативные табы для категорий
 * 
 * Использует нативные компоненты:
 * - iOS: Segmented Control style
 * - Android: Material TabLayout style
 * 
 * Категории: Авто, Недвижимость, Вакансии, Лошади
 * 
 * Использование:
 * <CategoryTabs
 *   selected={category}
 *   onSelect={setCategory}
 * />
 */

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// ============================================================================
// Types
// ============================================================================

export type CategoryType = 'car' | 'real_estate' | 'horse';

export interface Category {
  key: CategoryType;
  label: string;
  labelShort: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  {
    key: 'car',
    label: 'Автомобили',
    labelShort: 'Авто',
    icon: 'car-sport',
    color: '#E5E4E2', // Platinum
    emoji: '🚗',
  },
  {
    key: 'real_estate',
    label: 'Недвижимость',
    labelShort: 'Недвижимость',
    icon: 'home',
    color: '#E5E4E2', // Platinum
    emoji: '🏠',
  },
  {
    key: 'horse',
    label: 'Лошади',
    labelShort: 'Лошади',
    icon: 'fitness', // closest to horse
    color: '#E5E4E2', // Platinum
    emoji: '🐴',
  },
];

export interface CategoryTabsProps {
  /** Выбранная категория */
  selected: CategoryType;
  /** Callback при выборе */
  onSelect: (category: CategoryType) => void;
  /** Вариант отображения */
  variant?: 'pills' | 'underline' | 'chips';
  /** Показывать иконки */
  showIcons?: boolean;
  /** Показывать эмодзи */
  showEmoji?: boolean;
  /** Компактный режим */
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function CategoryTabs({
  selected,
  onSelect,
  variant = 'pills',
  showIcons = true,
  showEmoji = false,
  compact = false,
}: CategoryTabsProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Find selected index
  const selectedIndex = CATEGORIES.findIndex(c => c.key === selected);

  // Scroll to selected tab
  useEffect(() => {
    if (scrollViewRef.current && selectedIndex >= 0) {
      // Calculate approximate scroll position
      const tabWidth = compact ? 90 : 110;
      const scrollX = Math.max(0, selectedIndex * tabWidth - 50);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [selectedIndex, compact]);

  const handleSelect = useCallback((category: CategoryType) => {
    if (category === selected) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.selectionAsync();
    }
    
    onSelect(category);
  }, [selected, onSelect]);

  if (variant === 'underline') {
    return (
      <UnderlineTabs
        categories={CATEGORIES}
        selected={selected}
        onSelect={handleSelect}
        showIcons={showIcons}
        compact={compact}
      />
    );
  }

  if (variant === 'chips') {
    return (
      <ChipTabs
        categories={CATEGORIES}
        selected={selected}
        onSelect={handleSelect}
        showEmoji={showEmoji}
        compact={compact}
      />
    );
  }

  // Default: Pills
  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillsContainer}
    >
      {CATEGORIES.map((category) => (
        <PillTab
          key={category.key}
          category={category}
          isSelected={category.key === selected}
          onPress={() => handleSelect(category.key)}
          showIcon={showIcons}
          showEmoji={showEmoji}
          compact={compact}
        />
      ))}
    </ScrollView>
  );
}

// ============================================================================
// Pill Tab
// ============================================================================

interface PillTabProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
  showIcon: boolean;
  showEmoji: boolean;
  compact: boolean;
}

const PillTab = React.memo(({
  category,
  isSelected,
  onPress,
  showIcon,
  showEmoji,
  compact,
}: PillTabProps) => {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', category.color + '20']
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [ultra.border, category.color]
    );

    return {
      backgroundColor,
      borderColor,
      transform: [{ scale: scale.value }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [ultra.textSecondary, category.color]
    );
    return { color };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[
        styles.pillTab,
        compact && styles.pillTabCompact,
        animatedStyle,
      ]}>
        {showEmoji && (
          <Text style={styles.emoji}>{category.emoji}</Text>
        )}
        {showIcon && !showEmoji && (
          <Ionicons
            name={category.icon}
            size={compact ? 16 : 18}
            color={isSelected ? category.color : ultra.textSecondary}
          />
        )}
        <Animated.Text style={[
          styles.pillText,
          compact && styles.pillTextCompact,
          textAnimatedStyle,
        ]}>
          {compact ? category.labelShort : category.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
});

// ============================================================================
// Underline Tabs
// ============================================================================

interface UnderlineTabsProps {
  categories: Category[];
  selected: CategoryType;
  onSelect: (key: CategoryType) => void;
  showIcons: boolean;
  compact: boolean;
}

const UnderlineTabs = ({
  categories,
  selected,
  onSelect,
  showIcons,
  compact,
}: UnderlineTabsProps) => {
  const selectedIndex = categories.findIndex(c => c.key === selected);
  const translateX = useSharedValue(selectedIndex * (compact ? 80 : 100));

  useEffect(() => {
    translateX.value = withSpring(selectedIndex * (compact ? 80 : 100), {
      damping: 20,
      stiffness: 200,
    });
  }, [selectedIndex, translateX, compact]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.underlineContainer}>
      <View style={styles.underlineTabs}>
        {categories.map((category) => {
          const isSelected = category.key === selected;
          return (
            <Pressable
              key={category.key}
              onPress={() => onSelect(category.key)}
              style={[styles.underlineTab, compact && styles.underlineTabCompact]}
            >
              {showIcons && (
                <Ionicons
                  name={category.icon}
                  size={compact ? 18 : 20}
                  color={isSelected ? category.color : ultra.textMuted}
                />
              )}
              <Text style={[
                styles.underlineText,
                compact && styles.underlineTextCompact,
                isSelected && { color: categories.find(c => c.key === selected)?.color },
              ]}>
                {compact ? category.labelShort : category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {/* Indicator */}
      <Animated.View style={[
        styles.underlineIndicator,
        compact && styles.underlineIndicatorCompact,
        indicatorStyle,
        { backgroundColor: categories[selectedIndex]?.color || ultra.accent },
      ]} />
    </View>
  );
};

// ============================================================================
// Chip Tabs
// ============================================================================

interface ChipTabsProps {
  categories: Category[];
  selected: CategoryType;
  onSelect: (key: CategoryType) => void;
  showEmoji: boolean;
  compact: boolean;
}

const ChipTabs = ({
  categories,
  selected,
  onSelect,
  showEmoji,
  compact,
}: ChipTabsProps) => {
  return (
    <View style={styles.chipsContainer}>
      {categories.map((category) => {
        const isSelected = category.key === selected;
        return (
          <Pressable
            key={category.key}
            onPress={() => onSelect(category.key)}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              isSelected && {
                backgroundColor: category.color + '20',
                borderColor: category.color,
              },
            ]}
          >
            {showEmoji && (
              <Text style={[styles.chipEmoji, compact && styles.chipEmojiCompact]}>
                {category.emoji}
              </Text>
            )}
            <Text style={[
              styles.chipText,
              compact && styles.chipTextCompact,
              isSelected && { color: category.color },
            ]}>
              {compact ? category.labelShort : category.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Pills
  pillsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    flexDirection: 'row',
  },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  pillTabCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textSecondary,
  },
  pillTextCompact: {
    fontSize: 13,
  },
  emoji: {
    fontSize: 18,
  },

  // Underline
  underlineContainer: {
    position: 'relative',
  },
  underlineTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  underlineTab: {
    width: 100,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  underlineTabCompact: {
    width: 80,
    paddingVertical: 10,
  },
  underlineText: {
    fontSize: 13,
    fontWeight: '500',
    color: ultra.textMuted,
  },
  underlineTextCompact: {
    fontSize: 12,
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 100,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  underlineIndicatorCompact: {
    width: 80,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: ultra.card,
    borderWidth: 1,
    borderColor: ultra.border,
    gap: 6,
  },
  chipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipEmojiCompact: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: ultra.textSecondary,
  },
  chipTextCompact: {
    fontSize: 12,
  },
});

export default CategoryTabs;

