// Значок BOOST на карточке автомобиля

import type { BoostType } from '@/types/boost';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BoostBadgeProps {
  type: BoostType;
}

const BOOST_CONFIG = {
  basic: {
    emoji: '⭐',
    label: 'Выделено',
    colors: ['#FFA500', '#FF8C00'],
  },
  top: {
    emoji: '🔥',
    label: 'ТОП',
    colors: ['#FF3B30', '#FF0000'],
  },
  premium: {
    emoji: '💎',
    label: 'ПРЕМИУМ',
    colors: ['#FFD700', '#FFA500'],
  },
};

export default function BoostBadge({ type }: BoostBadgeProps) {
  const config = BOOST_CONFIG[type];

  if (!config) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={config.colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.emoji}>{config.emoji}</Text>
        <Text style={styles.label}>{config.label}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emoji: {
    fontSize: 14,
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
