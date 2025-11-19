// lib/theme/index.ts — ТЕМА УРОВНЯ APPLE VISION PRO + DUBAI 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВАЯ К APP STORE (ноябрь 2025)

import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, memo } from 'react';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';

// === БАЗОВЫЕ ЦВЕТА (ultra-стиль) ===
const ultra = {
  black: '#0A0A0A',
  dark: '#121212',
  card: '#1C1C1E',
  surface: '#2C2C2E',
  border: '#383838',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#888888',
  accent: '#C0C0C0',
  accentSecondary: '#E0E0E0',
  gradientStart: '#1E1E1E',
  gradientEnd: '#121212',
  platinum: '#E5E5E5',
  platinumGlow: '#FFFFFF',
};

// === ТЕМЫ ===
const lightTheme = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E5E5',
  text: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  accent: '#007AFF',
  gradient: ['#F5F5F7', '#E5E5E7', '#F5F5F7'] as [string, string, string],
};

const darkTheme = {
  background: ultra.black,
  surface: ultra.surface,
  card: ultra.card,
  border: ultra.border,
  text: ultra.text,
  textSecondary: ultra.textSecondary,
  textMuted: ultra.textMuted,
  accent: ultra.accent,
  gradient: [ultra.gradientStart, ultra.black, ultra.gradientEnd] as [string, string, string],
};

// === РЕАКТИВНЫЙ ХУК ===
export function useTheme() {
  const scheme = useColorScheme();
  return useMemo(() => {
    return scheme === 'dark' ? darkTheme : lightTheme;
  }, [scheme]);
}

// Алиасы для обратной совместимости
export const useAppTheme = useTheme;
export function useThemeContext() {
  const scheme = useColorScheme();
  return {
    isDark: scheme === 'dark',
    theme: scheme === 'dark' ? darkTheme : lightTheme,
  };
}

// ThemedBackground компонент
export const ThemedBackground = memo(({ 
  children, 
  style 
}: { 
  children?: React.ReactNode;
  style?: any;
}) => {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkTheme.gradient : lightTheme.gradient;
  
  return (
    <LinearGradient colors={colors} style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
});

ThemedBackground.displayName = 'ThemedBackground';

// === АНИМИРОВАННЫЙ ФОН ===
export const AnimatedGradientBackground = memo(({ children }: { children?: React.ReactNode }) => {
  const scheme = useColorScheme();
  const progress = useSharedValue(scheme === 'dark' ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(scheme === 'dark' ? 1 : 0, { duration: 800 });
  }, [scheme]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value === 1 ? darkTheme.background : lightTheme.background,
  }));

  const colors = scheme === 'dark' ? darkTheme.gradient : lightTheme.gradient;

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <LinearGradient colors={colors} style={{ flex: 1 }}>
        {children}
      </LinearGradient>
    </Animated.View>
  );
});

AnimatedGradientBackground.displayName = 'AnimatedGradientBackground';

// === ГОТОВЫЕ ТЕМЫ ДЛЯ ЭКСПОРТА ===
export const theme = {
  light: lightTheme,
  dark: darkTheme,
  ultra,
  current: () => {
    // Для использования вне компонентов - возвращаем dark по умолчанию
    // В компонентах используйте useTheme()
    return darkTheme;
  },
};

// Экспорт для обратной совместимости
export { ultra };
export { lightTheme, darkTheme };

