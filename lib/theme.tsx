// lib/theme.tsx
// Универсальная система тем для авто-переключения светлая/тёмная
// VisionOS-стиль с градиентным фоном и плавной анимацией
// ОБНОВЛЕНО: Reanimated для плавности iOS 18

import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useMemo } from 'react';
import { useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from './theme/colors';
import { tokens } from './theme/tokens';

// Типы
export interface Theme {
  backgroundGradient: [string, string, string];
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
  placeholder: string;
  primary: string;
  error: string;
  success: string;
  warning: string;
}

// Константы тем
export const lightTheme: Theme = {
  backgroundGradient: ['#f9f9f9', '#eaeaea', '#fefefe'],
  background: '#f5f5f5',
  surface: '#f8f8f8',
  text: '#1a1a1a',
  textSecondary: '#666666',
  card: '#ffffff',
  border: '#e5e5e5',
  placeholder: '#999999',
  primary: '#FF3B30',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
};

export const darkTheme: Theme = {
  backgroundGradient: ['#0b0b0b', '#121212', '#1c1c1c'],
  background: '#121212',
  surface: '#1a1a1a',
  text: '#f2f2f2',
  textSecondary: '#8E8E93',
  card: '#1C1C1E',
  border: '#333333',
  placeholder: '#888888',
  primary: '#FF3B30',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
};

// Контекст темы для оптимизации
export const ThemeContext = React.createContext<{
  theme: Theme;
  isDark: boolean;
  colorScheme: 'light' | 'dark' | null;
}>({
  theme: lightTheme,
  isDark: false,
  colorScheme: 'light',
});

// Хук для получения темы с мемоизацией
export function useAppTheme(): Theme {
  const scheme = useColorScheme();
  
  return useMemo(() => {
    return scheme === 'dark' ? darkTheme : lightTheme;
  }, [scheme]);
}

// Новый упрощенный хук (финальная версия)
export function useTheme(): Theme {
  return useAppTheme();
}

// Хук для получения контекста темы
export function useThemeContext() {
  const scheme = useColorScheme();
  const theme = useAppTheme();
  const isDark = scheme === 'dark';
  
  return useMemo(
    () => ({
      theme,
      isDark,
      colorScheme: scheme,
    }),
    [theme, isDark, scheme]
  );
}

// Функция для использования вне React компонентов
export function getTheme(scheme: 'light' | 'dark' | null | undefined): Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

// Точная реализация Material Design cubic-bezier кривой (0.4, 0.0, 0.2, 1)
// Это стандартная easing функция Material Design для плавных анимаций
function cubicBezierEasing(t: number): number {
  // Контрольные точки для Material Design стандартной кривой
  const p1x = 0.4;
  const p1y = 0.0;
  const p2x = 0.2;
  const p2y = 1.0;
  
  // Для нахождения y по x используем метод Ньютона-Рафсона
  // Функция bezier x(t) = (1-t)³*0 + 3(1-t)²t*p1x + 3(1-t)t²*p2x + t³*1
  // Нам нужно найти t для заданного x, затем вычислить y(t)
  
  // Аппроксимация через бинарный поиск (более быстрая и точная)
  function bezierX(t: number): number {
    const mt = 1 - t;
    return 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t;
  }
  
  function bezierY(t: number): number {
    const mt = 1 - t;
    return 3 * mt * mt * t * p1y + 3 * mt * t * t * p2y + t * t * t;
  }
  
  // Бинарный поиск для нахождения t по x
  let low = 0;
  let high = 1;
  let mid = 0.5; // Инициализация для корректной работы
  
  for (let i = 0; i < 20; i++) {
    mid = (low + high) / 2;
    const x = bezierX(mid);
    
    if (Math.abs(x - t) < 0.0001) break;
    
    if (x > t) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  // Гарантируем, что mid инициализирован
  return bezierY(mid ?? 0.5);
}

// Утилита для интерполяции цветов градиента
function interpolateGradientColors(
  progress: number,
  lightColors: [string, string, string],
  darkColors: [string, string, string]
): [string, string, string] {
  const interpolateHex = (light: string, dark: string): string => {
    // Простая интерполяция через RGB
    const lightRgb = hexToRgb(light);
    const darkRgb = hexToRgb(dark);
    
    if (!lightRgb || !darkRgb) return light;
    
    const r = Math.round(lightRgb.r + (darkRgb.r - lightRgb.r) * progress);
    const g = Math.round(lightRgb.g + (darkRgb.g - lightRgb.g) * progress);
    const b = Math.round(lightRgb.b + (darkRgb.b - lightRgb.b) * progress);
    
    return rgbToHex(r, g, b);
  };
  
  return [
    interpolateHex(lightColors[0], darkColors[0]),
    interpolateHex(lightColors[1], darkColors[1]),
    interpolateHex(lightColors[2], darkColors[2]),
  ];
}

// Вспомогательные функции для работы с цветами
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Props для ThemedBackground
export interface ThemedBackgroundProps {
  style?: any;
  children?: React.ReactNode;
  enableAnimation?: boolean;
  animationDuration?: number;
  [key: string]: any;
}

// Компонент для обёртки фона с VisionOS-стиль градиентом и анимацией
// ОБНОВЛЕНО: Использует Reanimated для плавности iOS 18
export const ThemedBackground = memo<ThemedBackgroundProps>(
  ({
    style,
    children,
    enableAnimation = true,
    animationDuration = 800,
    ...props
  }) => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    
    // Используем Reanimated для плавной анимации
    const progress = useSharedValue(isDark ? 1 : 0);
    
    useEffect(() => {
      if (enableAnimation) {
        progress.value = withTiming(isDark ? 1 : 0, { duration: animationDuration });
      } else {
        progress.value = isDark ? 1 : 0;
      }
    }, [isDark, enableAnimation, animationDuration]);
    
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: 1, // Можно добавить fade-in эффект если нужно
    }));
    
    // Мемоизируем цвета градиента
    const gradientColors = useMemo(() => {
      return isDark ? darkTheme.backgroundGradient : lightTheme.backgroundGradient;
    }, [isDark]);
    
    return (
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ flex: 1 }, style]}
          {...props}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    // Кастомная функция сравнения для оптимизации
    return (
      prevProps.enableAnimation === nextProps.enableAnimation &&
      prevProps.animationDuration === nextProps.animationDuration &&
      prevProps.children === nextProps.children
    );
  }
);

ThemedBackground.displayName = 'ThemedBackground';

// Оптимизированный компонент ThemedView с мемоизацией
export interface ThemedViewProps {
  style?: any;
  children?: React.ReactNode;
  [key: string]: any;
}

export const ThemedView = memo<ThemedViewProps>(
  ({ style, children, ...props }) => {
    const theme = useAppTheme();
    
    const containerStyle = useMemo(
      () => [{ flex: 1, backgroundColor: theme.background }, style],
      [theme.background, style]
    );
    
    return (
      <View style={containerStyle} {...props}>
        {children}
      </View>
    );
  }
);

ThemedView.displayName = 'ThemedView';

// Экспорт констант для прямого доступа
export const THEMES = {
  light: lightTheme,
  dark: darkTheme,
} as const;

// ============================================
// Comprehensive Theme Export
// ============================================
// This export provides a complete theme object with all properties
// that components are accessing. It defaults to dark theme for safety.
// Components should use useAppTheme() hook when possible, but this
// export ensures backward compatibility and prevents crashes.

// Extended theme interface with all properties
export interface ExtendedTheme {
  // Basic theme properties
  background: string;
  surface: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textPlaceholder: string;
  border: string;
  borderStrong: string;
  borderSoft: string;
  borderSubtle: string;
  borderHeavy: string;
  borderWeak: string;
  primary: string;
  error: string;
  success: string;
  warning: string;
  
  // Extended properties
  surfaceGlass: string;
  surfaceGlassStrong: string;
  accentPrimary: string;
  accentDanger: string;
  glowPrimary: string;
  glowSecondary: string;
  
  // Typography
  typography?: {
    label?: { fontSize?: number; fontWeight?: string; color?: string };
    sectionTitle?: { fontSize?: number; fontWeight?: string; color?: string };
    heading?: { fontSize?: number; fontWeight?: string };
    title?: { fontSize?: number; fontWeight?: string };
    subtitle?: { fontSize?: number; fontWeight?: string };
    body?: { fontSize?: number; fontWeight?: string };
    input?: { fontSize?: number; fontWeight?: string };
  };
  
  // Spacing
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  // Radius
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    ultra: number;
  };
  
  // Screen
  screen: {
    paddingHorizontal: number;
  };
  
  // Chip
  chip: {
    height: number;
    paddingHorizontal: number;
    radius: number;
  };
  chipBorder: string;
  chipBg: string;
  chipBgActive: string;
  
  // Pill
  pill?: {
    background?: string;
    selectedBackground?: string;
    border?: string;
    selectedBorder?: string;
  };
  
  // Input
  inputBorder: string;
  inputBg: string;
  inputBorderActive: string;
  
  // Primary Button
  primaryButtonBg: string;
  primaryButtonBgPressed: string;
  primaryButtonText: string;
  
  // Aurora
  aurora?: {
    primary?: string[];
    danger?: string[];
  };
  
  // Action Button
  actionButton?: {
    background?: string;
    bgMuted?: string;
    iconColor?: string;
    iconMuted?: string;
  };
}

// Create comprehensive dark theme
const comprehensiveDarkTheme: ExtendedTheme = {
  // Basic
  background: darkTheme.background,
  surface: darkTheme.surface,
  text: darkTheme.text,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textTertiary: colors.textTertiary,
  textMuted: colors.textTertiary,
  textPlaceholder: darkTheme.placeholder,
  border: darkTheme.border,
  borderStrong: colors.borderHard,
  borderSoft: colors.borderSoft,
  borderSubtle: 'rgba(255,255,255,0.1)',
  borderHeavy: colors.borderHard,
  borderWeak: 'rgba(255,255,255,0.06)',
  primary: darkTheme.primary,
  error: darkTheme.error,
  success: darkTheme.success,
  warning: darkTheme.warning,
  
  // Extended
  surfaceGlass: colors.glass1,
  surfaceGlassStrong: colors.glass2,
  accentPrimary: colors.platinum,
  accentDanger: darkTheme.error,
  glowPrimary: colors.platinumGlow,
  glowSecondary: 'rgba(255,69,58,0.32)',
  
  // Typography
  typography: {
    label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    heading: { fontSize: 22, fontWeight: '700' },
    title: { fontSize: 18, fontWeight: '600' },
    subtitle: { fontSize: 15, fontWeight: '500' },
    body: { fontSize: 14, fontWeight: '400' },
    input: { fontSize: 16, fontWeight: '500' },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Radius
  radius: tokens.radius,
  
  // Screen
  screen: {
    paddingHorizontal: 20,
  },
  
  // Chip
  chip: {
    height: 36,
    paddingHorizontal: 16,
    radius: 18,
  },
  chipBorder: colors.borderSoft,
  chipBg: colors.glass0,
  chipBgActive: colors.glass1,
  
  // Pill
  pill: {
    background: colors.glass0,
    selectedBackground: colors.glass1,
    border: colors.borderSoft,
    selectedBorder: colors.borderHard,
  },
  
  // Input
  inputBorder: colors.borderSoft,
  inputBg: colors.glass0,
  inputBorderActive: colors.platinum,
  
  // Primary Button
  primaryButtonBg: colors.platinum,
  primaryButtonBgPressed: colors.platinumSoft,
  primaryButtonText: colors.ultraBlack,
  
  // Aurora
  aurora: {
    primary: [colors.platinumGlow, 'rgba(207,207,207,0.12)'],
    danger: ['rgba(255,69,58,0.32)', 'rgba(255,149,141,0.22)'],
  },
  
  // Action Button
  actionButton: {
    background: colors.glass2,
    bgMuted: colors.glass1,
    iconColor: colors.textPrimary,
    iconMuted: colors.textSecondary,
  },
};

// Create comprehensive light theme
const comprehensiveLightTheme: ExtendedTheme = {
  // Basic
  background: lightTheme.background,
  surface: lightTheme.surface,
  text: lightTheme.text,
  textPrimary: '#0A0A0E',
  textSecondary: 'rgba(0,0,0,0.55)',
  textTertiary: 'rgba(0,0,0,0.32)',
  textMuted: 'rgba(0,0,0,0.4)',
  textPlaceholder: lightTheme.placeholder,
  border: lightTheme.border,
  borderStrong: 'rgba(0,0,0,0.12)',
  borderSoft: 'rgba(0,0,0,0.08)',
  borderSubtle: 'rgba(0,0,0,0.06)',
  borderHeavy: 'rgba(0,0,0,0.12)',
  borderWeak: 'rgba(0,0,0,0.04)',
  primary: lightTheme.primary,
  error: lightTheme.error,
  success: lightTheme.success,
  warning: lightTheme.warning,
  
  // Extended
  surfaceGlass: 'rgba(255,255,255,0.75)',
  surfaceGlassStrong: 'rgba(255,255,255,0.85)',
  accentPrimary: '#E6E6E6', // Platinum
  accentDanger: lightTheme.error,
  glowPrimary: 'rgba(255,255,255,0.14)',
  glowSecondary: 'rgba(255,69,58,0.32)',
  
  // Typography
  typography: {
    label: { fontSize: 14, fontWeight: '600', color: '#0A0A0E' },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0A0A0E' },
    heading: { fontSize: 22, fontWeight: '700' },
    title: { fontSize: 18, fontWeight: '600' },
    subtitle: { fontSize: 15, fontWeight: '500' },
    body: { fontSize: 14, fontWeight: '400' },
    input: { fontSize: 16, fontWeight: '500' },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Radius
  radius: tokens.radius,
  
  // Screen
  screen: {
    paddingHorizontal: 20,
  },
  
  // Chip
  chip: {
    height: 36,
    paddingHorizontal: 16,
    radius: 18,
  },
  chipBorder: 'rgba(0,0,0,0.08)',
  chipBg: 'rgba(255,255,255,0.9)',
  chipBgActive: 'rgba(255,255,255,1)',
  
  // Pill
  pill: {
    background: 'rgba(255,255,255,0.06)',
    selectedBackground: 'rgba(255,255,255,0.12)',
    border: 'rgba(0,0,0,0.08)',
    selectedBorder: 'rgba(0,0,0,0.12)',
  },
  
  // Input
  inputBorder: 'rgba(0,0,0,0.08)',
  inputBg: 'rgba(255,255,255,0.9)',
  inputBorderActive: '#E6E6E6',
  
  // Primary Button
  primaryButtonBg: '#E6E6E6',
  primaryButtonBgPressed: '#CFCFCF',
  primaryButtonText: '#0A0A0E',
  
  // Aurora
  aurora: {
    primary: ['rgba(255,255,255,0.14)', 'rgba(207,207,207,0.12)'],
    danger: ['rgba(255,69,58,0.32)', 'rgba(255,149,141,0.22)'],
  },
  
  // Action Button
  actionButton: {
    background: 'rgba(255,255,255,0.85)',
    bgMuted: 'rgba(255,255,255,0.65)',
    iconColor: '#111',
    iconMuted: 'rgba(0,0,0,0.3)',
  },
};

// Safe default theme export (defaults to dark for safety)
// This is used by components that import theme directly
// Note: For reactive theme, components should use useAppTheme() hook
export const extendedTheme: ExtendedTheme = comprehensiveDarkTheme;

// Helper function to get theme based on color scheme
// This can be used in components that need reactive theme but can't use hooks
export function getExtendedTheme(scheme: 'light' | 'dark' | null | undefined): ExtendedTheme {
  return scheme === 'dark' ? comprehensiveDarkTheme : comprehensiveLightTheme;
}

// ============================================
// НОВЫЕ ЭКСПОРТЫ (ФИНАЛЬНАЯ ВЕРСИЯ)
// ============================================

// Анимированный градиентный фон (Reanimated версия)
export const AnimatedGradientBackground = memo(({ children }: { children?: React.ReactNode }) => {
  const scheme = useColorScheme();
  const progress = useSharedValue(scheme === 'dark' ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(scheme === 'dark' ? 1 : 0, { duration: 800 });
  }, [scheme]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value === 1 ? darkTheme.background : lightTheme.background,
  }));

  const colors = scheme === 'dark' ? darkTheme.backgroundGradient : lightTheme.backgroundGradient;

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <LinearGradient colors={colors} style={{ flex: 1 }}>
        {children}
      </LinearGradient>
    </Animated.View>
  );
});

AnimatedGradientBackground.displayName = 'AnimatedGradientBackground';

// Экспорт ultra палитры
export { ultra } from './theme/ultra';

// Экспорт theme.current() для использования вне компонентов
export const theme = {
  light: lightTheme,
  dark: darkTheme,
  ultra: require('./theme/ultra').ultra,
  current: () => {
    // Для использования вне компонентов - возвращаем dark по умолчанию
    // В компонентах используйте useTheme()
    return darkTheme;
  },
  // Обратная совместимость с ExtendedTheme
  ...comprehensiveDarkTheme,
};