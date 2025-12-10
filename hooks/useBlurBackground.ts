// hooks/useBlurBackground.ts
// PREMIUM BLUR EFFECTS — TIKTOK/INSTAGRAM STYLE
// Использует expo-blur для premium размытия фонов

import { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

// ============================================
// TYPES
// ============================================

export type BlurIntensity = 'light' | 'medium' | 'heavy' | 'ultra';
export type BlurTint = 'light' | 'dark' | 'default' | 'prominent' | 'systemMaterial';

export interface BlurConfig {
  intensity: BlurIntensity;
  tint: BlurTint;
  animated?: boolean;
  animationDuration?: number;
}

export interface UseBlurBackgroundResult {
  // Компонент для рендера
  BlurComponent: typeof BlurView;
  
  // Стили и пропсы
  blurProps: {
    intensity: number;
    tint: BlurTint;
    style: ViewStyle;
  };
  
  // Анимированные значения
  animatedIntensity: SharedValue<number>;
  
  // Методы управления
  fadeIn: () => void;
  fadeOut: () => void;
  setIntensity: (intensity: BlurIntensity) => void;
}

// ============================================
// CONSTANTS
// ============================================

// Интенсивность размытия по уровням
const INTENSITY_MAP: Record<BlurIntensity, number> = {
  light: 20,
  medium: 50,
  heavy: 80,
  ultra: 100,
};

// Платформо-специфичные настройки
const PLATFORM_ADJUSTMENTS = Platform.select({
  ios: {
    // iOS имеет нативный blur, работает отлично
    multiplier: 1,
    tintDefault: 'default' as BlurTint,
  },
  android: {
    // Android использует fallback, нужно больше intensity
    multiplier: 1.2,
    tintDefault: 'dark' as BlurTint,
  },
  default: {
    multiplier: 1,
    tintDefault: 'default' as BlurTint,
  },
});

// ============================================
// HOOK
// ============================================

export function useBlurBackground(
  config: Partial<BlurConfig> = {}
): UseBlurBackgroundResult {
  const {
    intensity = 'medium',
    tint = PLATFORM_ADJUSTMENTS.tintDefault,
    animated = true,
    animationDuration = 300,
  } = config;
  
  // Вычисляем числовую интенсивность
  const numericIntensity = useMemo(() => {
    const base = INTENSITY_MAP[intensity];
    return Math.min(100, base * PLATFORM_ADJUSTMENTS.multiplier);
  }, [intensity]);
  
  // Анимированное значение интенсивности
  const animatedIntensity = useSharedValue(animated ? 0 : numericIntensity);
  
  // Методы управления
  const fadeIn = useCallback(() => {
    animatedIntensity.value = withTiming(numericIntensity, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [numericIntensity, animationDuration, animatedIntensity]);
  
  const fadeOut = useCallback(() => {
    animatedIntensity.value = withTiming(0, {
      duration: animationDuration,
      easing: Easing.in(Easing.cubic),
    });
  }, [animationDuration, animatedIntensity]);
  
  const setIntensity = useCallback((newIntensity: BlurIntensity) => {
    const newNumeric = INTENSITY_MAP[newIntensity] * PLATFORM_ADJUSTMENTS.multiplier;
    animatedIntensity.value = withTiming(Math.min(100, newNumeric), {
      duration: animationDuration / 2,
    });
  }, [animationDuration, animatedIntensity]);
  
  // Пропсы для BlurView
  const blurProps = useMemo(() => ({
    intensity: numericIntensity,
    tint,
    style: styles.blur as ViewStyle,
  }), [numericIntensity, tint]);
  
  return {
    BlurComponent: BlurView,
    blurProps,
    animatedIntensity,
    fadeIn,
    fadeOut,
    setIntensity,
  };
}

// ============================================
// PRESET CONFIGS
// ============================================

/**
 * Пресеты для типичных use cases
 */
export const BlurPresets = {
  // Фон модального окна (как в TikTok)
  modal: {
    intensity: 'heavy' as BlurIntensity,
    tint: 'dark' as BlurTint,
    animated: true,
    animationDuration: 200,
  },
  
  // Фон bottom sheet
  bottomSheet: {
    intensity: 'medium' as BlurIntensity,
    tint: 'dark' as BlurTint,
    animated: true,
    animationDuration: 300,
  },
  
  // Overlay для видео (пауза, загрузка)
  videoOverlay: {
    intensity: 'light' as BlurIntensity,
    tint: 'dark' as BlurTint,
    animated: true,
    animationDuration: 150,
  },
  
  // Header/Navbar blur (как в iOS)
  navbar: {
    intensity: 'medium' as BlurIntensity,
    tint: Platform.OS === 'ios' ? 'systemMaterial' as BlurTint : 'dark' as BlurTint,
    animated: false,
  },
  
  // Tab bar blur
  tabBar: {
    intensity: 'heavy' as BlurIntensity,
    tint: Platform.OS === 'ios' ? 'prominent' as BlurTint : 'dark' as BlurTint,
    animated: false,
  },
  
  // Карточка с blur-фоном
  card: {
    intensity: 'light' as BlurIntensity,
    tint: 'default' as BlurTint,
    animated: false,
  },
  
  // Premium эффект (максимальное размытие)
  premium: {
    intensity: 'ultra' as BlurIntensity,
    tint: 'dark' as BlurTint,
    animated: true,
    animationDuration: 400,
  },
};

// ============================================
// ANIMATED BLUR COMPONENT
// ============================================

/**
 * Хук для создания анимированного blur overlay
 */
export function useAnimatedBlur(config: Partial<BlurConfig> = {}) {
  const { 
    intensity = 'medium',
    tint = 'dark',
    animationDuration = 300,
  } = config;
  
  const progress = useSharedValue(0);
  
  const show = useCallback(() => {
    progress.value = withTiming(1, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [animationDuration, progress]);
  
  const hide = useCallback(() => {
    progress.value = withTiming(0, {
      duration: animationDuration,
      easing: Easing.in(Easing.cubic),
    });
  }, [animationDuration, progress]);
  
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    pointerEvents: progress.value > 0 ? 'auto' : 'none',
  }));
  
  const animatedBlurIntensity = useAnimatedStyle(() => {
    const numericIntensity = INTENSITY_MAP[intensity] * PLATFORM_ADJUSTMENTS.multiplier;
    return {
      // BlurView intensity не анимируется напрямую,
      // но opacity контейнера создаёт похожий эффект
      opacity: interpolate(progress.value, [0, 1], [0, 1]),
    };
  });
  
  return {
    progress,
    show,
    hide,
    animatedContainerStyle,
    animatedBlurIntensity,
    blurProps: {
      intensity: INTENSITY_MAP[intensity] * PLATFORM_ADJUSTMENTS.multiplier,
      tint,
    },
  };
}

// ============================================
// BLUR OVERLAY STYLES
// ============================================

/**
 * Стили для overlay с blur
 */
export const blurOverlayStyles = StyleSheet.create({
  // Полноэкранный overlay
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  
  // Overlay с центрированным контентом
  centered: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  
  // Overlay для bottom sheet
  bottomSheet: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  
  // Navbar blur
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  
  // Tab bar blur
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
});

// ============================================
// EXPORTS
// ============================================

export default useBlurBackground;

