// Значок бизнес-аккаунта для профиля

import { getTierBadge } from '@/lib/business/tier-features';
import { BusinessTier } from '@/types/business';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BusinessBadgeProps {
  tier: BusinessTier;
  isVerified?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function BusinessBadge({
  tier,
  isVerified = false,
  size = 'medium',
  showLabel = true,
}: BusinessBadgeProps) {
  // FREE пользователи не показывают badge
  if (tier === 'free') {
    return null;
  }

  const badge = getTierBadge(tier);

  const sizes = {
    small: { container: 24, icon: 16, text: 10 },
    medium: { container: 32, icon: 20, text: 12 },
    large: { container: 40, icon: 24, text: 14 },
  };

  const s = sizes[size];

  const isPro = tier === 'pro';

  if (isPro) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.proGradient,
            { width: s.container, height: s.container, borderRadius: s.container / 2 },
          ]}
        >
          {isVerified ? (
            <Ionicons name="shield-checkmark" size={s.icon} color="#FFFFFF" />
          ) : (
            <Text style={{ fontSize: s.icon }}>{badge.emoji}</Text>
          )}
        </LinearGradient>
        {showLabel && (
          <Text style={[styles.label, { fontSize: s.text }]}>{badge.label}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          { backgroundColor: badge.color, width: s.container, height: s.container, borderRadius: s.container / 2 },
        ]}
      >
        <Text style={{ fontSize: s.icon }}>{badge.emoji}</Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontSize: s.text }]}>{badge.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  proGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});

