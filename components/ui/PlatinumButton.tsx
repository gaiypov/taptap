// components/ui/PlatinumButton.tsx
// Premium Button with Reanimated animations
import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '@/lib/theme';
import { SPRING_CONFIGS } from '@/components/animations/PremiumAnimations';

interface PlatinumButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PlatinumButton: React.FC<PlatinumButtonProps> = ({
  title,
  fullWidth = true,
  style,
  textStyle,
  disabled,
  onPress,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.97, SPRING_CONFIGS.snappy);
    opacity.value = withSpring(0.9, SPRING_CONFIGS.snappy);
  }, [disabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
    opacity.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, []);

  const handlePress = useCallback((e: any) => {
    if (disabled) return;
    
    // ⚡ Premium bounce
    scale.value = withSequence(
      withSpring(1.02, SPRING_CONFIGS.bouncy),
      withSpring(0.98, SPRING_CONFIGS.snappy),
      withSpring(1, SPRING_CONFIGS.snappy)
    );
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    onPress?.(e);
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.base,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
          animatedStyle,
        ]}
      >
        <Text style={[styles.text, textStyle]} numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.primaryButtonBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.primaryButtonText,
    letterSpacing: -0.3,
  },
});
