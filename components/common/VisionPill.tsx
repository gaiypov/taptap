import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/lib/theme';

interface VisionPillProps {
  label: string;
  isSelected?: boolean;
  onPress: () => void;
  style?: any;
}

export const VisionPill: React.FC<VisionPillProps> = ({
  label,
  isSelected = false,
  onPress,
  style,
}) => {
  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scale = useSharedValue(1);
  const borderGlow = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.02, {
        damping: 15,
        stiffness: 200,
      });
      borderGlow.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
      borderGlow.value = withTiming(0, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isSelected, scale, borderGlow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderGlowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
    shadowOpacity: borderGlow.value * 0.5,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, {
      damping: 12,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.02 : 1, {
      damping: 12,
      stiffness: 300,
    });
  };

  const backgroundColor = isSelected
    ? isDark
      ? theme.surfaceGlassActive
      : theme.surfaceGlassActive || 'rgba(255,255,255,0.95)'
    : isDark
      ? theme.surfaceGlass
      : theme.surfaceGlass || 'rgba(255,255,255,0.75)';

  const borderColor = isSelected
    ? theme.accentPrimary || '#0077FF'
    : isDark
      ? theme.borderSoft
      : theme.borderSoft || 'rgba(0,0,0,0.08)';

  const textColor = isSelected
    ? theme.accentPrimary || '#0077FF'
    : isDark
      ? theme.textPrimary
      : theme.textSecondary || 'rgba(0,0,0,0.55)';

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={style}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor,
            borderColor,
          },
          animatedStyle,
        ]}
      >
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={isSelected ? (isDark ? 50 : 45) : (isDark ? 35 : 30)}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.specularHighlight} />
        {isSelected && (
          <Animated.View
            style={[
              styles.glowBorder,
              {
                borderColor: theme.accentPrimary || '#0077FF',
                shadowColor: theme.glowPrimary || 'rgba(0,119,255,0.28)',
              },
              borderGlowStyle,
            ]}
          />
        )}
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.10)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    zIndex: 2,
  },
});

