/**
 * PremiumButton — Универсальная премиальная кнопка
 * 
 * Revolut Ultra стиль для ВСЕХ кнопок в приложении.
 * Заменяет TouchableOpacity, Pressable, Button везде.
 * 
 * @example
 * ```tsx
 * // Основная кнопка
 * <PremiumButton onPress={handlePress} variant="primary">
 *   Купить
 * </PremiumButton>
 * 
 * // Иконка
 * <PremiumButton onPress={handleLike} variant="icon" haptic="medium">
 *   <HeartIcon />
 * </PremiumButton>
 * 
 * // Ghost (прозрачная)
 * <PremiumButton onPress={handleBack} variant="ghost">
 *   Назад
 * </PremiumButton>
 * ```
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ultra } from '@/lib/theme/ultra';
import { SPRING_CONFIGS } from '@/components/animations/PremiumAnimations';

// =============================================================================
// TYPES
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'tab' | 'chip';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type HapticType = 'none' | 'light' | 'medium' | 'heavy' | 'success' | 'warning';

interface PremiumButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  haptic?: HapticType;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  activeColor?: string;
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  onPress,
  onLongPress,
  variant = 'primary',
  size = 'md',
  haptic = 'light',
  disabled = false,
  loading = false,
  active = false,
  fullWidth = false,
  style,
  textStyle,
  activeColor = ultra.platinum,
  testID,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // ⚡ Premium press-in
  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    
    const targetScale = variant === 'icon' || variant === 'tab' ? 0.85 : 0.97;
    scale.value = withSpring(targetScale, SPRING_CONFIGS.snappy);
    opacity.value = withTiming(0.8, { duration: 100 });
  }, [disabled, loading, variant]);

  // ⚡ Premium press-out
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
    opacity.value = withTiming(1, { duration: 150 });
  }, []);

  // ⚡ Premium press with signature bounce
  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    // Signature bounce animation
    const bounceScale = variant === 'icon' || variant === 'tab' ? 1.15 : 1.03;
    scale.value = withSequence(
      withSpring(bounceScale, SPRING_CONFIGS.bouncy),
      withSpring(0.98, SPRING_CONFIGS.snappy),
      withSpring(1, SPRING_CONFIGS.snappy)
    );

    // Premium haptic feedback
    if (haptic !== 'none') {
      const hapticStyle = 
        haptic === 'heavy' || haptic === 'warning'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : haptic === 'medium' || haptic === 'success'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;
      
      if (haptic === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (haptic === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(hapticStyle);
      }
    }

    onPress?.();
  }, [disabled, loading, haptic, onPress, variant]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Get variant styles
  const variantStyles = getVariantStyles(variant, active, activeColor, disabled);
  const sizeStyles = getSizeStyles(size, variant);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.base,
          variantStyles.container,
          sizeStyles.container,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
          animatedStyle,
        ]}
      >
        {typeof children === 'string' ? (
          <Text style={[
            styles.text,
            variantStyles.text,
            sizeStyles.text,
            textStyle,
          ]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
};

// =============================================================================
// VARIANT STYLES
// =============================================================================

function getVariantStyles(
  variant: ButtonVariant,
  active: boolean,
  activeColor: string,
  disabled: boolean
): { container: ViewStyle; text: TextStyle } {
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: disabled ? ultra.textMuted : ultra.platinum,
        },
        text: {
          color: ultra.background,
          fontWeight: '700',
        },
      };
    
    case 'secondary':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: disabled ? ultra.textMuted : ultra.platinum,
        },
        text: {
          color: disabled ? ultra.textMuted : ultra.platinum,
          fontWeight: '600',
        },
      };
    
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
        },
        text: {
          color: disabled ? ultra.textMuted : ultra.textPrimary,
          fontWeight: '500',
        },
      };
    
    case 'icon':
      return {
        container: {
          backgroundColor: active ? `${activeColor}20` : 'rgba(255,255,255,0.1)',
          borderRadius: 100,
        },
        text: {
          color: active ? activeColor : ultra.textPrimary,
        },
      };
    
    case 'tab':
      return {
        container: {
          backgroundColor: active ? ultra.platinum : 'transparent',
          borderRadius: 100,
        },
        text: {
          color: active ? ultra.background : ultra.textMuted,
          fontWeight: active ? '700' : '500',
        },
      };
    
    case 'chip':
      return {
        container: {
          backgroundColor: active ? ultra.platinum : 'rgba(255,255,255,0.08)',
          borderRadius: 20,
          borderWidth: active ? 0 : 1,
          borderColor: 'rgba(255,255,255,0.15)',
        },
        text: {
          color: active ? ultra.background : ultra.textPrimary,
          fontWeight: active ? '600' : '500',
        },
      };
    
    default:
      return { container: {}, text: {} };
  }
}

// =============================================================================
// SIZE STYLES
// =============================================================================

function getSizeStyles(
  size: ButtonSize,
  variant: ButtonVariant
): { container: ViewStyle; text: TextStyle } {
  const isIcon = variant === 'icon' || variant === 'tab';
  
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingHorizontal: isIcon ? 8 : 12,
          paddingVertical: isIcon ? 8 : 6,
          minHeight: isIcon ? 32 : 28,
        },
        text: { fontSize: 12 },
      };
    
    case 'md':
      return {
        container: {
          paddingHorizontal: isIcon ? 12 : 20,
          paddingVertical: isIcon ? 12 : 12,
          minHeight: isIcon ? 44 : 44,
        },
        text: { fontSize: 14 },
      };
    
    case 'lg':
      return {
        container: {
          paddingHorizontal: isIcon ? 16 : 28,
          paddingVertical: isIcon ? 16 : 16,
          minHeight: isIcon ? 56 : 56,
        },
        text: { fontSize: 16 },
      };
    
    case 'xl':
      return {
        container: {
          paddingHorizontal: isIcon ? 20 : 36,
          paddingVertical: isIcon ? 20 : 20,
          minHeight: isIcon ? 64 : 64,
        },
        text: { fontSize: 18 },
      };
    
    default:
      return { container: {}, text: {} };
  }
}

// =============================================================================
// BASE STYLES
// =============================================================================

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    textAlign: 'center',
  },
});

export default PremiumButton;

