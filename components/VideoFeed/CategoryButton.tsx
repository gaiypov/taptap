// components/VideoFeed/CategoryButton.tsx
// REFACTORED: Reanimated 3 для UI Thread анимаций (60 FPS)

import { ultra } from '@/lib/theme/ultra';
import React, { useEffect, useCallback } from 'react';
import { Platform, StyleSheet, Text, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate,
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { computeFusedMotion } from '@/lib/neuralMotion';

// ==============================================
// TYPES
// ==============================================

type CategoryItem = {
  id: string;
  name: string;
  icon: string;
};

interface CategoryButtonProps {
  item: CategoryItem;
  isActive: boolean;
  scrollVelocity: number;
  gyroX: number;
  gyroY: number;
  onPress: () => void;
  fusedMotion?: ReturnType<typeof computeFusedMotion>;
  fps?: number;
  stall?: number;
}

// ==============================================
// SPRING CONFIGS
// ==============================================

const SPRING_CONFIG = {
  damping: 12,
  stiffness: 100,
  mass: 0.8,
};

const FAST_SPRING = {
  damping: 14,
  stiffness: 200,
};

// ==============================================
// COMPONENT
// ==============================================

const CategoryButton: React.FC<CategoryButtonProps> = React.memo(({
  item,
  isActive,
  scrollVelocity,
  gyroX,
  gyroY,
  onPress,
  fusedMotion,
  fps = 60,
  stall = 0,
}) => {
  // Shared values для UI Thread
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const parallaxY = useSharedValue(0);
  const tilt = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const depthTiltX = useSharedValue(0);
  const depthTiltY = useSharedValue(0);
  const jitter = useSharedValue(0);
  const inertia = useSharedValue(0);
  const gyroXAnim = useSharedValue(0);
  const gyroYAnim = useSharedValue(0);
  const sweepX = useSharedValue(-180);
  const glowPulse = useSharedValue(1);
  const airDrag = useSharedValue(1);

  const isLowPerformance = fps < 40 || stall > 120;

  // ==============================================
  // SWEEP ANIMATION (reflection)
  // ==============================================
  useEffect(() => {
    if (!isLowPerformance) {
      sweepX.value = withRepeat(
        withSequence(
          withTiming(200, { duration: 2600, easing: Easing.linear }),
          withTiming(-180, { duration: 0 })
        ),
        -1, // infinite
        false
      );
    } else {
      sweepX.value = -180;
    }
    
    return () => {
      cancelAnimation(sweepX);
    };
  }, [isLowPerformance]);

  // ==============================================
  // GLOW PULSE (active state)
  // ==============================================
  useEffect(() => {
    if (isActive && !isLowPerformance) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1.07, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      glowPulse.value = withTiming(1, { duration: 200 });
    }
    
    return () => {
      cancelAnimation(glowPulse);
    };
  }, [isActive, isLowPerformance]);

  // ==============================================
  // SCALE & OPACITY (active state)
  // ==============================================
  useEffect(() => {
    scale.value = withSpring(isActive ? 1.05 : 1, SPRING_CONFIG);
    opacity.value = withTiming(isActive ? 1 : 0.7, { duration: 200 });
    glowScale.value = withSpring(isActive ? 1.18 : 1, FAST_SPRING);
    
    const intensity = scrollVelocity > 15 ? 1.0 : scrollVelocity > 5 ? 0.6 : 0.25;
    const baseGlow = isActive ? intensity : 0;
    glowOpacity.value = withTiming(isLowPerformance ? baseGlow * 0.4 : baseGlow, { duration: 220 });
  }, [isActive, scrollVelocity, isLowPerformance]);

  // ==============================================
  // PARALLAX & TILT (scroll velocity)
  // ==============================================
  useEffect(() => {
    const v = scrollVelocity || 0;
    const clamped = Math.max(-25, Math.min(25, v));
    const activityFactor = isActive ? 1.2 : 0.6;
    const pressure = Math.min(Math.abs(v) / 22, 1);
    const pressureMultiplier = 0.7 + pressure * 0.7;
    const boost = fusedMotion?.animationBoost || 1.0;
    
    const targetY = -clamped * 0.3 * activityFactor * pressureMultiplier * (1 + (boost - 1.0) * 0.15);
    const targetTilt = clamped * 0.4 * activityFactor * pressureMultiplier * (1 + (boost - 1.0) * 0.2);

    if (v < 0) {
      parallaxY.value = withTiming(targetY, { duration: 200, easing: Easing.out(Easing.cubic) });
      tilt.value = withTiming(targetTilt, { duration: 200, easing: Easing.out(Easing.cubic) });
    } else {
      parallaxY.value = withSpring(targetY, SPRING_CONFIG);
      tilt.value = withSpring(targetTilt, SPRING_CONFIG);
    }
  }, [scrollVelocity, isActive, fusedMotion]);

  // ==============================================
  // DEPTH TILT (3D effect)
  // ==============================================
  useEffect(() => {
    const v = scrollVelocity || 0;
    const clamped = Math.max(-25, Math.min(25, v));
    const activityFactor = isActive ? 1.0 : 0.5;
    const pressure = Math.min(Math.abs(v) / 22, 1);
    const pressureMultiplier = 0.7 + pressure * 0.7;
    const stabilityWeight = fusedMotion?.stabilityWeight || 1.0;
    
    const targetTiltX = -clamped * 0.12 * activityFactor * pressureMultiplier * stabilityWeight;
    const targetTiltY = clamped * 0.08 * activityFactor * pressureMultiplier * stabilityWeight;

    if (v < 0) {
      depthTiltX.value = withTiming(targetTiltX, { duration: 200, easing: Easing.out(Easing.cubic) });
      depthTiltY.value = withTiming(targetTiltY, { duration: 200, easing: Easing.out(Easing.cubic) });
    } else {
      depthTiltX.value = withSpring(targetTiltX, SPRING_CONFIG);
      depthTiltY.value = withSpring(targetTiltY, SPRING_CONFIG);
    }
  }, [scrollVelocity, isActive, fusedMotion]);

  // ==============================================
  // AIR DRAG (velocity based)
  // ==============================================
  useEffect(() => {
    const absV = Math.abs(scrollVelocity || 0);
    const targetDrag = absV > 18 ? 0.72 : absV > 8 ? 0.82 : 0.95;
    airDrag.value = withTiming(targetDrag, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [scrollVelocity]);

  // ==============================================
  // JITTER (subtle movement)
  // ==============================================
  useEffect(() => {
    const v = Math.abs(scrollVelocity || 0);
    
    if (v > 0.2 && v < 2) {
      const activityFactor = isActive ? 1.0 : 0.7;
      let jitterAmplitude = 1.4 * activityFactor;
      if (fusedMotion?.nextAction === 'oscillate') {
        jitterAmplitude *= 1.3;
      }
      
      jitter.value = withRepeat(
        withSequence(
          withTiming(jitterAmplitude, { duration: 100, easing: Easing.inOut(Easing.sin) }),
          withTiming(-jitterAmplitude, { duration: 100, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(jitter);
      jitter.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) });
    }
    
    return () => {
      cancelAnimation(jitter);
    };
  }, [scrollVelocity, isActive, fusedMotion]);

  // ==============================================
  // GYRO (device motion)
  // ==============================================
  useEffect(() => {
    const intensity = isActive ? 1.0 : 0.5;
    gyroXAnim.value = withTiming(gyroX * intensity, { duration: 160, easing: Easing.out(Easing.quad) });
    gyroYAnim.value = withTiming(gyroY * intensity, { duration: 160, easing: Easing.out(Easing.quad) });
  }, [gyroX, gyroY, isActive]);

  // ==============================================
  // ANIMATED STYLES
  // ==============================================

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value * glowPulse.value }],
  }));

  const containerStyle = useAnimatedStyle(() => {
    const tiltRotate = interpolate(
      tilt.value,
      [-20, 20],
      [-6, 6],
      Extrapolate.CLAMP
    );

    const depthRotateX = interpolate(
      depthTiltX.value,
      [-15, 15],
      [10, -10],
      Extrapolate.CLAMP
    );

    const depthRotateY = interpolate(
      depthTiltY.value,
      [-15, 15],
      [-8, 8],
      Extrapolate.CLAMP
    );

    const gyroTranslateX = interpolate(
      gyroYAnim.value,
      [-1, 1],
      [-6, 6],
      Extrapolate.CLAMP
    );

    const gyroTranslateY = interpolate(
      gyroXAnim.value,
      [-1, 1],
      [4, -4],
      Extrapolate.CLAMP
    );

    const gyroRotateZ = interpolate(
      gyroYAnim.value,
      [-1, 1],
      [-4, 4],
      Extrapolate.CLAMP
    );

    return {
      opacity: opacity.value,
      transform: [
        { perspective: 800 },
        { rotateX: `${depthRotateX}deg` },
        { rotateY: `${depthRotateY}deg` },
        { rotateZ: `${gyroRotateZ}deg` },
        { translateX: jitter.value + gyroTranslateX * airDrag.value },
        { translateY: inertia.value + gyroTranslateY * airDrag.value },
        { scale: scale.value * airDrag.value },
      ],
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const tiltRotate = interpolate(
      tilt.value,
      [-20, 20],
      [-6, 6],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: interpolate(scale.value, [1, 1.05], [1, 1.1]) },
        { translateY: parallaxY.value },
        { rotate: `${tiltRotate}deg` },
      ],
    };
  });

  const reflectionStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: '35deg' },
      { translateX: sweepX.value },
    ],
  }));

  // ==============================================
  // RENDER
  // ==============================================

  return (
    <Pressable
      onPress={onPress}
      style={styles.categoryButtonWrapper}
    >
      {/* Glow effect */}
      <Animated.View
        style={[styles.glowLayer, glowStyle]}
      />
      
      {/* Main button */}
      <Animated.View
        style={[
          styles.glassButtonWrapper,
          {
            backgroundColor: ultra.card,
            borderColor: isActive ? ultra.accent : ultra.border,
          },
          containerStyle,
        ]}
      >
        {/* Reflection sweep */}
        {!isLowPerformance && (
          <Animated.View
            style={[styles.reflectionLayer, reflectionStyle]}
          />
        )}
        
        {/* Icon */}
        <Animated.View style={iconStyle}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
        </Animated.View>
        
        {/* Text */}
        <Text
          style={[
            styles.categoryText,
            {
              color: isActive ? ultra.textPrimary : ultra.textSecondary,
              fontWeight: isActive ? '800' : '600',
              fontFamily: Platform.OS === 'ios' ? 'System' : (isActive ? 'Inter-Bold' : 'Inter-Medium'),
            },
          ]}
        >
          {item.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

CategoryButton.displayName = 'CategoryButton';

// ==============================================
// STYLES
// ==============================================

const styles = StyleSheet.create({
  categoryButtonWrapper: {
    marginRight: 10,
  },
  glowLayer: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 32,
    backgroundColor: ultra.accent,
  },
  glassButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  reflectionLayer: {
    position: 'absolute',
    top: -20,
    left: -60,
    width: 140,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.22)',
    opacity: 0.14,
  },
  categoryIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

export default CategoryButton;
