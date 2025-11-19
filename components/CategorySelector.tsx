import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const CATEGORIES = {
  auto: { label: 'Авто', icon: 'car-outline', activeIcon: 'car' },
  horse: { label: 'Лошади', icon: 'ribbon-outline', activeIcon: 'trophy' },
  home: { label: 'Жильё', icon: 'home-outline', activeIcon: 'home' },
} as const;

export type CategoryType = 'auto' | 'horse' | 'home';

interface CategorySelectorProps {
  selectedCategory: CategoryType;
  onSelect: (category: CategoryType) => void;
}

interface CategoryPillProps {
  category: CategoryType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}

export default function CategorySelector({ selectedCategory, onSelect }: CategorySelectorProps) {
  return (
    <View style={[styles.wrapper, { pointerEvents: 'box-none' }]}>
      <View style={styles.container}>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <CategoryPill
            key={key}
            category={key as CategoryType}
            label={cat.label}
            icon={cat.icon}
            activeIcon={cat.activeIcon}
            active={selectedCategory === key}
            onPress={() => onSelect(key as CategoryType)}
          />
        ))}
      </View>
    </View>
  );
}

function CategoryPill({ category: _category, label, icon, activeIcon, active, onPress }: CategoryPillProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 150,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pillPress}
    >
      <Animated.View style={[styles.pillOuter, { transform: [{ scale }] }]}>
        {active && (
          <LinearGradient
            colors={['#667eea55', '#764ba255', '#f093fb55']}
            style={styles.glowAura}
          />
        )}

        <View
          style={[
            styles.pill,
            active && styles.pillActive,
          ]}
        >
          <View style={styles.pillContent}>
            <Ionicons
              name={active ? activeIcon : icon}
              size={Platform.select({ ios: 20, android: 19, default: 20 })}
              color={active ? ultra.textPrimary : ultra.textSecondary}
            />
            <Text
              style={[
                styles.label,
                active && styles.labelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 64 : 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },

  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },

  pillPress: { },

  pillOuter: {
    borderRadius: 28,
    overflow: 'visible',
  },

  glowAura: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    left: -8,
    right: -8,
    borderRadius: 36,
    opacity: 0.7,
  },

  pill: {
    borderRadius: Platform.select({ ios: 24, android: 22, default: 24 }),
    paddingHorizontal: Platform.select({ ios: 16, android: 14, default: 16 }),
    height: Platform.select({ ios: 44, android: 42, default: 44 }),
    justifyContent: 'center',
    backgroundColor: ultra.card, // #171717 матовая
    borderWidth: 1,
    borderColor: ultra.border, // #2A2A2A
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  pillActive: {
    borderColor: ultra.accent, // #C0C0C0 серебро
    backgroundColor: ultra.card,
  },

  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  label: {
    fontSize: Platform.select({ ios: 15, android: 14, default: 15 }),
    fontWeight: '500',
    color: ultra.textSecondary, // #B8B8B8
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },

  labelActive: {
    color: ultra.textPrimary, // #FFFFFF
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
});
