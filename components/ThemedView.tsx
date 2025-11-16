// components/ThemedView.tsx
// Обёртка для View с автоматическим применением темы (оптимизированная)

import React from 'react';
import { ViewStyle } from 'react-native';
import { ThemedView as OptimizedThemedView } from '@/lib/theme';

interface ThemedViewProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  [key: string]: any;
}

// Re-export оптимизированного компонента
export const ThemedView: React.FC<ThemedViewProps> = OptimizedThemedView;
