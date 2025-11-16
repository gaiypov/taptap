// TikTok-style вертикальная лента видео для React Native

import apiVideoService from '@/services/apiVideo';
import { auth } from '@/services/auth';
import { db } from '@/services/supabase';
import type { Car } from '@/types';
import { formatPriceWithUSD } from '@/constants/currency';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

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
import { VideoView, useVideoPlayer } from 'expo-video';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/constants';

interface VideoFeedProps {
  initialCarId?: string;
}

export default function TikTokStyleFeed({ initialCarId }: VideoFeedProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const loadCars = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getCars({ limit: 20 });
      
      if (error) throw error;
      
      if (data) {
        // Фильтруем только авто с видео
        const carsWithVideos = data.filter(car => car.video_url || car.video_id);
        setCars(carsWithVideos);
        
        // Если есть initialCarId, находим его индекс
        if (initialCarId) {
          const index = carsWithVideos.findIndex(car => car.id === initialCarId);
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


  /**
   * Обработчик изменения видимого элемента
   */
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);
      
      // Отслеживаем просмотр
      const car = cars[index];
      if (car) {
        trackView(car.id);
      }
    }
  }, [cars]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80, // 80% видно
  };

  /**
   * Отследить просмотр
   */
  const trackView = async (carId: string) => {
    try {
      await db.incrementViews(carId);
      
      // Обновляем локальное состояние
      setCars(prevCars =>
        prevCars.map(car =>
          car.id === carId ? { ...car, views: car.views + 1 } : car
        )
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  /**
   * Лайк автомобиля
   */
  const handleLike = async (car: Car) => {
    try {
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) return;

      const isLiked = car.isLiked;

      if (isLiked) {
        await db.unlikeCar(currentUser.id, car.id);
      } else {
        await db.likeCar(currentUser.id, car.id);
      }

      // Обновляем локальное состояние
      setCars(prevCars =>
        prevCars.map(c =>
          c.id === car.id
            ? { ...c, likes: isLiked ? c.likes - 1 : c.likes + 1, isLiked: !isLiked }
            : c
        )
      );
    } catch {
      // Silent error
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
  const handleChat = (car: Car) => {
    router.push({
      pathname: '/chat/[conversationId]',
      params: { conversationId: car.id },
    });
  };

  /**
   * Открыть детали авто
   */
  const handleOpenDetails = (car: Car) => {
    router.push({ pathname: '/car/[id]', params: { id: car.id } });
  };

  /**
   * Компонент для отдельного видео элемента (чтобы использовать hooks)
   * Мемоизирован для оптимизации производительности
   */
  const VideoItem = React.memo(function VideoItem({ car, index, isActive }: { car: Car; index: number; isActive: boolean }) {
    const videoUrl = car.video_url || (car.video_id ? apiVideoService.getHLSUrl(car.video_id) : null);
    const videoPlayer = useVideoPlayer(videoUrl || '');
    
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

    // Control video playback based on active state
    useEffect(() => {
      if (videoUrl) {
        videoPlayer.loop = true;
        videoPlayer.muted = false;
        if (isActive) {
          videoPlayer.play();
        } else {
          videoPlayer.pause();
        }
      }
      return () => {
        if (videoPlayer) {
          videoPlayer.pause();
        }
      };
    }, [isActive, videoUrl, videoPlayer]);

    const handlePress = () => {
      router.push({
        pathname: '/car/[id]',
        params: { id: car.id },
      });
    };

    return (
      <View style={styles.videoContainer}>
        {videoUrl ? (
          <VideoView
            player={videoPlayer}
            style={styles.video}
            contentFit="cover"
            allowsFullscreen
          />
        ) : (
          <View style={[styles.video, styles.placeholderVideo]}>
            <Ionicons name="videocam-off" size={64} color="#666" />
            <Text style={styles.placeholderText}>Видео недоступно</Text>
          </View>
        )}

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
          {/* Лайк */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(car)}
          >
            <Ionicons
              name={car.isLiked ? 'heart' : 'heart-outline'}
              size={32}
              color={car.isLiked ? '#FF3B30' : '#FFFFFF'}
            />
            <Text style={styles.actionText}>{car.likes}</Text>
          </TouchableOpacity>

          {/* Сохранить */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {/* TODO: Save functionality */}}
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

          {/* Чат */}
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => handleChat(car)}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF1744']}
              style={styles.chatButtonGradient}
            >
              <Ionicons name="chatbubble" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  });

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

  const renderVideoItem = useCallback(({ item, index }: { item: Car; index: number }) => {
    return <VideoItem car={item} index={index} isActive={index === currentIndex} />;
  }, [currentIndex, cars]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <FlatList
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
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={3}
      removeClippedSubviews
      getItemLayout={(data, index) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
        })}
      />
    </View>
  );
}

// Set displayName for better debugging
TikTokStyleFeed.displayName = 'TikTokStyleFeed';

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
    ...Platform.select({
      web: {
        textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  carPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 4,
    ...Platform.select({
      web: {
        textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  carPriceUSD: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
    ...Platform.select({
      web: {
        textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
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
