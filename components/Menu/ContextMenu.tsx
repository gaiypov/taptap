/**
 * ContextMenu - Нативное контекстное меню с Zeego
 * 
 * Revolut Ultra Platinum Style
 * - iOS: UIMenu (нативное меню)
 * - Android: ContextMenu
 * - Долгое нажатие активирует меню
 * 
 * Использование:
 * <ContextMenu
 *   items={[
 *     { key: 'edit', title: 'Редактировать', icon: 'pencil' },
 *     { key: 'delete', title: 'Удалить', icon: 'trash', destructive: true },
 *   ]}
 *   onSelect={(key) => console.log(key)}
 * >
 *   <ListingCard />
 * </ContextMenu>
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as ContextMenuZeego from 'zeego/context-menu';

// ============================================================================
// Types
// ============================================================================

export interface ContextMenuItem {
  /** Уникальный ключ элемента */
  key: string;
  /** Заголовок */
  title: string;
  /** Иконка (Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Системная SF Symbol иконка (iOS) */
  iosIcon?: string;
  /** Деструктивное действие (красный цвет) */
  destructive?: boolean;
  /** Отключено */
  disabled?: boolean;
  /** Подменю */
  submenu?: ContextMenuItem[];
}

export interface ContextMenuProps {
  /** Дочерние элементы (триггер) */
  children: React.ReactNode;
  /** Элементы меню */
  items: ContextMenuItem[];
  /** Callback при выборе */
  onSelect: (key: string) => void;
  /** Отключить меню */
  disabled?: boolean;
  /** Callback при открытии */
  onOpen?: () => void;
  /** Callback при закрытии */
  onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ContextMenu({
  children,
  items,
  onSelect,
  disabled,
  onOpen,
  onClose,
}: ContextMenuProps) {
  const handleSelect = useCallback((key: string) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.selectionAsync();
    }
    
    onSelect(key);
  }, [onSelect]);

  const handleOpen = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onOpen?.();
  }, [onOpen]);

  const renderItem = (item: ContextMenuItem) => {
    // Submenu
    if (item.submenu && item.submenu.length > 0) {
      return (
        <ContextMenuZeego.Sub key={item.key}>
          <ContextMenuZeego.SubTrigger
            key={`${item.key}-trigger`}
            disabled={item.disabled}
          >
            <ContextMenuZeego.ItemTitle>{item.title}</ContextMenuZeego.ItemTitle>
            {item.iosIcon && (
              <ContextMenuZeego.ItemIcon
                ios={{ name: item.iosIcon as any }}
              />
            )}
          </ContextMenuZeego.SubTrigger>
          <ContextMenuZeego.SubContent>
            {item.submenu.map(renderItem)}
          </ContextMenuZeego.SubContent>
        </ContextMenuZeego.Sub>
      );
    }

    // Regular item
    return (
      <ContextMenuZeego.Item
        key={item.key}
        onSelect={() => handleSelect(item.key)}
        disabled={item.disabled}
        destructive={item.destructive}
      >
        <ContextMenuZeego.ItemTitle>{item.title}</ContextMenuZeego.ItemTitle>
        {item.iosIcon && (
          <ContextMenuZeego.ItemIcon
            ios={{ name: item.iosIcon as any }}
          />
        )}
      </ContextMenuZeego.Item>
    );
  };

  if (disabled) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <ContextMenuZeego.Root onOpenChange={(open) => open ? handleOpen() : onClose?.()}>
      <ContextMenuZeego.Trigger style={styles.trigger}>
        {children}
      </ContextMenuZeego.Trigger>
      
      <ContextMenuZeego.Content>
        {items.map(renderItem)}
      </ContextMenuZeego.Content>
    </ContextMenuZeego.Root>
  );
}

// ============================================================================
// Preset Menus
// ============================================================================

/** Контекстное меню для объявления */
export const ListingContextMenuItems: ContextMenuItem[] = [
  { key: 'share', title: 'Поделиться', iosIcon: 'square.and.arrow.up' },
  { key: 'save', title: 'Сохранить', iosIcon: 'bookmark' },
  { key: 'report', title: 'Пожаловаться', iosIcon: 'exclamationmark.triangle' },
  { key: 'hide', title: 'Скрыть', iosIcon: 'eye.slash' },
];

/** Контекстное меню для своего объявления */
export const MyListingContextMenuItems: ContextMenuItem[] = [
  { key: 'edit', title: 'Редактировать', iosIcon: 'pencil' },
  { key: 'share', title: 'Поделиться', iosIcon: 'square.and.arrow.up' },
  { key: 'stats', title: 'Статистика', iosIcon: 'chart.bar' },
  { key: 'boost', title: 'Продвинуть', iosIcon: 'flame' },
  { key: 'delete', title: 'Удалить', iosIcon: 'trash', destructive: true },
];

/** Контекстное меню для сообщения */
export const MessageContextMenuItems: ContextMenuItem[] = [
  { key: 'copy', title: 'Копировать', iosIcon: 'doc.on.doc' },
  { key: 'reply', title: 'Ответить', iosIcon: 'arrowshape.turn.up.left' },
  { key: 'forward', title: 'Переслать', iosIcon: 'arrowshape.turn.up.right' },
  { key: 'delete', title: 'Удалить', iosIcon: 'trash', destructive: true },
];

/** Контекстное меню для комментария */
export const CommentContextMenuItems: ContextMenuItem[] = [
  { key: 'copy', title: 'Копировать', iosIcon: 'doc.on.doc' },
  { key: 'reply', title: 'Ответить', iosIcon: 'arrowshape.turn.up.left' },
  { key: 'report', title: 'Пожаловаться', iosIcon: 'exclamationmark.triangle' },
];

/** Контекстное меню для своего комментария */
export const MyCommentContextMenuItems: ContextMenuItem[] = [
  { key: 'copy', title: 'Копировать', iosIcon: 'doc.on.doc' },
  { key: 'edit', title: 'Редактировать', iosIcon: 'pencil' },
  { key: 'delete', title: 'Удалить', iosIcon: 'trash', destructive: true },
];

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  trigger: {
    flex: 1,
  },
});

export default ContextMenu;

