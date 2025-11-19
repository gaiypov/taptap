// components/ui/GlassField.tsx
import React from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { theme } from '@/lib/theme';

interface GlassFieldProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
}

export const GlassField: React.FC<GlassFieldProps> = ({
  label,
  containerStyle,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.wrapper,
          focused && styles.wrapperFocused,
        ]}
      >
        <TextInput
          placeholderTextColor={theme.textPlaceholder}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...(theme.typography?.label || {}),
    marginBottom: 6,
  },
  wrapper: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBg,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: 'center',
  },
  wrapperFocused: {
    borderColor: theme.inputBorderActive,
    backgroundColor: theme.surfaceGlassStrong,
  },
  input: {
    fontSize: 16,
    color: theme.textPrimary,
  },
});

