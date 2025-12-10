/**
 * ActionSheet - Красивый action sheet в стиле iOS
 * 
 * Revolut Ultra Platinum Style
 * - BlurView background
 * - Анимации Reanimated
 * - Haptic feedback
 * 
 * Использование:
 * <ActionSheet
 *   visible={showSheet}
 *   onClose={() => setShowSheet(false)}
 *   title="Выберите действие"
 *   actions={[
 *     { key: 'edit', title: 'Редактировать', icon: 'pencil' },
 *     { key: 'delete', title: 'Удалить', destructive: true },
 *   ]}
 *   onSelect={(key) => handleAction(key)}
 * />
 */

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
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
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// Types
// ============================================================================

export interface ActionSheetAction {
  /** Уникальный ключ */
  key: string;
  /** Заголовок */
  title: string;
  /** Подзаголовок */
  subtitle?: string;
  /** Иконка (Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Деструктивное действие */
  destructive?: boolean;
  /** Отключено */
  disabled?: boolean;
}

export interface ActionSheetProps {
  /** Видимость */
  visible: boolean;
  /** Callback закрытия */
  onClose: () => void;
  /** Заголовок */
  title?: string;
  /** Описание */
  message?: string;
  /** Действия */
  actions: ActionSheetAction[];
  /** Callback выбора */
  onSelect: (key: string) => void;
  /** Текст кнопки отмены */
  cancelText?: string;
  /** Показывать кнопку отмены */
  showCancel?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  actions,
  onSelect,
  cancelText = 'Отмена',
  showCancel = true,
}: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [visible]);

  const handleSelect = useCallback((action: ActionSheetAction) => {
    if (action.disabled) return;

    // Haptic
    if (Platform.OS === 'ios') {
      if (action.destructive) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      Haptics.selectionAsync();
    }

    // Scale animation
    scale.value = withSpring(0.98, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
      runOnJS(onSelect)(action.key);
      runOnJS(onClose)();
    });
  }, [onSelect, onClose, scale]);

  const handleCancel = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Sheet */}
        <Animated.View
          entering={SlideInDown.springify().damping(20).mass(0.8)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            containerAnimatedStyle,
            { paddingBottom: insets.bottom + 8 },
          ]}
        >
          {/* Actions Card */}
          <View style={styles.actionsCard}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 80 : 0}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            {(title || message) && (
              <View style={styles.header}>
                {title && <Text style={styles.title}>{title}</Text>}
                {message && <Text style={styles.message}>{message}</Text>}
              </View>
            )}

            {/* Actions */}
            {actions.map((action, index) => (
              <React.Fragment key={action.key}>
                {index > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  onPress={() => handleSelect(action)}
                  disabled={action.disabled}
                  style={[
                    styles.actionButton,
                    action.disabled && styles.actionDisabled,
                  ]}
                  activeOpacity={0.6}
                >
                  {action.icon && (
                    <Ionicons
                      name={action.icon}
                      size={22}
                      color={
                        action.destructive
                          ? '#FF6B6B'
                          : action.disabled
                          ? ultra.textMuted
                          : ultra.textPrimary
                      }
                      style={styles.actionIcon}
                    />
                  )}
                  <View style={styles.actionTextContainer}>
                    <Text
                      style={[
                        styles.actionTitle,
                        action.destructive && styles.actionDestructive,
                        action.disabled && styles.actionTextDisabled,
                      ]}
                    >
                      {action.title}
                    </Text>
                    {action.subtitle && (
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>

          {/* Cancel Button */}
          {showCancel && (
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 80 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ============================================================================
// Preset Action Sheets
// ============================================================================

/** Действия с объявлением */
export const ListingActions: ActionSheetAction[] = [
  { key: 'share', title: 'Поделиться', icon: 'share-outline' },
  { key: 'save', title: 'Добавить в избранное', icon: 'bookmark-outline' },
  { key: 'report', title: 'Пожаловаться', icon: 'flag-outline' },
  { key: 'hide', title: 'Скрыть похожие', icon: 'eye-off-outline' },
];

/** Действия с фото */
export const PhotoActions: ActionSheetAction[] = [
  { key: 'camera', title: 'Сделать фото', subtitle: 'Откроется камера', icon: 'camera-outline' },
  { key: 'gallery', title: 'Выбрать из галереи', icon: 'images-outline' },
  { key: 'remove', title: 'Удалить фото', icon: 'trash-outline', destructive: true },
];

/** Действия удаления */
export const DeleteActions: ActionSheetAction[] = [
  { key: 'delete', title: 'Удалить', icon: 'trash-outline', destructive: true },
];

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 8,
    gap: 8,
  },
  actionsCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: ultra.card,
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: ultra.textSecondary,
    textAlign: 'center',
  },
  message: {
    fontSize: 12,
    color: ultra.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: ultra.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    marginRight: 14,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    color: ultra.textPrimary,
    fontWeight: '400',
  },
  actionDestructive: {
    color: '#FF6B6B',
  },
  actionTextDisabled: {
    color: ultra.textMuted,
  },
  actionSubtitle: {
    fontSize: 13,
    color: ultra.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: ultra.card,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: ultra.accent,
  },
});

export default ActionSheet;

