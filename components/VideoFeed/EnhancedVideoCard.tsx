// components/listings/EnhancedVideoCard.tsx

import { LikeAnimation } from '@/components/animations/LikeAnimation';
import { ultra } from '@/lib/theme/ultra';
import { apiVideo } from '@/services/apiVideo';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@/utils/constants';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { OptimizedVideoPlayer } from './OptimizedVideoPlayer';

// ВОТ ЭТО САМОЕ ГЛАВНОЕ — ПРАВИЛЬНЫЕ ХУКИ!
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleMuteVideo } from '@/lib/store/slices/videoSlice';

import { auth } from '@/services/auth';
import type { Listing } from '@/types';

export interface EnhancedVideoCardProps {
  listing: Listing & {
    category?: string;
    is_favorited?: boolean;
    is_saved?: boolean;
    is_liked?: boolean;
    likes_count?: number;
    comments_count?: number;
    video_id?: string;
    video_url?: string;
    thumbnail_url?: string;
    additional_images?: string[];
    media?: { url: string }[];
    details?: Record<string, unknown>;
    location?: string;
    city?: string;
    seller?: { id: string; name?: string; avatar_url?: string };
  };
  isActive: boolean;
  isPreloaded: boolean;
  onLike: () => void;
  onFavorite: () => void;
  onComment: () => void;
  onShare: () => void;
}

// Утилиты без изменений
function getVideoUrl(listing: EnhancedVideoCardProps['listing']): string {
  if (listing.video_id && listing.video_id.trim() !== '') {
    try {
      const hlsUrl = apiVideo.getHLSUrl(listing.video_id);
      if (hlsUrl && hlsUrl.trim() !== '') return hlsUrl;
    } catch {
      // Игнорируем ошибки получения HLS URL
    }
  }
  return listing.video_url || '';
}

function getThumbnailUrl(listing: EnhancedVideoCardProps['listing']): string | undefined {
  if (listing.thumbnail_url) return listing.thumbnail_url;
  if (listing.video_id) return apiVideo.getThumbnailUrl(listing.video_id);
  return undefined;
}

export const EnhancedVideoCard = React.memo<EnhancedVideoCardProps>(({
  listing,
  isActive,
  isPreloaded,
  onLike,
  onFavorite,
  onComment,
  onShare,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mutedVideoIds = useAppSelector(state => state.video.mutedVideoIds);
  const isMuted = mutedVideoIds.includes(listing.id);

  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const lastTapRef = useRef<number>(0);

  const videoUrl = useMemo(() => getVideoUrl(listing), [listing]);
  const thumbnailUrl = useMemo(() => getThumbnailUrl(listing), [listing]);

  const categoryForAnimation = useMemo(() => {
    const cat = String(listing.category || '').toLowerCase();
    if (cat.includes('car')) return 'car';
    if (cat.includes('horse')) return 'horse';
    if (cat.includes('real_estate')) return 'real_estate';
    return 'car';
  }, [listing.category]);

  const additionalInfo = useMemo(() => {
    const d = listing.details || {};
    const cat = String(listing.category || '').toLowerCase();

    if (cat.includes('car') && (d.brand || d.make)) {
      return `${d.brand || d.make} ${d.model || ''}${d.year ? ` ${d.year}` : ''}`.trim();
    }
    if (cat.includes('horse') && d.breed) {
      return `${d.breed}${d.age_years ? `, ${d.age_years} лет` : ''}`;
    }
    if (cat.includes('real_estate') && d.property_type) {
      return `${d.property_type}${d.area_m2 ? `, ${d.area_m2}м²` : ''}`;
    }
    return listing.title || 'Объявление';
  }, [listing]);

  const priceValue = Number(listing.price ?? 0);

  const handleLikePress = useCallback(() => {
    // Показываем анимацию при каждом лайке (когда переключаем на лайкнутое)
    if (!listing.is_liked) {
      setShowLikeAnimation(true);
      setAnimationKey(k => k + 1);
    }
    onLike();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [listing.is_liked, onLike]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleLikePress();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [handleLikePress]);

  const handleLongPress = useCallback(() => {
    handleLikePress();
  }, [handleLikePress]);

  const handleAnimationFinish = useCallback(() => {
    setShowLikeAnimation(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(toggleMuteVideo(listing.id));
  }, [listing.id, dispatch]);

  const handleMessageSeller = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        router.push('/(auth)/intro');
        return;
      }
      if (listing.seller?.id) {
        router.push(`/chat/${listing.seller.id}?listingId=${listing.id}`);
      }
    } catch {
      router.push('/(auth)/intro');
    }
  }, [listing.seller?.id, listing.id, router]);

  return (
    <View style={styles.videoCard}>
      {/* РАБОЧАЯ ВЕРСИЯ — ВИДЕО ИГРАЕТ, КНОПКИ РАБОТАЮТ, ЛАЙК ПО ДВОЙНОМУ ТАПУ — ВСЁ ЛЕТАЕТ */}
      <Pressable
        style={{ flex: 1 }}
        onPress={(e) => {
          // Безопасная проверка locationX (работает на iOS + Android)
          const x = e.nativeEvent?.locationX ?? e.nativeEvent?.pageX ?? 0;
          if (x > SCREEN_WIDTH * 0.7) return; // правая панель — не лайкаем
          handleDoubleTap();
        }}
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
        {/* УБРАЛ pointerEvents="box-none" — ЭТО БЫЛ УБИЙЦА! */}
        <View style={styles.videoContainer}>
          {videoUrl ? (
            <OptimizedVideoPlayer
              videoUrl={videoUrl}
              thumbnailUrl={thumbnailUrl}
              isActive={isActive}
              muted={isMuted}
              listingId={listing.id}
            />
          ) : (
            // Fallback — если видео нет, показываем превью
            <Image
              source={{ 
                uri: thumbnailUrl || 
                (listing.additional_images && listing.additional_images[0] ? listing.additional_images[0] : '') ||
                (listing.media && listing.media[0]?.url ? listing.media[0].url : '')
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          )}

          {/* Анимация лайка */}
          {showLikeAnimation && (
            <LikeAnimation
              key={animationKey}
              category={categoryForAnimation}
              onFinish={handleAnimationFinish}
            />
          )}
        </View>
      </Pressable>

      {/* Цена и инфа — матовая карточка слева внизу Revolut Ultra */}
      <View style={styles.infoCard}>
        <View style={styles.infoContent}>
          <Text style={styles.title}>{additionalInfo}</Text>
          <Text style={styles.price}>
            {priceValue ? priceValue.toLocaleString('ru-RU') : '—'} сом
          </Text>
          <Text style={styles.location}>
            <Ionicons name="location" size={Platform.select({ ios: 14, android: 13, default: 14 })} color={ultra.textSecondary} /> {listing.city || listing.location || 'Кыргызстан'}
          </Text>
        </View>
      </View>

      {/* Панель действий справа — TikTok 2025 стиль (44-48px, расстояние 20-22px) */}
      <View style={styles.actionsPanel} pointerEvents="box-none">
        <Pressable style={styles.actionButton} onPress={handleMessageSeller}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="mail-outline" size={Platform.select({ ios: 24, android: 26, default: 24 })} color={ultra.textPrimary} />
          </View>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onShare}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="share-outline" size={Platform.select({ ios: 24, android: 26, default: 24 })} color={ultra.textPrimary} />
          </View>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleLikePress}>
          <View style={[styles.actionIconContainer, styles.likeButton, listing.is_liked && styles.activeAction]}>
            <Ionicons name={listing.is_liked ? 'heart' : 'heart-outline'} size={Platform.select({ ios: 26, android: 26, default: 26 })} color={listing.is_liked ? ultra.accent : ultra.textPrimary} />
          </View>
          <Text style={styles.actionCount}>{listing.likes_count || 0}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onComment}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="chatbubble-outline" size={Platform.select({ ios: 24, android: 26, default: 24 })} color={ultra.textPrimary} />
          </View>
          <Text style={styles.actionCount}>{listing.comments_count || 0}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onFavorite}>
          <View style={[styles.actionIconContainer, listing.is_favorited && styles.activeAction]}>
            <Ionicons name={listing.is_favorited ? 'bookmark' : 'bookmark-outline'} size={Platform.select({ ios: 24, android: 26, default: 24 })} color={listing.is_favorited ? ultra.accent : ultra.textPrimary} />
          </View>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleToggleMute}>
          <View style={[styles.actionIconContainer, isMuted && styles.activeAction]}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={Platform.select({ ios: 24, android: 26, default: 24 })} color={isMuted ? ultra.accent : ultra.textPrimary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
},
(prev, next) => (
  prev.listing.id === next.listing.id &&
  prev.isActive === next.isActive &&
  prev.isPreloaded === next.isPreloaded &&
  prev.listing.is_liked === next.listing.is_liked &&
  prev.listing.is_favorited === next.listing.is_favorited &&
  prev.listing.likes_count === next.listing.likes_count &&
  prev.listing.comments_count === next.listing.comments_count
));

EnhancedVideoCard.displayName = 'EnhancedVideoCard';

const styles = StyleSheet.create({
  videoCard: { 
    width: SCREEN_WIDTH, 
    height: SCREEN_HEIGHT, 
    backgroundColor: ultra.background 
  },
  videoContainer: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  // Цена слева внизу — матовая карточка Revolut Ultra Platinum (скругление 24px)
  infoCard: {
    position: 'absolute',
    bottom: Platform.select({ ios: 140, android: 130, default: 140 }),
    left: Platform.select({ ios: 20, android: 16, default: 20 }),
    right: Platform.select({ ios: 120, android: 110, default: 120 }),
    borderRadius: 24, // Скругление 24px
    backgroundColor: ultra.card, // #171717 матовая карточка
    borderWidth: 1,
    borderColor: ultra.border, // #2A2A2A тонкая обводка
    // Никаких теней (TikTok стиль)
  },
  infoContent: { 
    padding: Platform.select({ ios: 20, android: 18, default: 20 }),
  },
  title: { 
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }), 
    fontWeight: '800', 
    color: ultra.textPrimary,
    marginBottom: Platform.select({ ios: 6, android: 4, default: 6 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  price: { 
    fontSize: Platform.select({ ios: 30, android: 32, default: 30 }), // 30-32pt
    fontWeight: '900', 
    color: ultra.accentSecondary, // #E0E0E0 светлое серебро
    marginTop: Platform.select({ ios: 4, android: 2, default: 4 }),
    textShadowColor: 'rgba(224, 224, 224, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12, // Лёгкое свечение
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
  location: { 
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }), 
    color: ultra.textSecondary, 
    marginTop: Platform.select({ ios: 8, android: 6, default: 8 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  // Панель действий справа — TikTok 2025 стиль (44-48px, расстояние 20-22px)
  actionsPanel: {
    position: 'absolute',
    right: Platform.select({ ios: 16, android: 14, default: 16 }),
    bottom: Platform.select({ ios: 160, android: 150, default: 160 }),
    alignItems: 'center',
    gap: Platform.select({ ios: 20, android: 22, default: 20 }), // Расстояние 20-22px
    zIndex: 10,
  },
  actionButton: { 
    alignItems: 'center' 
  },
  actionIconContainer: {
    width: Platform.select({ ios: 44, android: 48, default: 44 }), // 44-48px
    height: Platform.select({ ios: 44, android: 48, default: 44 }),
    borderRadius: Platform.select({ ios: 22, android: 24, default: 22 }),
    backgroundColor: ultra.card, // #171717 матовая
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ultra.border, // #2A2A2A тонкая белая обводка
    // Никаких теней и блюра (TikTok не использует)
  },
  likeButton: {
    width: Platform.select({ ios: 48, android: 48, default: 48 }), // Лайк 48px
    height: Platform.select({ ios: 48, android: 48, default: 48 }),
    borderRadius: Platform.select({ ios: 24, android: 24, default: 24 }),
  },
  activeAction: {
    backgroundColor: ultra.card,
    borderColor: ultra.accent, // #C0C0C0 серебро для активных
  },
  actionCount: { 
    marginTop: Platform.select({ ios: 6, android: 4, default: 6 }), 
    fontSize: Platform.select({ ios: 12, android: 11, default: 12 }), 
    fontWeight: '700', 
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
});
