// components/listings/EnhancedVideoCard.tsx

import { LikeAnimation } from '@/components/animations/LikeAnimation';
import { ultra } from '@/lib/theme/ultra';
import { apiVideo } from '@/services/apiVideo';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/constants';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { EngineVideoPlayer } from './EngineVideoPlayer';
import { RightActionPanel } from './RightActionPanel';
import { VideoInfoOverlay } from './VideoInfoOverlay';

// ВОТ ЭТО САМОЕ ГЛАВНОЕ — ПРАВИЛЬНЫЕ ХУКИ!
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleMuteVideo } from '@/lib/store/slices/videoSlice';

import type { Listing } from '@/types';
import { requireAuth } from '@/utils/permissionManager';

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
  index: number; // Feed index - REQUIRED for VideoEngine360V4
  isActive: boolean;
  isPreloaded: boolean;
  isFeedFocused: boolean; // Feed screen is in focus (tab)
  onLike: () => void;
  onFavorite: () => void;
  onComment: () => void;
  onShare: () => void;
}

// Утилиты - получаем RAW URL (без нормализации, useVideoEngine сделает это)
function getVideoUrl(listing: EnhancedVideoCardProps['listing']): string | null {
  // Пытаемся получить HLS URL из video_id
  if (listing.video_id) {
    try {
      const hlsUrl = apiVideo.getHLSUrl(String(listing.video_id));
      // Возвращаем RAW URL - нормализация будет в useVideoEngine
      if (hlsUrl && !String(hlsUrl).includes('BigBuckBunny')) {
        return hlsUrl;
      }
    } catch {
      // Игнорируем ошибки получения HLS URL
    }
  }
  
  // Fallback на video_url
  if (listing.video_url) {
    const url = listing.video_url;
    if (url && !String(url).includes('BigBuckBunny')) {
      return url;
    }
  }
  
  return null;
}

function getThumbnailUrl(listing: EnhancedVideoCardProps['listing']): string | undefined {
  if (listing.thumbnail_url) return listing.thumbnail_url;
  if (listing.video_id) return apiVideo.getThumbnailUrl(listing.video_id);
  return undefined;
}

export const EnhancedVideoCard = React.memo<EnhancedVideoCardProps>(({
  listing,
  index,
  isActive,
  isPreloaded,
  isFeedFocused,
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

  // Получаем RAW URL (без нормализации - useVideoEngine сделает это)
  const rawVideoUrl = useMemo(() => {
    return getVideoUrl(listing);
  }, [listing]);

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
    if (!requireAuth('like')) return;
    
    // Показываем анимацию при каждом лайке (когда переключаем на лайкнутое)
    if (!listing.is_liked) {
      setShowLikeAnimation(true);
      setAnimationKey(k => k + 1);
    }
    
    const { triggerHaptic } = require('@/utils/listingActions');
    triggerHaptic('medium');
    onLike();
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
    if (!requireAuth('message')) return;
    
    const { triggerHaptic, openChat, getCurrentUserSafe } = await import('@/utils/listingActions');
    triggerHaptic('medium');

    try {
      const user = await getCurrentUserSafe();
      if (!user || !listing.seller?.id) return;
      
      const conversationId = await openChat(user.id, listing.seller.id, listing.id);
      if (conversationId) {
        router.push({
          pathname: '/chat/[conversationId]',
          params: { conversationId },
        });
      }
    } catch (error) {
      console.error('[EnhancedVideoCard] Message error:', error);
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
          {rawVideoUrl ? (
            <EngineVideoPlayer
              id={listing.id}
              index={index}
              rawUrl={rawVideoUrl}
              isVisible={isActive}
              isFeedFocused={isFeedFocused}
              posterUrl={thumbnailUrl}
              mutedByDefault={isMuted}
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

      {/* Right Action Panel — стеклянные кнопки VisionOS */}
      <RightActionPanel
        listingId={listing.id}
        isActive={isActive}
        isLiked={listing.is_liked ?? false}
        isFavorited={listing.is_favorited ?? false}
        isSaved={listing.is_saved ?? false}
        isMuted={isMuted}
        likeCount={listing.likes_count ?? 0}
        commentCount={listing.comments_count ?? 0}
        actions={{
          onLike: handleLikePress,
          onSave: onFavorite,
          onComment: onComment,
          onShare: onShare,
          onOpenChat: handleMessageSeller,
          onOpenDetails: () => {},
          onToggleMute: handleToggleMute,
        }}
      />

      {/* Video Info Overlay — стеклянная полупрозрачная панель внизу */}
      <VideoInfoOverlay listing={listing} />
    </View>
  );
},
(prev, next) => (
  prev.listing.id === next.listing.id &&
  prev.index === next.index &&
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
});
