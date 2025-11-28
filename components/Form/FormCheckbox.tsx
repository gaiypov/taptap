/**
 * FormCheckbox - Типизированный checkbox компонент для React Hook Form
 * 
 * Revolut Ultra Platinum Style
 */

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  useFormState,
} from 'react-hook-form';

// ============================================================================
// Types
// ============================================================================

export interface FormCheckboxProps<T extends FieldValues> {
  /** React Hook Form control */
  control: Control<T>;
  /** Field name */
  name: FieldPath<T>;
  /** Текст чекбокса */
  label: string | React.ReactNode;
  /** Показывать звездочку обязательного поля */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  containerStyle?: View['props']['style'];
}

// ============================================================================
// Component
// ============================================================================

function FormCheckboxInner<T extends FieldValues>(
  props: FormCheckboxProps<T>
) {
  const {
    control,
    name,
    label,
    required,
    disabled,
    containerStyle,
  } = props;

  // Form state
  const { errors } = useFormState({ control, name });
  const fieldError = errors[name];
  const errorText = fieldError?.message as string | undefined;

  // Animation
  const scale = useSharedValue(1);
  const errorShake = useSharedValue(0);

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: errorShake.value },
    ],
  }));

  const handlePress = (onChange: (value: boolean) => void, currentValue: boolean) => {
    if (disabled) return;

    // Haptic
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale animation
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );

    onChange(!currentValue);
  };

  // Show error animation when error appears
  React.useEffect(() => {
    if (errorText) {
      errorShake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [errorText, errorShake]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View style={[styles.container, containerStyle]}>
          <Pressable
            onPress={() => handlePress(onChange, !!value)}
            style={styles.pressable}
            disabled={disabled}
          >
            <Animated.View
              style={[
                styles.checkbox,
                value && styles.checkboxActive,
                disabled && styles.checkboxDisabled,
                errorText && styles.checkboxError,
                checkboxAnimatedStyle,
              ]}
            >
              {value && (
                <Ionicons name="checkmark" size={14} color="#FFF" />
              )}
            </Animated.View>

            <View style={styles.labelContainer}>
              {typeof label === 'string' ? (
                <Text style={[styles.label, disabled && styles.labelDisabled]}>
                  {label}
                  {required && <Text style={styles.required}> *</Text>}
                </Text>
              ) : (
                label
              )}
            </View>
          </Pressable>

          {/* Error */}
          {errorText && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

export const FormCheckbox = FormCheckboxInner as <T extends FieldValues>(
  props: FormCheckboxProps<T>
) => React.ReactElement;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ultra.border,
    backgroundColor: ultra.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    borderColor: ultra.accent,
    backgroundColor: ultra.accent,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkboxError: {
    borderColor: '#FF6B6B',
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: ultra.textPrimary,
    lineHeight: 20,
  },
  labelDisabled: {
    opacity: 0.5,
  },
  required: {
    color: ultra.accent,
  },
  errorContainer: {
    marginTop: 6,
    marginLeft: 34,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
  },
});

export default FormCheckbox;

