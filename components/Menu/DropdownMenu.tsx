/**
 * DropdownMenu - Нативное выпадающее меню с Zeego
 * 
 * Revolut Ultra Platinum Style
 * - iOS: UIMenu (нативное меню)
 * - Android: PopupMenu
 * - Нажатие активирует меню
 * 
 * Использование:
 * <DropdownMenu
 *   items={[
 *     { key: 'newest', title: 'Сначала новые' },
 *     { key: 'cheapest', title: 'Сначала дешевые' },
 *   ]}
 *   onSelect={(key) => setSortBy(key)}
 * >
 *   <SortButton />
 * </DropdownMenu>
 */

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DropdownMenuZeego from 'zeego/dropdown-menu';

// ============================================================================
// Types
// ============================================================================

export interface DropdownMenuItem {
  /** Уникальный ключ элемента */
  key: string;
  /** Заголовок */
  title: string;
  /** SF Symbol иконка (iOS) */
  iosIcon?: string;
  /** Деструктивное действие */
  destructive?: boolean;
  /** Отключено */
  disabled?: boolean;
  /** Является ли элемент выбранным (чекбокс) */
  checked?: boolean;
  /** Подменю */
  submenu?: DropdownMenuItem[];
}

export interface DropdownMenuGroup {
  /** Заголовок группы */
  title?: string;
  /** Элементы группы */
  items: DropdownMenuItem[];
}

export interface DropdownMenuProps {
  /** Дочерние элементы (триггер) - если не указаны, используется defaultTrigger */
  children?: React.ReactNode;
  /** Элементы меню (плоский список или группы) */
  items?: DropdownMenuItem[];
  /** Группы элементов */
  groups?: DropdownMenuGroup[];
  /** Callback при выборе */
  onSelect: (key: string) => void;
  /** Текущий выбранный ключ */
  selectedKey?: string;
  /** Отключить меню */
  disabled?: boolean;
  /** Заголовок для дефолтного триггера */
  triggerTitle?: string;
  /** Иконка для дефолтного триггера */
  triggerIcon?: keyof typeof Ionicons.glyphMap;
}

// ============================================================================
// Component
// ============================================================================

export function DropdownMenu({
  children,
  items,
  groups,
  onSelect,
  selectedKey,
  disabled,
  triggerTitle,
  triggerIcon = 'chevron-down',
}: DropdownMenuProps) {
  const handleSelect = useCallback((key: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.selectionAsync();
    }
    
    onSelect(key);
  }, [onSelect]);

  const renderItem = (item: DropdownMenuItem, isSelected: boolean) => {
    // Submenu
    if (item.submenu && item.submenu.length > 0) {
      return (
        <DropdownMenuZeego.Sub key={item.key}>
          <DropdownMenuZeego.SubTrigger
            key={`${item.key}-trigger`}
            disabled={item.disabled}
          >
            <DropdownMenuZeego.ItemTitle>{item.title}</DropdownMenuZeego.ItemTitle>
            {item.iosIcon && (
              <DropdownMenuZeego.ItemIcon
                ios={{ name: item.iosIcon as any }}
              />
            )}
          </DropdownMenuZeego.SubTrigger>
          <DropdownMenuZeego.SubContent>
            {item.submenu.map((subItem) => renderItem(subItem, selectedKey === subItem.key))}
          </DropdownMenuZeego.SubContent>
        </DropdownMenuZeego.Sub>
      );
    }

    // Checkable item
    if (item.checked !== undefined || isSelected) {
      return (
        <DropdownMenuZeego.CheckboxItem
          key={item.key}
          value={item.checked ?? isSelected ? 'on' : 'off'}
          onValueChange={() => handleSelect(item.key)}
          disabled={item.disabled}
        >
          <DropdownMenuZeego.ItemIndicator />
          <DropdownMenuZeego.ItemTitle>{item.title}</DropdownMenuZeego.ItemTitle>
          {item.iosIcon && (
            <DropdownMenuZeego.ItemIcon
              ios={{ name: item.iosIcon as any }}
            />
          )}
        </DropdownMenuZeego.CheckboxItem>
      );
    }

    // Regular item
    return (
      <DropdownMenuZeego.Item
        key={item.key}
        onSelect={() => handleSelect(item.key)}
        disabled={item.disabled}
        destructive={item.destructive}
      >
        <DropdownMenuZeego.ItemTitle>{item.title}</DropdownMenuZeego.ItemTitle>
        {item.iosIcon && (
          <DropdownMenuZeego.ItemIcon
            ios={{ name: item.iosIcon as any }}
          />
        )}
      </DropdownMenuZeego.Item>
    );
  };

  // Render groups or flat items
  const renderContent = () => {
    if (groups && groups.length > 0) {
      return groups.map((group, index) => (
        <DropdownMenuZeego.Group key={`group-${index}`}>
          {group.title && (
            <DropdownMenuZeego.Label>{group.title}</DropdownMenuZeego.Label>
          )}
          {group.items.map((item) => renderItem(item, selectedKey === item.key))}
        </DropdownMenuZeego.Group>
      ));
    }

    if (items && items.length > 0) {
      return items.map((item) => renderItem(item, selectedKey === item.key));
    }

    return null;
  };

  // Default trigger
  const defaultTrigger = (
    <TouchableOpacity 
      style={[styles.defaultTrigger, disabled && styles.triggerDisabled]}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.triggerText}>
        {triggerTitle || 'Выбрать'}
      </Text>
      <Ionicons 
        name={triggerIcon} 
        size={16} 
        color={ultra.textSecondary} 
      />
    </TouchableOpacity>
  );

  if (disabled) {
    return <View>{children || defaultTrigger}</View>;
  }

  return (
    <DropdownMenuZeego.Root>
      <DropdownMenuZeego.Trigger>
        {children || defaultTrigger}
      </DropdownMenuZeego.Trigger>
      
      <DropdownMenuZeego.Content>
        {renderContent()}
      </DropdownMenuZeego.Content>
    </DropdownMenuZeego.Root>
  );
}

// ============================================================================
// Preset Menus
// ============================================================================

/** Сортировка объявлений */
export const SortMenuItems: DropdownMenuItem[] = [
  { key: 'newest', title: 'Сначала новые', iosIcon: 'clock' },
  { key: 'oldest', title: 'Сначала старые', iosIcon: 'clock.arrow.circlepath' },
  { key: 'cheapest', title: 'Сначала дешёвые', iosIcon: 'arrow.down' },
  { key: 'expensive', title: 'Сначала дорогие', iosIcon: 'arrow.up' },
  { key: 'popular', title: 'По популярности', iosIcon: 'flame' },
];

/** Категории */
export const CategoryMenuItems: DropdownMenuItem[] = [
  { key: 'all', title: 'Все категории', iosIcon: 'square.grid.2x2' },
  { key: 'car', title: 'Автомобили', iosIcon: 'car' },
  { key: 'horse', title: 'Лошади', iosIcon: 'hare' },
];

/** Фильтр по времени */
export const TimeFilterItems: DropdownMenuItem[] = [
  { key: 'all', title: 'За всё время' },
  { key: 'day', title: 'За день' },
  { key: 'week', title: 'За неделю' },
  { key: 'month', title: 'За месяц' },
];

/** Действия профиля */
export const ProfileMenuItems: DropdownMenuItem[] = [
  { key: 'edit', title: 'Редактировать профиль', iosIcon: 'pencil' },
  { key: 'settings', title: 'Настройки', iosIcon: 'gear' },
  { key: 'help', title: 'Помощь', iosIcon: 'questionmark.circle' },
  { key: 'logout', title: 'Выйти', iosIcon: 'rectangle.portrait.and.arrow.right', destructive: true },
];

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  defaultTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: ultra.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ultra.border,
    gap: 6,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    fontSize: 14,
    color: ultra.textPrimary,
    fontWeight: '500',
  },
});

export default DropdownMenu;

