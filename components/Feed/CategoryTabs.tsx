// components/Feed/CategoryTabs.tsx
import type { ListingCategory } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CategoryTabsProps {
  selectedCategory: ListingCategory;
  onCategoryChange: (category: ListingCategory) => void;
}

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <View style={styles.container}>
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
          🚗 Авто
        </Text>
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
          🐎 Лошади
        </Text>
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
          🏠 Недвижимость
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    paddingTop: 50, // Отступ для статус-бара
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF3B30',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#FFF',
  },
});

