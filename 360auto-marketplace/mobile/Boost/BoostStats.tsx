// Статистика эффективности BOOST

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BoostStatsProps {
  carId: string;
  viewsBefore: number;
  viewsCurrent: number;
  hoursRemaining: number;
}

export default function BoostStats({
  viewsBefore,
  viewsCurrent,
  hoursRemaining,
}: BoostStatsProps) {
  const multiplier = viewsBefore > 0 ? (viewsCurrent / viewsBefore).toFixed(1) : '0.0';

  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{viewsBefore}</Text>
        <Text style={styles.statLabel}>До BOOST</Text>
      </View>

      <View style={styles.arrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>

      <View style={styles.statItem}>
        <Text style={[styles.statValue, styles.currentValue]}>{viewsCurrent}</Text>
        <Text style={styles.statLabel}>Сейчас</Text>
      </View>

      <View style={styles.statItem}>
        <Text style={[styles.statValue, styles.multiplierValue]}>×{multiplier}</Text>
        <Text style={styles.statLabel}>Прирост</Text>
      </View>

      <View style={styles.statItem}>
        <Text style={styles.statValue}>{Math.floor(hoursRemaining)}ч</Text>
        <Text style={styles.statLabel}>Осталось</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  currentValue: {
    color: '#4CAF50',
  },
  multiplierValue: {
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  arrow: {
    marginHorizontal: 8,
  },
  arrowText: {
    fontSize: 20,
    color: '#999',
  },
});
