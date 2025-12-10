import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CategoryType, getCategoryConfig } from '@/config/filterConfig';
import { useAppTheme } from '@/lib/theme';

interface VisionCategorySelectorProps {
  categories: CategoryType[];
  selectedCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

// Icon mapping for categories
const CATEGORY_ICONS: Record<CategoryType, keyof typeof Ionicons.glyphMap> = {
  car: 'car-outline',
  horse: 'paw-outline',
  real_estate: 'home-outline',
};

const CATEGORY_ICONS_ACTIVE: Record<CategoryType, keyof typeof Ionicons.glyphMap> = {
  car: 'car',
  horse: 'paw',
  real_estate: 'home',
};

export const VisionCategorySelector: React.FC<VisionCategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {categories.map((category) => {
        const config = getCategoryConfig(category);
        const isSelected = selectedCategory === category;

        return (
          <CategoryChip
            key={category}
            category={category}
            name={config.name}
            icon={isSelected ? CATEGORY_ICONS_ACTIVE[category] : CATEGORY_ICONS[category]}
            isSelected={isSelected}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onCategoryChange(category);
            }}
            theme={theme}
            isDark={isDark}
          />
        );
      })}
    </ScrollView>
  );
};

interface CategoryChipProps {
  category: CategoryType;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onPress: () => void;
  theme: any;
  isDark: boolean;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  icon,
  name,
  isSelected,
  onPress,
  theme,
  isDark,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isSelected ? 1 : 0.85);
  const borderGlow = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.05, {
        damping: 12,
        stiffness: 200,
      });
      opacity.value = withTiming(1, {
        duration: 120,
        easing: Easing.out(Easing.cubic),
      });
      borderGlow.value = withTiming(1, {
        duration: 120,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });
      opacity.value = withTiming(0.85, {
        duration: 120,
        easing: Easing.out(Easing.cubic),
      });
      borderGlow.value = withTiming(0, {
        duration: 120,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isSelected, scale, opacity, borderGlow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const borderGlowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
    shadowOpacity: borderGlow.value * 0.6,
  }));

  const backgroundColor = isSelected
    ? isDark
      ? theme.surfaceGlassActive
      : theme.surfaceGlassActive || 'rgba(255,255,255,0.95)'
    : isDark
      ? theme.surfaceGlass
      : theme.surfaceGlass || 'rgba(255,255,255,0.75)';

  const borderColor = isSelected
    ? theme.accentPrimary || '#0077FF'
    : isDark
      ? theme.borderSoft
      : theme.borderSoft || 'rgba(0,0,0,0.08)';

  const iconColor = isSelected
    ? theme.accentPrimary || '#E6E6E6' // Platinum
    : isDark
      ? theme.textPrimary
      : theme.textSecondary || 'rgba(0,0,0,0.55)';

  const textColor = isSelected
    ? theme.accentPrimary || '#E6E6E6' // Platinum
    : isDark
      ? theme.textPrimary
      : theme.textSecondary || 'rgba(0,0,0,0.55)';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={styles.chipWrapper}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor,
            borderColor,
          },
          animatedStyle,
        ]}
      >
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={isSelected ? (isDark ? 55 : 50) : (isDark ? 40 : 35)}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.specularHighlight} />
        <Animated.View
          style={[
            styles.glowBorder,
            {
              borderColor: theme.accentPrimary || '#E6E6E6', // Platinum
              shadowColor: theme.glowPrimary || 'rgba(255,255,255,0.14)', // Platinum glow
            },
            borderGlowStyle,
          ]}
        />
        <View style={styles.content}>
          <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
          <Text style={[styles.text, { color: textColor }]}>{name}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  contentContainer: {
    gap: 10,
    paddingHorizontal: 4,
  },
  chipWrapper: {
    marginRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.12)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  icon: {
    zIndex: 2,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    zIndex: 2,
  },
});

