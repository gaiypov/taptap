import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/lib/theme';
import { OptimizedVideoPlayer } from './OptimizedVideoPlayer';
import { apiVideo } from '@/services/apiVideo';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/constants';
import { LikeAnimation } from '@/components/animations/LikeAnimation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleMuteVideo } from '@/lib/store/slices/videoSlice';
import { auth } from '@/services/auth';
import { appLogger } from '@/utils/logger';
import type { Listing } from '@/types';

interface EnhancedVideoCardProps {
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
    details?: any;
    location?: string;
    city?: string;
  };
  isActive: boolean;
  isPreloaded: boolean;
  onLike: () => void;
  onFavorite: () => void;
  onComment: () => void;
  onShare: () => void;
}

// Утилита для получения видео URL
function getVideoUrl(listing: EnhancedVideoCardProps['listing']): string {
  if (listing.video_id && listing.video_id.trim() !== '') {
    try {
      const hlsUrl = apiVideo.getHLSUrl(listing.video_id);
      if (hlsUrl && hlsUrl.trim() !== '') {
        appLogger.debug('[EnhancedVideoCard] Using HLS URL', {
          listingId: listing.id,
          videoId: listing.video_id,
        });
        return hlsUrl;
      }
    } catch (error) {
      appLogger.warn('[EnhancedVideoCard] Error getting HLS URL', {
        listingId: listing.id,
        videoId: listing.video_id,
        error,
      });
    }
  }
  const videoUrl = listing.video_url || (listing as any).videoUrl || '';
  if (videoUrl && videoUrl.trim() !== '') {
    appLogger.debug('[EnhancedVideoCard] Using video_url', {
      listingId: listing.id,
      hasVideoUrl: true,
    });
    return videoUrl;
  }
  
  appLogger.warn('[EnhancedVideoCard] No video URL found', {
    listingId: listing.id,
    hasVideoId: !!listing.video_id,
    hasVideoUrl: !!listing.video_url,
  });
  
  return '';
}

// Утилита для получения превью
function getThumbnailUrl(listing: EnhancedVideoCardProps['listing']): string | undefined {
  if (listing.thumbnail_url) {
    return listing.thumbnail_url;
  }
  if (listing.video_id) {
    return apiVideo.getThumbnailUrl(listing.video_id);
  }
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
  const theme = useAppTheme();
  const dispatch = useAppDispatch();
  const mutedVideoIds = useAppSelector((state) => state.video.mutedVideoIds);
  const isMuted = mutedVideoIds.includes(listing.id);
  
  // Состояние для анимации лайка
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const lastTapRef = useRef<number>(0);

  const videoUrl = useMemo(() => getVideoUrl(listing), [listing]);
  const thumbnailUrl = useMemo(() => getThumbnailUrl(listing), [listing]);
  
  // Определяем категорию для анимации
  const categoryForAnimation = useMemo(() => {
    const category = String(listing.category || '').toLowerCase();
    if (category === 'car' || category === 'cars') return 'car';
    if (category === 'horse' || category === 'horses') return 'horse';
    if (category === 'real_estate') return 'real_estate';
    return 'car'; // fallback
  }, [listing.category]);

  // Форматирование информации
  const additionalInfo = useMemo(() => {
    const details = listing.details || {};
    const category = String(listing.category || '').toLowerCase();
    
    if (category === 'car' || category === 'cars') {
      if (details.brand && details.model) {
        return `${details.brand} ${details.model}${details.year ? ` ${details.year}` : ''}`;
      }
      if (details.make && details.model) {
        return `${details.make} ${details.model}${details.year ? ` ${details.year}` : ''}`;
      }
    }
    
    if (category === 'horse' || category === 'horses') {
      if (details.breed) {
        return `${details.breed}${details.age_years || details.age ? `, ${details.age_years || details.age} лет` : ''}`;
      }
    }
    
    if (category === 'real_estate') {
      if (details.property_type) {
        return `${details.property_type}${details.area_m2 || details.area ? `, ${details.area_m2 || details.area}м²` : ''}`;
      }
    }
    
    return listing.title || 'Объявление';
  }, [listing]);

  const priceValue = useMemo(() => Number(listing.price ?? 0), [listing.price]);

  // Обработка лайка через кнопку
  // ВАЖНО: Определяем ПЕРЕД handleDoubleTap и handleLongPress, которые его используют
  const handleLikePress = useCallback(() => {
    const wasLiked = listing.is_liked;
    const willBeLiked = !wasLiked;
    
    // Показываем анимацию только при лайке (не при анлайке)
    if (willBeLiked) {
      setShowLikeAnimation(true);
      setAnimationKey(prev => prev + 1);
    }
    
    onLike();
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [listing.is_liked, onLike]);

  // Обработка обычного тапа (для паузы/воспроизведения, если нужно)
  const handleSingleTap = useCallback(() => {
    // Пока не используем - можно добавить паузу/play в будущем
    // Можно также использовать для других действий
  }, []);

  // Обработка двойного тапа для лайка
  // ВАЖНО: Определяем ПОСЛЕ handleLikePress
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Двойной тап - лайкаем
      lastTapRef.current = 0;
      handleLikePress();
    } else {
      lastTapRef.current = now;
      // Задержка для определения одиночного тапа
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          handleSingleTap();
          lastTapRef.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [handleLikePress, handleSingleTap]);
  
  // Обработка длительного нажатия (альтернативный способ лайка)
  // ВАЖНО: Определяем ПОСЛЕ handleLikePress
  const handleLongPress = useCallback(() => {
    handleLikePress();
  }, [handleLikePress]);

  // Обработка завершения анимации
  const handleAnimationFinish = useCallback(() => {
    setShowLikeAnimation(false);
  }, []);

  // Обработка переключения звука
  const handleToggleMute = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dispatch(toggleMuteVideo(listing.id));
  }, [listing.id, dispatch]);

  // Обработка отправки сообщения продавцу
  const handleMessageSeller = useCallback(async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Проверяем авторизацию
    try {
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        // Если не авторизован, редиректим на экран авторизации
        router.push('/(auth)/intro');
        return;
      }

      // Если авторизован, открываем чат с продавцом
      if (listing.seller?.id) {
        // Создаем или открываем существующий чат
        router.push(`/chat/${listing.seller.id}?listingId=${listing.id}`);
      } else {
        Alert.alert('Ошибка', 'Информация о продавце недоступна');
      }
    } catch (error) {
      console.error('Message seller error:', error);
      router.push('/(auth)/intro');
    }
  }, [listing.seller, listing.id, router]);

  return (
    <View style={styles.videoCard} collapsable={false}>
      {/* Оптимизированный видеоплеер с обработкой двойного тапа и длительного нажатия */}
      <TouchableWithoutFeedback
        onPress={handleDoubleTap}
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
        <View style={styles.videoPressable}>
          <OptimizedVideoPlayer
            listing={listing}
            isActive={isActive}
            isPreloaded={isPreloaded}
            videoUrl={videoUrl}
            thumbnailUrl={thumbnailUrl}
            autoPlay={true}
            onLoad={() => {
              appLogger.debug('[EnhancedVideoCard] Video loaded', { listingId: listing.id });
            }}
            onError={(error) => {
              appLogger.error('[EnhancedVideoCard] Video error', {
                error,
                listingId: listing.id,
                videoUrl: videoUrl?.substring(0, 50) + '...',
              });
            }}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Анимация лайка */}
      {showLikeAnimation && (
        <LikeAnimation
          key={animationKey}
          category={categoryForAnimation}
          onFinish={handleAnimationFinish}
        />
      )}

      {/* Затемнение снизу с информацией */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        style={styles.overlay}
      >
        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: '#FFFFFF' }]} numberOfLines={2}>
            {additionalInfo}
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: '#FFFFFF' }]}>
              {Number.isFinite(priceValue) ? priceValue.toLocaleString('ru-RU') : '—'} сом
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={[styles.location, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              <Ionicons name="location" size={14} color="rgba(255, 255, 255, 0.9)" />{' '}
              {listing.location || listing.city || 'Не указано'}
            </Text>
            {(() => {
              const details = listing.details || {};
              const mileage = details.mileage_km || details.mileage;
              if (mileage) {
                return (
                  <>
                    <Text style={[styles.separator, { color: 'rgba(255, 255, 255, 0.7)' }]}> • </Text>
                    <Text style={[styles.mileage, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                      {Number(mileage).toLocaleString('ru-RU')} км
                    </Text>
                  </>
                );
              }
              return null;
            })()}
          </View>

          {listing.seller && (
            <TouchableOpacity 
              style={styles.sellerRow}
              onPress={() => listing.seller && router.push(`/profile/${listing.seller.id}`)}
            >
              <View style={styles.sellerAvatarContainer}>
                {listing.seller.avatar_url ? (
                  <Image 
                    source={{ uri: listing.seller.avatar_url }} 
                    style={styles.sellerAvatarImage}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.sellerAvatarFallback, { backgroundColor: theme.primary }]}>
                    <Text style={styles.sellerAvatarText}>
                      {listing.seller.name?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.sellerName, { color: '#FFFFFF' }]}>
                {listing.seller?.name || 'Пользователь'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Правая панель действий */}
      <View 
        style={styles.actionsPanel}
        collapsable={false}
      >
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          <View 
            style={[
              styles.actionIconContainer, 
              { 
                backgroundColor: listing.is_liked ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 255, 255, 0.25)',
                borderWidth: 1.5,
                borderColor: listing.is_liked ? 'rgba(255, 59, 48, 0.5)' : 'rgba(255, 255, 255, 0.4)',
              }
            ]}
          >
            <Ionicons 
              name={listing.is_liked ? 'heart' : 'heart-outline'} 
              size={Platform.select({ ios: 36, android: 32, web: 36 })} 
              color={listing.is_liked ? '#FF3B30' : '#FFFFFF'} 
            />
          </View>
          <Text style={[styles.actionCount, { color: '#FFFFFF' }]}>
            {listing.likes_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onComment();
          }}
          activeOpacity={0.7}
        >
          <View 
            style={[
              styles.actionIconContainer, 
              { 
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }
            ]}
          >
            <Ionicons 
              name="chatbubble-outline" 
              size={Platform.select({ ios: 32, android: 30, web: 32 })} 
              color="#FFFFFF" 
            />
          </View>
          <Text style={[styles.actionCount, { color: '#FFFFFF' }]}>
            {listing.comments_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onShare();
          }}
          activeOpacity={0.7}
        >
          <View 
            style={[
              styles.actionIconContainer, 
              { 
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }
            ]}
          >
            <Ionicons 
              name="share-outline" 
              size={Platform.select({ ios: 32, android: 30, web: 32 })} 
              color="#FFFFFF" 
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onFavorite();
          }}
          activeOpacity={0.7}
        >
          <View 
            style={[
              styles.actionIconContainer, 
              { 
                backgroundColor: listing.is_favorited ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 255, 255, 0.25)',
                borderWidth: 1.5,
                borderColor: listing.is_favorited ? 'rgba(255, 59, 48, 0.5)' : 'rgba(255, 255, 255, 0.4)',
              }
            ]}
          >
            <Ionicons 
              name={listing.is_favorited ? 'bookmark' : 'bookmark-outline'} 
              size={Platform.select({ ios: 32, android: 30, web: 32 })} 
              color={listing.is_favorited ? '#FF3B30' : '#FFFFFF'} 
            />
          </View>
        </TouchableOpacity>

        {/* Написать продавцу */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleMessageSeller}
          activeOpacity={0.7}
        >
          <View 
            style={[
              styles.actionIconContainer, 
              { 
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }
            ]}
          >
            <Ionicons 
              name="mail-outline" 
              size={Platform.select({ ios: 32, android: 30, web: 32 })} 
              color="#FFFFFF" 
            />
          </View>
        </TouchableOpacity>

        {/* Без звука */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleToggleMute}
          activeOpacity={0.7}
        >
          <View 
            style={[
              styles.actionIconContainer, 
              { 
                backgroundColor: isMuted ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 255, 255, 0.25)',
                borderWidth: 1.5,
                borderColor: isMuted ? 'rgba(255, 59, 48, 0.5)' : 'rgba(255, 255, 255, 0.4)',
              }
            ]}
          >
            <Ionicons 
              name={isMuted ? 'volume-mute' : 'volume-high'} 
              size={Platform.select({ ios: 32, android: 30, web: 32 })} 
              color={isMuted ? '#FF3B30' : '#FFFFFF'} 
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Оптимизированная функция сравнения
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPreloaded === nextProps.isPreloaded &&
    prevProps.listing.is_liked === nextProps.listing.is_liked &&
    prevProps.listing.is_favorited === nextProps.listing.is_favorited &&
    prevProps.listing.likes_count === nextProps.listing.likes_count &&
    prevProps.listing.comments_count === nextProps.listing.comments_count
  );
});

EnhancedVideoCard.displayName = 'EnhancedVideoCard';

const styles = StyleSheet.create({
  videoCard: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPressable: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.select({ ios: 100, android: 80, web: 100 }),
    paddingHorizontal: 16,
    paddingTop: 40,
    zIndex: 10,
  },
  infoContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceRow: {
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  location: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  mileage: {
    fontSize: 14,
    fontWeight: '500',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sellerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerAvatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsPanel: {
    position: 'absolute',
    right: 16,
    bottom: Platform.select({ ios: 140, android: 120, web: 140 }),
    alignItems: 'center',
    zIndex: 99999, // Максимальный zIndex для гарантированной видимости
    elevation: Platform.select({ android: 20 }), // Для Android
    pointerEvents: 'auto', // Гарантируем что кнопки кликабельны
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionIconContainer: {
    width: Platform.select({ ios: 56, android: 52, web: 56 }),
    height: Platform.select({ ios: 56, android: 52, web: 56 }),
    borderRadius: Platform.select({ ios: 28, android: 26, web: 28 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

