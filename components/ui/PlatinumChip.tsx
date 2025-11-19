// components/ui/PlatinumChip.tsx
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { theme } from '@/lib/theme';

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[styles.text, selected && styles.textSelected, textStyle]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: theme.chip.height,
    paddingHorizontal: theme.chip.paddingHorizontal,
    borderRadius: theme.chip.radius,
    borderWidth: 1,
    borderColor: theme.chipBorder,
    backgroundColor: theme.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: theme.chipBgActive,
    borderColor: theme.borderStrong,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  textSelected: {
    color: theme.textPrimary,
  },
});

