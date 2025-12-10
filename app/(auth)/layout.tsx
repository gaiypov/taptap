import { Slot } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Layout для группы auth экранов
 * Использует Slot для рендеринга дочерних экранов (как в Expo Router)
 */
export default function AuthLayout() {
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

