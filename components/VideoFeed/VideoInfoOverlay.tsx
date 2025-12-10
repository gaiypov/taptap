// components/VideoFeed/VideoInfoOverlay.tsx
// Информация о объявлении поверх видео — цена, название, локация

import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { SIZES } from '@/lib/constants/sizes';
import { ultra } from '@/lib/theme/ultra';
import { Icons } from '@/components/icons/CustomIcons';
import type { Listing } from '@/types';

// ==============================================
// TYPES
// ==============================================

interface VideoInfoOverlayProps {
  listing: Listing & {
    category?: string;
    details?: Record<string, any>;
    location?: string;
    city?: string;
    seller?: {
      id: string;
      name?: string;
      avatar_url?: string;
    };
  };
  honestyScore?: number; // 0-100
  honestyGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
  onSellerPress?: () => void;
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)} млн`;
  }
  if (price >= 1000) {
    return `${Math.round(price / 1000)} тыс`;
  }
  return price.toString();
}

function getGradeColor(grade?: string): string {
  switch (grade) {
    case 'A': return '#22C55E'; // Green
    case 'B': return '#84CC16'; // Lime
    case 'C': return '#EAB308'; // Yellow
    case 'D': return '#F97316'; // Orange
    case 'F': return '#EF4444'; // Red
    default: return ultra.textMuted;
  }
}

function getCategoryIcon(category?: string): React.FC<{ size?: number; color?: string }> {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('car')) return Icons.Car;
  if (cat.includes('horse')) return Icons.Horse;
  if (cat.includes('real_estate')) return Icons.House;
  return Icons.Car;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({
  listing,
  honestyScore,
  honestyGrade,
  onSellerPress,
}) => {
  const router = useRouter();
  const scale = useSharedValue(1);

  // Format data
  const priceFormatted = useMemo(() => {
    const price = Number(listing.price ?? 0);
    return price > 0 ? `${formatPrice(price)} сом` : 'Цена по запросу';
  }, [listing.price]);

  const titleText = useMemo(() => {
    const d = listing.details || {};
    const cat = String(listing.category || '').toLowerCase();

    if (cat.includes('car') && (d.brand || d.make)) {
      return `${d.brand || d.make} ${d.model || ''}`.trim();
    }
    if (cat.includes('horse') && d.breed) {
      return String(d.breed);
    }
    if (cat.includes('real_estate') && d.property_type) {
      return `${d.property_type}${d.rooms ? `, ${d.rooms} комн.` : ''}`;
    }
    return listing.title || 'Объявление';
  }, [listing]);

  const subtitleText = useMemo(() => {
    const d = listing.details || {};
    const cat = String(listing.category || '').toLowerCase();

    if (cat.includes('car')) {
      const parts = [];
      if (d.year) parts.push(`${d.year} г.`);
      if (d.mileage) parts.push(`${Math.round(Number(d.mileage) / 1000)}т км`);
      if (d.engine_volume) parts.push(`${d.engine_volume}л`);
      return parts.join(' • ');
    }
    if (cat.includes('horse')) {
      const parts = [];
      if (d.age_years) parts.push(`${d.age_years} лет`);
      if (d.gender) parts.push(String(d.gender));
      return parts.join(' • ');
    }
    if (cat.includes('real_estate')) {
      const parts = [];
      if (d.area_m2) parts.push(`${d.area_m2} м²`);
      if (d.floor && d.total_floors) parts.push(`${d.floor}/${d.total_floors} эт.`);
      return parts.join(' • ');
    }
    return '';
  }, [listing]);

  const location = listing.city || listing.location || 'Бишкек';
  const CategoryIcon = getCategoryIcon(listing.category);
  const gradeColor = getGradeColor(honestyGrade);

  // Navigate to details
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/listing/${listing.id}`);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} entering={FadeIn.delay(200)}>
      {/* VisionOS Glass Panel - стеклянная полупрозрачная панель */}
      <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
        <View style={styles.glassBorder} />
        <Pressable 
          onPress={handlePress}
          onPressIn={() => { scale.value = withSpring(0.98); }}
          onPressOut={() => { scale.value = withSpring(1); }}
        >
          <View style={styles.content}>
          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{priceFormatted}</Text>
            
            {/* Honesty Grade Badge */}
            {honestyGrade && (
              <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}>
                <Text style={styles.gradeText}>{honestyGrade}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            <CategoryIcon size={16} color={ultra.textPrimary} />
            <Text style={styles.title} numberOfLines={2}>
              {titleText}
            </Text>
          </View>

          {/* Subtitle (specs) */}
          {subtitleText ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitleText}
            </Text>
          ) : null}

          {/* Location */}
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>

          {/* Seller (optional) */}
          {listing.seller?.name && (
            <Pressable 
              style={styles.sellerRow}
              onPress={onSellerPress}
            >
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {listing.seller.name[0]?.toUpperCase() || 'П'}
                </Text>
              </View>
              <Text style={styles.sellerName} numberOfLines={1}>
                {listing.seller.name}
              </Text>
            </Pressable>
          )}
          </View>
        </Pressable>
      </BlurView>
    </Animated.View>
  );
};

// ==============================================
// STYLES
// ==============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: SIZES.actionPanel.containerSize + SIZES.actionPanel.rightOffset + 16,
    bottom: SIZES.videoInfo.bottomOffset,
    paddingLeft: SIZES.videoInfo.leftOffset,
    paddingRight: SIZES.videoInfo.leftOffset,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(229, 228, 226, 0.15)', // Тонкая платиновая граница
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(229, 228, 226, 0.2)',
  },
  content: {
    gap: SIZES.videoInfo.gap,
    padding: Platform.select({ ios: 16, android: 14, default: 16 }),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: SIZES.videoInfo.priceFontSize,
    fontWeight: '700',
    color: ultra.textPrimary,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: SIZES.videoInfo.titleFontSize,
    fontWeight: '600',
    color: ultra.textPrimary,
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  subtitle: {
    fontSize: SIZES.videoInfo.locationFontSize,
    color: ultra.textSecondary,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  location: {
    fontSize: SIZES.videoInfo.locationFontSize,
    color: ultra.textSecondary,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    fontSize: 10,
    color: ultra.textPrimary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  sellerName: {
    fontSize: 13,
    color: ultra.textPrimary,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});

export default VideoInfoOverlay;

