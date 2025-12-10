/**
 * Theme System — Revolut Ultra Platinum 2025-2026
 * 
 * Дизайн-система:
 * - Absolute Black (#000000) — OLED-оптимизированный фон
 * - Pure White (#FFFFFF) — максимальный контраст
 * - Platinum (#E5E4E2) — фирменный цвет
 * 
 * Типографика:
 * - Заголовки: fontWeight 900/800, letterSpacing -1
 * - Лейблы: UPPERCASE, letterSpacing 1
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, memo } from 'react';
import { useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// Import from ultra.ts
import { ultra, typography, shadows, radius, spacing } from './ultra';
export { ultra, typography, shadows, radius, spacing } from './ultra';

// Import styles
export * from './styles';

// ============================================================================
// Темы
// ============================================================================

const lightTheme = {
  background: '#FFFFFF',
  surface: '#F5F5F7',
  card: '#FFFFFF',
  border: '#E5E5E5',
  text: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  accent: ultra.platinum,
  gradient: ['#FFFFFF', '#F5F5F7', '#FFFFFF'] as [string, string, string],
  // Vision components compatibility
  surfaceGlass: 'rgba(255, 255, 255, 0.1)',
  surfaceGlassActive: 'rgba(255, 255, 255, 0.2)',
  borderSoft: 'rgba(0, 0, 0, 0.1)',
  textPrimary: '#000000',
  accentPrimary: ultra.platinum,
  glowPrimary: ultra.platinum,
};

const darkTheme = {
  background: ultra.background,      // #000000
  surface: ultra.surface,            // #111111
  card: ultra.card,                  // #0A0A0A
  border: ultra.border,              // #1F1F1F
  text: ultra.textPrimary,           // #FFFFFF
  textSecondary: ultra.textSecondary, // #E5E4E2 (Platinum)
  textMuted: ultra.textMuted,        // #888888
  accent: ultra.platinum,            // #E5E4E2
  gradient: ['#0A0A0A', '#000000', '#050505'] as [string, string, string],
  // Vision components compatibility
  surfaceGlass: 'rgba(255, 255, 255, 0.05)',
  surfaceGlassActive: 'rgba(255, 255, 255, 0.1)',
  borderSoft: 'rgba(255, 255, 255, 0.1)',
  textPrimary: ultra.textPrimary,
  accentPrimary: ultra.platinum,
  glowPrimary: ultra.platinum,
};

// ============================================================================
// Хуки
// ============================================================================

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

// ============================================================================
// Компоненты
// ============================================================================

export const ThemedBackground = memo(({
  children,
  style,
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

export const AnimatedGradientBackground = memo(({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const scheme = useColorScheme();
  const progress = useSharedValue(scheme === 'dark' ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(scheme === 'dark' ? 1 : 0, { duration: 800 });
  }, [scheme, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor:
      progress.value === 1 ? darkTheme.background : lightTheme.background,
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

// ============================================================================
// Экспорт
// ============================================================================

export const theme = {
  light: lightTheme,
  dark: darkTheme,
  ultra,
  typography,
  shadows,
  radius,
  spacing,
  current: () => darkTheme, // По умолчанию dark
};

export { lightTheme, darkTheme };

// Тип темы для TypeScript
export type Theme = typeof darkTheme;
