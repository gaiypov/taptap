// components/Feed/CategoryTabs.tsx
import type { ListingCategory } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ultra } from '@/lib/theme/ultra';

interface CategoryTabsProps {
  selectedCategory: ListingCategory;
  onCategoryChange: (category: ListingCategory) => void;
}

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedCategory === 'car' && styles.tabActive,
          ]}
          onPress={() => onCategoryChange('car')}
        >
          <Text style={[
            styles.tabText,
            selectedCategory === 'car' && styles.tabTextActive,
          ]}>
            Авто
          </Text>
          {selectedCategory === 'car' && <View style={styles.underline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedCategory === 'horse' && styles.tabActive,
          ]}
          onPress={() => onCategoryChange('horse')}
        >
          <Text style={[
            styles.tabText,
            selectedCategory === 'horse' && styles.tabTextActive,
          ]}>
            Лошади
          </Text>
          {selectedCategory === 'horse' && <View style={styles.underline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedCategory === 'real_estate' && styles.tabActive,
          ]}
          onPress={() => onCategoryChange('real_estate')}
        >
          <Text style={[
            styles.tabText,
            selectedCategory === 'real_estate' && styles.tabTextActive,
          ]}>
            Недвижимость
          </Text>
          {selectedCategory === 'real_estate' && <View style={styles.underline} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ultra.background,
    paddingTop: 50, // Отступ для статус-бара
    borderBottomWidth: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    justifyContent: 'center',
    gap: 44,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabActive: {
    // Active state handled by underline
  },
  tabText: {
    fontSize: 18,
    fontWeight: '600',
    color: ultra.textMuted,
  },
  tabTextActive: {
    color: ultra.textPrimary,
    fontWeight: '800',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: ultra.textPrimary,
  },
});

