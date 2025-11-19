import { ultra } from '@/lib/theme/ultra';
import React, { useEffect } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { computeFusedMotion } from '@/lib/neuralMotion';

type CategoryItem = {
  id: string;
  name: string;
  icon: string;
};

interface CategoryButtonProps {
  item: CategoryItem;
  isActive: boolean;
  animValue: Animated.Value;
  scrollVelocity: number;
  gyroX: number;
  gyroY: number;
  onPress: () => void;
  fusedMotion?: ReturnType<typeof computeFusedMotion>;
  fps?: number;
  stall?: number;
}

const CategoryButton: React.FC<CategoryButtonProps> = React.memo(({
  item,
  isActive,
  animValue,
  scrollVelocity,
  gyroX,
  gyroY,
  onPress,
  fusedMotion,
  fps = 60,
  stall = 0,
}) => {
  const parallaxY = React.useRef(new Animated.Value(0)).current;
  const tilt = React.useRef(new Animated.Value(0)).current;
  const glowScale = React.useRef(new Animated.Value(1)).current;
  const glowOpacity = React.useRef(new Animated.Value(0)).current;
  const depthTiltX = React.useRef(new Animated.Value(0)).current;
  const depthTiltY = React.useRef(new Animated.Value(0)).current;
  const jitter = React.useRef(new Animated.Value(0)).current;
  const inertia = React.useRef(new Animated.Value(0)).current;
  const prevScrollVelocityRef = React.useRef(0);
  const jitterLoopRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const touchPressure = React.useRef(new Animated.Value(0)).current;
  const airDrag = React.useRef(new Animated.Value(1)).current;
  const momentum = React.useRef(new Animated.Value(0)).current;
  const gyroXAnim = React.useRef(new Animated.Value(0)).current;
  const gyroYAnim = React.useRef(new Animated.Value(0)).current;
  const sweepX = React.useRef(new Animated.Value(-180)).current;
  const glowPulse = React.useRef(new Animated.Value(1)).current;

  const isLowPerformance = fps < 40 || stall > 120;

  useEffect(() => {
    if (!isLowPerformance) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sweepX, {
            toValue: 200,
            duration: 2600,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(sweepX, {
            toValue: -180,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      sweepX.setValue(-180);
    }
  }, [isLowPerformance, sweepX]);

  useEffect(() => {
    if (isActive && !isLowPerformance) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1.07,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowPulse.setValue(1);
    }
  }, [isActive, isLowPerformance, glowPulse]);

  const scaleAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const opacityAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  // Используем фиксированный цвет вместо анимации
  const backgroundColor = ultra.card; // #171717 матовая

  const shadowOpacityAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  React.useEffect(() => {
    const v = scrollVelocity || 0;
    const clamped = Math.max(-25, Math.min(25, v));
    const activityFactor = isActive ? 1.2 : 0.6;
    const pressure = Math.min(Math.abs(v) / 22, 1);
    const pressureMultiplier = 0.7 + pressure * 0.7;
    const boost = fusedMotion?.animationBoost || 1.0;
    const targetY = -clamped * 0.3 * activityFactor * pressureMultiplier * (1 + (boost - 1.0) * 0.15);
    const targetTilt = clamped * 0.4 * activityFactor * pressureMultiplier * (1 + (boost - 1.0) * 0.2);

    if (v < 0) {
      Animated.parallel([
        Animated.timing(parallaxY, {
          toValue: targetY,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tilt, {
          toValue: targetTilt,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(parallaxY, {
          toValue: targetY,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(tilt, {
          toValue: targetTilt,
          tension: 90,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [scrollVelocity, isActive, parallaxY, tilt, fusedMotion]);

  React.useEffect(() => {
    const v = scrollVelocity || 0;
    const clamped = Math.max(-25, Math.min(25, v));
    const activityFactor = isActive ? 1.0 : 0.5;
    const pressure = Math.min(Math.abs(v) / 22, 1);
    const pressureMultiplier = 0.7 + pressure * 0.7;
    const stabilityWeight = fusedMotion?.stabilityWeight || 1.0;
    const targetTiltX = -clamped * 0.12 * activityFactor * pressureMultiplier * stabilityWeight;
    const targetTiltY = clamped * 0.08 * activityFactor * pressureMultiplier * stabilityWeight;

    if (v < 0) {
      Animated.parallel([
        Animated.timing(depthTiltX, {
          toValue: targetTiltX,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(depthTiltY, {
          toValue: targetTiltY,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(depthTiltX, {
          toValue: targetTiltX,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(depthTiltY, {
          toValue: targetTiltY,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [scrollVelocity, isActive, depthTiltX, depthTiltY, fusedMotion]);

  React.useEffect(() => {
    const v = scrollVelocity || 0;
    const absV = Math.abs(v);
    const pressure = Math.min(absV / 22, 1);
    const targetPressure = isActive ? pressure : pressure * 0.6;
    Animated.timing(touchPressure, {
      toValue: targetPressure,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    const targetMomentum = isActive ? Math.min(absV * 0.7, 18) : Math.min(absV * 0.4, 12);
    Animated.spring(momentum, {
      toValue: targetMomentum,
      tension: 120,
      friction: 18,
      useNativeDriver: true,
    }).start();
  }, [scrollVelocity, isActive, touchPressure, momentum]);

  React.useEffect(() => {
    const v = scrollVelocity || 0;
    const absV = Math.abs(v);
    const targetDrag = absV > 18 ? 0.72 : absV > 8 ? 0.82 : 0.95;
    Animated.timing(airDrag, {
      toValue: targetDrag,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scrollVelocity, airDrag]);

  React.useEffect(() => {
    const intensity = scrollVelocity > 15 ? 1.0 : scrollVelocity > 5 ? 0.6 : 0.25;
    const baseGlow = isActive ? intensity : 0;
    Animated.parallel([
      Animated.spring(glowScale, {
        toValue: isActive ? 1.18 : 1,
        tension: 90,
        friction: 14,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: isLowPerformance ? baseGlow * 0.4 : baseGlow,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scrollVelocity, isActive, glowScale, glowOpacity, isLowPerformance]);

  React.useEffect(() => {
    const v = Math.abs(scrollVelocity || 0);
    if (jitterLoopRef.current) {
      jitterLoopRef.current.stop();
      jitterLoopRef.current = null;
    }
    if (v > 0.2 && v < 2) {
      const activityFactor = isActive ? 1.0 : 0.7;
      let jitterAmplitude = 1.4 * activityFactor;
      if (fusedMotion?.nextAction === 'oscillate') {
        jitterAmplitude *= 1.3;
      }
      jitterLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(jitter, {
            toValue: jitterAmplitude,
            duration: 80 + Math.random() * 40,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(jitter, {
            toValue: -jitterAmplitude,
            duration: 80 + Math.random() * 40,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      jitterLoopRef.current.start();
    } else {
      Animated.timing(jitter, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [scrollVelocity, isActive, jitter, fusedMotion]);

  React.useEffect(() => {
    const v = scrollVelocity || 0;
    const prevV = prevScrollVelocityRef.current;
    const signChanged = (prevV < 0 && v > 0) || (prevV > 0 && v < 0);
    if (signChanged && Math.abs(v) > 0.5) {
      const activityFactor = isActive ? 1.0 : 0.6;
      const snapValue = (v > 0 ? -6 : 6) * activityFactor;
      Animated.spring(inertia, {
        toValue: snapValue,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(inertia, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      });
    } else if (Math.abs(v) < 0.5) {
      Animated.parallel([
        Animated.spring(inertia, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(parallaxY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(depthTiltX, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(depthTiltY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevScrollVelocityRef.current = v;
  }, [scrollVelocity, isActive, inertia, parallaxY, depthTiltX, depthTiltY]);

  React.useEffect(() => {
    const intensity = isActive ? 1.0 : 0.5;
    Animated.parallel([
      Animated.timing(gyroXAnim, {
        toValue: gyroX * intensity,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(gyroYAnim, {
        toValue: gyroY * intensity,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [gyroX, gyroY, isActive, gyroXAnim, gyroYAnim]);

  const tiltRotate = tilt.interpolate({
    inputRange: [-20, 20],
    outputRange: ['-6deg', '6deg'],
    extrapolate: 'clamp',
  });

  const depthRotateX = depthTiltX.interpolate({
    inputRange: [-15, 15],
    outputRange: ['10deg', '-10deg'],
    extrapolate: 'clamp',
  });

  const depthRotateY = depthTiltY.interpolate({
    inputRange: [-15, 15],
    outputRange: ['-8deg', '8deg'],
    extrapolate: 'clamp',
  });

  const gyroTranslateX = gyroYAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
    extrapolate: 'clamp',
  });

  const gyroTranslateY = gyroXAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [4, -4],
    extrapolate: 'clamp',
  });

  const gyroRotateZ = gyroYAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4deg', '4deg'],
    extrapolate: 'clamp',
  });

  const shadowOpacity = isLowPerformance ? shadowOpacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  }) : shadowOpacityAnim;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.categoryButtonWrapper}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          borderRadius: 32,
          backgroundColor: ultra.accent, // #C0C0C0 серебро
          opacity: glowOpacity,
          transform: [{ scale: Animated.multiply(glowScale, glowPulse) }],
        }}
      />
      <Animated.View
        style={[
          styles.glassButtonWrapper,
          {
            transform: [
              { perspective: 800 },
              { rotateX: depthRotateX },
              { rotateY: depthRotateY },
              { rotateZ: gyroRotateZ },
              { translateX: Animated.add(jitter, Animated.multiply(gyroTranslateX, airDrag)) },
              { translateY: Animated.add(inertia, Animated.multiply(gyroTranslateY, airDrag)) },
              { scale: Animated.multiply(scaleAnim, airDrag) },
            ],
            opacity: opacityAnim,
            backgroundColor: ultra.card, // #171717 матовая
            borderColor: isActive ? ultra.accent : ultra.border,
            shadowColor: '#000',
            shadowOpacity: isActive ? 0.3 : 0.2,
            ...Platform.select({
              ios: {
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
              },
              android: {
                elevation: isActive ? 4 : 2,
              },
            }),
          },
        ]}
      >
        {!isLowPerformance && (
          <Animated.View
            style={[
              styles.reflectionLayer,
              {
                transform: [
                  { rotate: '35deg' },
                  { translateX: sweepX },
                ],
              },
            ]}
          />
        )}
        <Animated.View
          style={{
            transform: [
              {
                scale: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }),
              },
              { translateY: parallaxY },
              { rotate: tiltRotate },
            ],
          }}
        >
          <Text style={styles.categoryIcon}>{item.icon}</Text>
        </Animated.View>
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
    </TouchableOpacity>
  );
});

CategoryButton.displayName = 'CategoryButton';

const styles = StyleSheet.create({
  categoryButtonWrapper: {
    marginRight: 10,
  },
  glassButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 12,
    overflow: 'hidden',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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

