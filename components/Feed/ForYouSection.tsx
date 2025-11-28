// components/Feed/ForYouSection.tsx — Секция "Для вас" с персонализированными рекомендациями
// Показывает объявления на основе поведения пользователя

import { CategoryType, formatPrice } from '@/config/filterConfig';
import { useUserBehavior } from '@/hooks/useUserBehavior';
import { ultra } from '@/lib/theme/ultra';
import { RecommendedListing } from '@/services/userBehavior';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { IMAGE_TRANSITION, getBlurhashByCategory } from '@/constants/blurhash';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LegendList } from '@legendapp/list';
import { FadeIn, ScalePress, Shimmer, Glow } from '@/components/animations/PremiumAnimations';
import { spacing, fontSize, borderRadius, shadows } from '@/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface ForYouSectionProps {
  category?: CategoryType;
  title?: string;
  limit?: number;
  excludeIds?: string[];
  onSeeAll?: () => void;
}

/**
 * Секция "Для вас" с персонализированными рекомендациями
 *
 * Показывает объявления, которые могут понравиться пользователю,
 * основываясь на его предыдущих действиях (просмотры, лайки, избранное и т.д.)
 */
export const ForYouSection = React.memo<ForYouSectionProps>(({
  category,
  title = 'Для вас',
  limit = 10,
  excludeIds = [],
  onSeeAll,
}) => {
  const router = useRouter();
  const behavior = useUserBehavior();

  const [recommendations, setRecommendations] = useState<RecommendedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Загружаем рекомендации
  useEffect(() => {
    if (!behavior.isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(false);
        const recs = await behavior.getRecommendations(category, limit, excludeIds);
        setRecommendations(recs);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [behavior.isAuthenticated, behavior.userId, category, limit]);

  const handleCardPress = useCallback((listing: any) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Трекаем просмотр
    const cat = (listing.category || 'car') as CategoryType;
    behavior.trackView(listing.id, cat, {
      brand: listing.brand || listing.details?.brand,
      price: listing.price,
      city: listing.city,
      source: 'recommendations',
    });

    router.push({
      pathname: '/car/[id]',
      params: { id: listing.id },
    });
  }, [router, behavior]);

  const handleSeeAll = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSeeAll?.();
  }, [onSeeAll]);

  // ♻️ LegendList renderItem — оптимизированный рендеринг + FadeIn анимация
  const renderRecommendation = useCallback(({ item, index }: { item: RecommendedListing; index: number }) => (
    <FadeIn delay={index * 80} duration={400}>
      <RecommendationCard
        recommendation={item}
        onPress={() => handleCardPress(item.listing)}
        isFirst={index === 0}
        isLast={index === recommendations.length - 1}
      />
    </FadeIn>
  ), [handleCardPress, recommendations.length]);

  // Не показываем для неавторизованных пользователей
  if (!behavior.isAuthenticated) {
    return null;
  }

  // Не показываем при загрузке или ошибке (или если нет рекомендаций)
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="sparkles" size={20} color={ultra.accent} />
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        <View style={styles.scrollContent}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.card}>
              <Shimmer width={CARD_WIDTH} height={CARD_WIDTH} borderRadius={16} />
              <View style={styles.info}>
                <Shimmer width={CARD_WIDTH * 0.7} height={14} borderRadius={4} />
                <Shimmer width={CARD_WIDTH * 0.5} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                <Shimmer width={CARD_WIDTH * 0.6} height={16} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="sparkles" size={20} color={ultra.accent} />
          <Text style={styles.title}>{title}</Text>
        </View>
        {onSeeAll && (
          <ScalePress scale={0.95}>
            <Pressable onPress={handleSeeAll}>
              <Text style={styles.seeAllText}>Все →</Text>
            </Pressable>
          </ScalePress>
        )}
      </View>

      {/* Horizontal Scroll — ♻️ Оптимизировано с LegendList */}
      <LegendList
        data={recommendations}
        renderItem={renderRecommendation}
        keyExtractor={(item) => item.listing.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
        recycleItems={true}  // ♻️ Переиспользование элементов
        drawDistance={SCREEN_WIDTH * 2}  // 🎯 Render window для горизонтального скролла
      />
    </View>
  );
});

ForYouSection.displayName = 'ForYouSection';

// ============ Карточка рекомендации ============
interface RecommendationCardProps {
  recommendation: RecommendedListing;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const RecommendationCard = React.memo<RecommendationCardProps>(({
  recommendation,
  onPress,
  isFirst,
  isLast,
}) => {
  const { listing, score, reason } = recommendation;

  const getTitle = () => {
    const cat = listing.category;
    if (cat === 'car') {
      return `${listing.brand || ''} ${listing.model || ''}`.trim() || listing.title || 'Авто';
    }
    if (cat === 'horse') {
      return listing.breed || listing.title || 'Лошадь';
    }
    if (cat === 'real_estate') {
      return listing.property_type || listing.title || 'Недвижимость';
    }
    return listing.title || 'Объявление';
  };

  const getSubtitle = () => {
    const cat = listing.category;
    const parts: string[] = [];

    if (cat === 'car' && listing.year) {
      parts.push(String(listing.year));
    }
    if (listing.city) {
      parts.push(listing.city);
    }

    return parts.join(' • ');
  };

  return (
    <ScalePress scale={0.97}>
      <Pressable
        style={[
          styles.card,
          isFirst && styles.cardFirst,
          isLast && styles.cardLast,
        ]}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: listing.thumbnail_url || listing.video_url }}
            placeholder={{ blurhash: getBlurhashByCategory(listing.category) }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={IMAGE_TRANSITION.FAST}
          />

          {/* Score Badge с Glow эффектом */}
          {score > 70 && (
            <Glow intensity={0.6} color="#FF3B30">
              <View style={styles.scoreBadge}>
                <Ionicons name="heart" size={10} color="#FFF" />
                <Text style={styles.scoreText}>{score}%</Text>
              </View>
            </Glow>
          )}

          {/* AI Badge с Glow эффектом */}
          {listing.ai_score && listing.ai_score > 0.8 && (
            <Glow intensity={0.5} color="#34C759">
              <View style={styles.aiBadge}>
                <Text style={styles.aiText}>AI ✓</Text>
              </View>
            </Glow>
          )}
        </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {getTitle()}
        </Text>

        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {getSubtitle()}
        </Text>

        <Text style={styles.cardPrice}>
          {formatPrice(listing.price)} сом
        </Text>

        {/* Reason */}
        <View style={styles.reasonContainer}>
          <Ionicons name="bulb-outline" size={12} color={ultra.textMuted} />
          <Text style={styles.reasonText} numberOfLines={1}>
            {reason}
          </Text>
        </View>
      </View>
    </Pressable>
    </ScalePress>
  );
});

RecommendationCard.displayName = 'RecommendationCard';

// ============ Styles ============
const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  seeAllText: {
    fontSize: fontSize.md,
    color: ultra.accent,
    fontWeight: '600',
  },
  loadingContainer: {
    height: CARD_HEIGHT,
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
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...shadows.md,
  },
  cardFirst: {
    marginLeft: 0,
  },
  cardLast: {
    marginRight: spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: ultra.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scoreBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  scoreText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#FFF',
  },
  aiBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  aiText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#FFF',
  },
  info: {
    padding: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: ultra.textSecondary,
    marginBottom: spacing.xs,
  },
  cardPrice: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: ultra.accentSecondary,
    marginBottom: spacing.sm,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reasonText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: ultra.textMuted,
  },
});

export default ForYouSection;
