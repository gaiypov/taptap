// components/ui/PlatinumButton.tsx
import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { theme } from '@/lib/theme';

interface PlatinumButtonProps extends PressableProps {
  title: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PlatinumButton: React.FC<PlatinumButtonProps> = ({
  title,
  fullWidth = true,
  style,
  textStyle,
  ...rest
}) => {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, textStyle]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.primaryButtonBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    backgroundColor: theme.primaryButtonBgPressed,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.primaryButtonText,
  },
});

