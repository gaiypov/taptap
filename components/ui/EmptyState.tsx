// components/ui/EmptyState.tsx
// Компонент для отображения пустого состояния

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Нет данных',
  subtitle = 'Попробуйте обновить позже',
  icon = 'cube-outline',
  iconColor = '#aaa',
  backgroundColor = '#fff',
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Ionicons name={icon} size={48} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
});

