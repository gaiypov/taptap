/**
 * FormInput - Типизированный input компонент для React Hook Form
 * 
 * Revolut Ultra Platinum Style с поддержкой:
 * - Автоматическое отображение ошибок
 * - Haptic feedback при ошибках
 * - Анимации ошибок
 * - Типизация через generics
 * 
 * Использование:
 * <FormInput
 *   control={control}
 *   name="email"
 *   label="Email"
 *   placeholder="example@mail.com"
 *   keyboardType="email-address"
 * />
 */

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
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

export interface FormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  /** React Hook Form control */
  control: Control<T>;
  /** Field name (типизированный через FieldPath) */
  name: FieldPath<T>;
  /** Label над input */
  label?: string;
  /** Иконка слева */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Иконка справа */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Показывать счетчик символов */
  showCharCount?: boolean;
  /** Максимальная длина для счетчика */
  maxCharCount?: number;
  /** Кастомное сообщение об ошибке (перезаписывает Zod) */
  errorMessage?: string;
  /** Callback при фокусе */
  onFocusChange?: (focused: boolean) => void;
  /** Контейнер стили */
  containerStyle?: View['props']['style'];
  /** Режим только чтение */
  readOnly?: boolean;
}

// ============================================================================
// Component
// ============================================================================

function FormInputInner<T extends FieldValues>(
  props: FormInputProps<T>,
  ref: React.ForwardedRef<TextInput>
) {
  const {
    control,
    name,
    label,
    leftIcon,
    rightIcon,
    showCharCount,
    maxCharCount,
    errorMessage: customError,
    onFocusChange,
    containerStyle,
    readOnly,
    placeholder,
    multiline,
    numberOfLines,
    keyboardType,
    ...textInputProps
  } = props;

  // Animation values
  const focusValue = useSharedValue(0);
  const errorShake = useSharedValue(0);
  const errorBorderValue = useSharedValue(0);

  // Refs
  const inputRef = useRef<TextInput>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);

  // Form state для отслеживания ошибок
  const { errors } = useFormState({ control, name });
  const fieldError = errors[name];
  const errorText = customError || (fieldError?.message as string | undefined);

  // Анимация появления ошибки с haptic
  useEffect(() => {
    if (errorText && errorText !== prevErrorRef.current) {
      // Haptic feedback при новой ошибке
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Shake animation
      errorShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Border color animation
      errorBorderValue.value = withTiming(1, { duration: 200 });
    } else if (!errorText && prevErrorRef.current) {
      errorBorderValue.value = withTiming(0, { duration: 200 });
    }

    prevErrorRef.current = errorText;
  }, [errorText, errorShake, errorBorderValue]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));

  const inputContainerAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      errorBorderValue.value,
      [0, 1],
      [focusValue.value === 1 ? ultra.accent : ultra.border, '#FF6B6B']
    );

    return {
      borderColor,
      borderWidth: focusValue.value === 1 || errorBorderValue.value === 1 ? 2 : 1,
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    color: errorBorderValue.value === 1 ? '#FF6B6B' : ultra.textSecondary,
  }));

  // Handlers
  const handleFocus = useCallback(() => {
    focusValue.value = withSpring(1, { damping: 15 });
    onFocusChange?.(true);
  }, [focusValue, onFocusChange]);

  const handleBlur = useCallback(() => {
    focusValue.value = withSpring(0, { damping: 15 });
    onFocusChange?.(false);
  }, [focusValue, onFocusChange]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Animated.View style={[styles.container, containerStyle, containerAnimatedStyle]}>
          {/* Label */}
          {label && (
            <Animated.Text style={[styles.label, labelAnimatedStyle]}>
              {label}
            </Animated.Text>
          )}

          {/* Input Container */}
          <Animated.View style={[styles.inputWrapper, inputContainerAnimatedStyle]}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 15 : 0}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.inputContainer}>
              {/* Left Icon */}
              {leftIcon && (
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={leftIcon}
                    size={20}
                    color={errorText ? '#FF6B6B' : ultra.textMuted}
                  />
                </View>
              )}

              {/* Text Input */}
              <TextInput
                ref={(r) => {
                  // @ts-ignore
                  inputRef.current = r;
                  if (typeof ref === 'function') ref(r);
                  else if (ref) ref.current = r;
                }}
                style={[
                  styles.input,
                  multiline && styles.inputMultiline,
                  leftIcon && styles.inputWithLeftIcon,
                  rightIcon && styles.inputWithRightIcon,
                  readOnly && styles.inputReadOnly,
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  onBlur();
                  handleBlur();
                }}
                onFocus={handleFocus}
                placeholder={placeholder}
                placeholderTextColor={ultra.textMuted}
                multiline={multiline}
                numberOfLines={numberOfLines}
                keyboardType={keyboardType}
                editable={!readOnly}
                {...textInputProps}
              />

              {/* Right Icon */}
              {rightIcon && (
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={rightIcon}
                    size={20}
                    color={errorText ? '#FF6B6B' : ultra.textMuted}
                  />
                </View>
              )}

              {/* Character Count */}
              {showCharCount && maxCharCount && (
                <View style={styles.charCountContainer}>
                  <Text
                    style={[
                      styles.charCount,
                      value?.length > maxCharCount && styles.charCountError,
                    ]}
                  >
                    {value?.length || 0}/{maxCharCount}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Error Message */}
          {errorText && (
            <Animated.View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
              <Text style={styles.errorText}>{errorText}</Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
    />
  );
}

// Forward ref wrapper с generic поддержкой
export const FormInput = React.forwardRef(FormInputInner) as <T extends FieldValues>(
  props: FormInputProps<T> & { ref?: React.ForwardedRef<TextInput> }
) => React.ReactElement;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    backgroundColor: ultra.card,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  inputMultiline: {
    height: 120,
    textAlignVertical: 'top',
    paddingVertical: 14,
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  inputWithRightIcon: {
    marginRight: 8,
  },
  inputReadOnly: {
    opacity: 0.6,
  },
  iconContainer: {
    padding: 4,
  },
  charCountContainer: {
    position: 'absolute',
    right: 12,
    bottom: 8,
  },
  charCount: {
    fontSize: 11,
    color: ultra.textMuted,
  },
  charCountError: {
    color: '#FF6B6B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    flex: 1,
  },
});

export default FormInput;

