// components/ui/PlatinumChip.tsx
// Premium Chip with Reanimated animations
import React, { useCallback, useEffect } from 'react';
import {
  Pressable,
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
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '@/lib/theme';
import { SPRING_CONFIGS } from '@/components/animations/PremiumAnimations';

interface PlatinumChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PlatinumChip: React.FC<PlatinumChipProps> = ({
  label,
  selected,
  onPress,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const selectedValue = useSharedValue(selected ? 1 : 0);

  // Animate selection state
  useEffect(() => {
    selectedValue.value = withSpring(selected ? 1 : 0, SPRING_CONFIGS.gentle);
  }, [selected]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, SPRING_CONFIGS.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, []);

  const handlePress = useCallback(() => {
    // ⚡ Premium bounce
    scale.value = withSequence(
      withSpring(1.08, SPRING_CONFIGS.bouncy),
      withSpring(0.95, SPRING_CONFIGS.snappy),
      withSpring(1, SPRING_CONFIGS.snappy)
    );
    
    // Light haptic for chips
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    onPress?.();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectedValue.value,
      [0, 1],
      [theme.chipBg, theme.chipBgActive]
    );
    
    const borderColor = interpolateColor(
      selectedValue.value,
      [0, 1],
      [theme.chipBorder, theme.borderStrong]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      selectedValue.value,
      [0, 1],
      [theme.textSecondary, theme.textPrimary]
    );

    return { color };
  });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.base, style, animatedStyle]}>
        <Animated.Text
          style={[styles.text, textStyle, animatedTextStyle]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: theme.chip.height,
    paddingHorizontal: theme.chip.paddingHorizontal,
    borderRadius: theme.chip.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
