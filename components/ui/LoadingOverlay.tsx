// components/ui/LoadingOverlay.tsx
// Компонент для отображения загрузки поверх контента (оптимизированный)

import { useAppTheme, darkTheme } from '@/lib/theme';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingOverlayProps {
  message?: string;
  backgroundColor?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = React.memo(({
  message,
  backgroundColor,
}) => {
  const theme = useAppTheme();
  
  const finalBackgroundColor = useMemo(() => {
    if (backgroundColor) return backgroundColor;
    return theme.background === darkTheme.background
      ? 'rgba(0,0,0,0.85)'
      : 'rgba(255,255,255,0.85)';
  }, [backgroundColor, theme.background]);
  
  const messageStyle = useMemo(
    () => [styles.message, { color: theme.text }],
    [theme.text]
  );
  
  return (
    <View style={[styles.overlay, { backgroundColor: finalBackgroundColor }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      {message && <Text style={messageStyle}>{message}</Text>}
    </View>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

