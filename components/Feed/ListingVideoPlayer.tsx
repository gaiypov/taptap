// components/Feed/ListingVideoPlayer.tsx
// Использует единый helper normalizeVideoUrl для безопасной нормализации VideoSource

import type { Listing } from '@/types';
import { isCarListing, isHorseListing } from '@/types';
import { normalizeVideoUrl, isRealVideo } from '@/lib/video/videoSource';
import { VideoView, useVideoPlayer } from '@expo/video';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { appLogger } from '@/utils/logger';

import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/constants';

interface ListingVideoPlayerProps {
  listing: Listing;
  isActive: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
}

export default function ListingVideoPlayer({
  listing,
  isActive,
  onLike,
  onSave,
  onShare,
}: ListingVideoPlayerProps) {
  // КРИТИЧНО: Нормализуем videoUrl ПЕРЕД использованием
  const primaryUrl = listing.video_url;
  const finalUrl = useMemo(() => {
    const normalized = normalizeVideoUrl(primaryUrl);
    
    // DEBUG лог для поиска источника Optional
    if (__DEV__) {
      appLogger.debug('DEBUG videoUrl source', {
        original: primaryUrl,
        normalized: normalized,
        component: 'ListingVideoPlayer',
        listingId: listing.id,
      });
    }
    
    return normalized;
  }, [primaryUrl, listing.id]);

  // Проверяем, является ли это реальным видео (не placeholder)
  const hasRealVideo = useMemo(() => {
    return isRealVideo(finalUrl);
  }, [finalUrl]);

  // Create player source - ALWAYS use { uri: string } format for both iOS and Android
  const playerSource = useMemo(() => {
    if (!finalUrl || finalUrl.length === 0) return null;
    return { uri: finalUrl };
  }, [finalUrl]);

  const player = useVideoPlayer(playerSource as any);

  // Настраиваем плеер после создания (только если есть реальное видео)
  React.useEffect(() => {
    if (!player || !hasRealVideo) return;
    
    try {
    // @ts-expect-error - loop может существовать в рантайме
    player.loop = true;
    // @ts-expect-error - muted может существовать в рантайме
    player.muted = true;
    } catch (error) {
      appLogger.warn('[ListingVideoPlayer] Player config error', { error, listingId: listing.id });
    }
  }, [player, hasRealVideo, listing.id]);

  React.useEffect(() => {
    if (!player || !hasRealVideo) return;
    
    try {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
    } catch (error) {
      appLogger.warn('[ListingVideoPlayer] Playback error', { error, listingId: listing.id });
    }
    
    return () => {
      try {
        if (player && hasRealVideo) {
          player.pause();
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [isActive, player, hasRealVideo]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  // Если нет реального видео — показываем placeholder
  if (!hasRealVideo) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="videocam-off" size={80} color="#666" />
        <Text style={styles.placeholderText}>Видео недоступно</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        contentPosition={{ dx: 0, dy: 0 }}
        nativeControls={false}
        allowsFullscreen={false}
        showsTimecodes={false}
        requiresLinearPlayback={false}
      />

      {/* Overlay для проданных */}
      {/* Status field doesn't exist in schema - removed */}

      {/* Информация о листинге */}
      <View style={styles.infoContainer}>
        {/* Основная информация */}
        <View style={styles.mainInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {listing.title}
          </Text>

          {isCarListing(listing) && (
            <>
              <Text style={styles.subtitle}>
                {listing.details?.brand || 'Авто'} {listing.details?.model || ''} • {listing.details?.year || 'N/A'}
              </Text>
              <Text style={styles.details}>
                {listing.details?.mileage ? listing.details.mileage.toLocaleString() : '0'} км • {listing.details?.transmission || 'Не указано'}
              </Text>
            </>
          )}

          {isHorseListing(listing) && (
            <>
              <Text style={styles.subtitle}>
                {listing.details?.breed || 'Лошадь'} • {listing.details?.age || 'N/A'} лет
              </Text>
              <Text style={styles.details}>
                {listing.details?.color || 'Не указан'} • {listing.details?.height || 'N/A'} см
              </Text>
            </>
          )}

          <Text style={styles.price}>
            {formatPrice(listing.price)} ₽
          </Text>

          {listing.city && (
            <Text style={styles.location}>📍 {listing.city}</Text>
          )}

          {/* AI Score */}
          {listing.ai_score && (
            <View style={styles.aiScoreContainer}>
              <Text style={styles.aiScore}>
                🤖 AI оценка: {(listing.ai_score * 100).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>

        {/* Информация о продавце */}
        {listing.seller && (
          <View style={styles.sellerInfo}>
            {listing.seller.avatar_url ? (
              <Image
                source={{ uri: listing.seller.avatar_url }}
                style={styles.sellerAvatar}
              />
            ) : (
              <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                <Text style={styles.sellerAvatarText}>
                  {(listing.seller.name ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{listing.seller.name ?? 'Продавец'}</Text>
                {listing.seller.is_verified && (
                  <Text style={styles.verifiedBadge}>✓</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Боковые действия */}
      <View style={styles.actions}>
        {/* Like */}
        <TouchableOpacity style={styles.actionButton} onPress={() => onLike(listing.id)}>
          <Text style={styles.actionIcon}>
            ❤️
          </Text>
          <Text style={styles.actionText}>
            {formatNumber(listing.likes || 0)}
          </Text>
        </TouchableOpacity>

        {/* Comments */}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>
            {formatNumber(listing.comments_count ?? 0)}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton} onPress={() => onShare(listing.id)}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>
            {formatNumber(listing.shares || 0)}
          </Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.actionButton} onPress={() => onSave(listing.id)}>
          <Text style={styles.actionIcon}>🔖</Text>
          <Text style={styles.actionText}>
            {formatNumber(listing.saves || 0)}
          </Text>
        </TouchableOpacity>

        {/* Sound/Mute */}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔇</Text>
        </TouchableOpacity>

        {/* Views */}
        <View style={styles.actionButton}>
          <Text style={styles.actionIcon}>👁️</Text>
          <Text style={styles.actionText}>
            {formatNumber(listing.views || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  soldBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    transform: [{ rotate: '-15deg' }],
  },
  soldText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80,
    padding: 20,
    paddingBottom: 100,
  },
  mainInfo: {
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  details: {
    color: '#E5E5EA',
    fontSize: 14,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  price: {
    color: '#30D158',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  location: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  aiScoreContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  aiScore: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: '600',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  verifiedBadge: {
    color: '#30D158',
    fontSize: 16,
  },
  actions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: {
    width: '100%',
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    marginTop: 16,
    fontSize: 18,
  },
});
