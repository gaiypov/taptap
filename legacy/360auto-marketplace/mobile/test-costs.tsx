// app/test-costs.tsx
import CostLoggerTest from '@/components/CostLoggerTest';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function TestCostsScreen() {
  return (
    <View style={styles.container}>
      <CostLoggerTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
