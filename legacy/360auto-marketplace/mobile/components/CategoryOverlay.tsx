// app/components/CategoryOverlay.tsx
// Прозрачный overlay с категориями поверх видео

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CategoryOverlayProps {
  activeCategory: 'car' | 'horse' | 'real_estate';
  onCategoryChange: (category: 'car' | 'horse' | 'real_estate') => void;
}

export default function CategoryOverlay({ activeCategory, onCategoryChange }: CategoryOverlayProps) {
  const categories = [
    { key: 'car' as const, icon: '🚗', label: 'Авто' },
    { key: 'horse' as const, icon: '🐴', label: 'Лошади' },
    { key: 'real_estate' as const, icon: '🏠', label: 'Недвижимость' },
  ];
  
  return (
    <BlurView
      intensity={80}
      tint="dark"
      style={styles.container}
    >
      <View style={styles.tabs}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.tab,
              activeCategory === cat.key && styles.tabActive
            ]}
            onPress={() => onCategoryChange(cat.key)}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text style={[
              styles.label,
              activeCategory === cat.key && styles.labelActive
            ]}>
              {cat.label}
            </Text>
            
            {activeCategory === cat.key && (
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeIndicator}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabActive: {
    // Active state
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  labelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
});

