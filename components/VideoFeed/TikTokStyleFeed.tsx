// TikTok-style вертикальная лента видео для React Native
// OPTIMIZED: Added isFeedFocused tracking and extracted VideoItem

import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { formatPriceWithUSD } from '@/constants/currency';
import { getHLSUrl } from '@/services/apiVideo';
import { auth } from '@/services/auth';
import { db, interactions, listings } from '@/services/supabase';
import type { Car } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { appLogger } from '@/utils/logger';
import { EngineVideoPlayer } from '@/components/VideoFeed/EngineVideoPlayer';
import { getVideoEngine } from '@/lib/video/videoEngine';
import { ultra } from '@/lib/theme/ultra';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native';
import { LegendList, LegendListRef } from '@legendapp/list';

import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@/utils/constants';
import { requireAuth } from '@/utils/permissionManager';
import { toggleLike, openChat, triggerHaptic, getCurrentUserSafe } from '@/utils/listingActions';
import { ScalePress, Bounce } from '@/components/animations/PremiumAnimations';
import { CommentsBottomSheet } from '@/components/Comments/CommentsBottomSheet';

// Helper component for price display
function PriceDisplay({ price }: { price: number }) {
  const priceInfo = formatPriceWithUSD(price);
  return (
    <View>
      <Text style={styles.carPrice}>{priceInfo.kgs}</Text>
      <Text style={styles.carPriceUSD}>{priceInfo.usd}</Text>
    </View>
  );
}

interface VideoFeedProps {
  initialCarId?: string;
}

export default function TikTokStyleFeed({ initialCarId }: VideoFeedProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [isFeedFocused, setIsFeedFocused] = useState(true);

  // TikTok-style комментарии
  const [showComments, setShowComments] = useState(false);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);

  const flatListRef = useRef<LegendListRef>(null);
  const router = useRouter();
  const videoEngine = getVideoEngine();

  // Track feed focus state using useFocusEffect
  useFocusEffect(
    useCallback(() => {
      setIsFeedFocused(true);
      // Resume active video when feed gains focus
      if (currentIndex >= 0) {
        videoEngine.setActiveIndex(currentIndex);
      }
      return () => {
        setIsFeedFocused(false);
        // Pause all videos when feed loses focus
        videoEngine.pauseAll();
      };
    }, [currentIndex, videoEngine])
  );

  const loadCars = useCallback(async () => {
    try {
      setLoading(true);
      // Используем listings.getByCategory вместо db.getCars
      const { data, error } = await listings.getByCategory('car', 20);
      
      if (error) throw error;
      
      if (data) {
        // Фильтруем только авто с видео
        const carsWithVideos = (data as Car[]).filter((car: Car) => car.video_url || car.video_id);
        setCars(carsWithVideos);
        
        // Если есть initialCarId, находим его индекс
        if (initialCarId) {
          const index = carsWithVideos.findIndex((car: Car) => car.id === initialCarId);
          if (index !== -1) {
            setCurrentIndex(index);
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index, animated: false });
            }, 100);
          }
        }
      }
    } catch {
      // Silent error - will retry on next load
    } finally {
      setLoading(false);
    }
  }, [initialCarId]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  // Инициализируем видимость первого элемента после загрузки данных
  useEffect(() => {
    if (cars.length > 0 && visibleItems.size === 0) {
      const initialIndex = initialCarId 
        ? cars.findIndex(car => car.id === initialCarId)
        : 0;
      const validIndex = initialIndex >= 0 ? initialIndex : 0;
      setVisibleItems(new Set([validIndex]));
      setCurrentIndex(validIndex);
      videoEngine.setActiveIndex(validIndex);
    }
  }, [cars, initialCarId, videoEngine, visibleItems.size]);

  // Synchronize indices when feed data changes
  useEffect(() => {
    if (cars.length === 0) return;

    // Update all video indices in engine
    cars.forEach((car, index) => {
      videoEngine.updateVideoIndex(car.id, index);
    });
  }, [cars, videoEngine]);


  // Use a Set to prevent double-counting views
  const viewedCarsRef = useRef(new Set<string>());

  /**
   * Отследить просмотр (debounced/unique)
   */
  const trackView = useCallback(async (carId: string) => {
    // Track view only once per video
    if (viewedCarsRef.current.has(carId)) return;
    viewedCarsRef.current.add(carId);

    try {
      // Получаем текущее объявление и увеличиваем views
      const { data: listing } = await listings.get(carId);
      if (listing) {
        const currentViews = (listing as any).views || 0;
        await listings.update(carId, { views: currentViews + 1 });
        
        // Обновляем локальное состояние
        setCars(prevCars =>
          prevCars.map(car =>
            car.id === carId ? { ...car, views: (car.views || 0) + 1 } : car
          )
        );
      }
    } catch (error) {
      appLogger.error('Error tracking view', { error });
    }
  }, []);


  /**
   * Обработчик изменения видимых элементов
   * Обновляет видимость для каждого элемента и устанавливает активный индекс
   */
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;

      const nextVisible = new Set<number>();

      viewableItems.forEach((vi) => {
        if (typeof vi.index === 'number' && vi.isViewable) {
          nextVisible.add(vi.index);
        }

        // Track view only once per video
        const car = vi.item as Car | undefined;
        if (car && !viewedCarsRef.current.has(car.id)) {
          viewedCarsRef.current.add(car.id);
          trackView(car.id);
        }
      });

      setVisibleItems(nextVisible);

      // Set active index for engine (first visible item)
      const firstVisibleIndex = [...nextVisible][0];
      if (typeof firstVisibleIndex === 'number') {
        setCurrentIndex(firstVisibleIndex);
        videoEngine.setActiveIndex(firstVisibleIndex);
      }
    },
    [videoEngine, trackView]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // 50% видно для более точного определения
    minimumViewTime: 100, // Минимум 100мс для стабильности
  }).current;


  /**
   * Лайк автомобиля
   */
  const handleLike = async (car: Car) => {
    if (!requireAuth('like')) return;
    
    triggerHaptic('medium');
    
    try {
      const user = await getCurrentUserSafe();
      if (!user) return;

      const isLiked = car.isLiked || false;
      const currentLikes = car.likes || 0;

      // Optimistic update
      setCars(prevCars =>
        prevCars.map(c =>
          c.id === car.id
            ? { ...c, likes: isLiked ? Math.max(currentLikes - 1, 0) : currentLikes + 1, isLiked: !isLiked }
            : c
        )
      );

      // Backend call
      const result = await toggleLike(user.id, car.id, isLiked, currentLikes);
      
      // Update with result
      setCars(prevCars =>
        prevCars.map(c =>
          c.id === car.id
            ? { ...c, likes: result.likesCount, isLiked: result.isLiked }
            : c
        )
      );
    } catch (error) {
      // Revert on error
      setCars(prevCars =>
        prevCars.map(c =>
          c.id === car.id
            ? { ...c, likes: car.likes, isLiked: car.isLiked }
            : c
        )
      );
      appLogger.error('[TikTokStyleFeed] Like error', { error });
    }
  };

  /**
   * Поделиться
   */
  const handleShare = async (car: Car) => {
    // TODO: Implement native share
  };

  /**
   * Открыть чат
   */
  const handleChat = async (car: Car) => {
    if (!requireAuth('message')) return;

    triggerHaptic('medium');

    try {
      const user = await getCurrentUserSafe();
      if (!user) return;

      const sellerId = car.seller_id || car.seller?.id;
      if (!sellerId) return;

      const conversationId = await openChat(user.id, sellerId, car.id);
      if (conversationId) {
        router.push({
          pathname: '/chat/[conversationId]',
          params: { conversationId },
        });
      }
    } catch (error) {
      appLogger.error('Error opening chat', { error });
    }
  };

  /**
   * Открыть комментарии (TikTok-style)
   */
  const handleOpenComments = useCallback((car: Car) => {
    if (!requireAuth('comment')) return;

    triggerHaptic('light');

    // Ставим видео на паузу
    videoEngine.pauseAll();

    // Открываем комментарии
    setActiveListingId(car.id);
    setCommentsCount(car.comments_count || 0);
    setShowComments(true);
  }, [videoEngine]);

  /**
   * Закрыть комментарии
   */
  const handleCloseComments = useCallback(() => {
    setShowComments(false);
    setActiveListingId(null);

    // Возобновляем видео
    if (currentIndex >= 0) {
      videoEngine.setActiveIndex(currentIndex);
    }
  }, [currentIndex, videoEngine]);

  /**
   * Открыть детали авто
   */
  const handleOpenDetails = (car: Car) => {
    router.push({ pathname: '/car/[id]', params: { id: car.id } });
  };

  /**
   * Компонент для отдельного видео элемента
   * Использует EngineVideoPlayer для интеграции с VideoEngine360V4
   */
  const VideoItem = React.memo(function VideoItem({
    car,
    index,
    isVisible,
    isFeedFocused: feedFocused,
  }: {
    car: Car;
    index: number;
    isVisible: boolean;
    isFeedFocused: boolean;
  }) {
    // Получаем video URL (может быть Optional, объект и т.д.)
    const rawUrl = car.video_url || (car.video_id ? getHLSUrl(car.video_id) : null);

    const details = car.details ?? {
      brand: car.brand,
      model: car.model,
      year: car.year,
      mileage: car.mileage,
    };
    const brand = car.brand ?? details.brand ?? 'Авто';
    const model = car.model ?? details.model ?? '';
    const year = car.year ?? details.year ?? 'N/A';
    const mileage = car.mileage ?? details.mileage ?? 0;

    return (
      <View style={styles.videoContainer}>
        {/* Используем EngineVideoPlayer ONLY */}
        <EngineVideoPlayer
          id={car.id}
          index={index}
          rawUrl={rawUrl}
          posterUrl={car.thumbnail_url}
          mutedByDefault={false}
          isVisible={isVisible}
          isFeedFocused={feedFocused}
        />

        {/* Градиентный оверлей снизу */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />

        {/* Информация об авто (слева снизу) */}
        <Pressable
          style={styles.infoContainer}
          onPress={() => handleOpenDetails(car)}
        >
          <Text style={styles.carTitle}>
            {brand} {model}
          </Text>
          <PriceDisplay price={car.price || 0} />
          <Text style={styles.carDetails}>
            {year} год • {mileage.toLocaleString()} км
          </Text>
          {car.description && (
            <Text style={styles.carDescription} numberOfLines={2}>
              {car.description}
            </Text>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={16} color="#FFFFFF" />
              <Text style={styles.statText}>{car.views}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={16} color="#FFFFFF" />
              <Text style={styles.statText}>{car.likes}</Text>
            </View>
          </View>
        </Pressable>

        {/* Действия справа (TikTok style) */}
        <View style={styles.actionsContainer}>
          {/* Лайк с Bounce анимацией */}
          <ScalePress scale={0.9}>
            <Bounce trigger={car.isLiked}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLike(car)}
              >
                <Ionicons
                  name={car.isLiked ? 'heart' : 'heart-outline'}
                  size={32}
                  color={car.isLiked ? ultra.accent : '#FFFFFF'}
                />
                <Text style={styles.actionText}>{car.likes}</Text>
              </TouchableOpacity>
            </Bounce>
          </ScalePress>

          {/* Сохранить */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              if (!requireAuth('save')) return;
              triggerHaptic('medium');
              // TODO: Implement save functionality using toggleSave helper
            }}
          >
            <Ionicons
              name={car.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={32}
              color={car.isSaved ? '#FFA500' : '#FFFFFF'}
            />
            <Text style={styles.actionText}>{car.saves || 0}</Text>
          </TouchableOpacity>

          {/* Поделиться */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(car)}
          >
            <Ionicons name="arrow-redo" size={32} color="#FFFFFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          {/* Комментарии — TikTok Style */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenComments(car)}
          >
            <Ionicons name="chatbubble-outline" size={32} color="#FFFFFF" />
            <Text style={styles.actionText}>{car.comments_count || 0}</Text>
          </TouchableOpacity>

          {/* Чат */}
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => handleChat(car)}
          >
            <LinearGradient
              colors={[ultra.accent, ultra.accentSecondary]}
              style={styles.chatButtonGradient}
            >
              <Ionicons name="chatbubble" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  });

  // Cleanup VideoEngine при размонтировании компонента
  useEffect(() => {
    return () => {
      videoEngine.clear();
    };
  }, [videoEngine]);

  // ВАЖНО: Хуки должны вызываться до ранних return!
  const renderVideoItem = useCallback(({ item, index }: { item: Car; index: number }) => {
    const isVisible = visibleItems.has(index);
    return <VideoItem car={item} index={index} isVisible={isVisible} isFeedFocused={isFeedFocused} />;
  }, [visibleItems, isFeedFocused]); // Include isFeedFocused in deps

  if (loading) {
    return <LoadingOverlay message="Загрузка видео..." />;
  }

  if (cars.length === 0) {
    return (
      <EmptyState
        title="Нет видео"
        subtitle="Пока нет активных объявлений"
        icon="videocam-off"
        backgroundColor="#fafafa"
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LegendList
      ref={flatListRef}
      data={cars}
      renderItem={renderVideoItem}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
        // LegendList оптимизации — signal-based recycling
        recycleItems={true}
        drawDistance={SCREEN_HEIGHT * 2}
      />

      {/* TikTok-style комментарии */}
      {activeListingId && (
        <CommentsBottomSheet
          listingId={activeListingId}
          isVisible={showComments}
          onClose={handleCloseComments}
          initialCommentsCount={commentsCount}
        />
      )}
    </View>
  );
}

// Set displayName for better debugging
TikTokStyleFeed.displayName = 'TikTokStyleFeed';

// 🔍 Why Did You Render — отслеживание лишних ререндеров
// (TikTokStyleFeed as any).whyDidYouRender = true; // DISABLED

const styles = StyleSheet.create({
  videoContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: '#000', // Видео должно быть на черном фоне для контраста
    position: 'relative',
  },
  video: {
    height: '100%',
    width: '100%',
  },
  placeholderVideo: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  placeholderText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  carTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  carPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: ultra.accent,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  carPriceUSD: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  carDetails: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    opacity: 0.9,
  },
  carDescription: {
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.8,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chatButton: {
    marginTop: 8,
  },
  chatButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
