// components/Feed/SimilarListings.tsx — Секция "Похожие объявления"
// Показывает похожие объявления на странице деталей

import { CategoryType, formatPrice } from '@/config/filterConfig';
import { useUserBehavior } from '@/hooks/useUserBehavior';
import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { BLURHASH, IMAGE_TRANSITION, getBlurhashByCategory } from '@/constants/blurhash';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LegendList } from '@legendapp/list';
import { FadeIn, ScalePress, Shimmer } from '@/components/animations/PremiumAnimations';
import { spacing, fontSize, borderRadius } from '@/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.38;

interface SimilarListingsProps {
  listingId: string;
  category?: CategoryType;
  limit?: number;
}

/**
 * Секция "Похожие объявления"
 *
 * Показывает объявления, похожие на текущее
 */
export const SimilarListings = React.memo<SimilarListingsProps>(({
  listingId,
  category,
  limit = 6,
}) => {
  const router = useRouter();
  const behavior = useUserBehavior();

  const [similarListings, setSimilarListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSimilar = async () => {
      try {
        setLoading(true);
        const similar = await behavior.getSimilarListings(listingId, limit);
        setSimilarListings(similar);
      } catch (e) {
        setSimilarListings([]);
      } finally {
        setLoading(false);
      }
    };

    loadSimilar();
  }, [listingId, limit]);

  const handleCardPress = useCallback((listing: any) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Трекаем просмотр
    const cat = (listing.category || category || 'car') as CategoryType;
    behavior.trackView(listing.id, cat, {
      brand: listing.brand || listing.details?.brand,
      price: listing.price,
      city: listing.city,
      source: 'similar',
    });

    router.push({
      pathname: '/car/[id]',
      params: { id: listing.id },
    });
  }, [router, behavior, category]);

  // ♻️ LegendList renderItem — оптимизированный рендеринг + FadeIn анимация
  const renderSimilarCard = useCallback(({ item, index }: { item: any; index: number }) => (
    <FadeIn delay={index * 80} duration={400}>
      <SimilarCard
        listing={item}
        onPress={() => handleCardPress(item)}
      />
    </FadeIn>
  ), [handleCardPress]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Похожие объявления</Text>
        <View style={styles.scrollContent}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.card}>
              <Shimmer width={CARD_WIDTH} height={CARD_WIDTH} borderRadius={12} />
              <View style={styles.info}>
                <Shimmer width={CARD_WIDTH * 0.7} height={13} borderRadius={4} />
                <Shimmer width={CARD_WIDTH * 0.5} height={14} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (similarListings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Похожие объявления</Text>

      {/* ♻️ Оптимизировано с LegendList */}
      <LegendList
        data={similarListings}
        renderItem={renderSimilarCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        recycleItems={true}  // ♻️ Переиспользование элементов
        drawDistance={SCREEN_WIDTH * 2}  // 🎯 Render window для горизонтального скролла
      />
    </View>
  );
});

SimilarListings.displayName = 'SimilarListings';

// ============ Карточка похожего ============
interface SimilarCardProps {
  listing: any;
  onPress: () => void;
}

const SimilarCard = React.memo<SimilarCardProps>(({ listing, onPress }) => {
  const getTitle = () => {
    if (listing.brand) {
      return `${listing.brand} ${listing.model || ''}`.trim();
    }
    return listing.title || 'Объявление';
  };

  return (
    <ScalePress scale={0.97}>
      <Pressable
        style={styles.card}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
      >
        <Image
          source={{ uri: listing.thumbnail_url || listing.video_url }}
          placeholder={{ blurhash: getBlurhashByCategory(listing.category) }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={IMAGE_TRANSITION.FAST}
        />
        <View style={styles.info}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {getTitle()}
          </Text>
          <Text style={styles.cardPrice}>
            {formatPrice(listing.price)} сом
          </Text>
        </View>
      </Pressable>
    </ScalePress>
  );
});

SimilarCard.displayName = 'SimilarCard';

// ============ Styles ============
const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: ultra.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: ultra.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: ultra.surface,
  },
  info: {
    padding: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: ultra.textPrimary,
    marginBottom: spacing.xs,
  },
  cardPrice: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: ultra.accentSecondary,
  },
});

export default SimilarListings;
