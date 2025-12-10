/**
 * Responsive Utilities для 360AutoMVP
 * 
 * Адаптивное масштабирование для разных размеров экранов.
 * Оптимизировано для portrait-only видео-маркетплейса.
 * 
 * @example
 * ```tsx
 * import { scale, moderateScale, fontScale } from '@/utils/responsive';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: scale(16),           // Масштабируется линейно
 *     borderRadius: moderateScale(12), // Масштабируется умеренно
 *   },
 *   title: {
 *     fontSize: fontScale(24),      // Учитывает настройки пользователя
 *   },
 * });
 * ```
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// =============================================================================
// КОНСТАНТЫ
// =============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Базовые размеры дизайна (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Breakpoints для определения типа устройства
const BREAKPOINTS = {
  xs: 320,   // iPhone SE
  sm: 375,   // iPhone 12 mini
  md: 390,   // iPhone 14
  lg: 428,   // iPhone 14 Pro Max
  xl: 768,   // iPad
} as const;

// =============================================================================
// МАСШТАБИРОВАНИЕ
// =============================================================================

/**
 * Линейное масштабирование по ширине экрана
 * Используй для: padding, margin, width, borderRadius
 */
export const scale = (size: number): number => 
  (SCREEN_WIDTH / BASE_WIDTH) * size;

/**
 * Линейное масштабирование по высоте экрана
 * Используй для: height, vertical spacing
 */
export const verticalScale = (size: number): number => 
  (SCREEN_HEIGHT / BASE_HEIGHT) * size;

/**
 * Умеренное масштабирование (меньше растягивает на больших экранах)
 * Используй для: fontSize, iconSize, borderRadius
 * 
 * @param size - Базовый размер
 * @param factor - Коэффициент масштабирования (0-1, default 0.5)
 */
export const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (scale(size) - size) * factor;

/**
 * Масштабирование шрифтов с учётом системных настроек пользователя
 * Используй для: fontSize
 */
export const fontScale = (size: number): number =>
  moderateScale(size) * PixelRatio.getFontScale();

/**
 * Нормализация размера для pixel-perfect отображения
 */
export const normalize = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel(size));

// =============================================================================
// ОПРЕДЕЛЕНИЕ УСТРОЙСТВА
// =============================================================================

export type DeviceType = 'phone' | 'tablet';
export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Определение типа устройства
 */
export const getDeviceType = (): DeviceType => 
  SCREEN_WIDTH >= BREAKPOINTS.xl ? 'tablet' : 'phone';

/**
 * Текущий breakpoint
 */
export const getBreakpoint = (): BreakpointKey => {
  if (SCREEN_WIDTH >= BREAKPOINTS.xl) return 'xl';
  if (SCREEN_WIDTH >= BREAKPOINTS.lg) return 'lg';
  if (SCREEN_WIDTH >= BREAKPOINTS.md) return 'md';
  if (SCREEN_WIDTH >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

/**
 * Проверка breakpoint
 */
export const isBreakpoint = (bp: BreakpointKey): boolean => 
  SCREEN_WIDTH >= BREAKPOINTS[bp];

// =============================================================================
// АДАПТИВНЫЕ ЗНАЧЕНИЯ
// =============================================================================

/**
 * Адаптивные отступы
 */
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
} as const;

/**
 * Адаптивные размеры шрифтов
 */
export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
  display: moderateScale(48),
} as const;

/**
 * Адаптивные border radius
 */
export const borderRadius = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(24),
  full: 9999,
} as const;

/**
 * Адаптивные размеры иконок
 */
export const iconSize = {
  xs: moderateScale(16),
  sm: moderateScale(20),
  md: moderateScale(24),
  lg: moderateScale(32),
  xl: moderateScale(48),
} as const;

// =============================================================================
// PLATFORM-SPECIFIC ТЕНИ
// =============================================================================

interface ShadowConfig {
  color?: string;
  opacity?: number;
  radius?: number;
  offsetX?: number;
  offsetY?: number;
  elevation?: number;
}

/**
 * Кроссплатформенные тени
 */
export const createShadow = ({
  color = '#000',
  opacity = 0.15,
  radius = 8,
  offsetX = 0,
  offsetY = 4,
  elevation = 4,
}: ShadowConfig = {}) => {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: offsetX, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
    web: {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(0,0,0,${opacity})`,
    },
    default: {},
  });
};

/**
 * Предустановленные тени
 */
export const shadows = {
  none: createShadow({ opacity: 0, elevation: 0 }),
  sm: createShadow({ radius: 4, offsetY: 2, elevation: 2 }),
  md: createShadow({ radius: 8, offsetY: 4, elevation: 4 }),
  lg: createShadow({ radius: 16, offsetY: 8, elevation: 8 }),
  xl: createShadow({ radius: 24, offsetY: 12, elevation: 12 }),
} as const;

// =============================================================================
// ХУКИ
// =============================================================================

import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Хук для получения адаптивных размеров с поддержкой изменения экрана
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  
  const deviceScale = width / BASE_WIDTH;
  
  return {
    width,
    height,
    deviceType: width >= BREAKPOINTS.xl ? 'tablet' : 'phone' as DeviceType,
    breakpoint: getBreakpoint(),
    isTablet: width >= BREAKPOINTS.xl,
    isSmallPhone: width < BREAKPOINTS.sm,
    // Динамическое масштабирование
    scale: (size: number) => deviceScale * size,
    moderateScale: (size: number, factor = 0.5) => 
      size + (deviceScale * size - size) * factor,
  };
};

/**
 * Хук для safe area с адаптивными отступами
 */
export const useSafeSpacing = () => {
  const insets = useSafeAreaInsets();
  
  return {
    ...insets,
    // Минимальные отступы даже без notch
    paddingTop: Math.max(insets.top, spacing.md),
    paddingBottom: Math.max(insets.bottom, spacing.md),
    paddingHorizontal: spacing.md,
  };
};

// =============================================================================
// ЭКСПОРТ
// =============================================================================

export const responsive = {
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  normalize,
  spacing,
  fontSize,
  borderRadius,
  iconSize,
  shadows,
  createShadow,
  getDeviceType,
  getBreakpoint,
  isBreakpoint,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  BREAKPOINTS,
};

export default responsive;

