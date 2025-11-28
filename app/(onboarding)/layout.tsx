import { Slot } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Layout для группы onboarding экранов
 * Использует Slot для рендеринга дочерних экранов
 */
export default function OnboardingLayout() {
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});