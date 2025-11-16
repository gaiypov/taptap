import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaContainerProps extends ViewProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
}

/**
 * Компонент-обертка для SafeArea с поддержкой всех iPhone моделей
 * Использует react-native-safe-area-context для корректной работы
 */
export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  edges = ['top', 'bottom'],
  backgroundColor = '#000',
  style,
  ...props
}) => {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View
      style={[
        styles.container,
        paddingStyle,
        { backgroundColor },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * Хук для получения insets без компонента
 */
export function useSafeArea() {
  const insets = useSafeAreaInsets();
  return insets;
}
