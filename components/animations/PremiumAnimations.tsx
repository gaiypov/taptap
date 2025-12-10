/**
 * Premium Animations — Revolut Ultra стиль анимации
 * 
 * Коллекция премиальных анимационных компонентов для 360AutoMVP.
 * Все анимации выполняются на UI thread через Reanimated/Moti.
 * 
 * @example
 * ```tsx
 * import { FadeIn, ScalePress, Shimmer, SlideUp } from '@/components/animations/PremiumAnimations';
 * 
 * <FadeIn delay={100}>
 *   <Text>Плавное появление</Text>
 * </FadeIn>
 * 
 * <ScalePress onPress={handlePress}>
 *   <Button>Нажми меня</Button>
 * </ScalePress>
 * ```
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ultra } from '@/lib/theme/ultra';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// =============================================================================
// SPRING CONFIGS — Премиальные настройки пружин
// =============================================================================

export const SPRING_CONFIGS = {
  // Быстрый и упругий — для кнопок
  snappy: { damping: 15, stiffness: 400, mass: 0.8 },
  // Плавный и элегантный — для модалок
  gentle: { damping: 20, stiffness: 200, mass: 1 },
  // Bouncy — для лайков и наград
  bouncy: { damping: 10, stiffness: 300, mass: 0.5 },
  // Тяжёлый — для важных элементов
  heavy: { damping: 25, stiffness: 150, mass: 1.5 },
} as const;

// =============================================================================
// FADE IN — Плавное появление
// =============================================================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  style,
}) => (
  <MotiView
    from={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{
      type: 'timing',
      duration,
      delay,
    }}
    style={style}
  >
    {children}
  </MotiView>
);

// =============================================================================
// FADE IN UP — Появление снизу (как в iOS)
// =============================================================================

interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

export const FadeInUp: React.FC<FadeInUpProps> = ({
  children,
  delay = 0,
  distance = 20,
  style,
}) => (
  <MotiView
    from={{ opacity: 0, translateY: distance }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{
      type: 'spring',
      ...SPRING_CONFIGS.gentle,
      delay,
    }}
    style={style}
  >
    {children}
  </MotiView>
);

// =============================================================================
// SLIDE UP — Выезд снизу (для модалок)
// =============================================================================

interface SlideUpProps {
  children: React.ReactNode;
  visible: boolean;
  style?: ViewStyle;
}

export const SlideUp: React.FC<SlideUpProps> = ({
  children,
  visible,
  style,
}) => (
  <AnimatePresence>
    {visible && (
      <MotiView
        from={{ translateY: 300, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        exit={{ translateY: 300, opacity: 0 }}
        transition={{
          type: 'spring',
          ...SPRING_CONFIGS.gentle,
        }}
        style={style}
      >
        {children}
      </MotiView>
    )}
  </AnimatePresence>
);

// =============================================================================
// SCALE PRESS — Премиальное нажатие с масштабом
// =============================================================================

interface ScalePressProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  scale?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  disabled?: boolean;
  style?: ViewStyle;
}

export const ScalePress: React.FC<ScalePressProps> = ({
  children,
  onPress,
  onLongPress,
  scale = 0.97,
  haptic = 'light',
  disabled = false,
  style,
}) => {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = useCallback(() => {
    scaleValue.value = withSpring(scale, SPRING_CONFIGS.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scaleValue.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, []);

  const handlePress = useCallback(() => {
    if (haptic !== 'none' && Platform.OS === 'ios') {
      const style = haptic === 'heavy' 
        ? Haptics.ImpactFeedbackStyle.Heavy
        : haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(style);
    }
    onPress?.();
  }, [haptic, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// =============================================================================
// BOUNCE — Пружинящий bounce эффект
// =============================================================================

interface BounceProps {
  children: React.ReactNode;
  trigger?: boolean;
  style?: ViewStyle;
}

export const Bounce: React.FC<BounceProps> = ({
  children,
  trigger,
  style,
}) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (trigger) {
      scale.value = withSequence(
        withSpring(1.2, SPRING_CONFIGS.bouncy),
        withSpring(1, SPRING_CONFIGS.bouncy)
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// =============================================================================
// SHIMMER — Премиальный shimmer эффект (skeleton)
// =============================================================================

interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => (
  <MotiView
    from={{ opacity: 0.3 }}
    animate={{ opacity: 0.7 }}
    transition={{
      type: 'timing',
      duration: 1000,
      loop: true,
    }}
    style={[
      {
        width: width as any,
        height,
        borderRadius,
        backgroundColor: ultra.elevated,
      },
      style,
    ]}
  />
);

// =============================================================================
// STAGGER — Последовательное появление элементов
// =============================================================================

interface StaggerProps {
  children: React.ReactNode[];
  delay?: number;
  staggerDelay?: number;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  delay = 0,
  staggerDelay = 50,
}) => (
  <>
    {React.Children.map(children, (child, index) => (
      <FadeInUp key={index} delay={delay + index * staggerDelay}>
        {child}
      </FadeInUp>
    ))}
  </>
);

// =============================================================================
// PULSE — Пульсирующий эффект (для уведомлений)
// =============================================================================

interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  style?: ViewStyle;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  active = true,
  style,
}) => (
  <MotiView
    animate={{
      scale: active ? [1, 1.05, 1] : 1,
    }}
    transition={{
      type: 'timing',
      duration: 1500,
      loop: active,
    }}
    style={style}
  >
    {children}
  </MotiView>
);

// =============================================================================
// GLOW — Свечение (для premium элементов)
// =============================================================================

interface GlowProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  style?: ViewStyle;
}

export const Glow: React.FC<GlowProps> = ({
  children,
  color = ultra.platinum,
  intensity = 0.5,
  style,
}) => (
  <MotiView
    animate={{
      shadowOpacity: [intensity * 0.5, intensity, intensity * 0.5],
    }}
    transition={{
      type: 'timing',
      duration: 2000,
      loop: true,
    }}
    style={[
      {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 20,
        elevation: 10,
      },
      style,
    ]}
  >
    {children}
  </MotiView>
);

// =============================================================================
// SKELETON TEXT — Анимированный placeholder для текста
// =============================================================================

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  style?: ViewStyle;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 16,
  style,
}) => (
  <MotiView style={style}>
    {Array.from({ length: lines }).map((_, i) => (
      <Shimmer
        key={i}
        width={i === lines - 1 ? '60%' : '100%'}
        height={lineHeight}
        style={{ marginBottom: 8 }}
      />
    ))}
  </MotiView>
);

// =============================================================================
// FLIP — 3D переворот (для карточек)
// =============================================================================

interface FlipProps {
  children: React.ReactNode;
  flipped?: boolean;
  style?: ViewStyle;
}

export const Flip: React.FC<FlipProps> = ({
  children,
  flipped = false,
  style,
}) => (
  <MotiView
    animate={{
      rotateY: flipped ? '180deg' : '0deg',
    }}
    transition={{
      type: 'spring',
      ...SPRING_CONFIGS.gentle,
    }}
    style={[{ backfaceVisibility: 'hidden' }, style]}
  >
    {children}
  </MotiView>
);

// =============================================================================
// EXPORTS
// =============================================================================

export {
  AnimatePresence,
  MotiView,
  MotiText,
};

export default {
  FadeIn,
  FadeInUp,
  SlideUp,
  ScalePress,
  Bounce,
  Shimmer,
  Stagger,
  Pulse,
  Glow,
  SkeletonText,
  Flip,
  SPRING_CONFIGS,
};

