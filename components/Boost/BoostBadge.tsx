// Значок BOOST на карточке автомобиля

import type { BoostType } from '@/types/boost';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface BoostBadgeProps {
  type: BoostType;
}

const BOOST_CONFIG: Record<string, { emoji: string; label: string; colors: string[] }> = {
  '3h': {
    emoji: '⚡',
    label: '3 часа',
    colors: ['#FFA500', '#FF8C00'],
  },
  '24h': {
    emoji: '🔥',
    label: '24 часа',
    colors: ['#FF3B30', '#FF0000'],
  },
  '7d': {
    emoji: '💎',
    label: '7 дней',
    colors: ['#FFD700', '#FFA500'],
  },
  '30d': {
    emoji: '👑',
    label: '30 дней',
    colors: ['#9370DB', '#8A2BE2'],
  },
  // Legacy support
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
  const config = BOOST_CONFIG[type] || BOOST_CONFIG['3h'];

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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }),
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
    ...Platform.select({
      web: {
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});
