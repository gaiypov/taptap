import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Shadows } from '../../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: [string, string, ...string[]];
}

export function Card({ 
  children, 
  style, 
  gradient = false, 
  gradientColors = [Colors.surface, Colors.surfaceSecondary] 
}: CardProps) {
  if (gradient) {
    return (
      <LinearGradient
        colors={gradientColors}
        style={[styles.card, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    ...Shadows.md,
  },
});