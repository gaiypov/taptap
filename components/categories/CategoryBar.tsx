// components/categories/CategoryBar.tsx

// Revolut Ultra Platinum - шапка категорий: Авто • Лошади • Недвижимость

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ultra } from '@/lib/theme/ultra';

type CategoryId = 'auto' | 'horse' | 'home' | 'real_estate';

interface CategoryBarProps {
  value: CategoryId | string;
  onChange: (value: CategoryId | string) => void;
}

const TABS: { id: CategoryId; label: string }[] = [
  { id: 'auto', label: 'Авто' },
  { id: 'horse', label: 'Лошади' },
  { id: 'home', label: 'Недвижимость' },
];

// Map 'real_estate' to 'home' for compatibility
const normalizeCategory = (category: CategoryId | string): CategoryId => {
  if (category === 'real_estate') return 'home';
  if (category === 'auto' || category === 'horse' || category === 'home') {
    return category;
  }
  return 'auto';
};

// Map 'home' back to 'home' for external use
// Note: mapCategoryToFeed in index.tsx expects 'home', not 'real_estate'
const denormalizeCategory = (category: CategoryId): string => {
  // Return as-is, because mapCategoryToFeed expects 'home' for real estate
  return category;
};

export const CategoryBar: React.FC<CategoryBarProps> = ({ value, onChange }) => {
  const normalizedValue = normalizeCategory(value);

  return (
    <View style={[styles.wrapper, { pointerEvents: 'box-none' as const }]}>
      <View style={styles.container}>
        <View style={styles.tabsRow}>
          {TABS.map((tab, index) => {
            const isActive = tab.id === normalizedValue;
            return (
              <React.Fragment key={tab.id}>
                <Pressable
                  onPress={() => {
                    if (!isActive) {
                      onChange(denormalizeCategory(tab.id));
                    }
                  }}
                  android_ripple={{
                    color: 'rgba(255,255,255,0.1)',
                    borderless: true,
                  }}
                >
                  <View style={styles.tabContainer}>
                    <Text
                      style={[
                        styles.tabLabel,
                        isActive && styles.tabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                    {isActive && <View style={styles.underline} />}
                  </View>
                </Pressable>
                {index < TABS.length - 1 && (
                  <Text style={styles.separator}> • </Text>
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ===================== STYLES =====================

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.select({ ios: 56, android: 40, default: 48 }),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  container: {
    backgroundColor: ultra.background, // #0D0D0D
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Platform.select({ ios: 16, android: 14, default: 16 }), // Симметрично, одинаковое расстояние
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.select({ ios: 8, android: 6, default: 8 }),
  },
  tabLabel: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '500',
    color: ultra.textSecondary, // #B8B8B8
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  tabLabelActive: {
    color: ultra.textPrimary, // #FFFFFF
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ultra.textPrimary, // #FFFFFF подчёркивание 2px
    borderRadius: 1,
  },
  separator: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    color: ultra.textSecondary, // #B8B8B8
    marginHorizontal: Platform.select({ ios: 4, android: 3, default: 4 }),
  },
});

export default CategoryBar;
