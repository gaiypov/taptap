/**
 * FormSelect - Типизированный select/picker компонент для React Hook Form
 * 
 * Revolut Ultra Platinum Style с поддержкой:
 * - Модальный выбор опций
 * - Анимации и haptic feedback
 * - Автоматическое отображение ошибок
 * 
 * Использование:
 * <FormSelect
 *   control={control}
 *   name="gender"
 *   label="Пол"
 *   options={[
 *     { value: 'male', label: 'Мужской' },
 *     { value: 'female', label: 'Женский' },
 *   ]}
 * />
 */

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

export interface SelectOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface FormSelectProps<T extends FieldValues> {
  /** React Hook Form control */
  control: Control<T>;
  /** Field name */
  name: FieldPath<T>;
  /** Label над select */
  label?: string;
  /** Placeholder когда ничего не выбрано */
  placeholder?: string;
  /** Опции для выбора */
  options: SelectOption[];
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  containerStyle?: View['props']['style'];
}

// ============================================================================
// Component
// ============================================================================

function FormSelectInner<T extends FieldValues>(props: FormSelectProps<T>) {
  const {
    control,
    name,
    label,
    placeholder = 'Выберите...',
    options,
    disabled,
    containerStyle,
  } = props;

  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const { errors } = useFormState({ control, name });
  const fieldError = errors[name];
  const errorText = fieldError?.message as string | undefined;

  // Animation
  const scale = useSharedValue(1);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleOpen = useCallback(() => {
    if (disabled) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    scale.value = withSpring(0.98, { damping: 15 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 100);
    
    setIsOpen(true);
  }, [disabled, scale]);

  const handleSelect = useCallback((
    value: string,
    onChange: (value: string) => void
  ) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onChange(value);
    setIsOpen(false);
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        const selectedOption = options.find(opt => opt.value === value);

        return (
          <Animated.View style={[styles.container, containerStyle, containerAnimatedStyle]}>
            {/* Label */}
            {label && (
              <Text style={[styles.label, errorText && styles.labelError]}>
                {label}
              </Text>
            )}

            {/* Select Button */}
            <TouchableOpacity
              onPress={handleOpen}
              activeOpacity={0.8}
              disabled={disabled}
              style={[
                styles.selectButton,
                errorText && styles.selectButtonError,
                disabled && styles.selectButtonDisabled,
              ]}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 15 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              
              <View style={styles.selectContent}>
                {selectedOption?.icon && (
                  <Ionicons
                    name={selectedOption.icon}
                    size={20}
                    color={ultra.textPrimary}
                    style={styles.optionIcon}
                  />
                )}
                <Text
                  style={[
                    styles.selectText,
                    !selectedOption && styles.selectPlaceholder,
                  ]}
                >
                  {selectedOption?.label || placeholder}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={ultra.textMuted}
                />
              </View>
            </TouchableOpacity>

            {/* Error */}
            {errorText && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            )}

            {/* Modal */}
            <Modal
              visible={isOpen}
              transparent
              animationType="none"
              onRequestClose={() => setIsOpen(false)}
            >
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.modalOverlay}
              >
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setIsOpen(false)}
                />
                
                <Animated.View
                  entering={SlideInDown.springify().damping(20)}
                  exiting={SlideOutDown.duration(200)}
                  style={styles.modalContent}
                >
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 0}
                    tint="dark"
                    style={StyleSheet.absoluteFillObject}
                  />
                  
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{label || 'Выберите'}</Text>
                    <TouchableOpacity
                      onPress={() => setIsOpen(false)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color={ultra.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Options */}
                  <ScrollView
                    style={styles.optionsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {options.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => handleSelect(option.value, onChange)}
                        style={[
                          styles.optionItem,
                          value === option.value && styles.optionItemSelected,
                        ]}
                        activeOpacity={0.7}
                      >
                        {option.icon && (
                          <Ionicons
                            name={option.icon}
                            size={22}
                            color={value === option.value ? ultra.accent : ultra.textSecondary}
                            style={styles.optionIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            value === option.value && styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {value === option.value && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={ultra.accent}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              </Animated.View>
            </Modal>
          </Animated.View>
        );
      }}
    />
  );
}

export const FormSelect = FormSelectInner as <T extends FieldValues>(
  props: FormSelectProps<T>
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
  labelError: {
    color: '#FF6B6B',
  },
  selectButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    backgroundColor: ultra.card,
  },
  selectButtonError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: ultra.textPrimary,
  },
  selectPlaceholder: {
    color: ultra.textMuted,
  },
  optionIcon: {
    marginRight: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ultra.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    padding: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: ultra.card,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  optionItemSelected: {
    borderColor: ultra.accent,
    backgroundColor: `${ultra.accent}15`,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: ultra.textPrimary,
  },
  optionTextSelected: {
    color: ultra.accent,
    fontWeight: '600',
  },
});

export default FormSelect;

