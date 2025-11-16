// Компонент выбора тарифа

import { getTierBadge, getTierFeatures } from '@/lib/business/tier-features';
import { BusinessTier } from '@/types/business';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TierSelectorProps {
  currentTier?: BusinessTier;
  onSelectTier: (tier: BusinessTier) => void;
}

export default function TierSelector({
  currentTier = 'free',
  onSelectTier,
}: TierSelectorProps) {
  const tiers: BusinessTier[] = ['lite', 'business', 'pro'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tiers.map((tier) => (
        <TierCard
          key={tier}
          tier={tier}
          isCurrent={tier === currentTier}
          onSelect={() => onSelectTier(tier)}
        />
      ))}
    </ScrollView>
  );
}

interface TierCardProps {
  tier: BusinessTier;
  isCurrent: boolean;
  onSelect: () => void;
}

function TierCard({ tier, isCurrent, onSelect }: TierCardProps) {
  const config = getTierFeatures(tier);
  const badge = getTierBadge(tier);

  const isPopular = tier === 'business';
  const isPro = tier === 'pro';

  return (
    <TouchableOpacity
      style={[styles.card, isCurrent && styles.cardCurrent]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>🔥 ПОПУЛЯРНЫЙ</Text>
        </View>
      )}

      {isPro && (
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proGradient}
        />
      )}

      <View style={styles.cardHeader}>
        <View style={styles.tierBadge}>
          <Text style={styles.tierEmoji}>{badge.emoji}</Text>
        </View>
        <Text style={styles.tierName}>{config.name}</Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>{config.price}</Text>
        <Text style={styles.currency}>сом/мес</Text>
      </View>

      <View style={styles.featuresContainer}>
        {config.features.slice(0, 5).map((feature, index) => (
          <View key={index} style={styles.feature}>
            <Ionicons name="checkmark" size={16} color="#10B981" />
            <Text style={styles.featureText} numberOfLines={2}>
              {feature}
            </Text>
          </View>
        ))}
        {config.features.length > 5 && (
          <Text style={styles.moreFeatures}>
            +{config.features.length - 5} еще
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.selectButton,
          isCurrent && styles.selectButtonCurrent,
          isPro && styles.selectButtonPro,
        ]}
        onPress={onSelect}
      >
        <Text
          style={[
            styles.selectButtonText,
            isCurrent && styles.selectButtonTextCurrent,
          ]}
        >
          {isCurrent ? 'Текущий' : 'Выбрать'}
        </Text>
      </TouchableOpacity>

      {isCurrent && (
        <View style={styles.currentIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  card: {
    width: 280,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#2C2C2E',
    position: 'relative',
    overflow: 'hidden',
  },
  cardCurrent: {
    borderColor: '#10B981',
    backgroundColor: '#1C1C1E',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  proGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tierBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierEmoji: {
    fontSize: 32,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currency: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  moreFeatures: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  selectButton: {
    height: 48,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonCurrent: {
    backgroundColor: '#10B981',
  },
  selectButtonPro: {
    backgroundColor: '#8B5CF6',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectButtonTextCurrent: {
    color: '#FFFFFF',
  },
  currentIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
  },
});

