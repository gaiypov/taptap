// components/Feed/CategoryTabs.tsx
// TikTok-style категории с анимациями Reanimated 3

import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SIZES } from '@/lib/constants/sizes';
import { ultra } from '@/lib/theme/ultra';
import { Icons } from '@/components/icons/CustomIcons';
import { SPRING_CONFIGS } from '@/components/animations/PremiumAnimations';
import type { ListingCategory } from '@/types';

// ==============================================
// TYPES
// ==============================================

interface CategoryTabsProps {
  selectedCategory: ListingCategory | 'all';
  onCategoryChange: (category: ListingCategory | 'all') => void;
}

interface TabItem {
  key: ListingCategory | 'all';
  label: string;
  icon: React.FC<{ size: number; color: string }>;
}

// ==============================================
// CONSTANTS
// ==============================================

const TABS: TabItem[] = [
  { key: 'all', label: 'Все', icon: () => null },
  { key: 'car', label: 'Авто', icon: Icons.Car },
  { key: 'horse', label: 'Лошади', icon: Icons.Horse },
  { key: 'real_estate', label: 'Жильё', icon: Icons.House },
];

// Use premium spring configs for smoother feel
const SPRING_CONFIG = SPRING_CONFIGS.snappy;

// ==============================================
// ANIMATED TAB COMPONENT
// ==============================================

interface AnimatedTabProps {
  item: TabItem;
  isSelected: boolean;
  onPress: () => void;
}

const AnimatedTab: React.FC<AnimatedTabProps> = React.memo(({ 
  item, 
  isSelected, 
  onPress 
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isSelected ? 1 : 0.6);

  // Update opacity when selection changes
  React.useEffect(() => {
    opacity.value = withTiming(isSelected ? 1 : 0.6, { duration: 200 });
  }, [isSelected, opacity]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    width: withSpring(isSelected ? SIZES.categoryTabs.indicatorWidth : 0, SPRING_CONFIG),
    opacity: withTiming(isSelected ? 1 : 0, { duration: 150 }),
  }));

  const IconComponent = item.icon;
  const showIcon = item.key !== 'all';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.tab, animatedContainerStyle]}>
        {/* Icon + Label */}
        <View style={styles.tabContent}>
          {showIcon && IconComponent && (
            <IconComponent 
              size={16} 
              color={isSelected ? ultra.textPrimary : ultra.textSecondary} 
            />
          )}
          <Text style={[
            styles.tabText,
            isSelected && styles.tabTextActive,
          ]}>
            {item.label}
          </Text>
        </View>
        
        {/* Indicator */}
        <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
      </Animated.View>
    </Pressable>
  );
});

// ==============================================
// MAIN COMPONENT
// ==============================================

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + 12 }
    ]}>
      {/* Revolut Ultra Glass Effect - тонкие границы, минимализм */}
      <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
        <View style={styles.glassBorder} />
        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <AnimatedTab
              key={tab.key}
              item={tab}
              isSelected={selectedCategory === tab.key}
              onPress={() => onCategoryChange(tab.key)}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
};

// ==============================================
// STYLES
// ==============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurContainer: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(229, 228, 226, 0.15)', // Platinum тонкая граница
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(229, 228, 226, 0.2)',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.select({ ios: 14, android: 12, default: 14 }),
    paddingHorizontal: 20,
    gap: SIZES.categoryTabs.tabGap,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: SIZES.categoryTabs.tabPaddingHorizontal,
    paddingVertical: 8,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: SIZES.categoryTabs.fontSize,
    fontWeight: SIZES.categoryTabs.fontWeight,
    color: ultra.textMuted, // Приглушённый для неактивных
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: ultra.textPrimary, // Pure White для активных
    fontWeight: '700',
  },
  indicator: {
    height: 1.5, // Тонкая линия
    backgroundColor: ultra.textPrimary,
    borderRadius: 0.75,
    marginTop: 6,
  },
});

export default CategoryTabs;

