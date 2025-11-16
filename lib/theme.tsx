// lib/theme.tsx
// Универсальная система тем для авто-переключения светлая/тёмная
// VisionOS-стиль с градиентным фоном и плавной анимацией

import { useColorScheme, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useEffect, useRef, memo } from 'react';

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
export const ThemedBackground = memo<ThemedBackgroundProps>(
  ({
    style,
    children,
    enableAnimation = true,
    animationDuration = 600,
    ...props
  }) => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const prevScheme = useRef(scheme);
    
    // Состояние для анимированных цветов градиента
    const [gradientColors, setGradientColors] = React.useState<[string, string, string]>(
      isDark ? darkTheme.backgroundGradient : lightTheme.backgroundGradient
    );
    
    // Анимируем переход между темами
    useEffect(() => {
      const targetColors = isDark ? darkTheme.backgroundGradient : lightTheme.backgroundGradient;
      const startColors = prevScheme.current === 'dark' 
        ? darkTheme.backgroundGradient 
        : lightTheme.backgroundGradient;
      
      // Если тема изменилась и анимация включена
      if (prevScheme.current !== scheme && enableAnimation) {
        prevScheme.current = scheme;
        
        // Плавный переход через интерполяцию цветов
        const steps = 30; // Больше шагов = плавнее анимация
        const stepDuration = animationDuration / steps;
        let currentStep = 0;
        
        const interval = setInterval(() => {
          currentStep++;
          const progress = Math.min(currentStep / steps, 1);
          
          // Используем точную Material Design cubic-bezier кривую (0.4, 0.0, 0.2, 1)
          // Эта же кривая используется в Easing.bezier из react-native-reanimated
          const easedProgress = cubicBezierEasing(progress);
          
          const interpolated = interpolateGradientColors(
            easedProgress,
            startColors,
            targetColors
          );
          
          setGradientColors(interpolated);
          
          if (currentStep >= steps) {
            clearInterval(interval);
            setGradientColors(targetColors);
          }
        }, stepDuration);
        
        return () => clearInterval(interval);
      } else {
        // Без анимации - сразу устанавливаем цвета
        setGradientColors(targetColors);
        prevScheme.current = scheme;
      }
    }, [scheme, isDark, enableAnimation, animationDuration]);
    
    // Мемоизируем финальные цвета
    const finalColors = useMemo(() => {
      if (!enableAnimation) {
        return isDark ? darkTheme.backgroundGradient : lightTheme.backgroundGradient;
      }
      return gradientColors;
    }, [isDark, enableAnimation, gradientColors]);
    
    return (
      <LinearGradient
        colors={finalColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[{ flex: 1 }, style]}
        {...props}
      >
        {children}
      </LinearGradient>
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