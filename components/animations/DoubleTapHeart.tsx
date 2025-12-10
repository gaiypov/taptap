// components/animations/DoubleTapHeart.tsx
// Анимация сердца при двойном тапе как в TikTok/Instagram

import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Icons } from '@/components/icons/CustomIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DoubleTapHeartProps {
  visible: boolean;
  x: number;
  y: number;
  onComplete: () => void;
}

export const DoubleTapHeart: React.FC<DoubleTapHeartProps> = ({
  visible,
  x,
  y,
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(-15);

  useEffect(() => {
    if (visible) {
      // Animate in
      scale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      opacity.value = withTiming(1, { duration: 100 });
      rotation.value = withSequence(
        withSpring(15, { damping: 10, stiffness: 300 }),
        withSpring(0, { damping: 8, stiffness: 200 })
      );
      
      // Animate out after delay
      const timeout = setTimeout(() => {
        scale.value = withTiming(0.5, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onComplete)();
        });
      }, 600);
      
      return () => clearTimeout(timeout);
    }
  }, [visible, scale, opacity, rotation, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { left: x - 50, top: y - 50 },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Icons.Heart size={100} color="#FF2D55" filled />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});

export default DoubleTapHeart;

