import CarManagement from '@/components/Cars/CarManagement';
import CommentsList from '@/components/Comments/CommentsList';
import apiVideoService from '@/services/apiVideo';
import { auth } from '@/services/auth';
import { db } from '@/services/supabase';
import { Listing } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { debounce } from 'lodash';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, Animated as RNAnimated, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    FadeOut,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

// TODO: После установки @api.video/react-native-player раскомментируй:
// import { VideoPlayer as ApiVideoPlayer } from '@api.video/react-native-player';

const { width, height } = Dimensions.get('window');
const DEFAULT_VIDEO_URI =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface VideoPlayerProps {
  car: Listing;
  isActive?: boolean;
  onLike?: (carId: string) => void;
  onSave?: (carId: string) => void;
  onShare?: (carId: string) => void;
  videoUri?: string;
  autoPlay?: boolean;
  onPlaybackStatusUpdate?: (status: any) => void;
}

export interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  getStatus: () => any;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ car, isActive = true, videoUri, autoPlay = true, onPlaybackStatusUpdate, onLike, onSave, onShare }, ref) => {
    const player = useVideoPlayer(videoUri || car.video_url || DEFAULT_VIDEO_URI, (player) => {
      player.loop = true;
      player.muted = true;
    });
    const isMountedRef = useRef(true);
    const lastTapRef = useRef<number>(0);
    
    const [status, setStatus] = useState<any>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [likesCount, setLikesCount] = useState(car.likes || 0);
    const [isMuted, setIsMuted] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [hasTrackedView, setHasTrackedView] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [showSwipeHint, setShowSwipeHint] = useState(true);
    const router = useRouter();

    // Swipe gesture states
    const translateY = useSharedValue(0);
    const arrowAnimation = useRef(new RNAnimated.Value(0)).current;

    // Cleanup для isMountedRef
    useEffect(() => {
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    useEffect(() => {
      let isMounted = true;

      auth
        .getCurrentUser()
        .then((user) => {
          if (isMounted) {
            setCurrentUser(user);
          }
        })
        .catch((error) => {
          console.error('Failed to get current user:', error);
        });

      return () => {
        isMounted = false;
      };
    }, []);

    useEffect(() => {
      setHasTrackedView(false);
      setLikesCount(car.likes || 0);
      const likedData = (car as any).is_liked ?? car.isLiked;
      const savedData = (car as any).is_saved ?? car.isSaved;

      setIsLiked(Array.isArray(likedData) ? likedData.length > 0 : Boolean(likedData));
      setIsSaved(Array.isArray(savedData) ? savedData.length > 0 : Boolean(savedData));
    }, [car.id, car.likes, car.isLiked, car.isSaved]);

    // Swipe gesture для открытия деталей
    const swipeGesture = Gesture.Pan()
      .onUpdate((event) => {
        // Только если свайп вверх
        if (event.translationY < 0) {
          translateY.value = event.translationY;
        }
      })
      .onEnd((event) => {
        // Если свайпнул больше 100px вверх
        if (event.translationY < -100) {
          // Открываем детали
          router.push({
            pathname: '/car/[id]',
            params: { id: car.id },
          });
        }
        translateY.value = withSpring(0);
      });

    // Анимация стрелки для hint
    useEffect(() => {
      const animation = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(arrowAnimation, {
            toValue: -10,
            duration: 600,
            useNativeDriver: true,
          }),
          RNAnimated.timing(arrowAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      
      // Скрыть через 3 секунды
      const timer = setTimeout(() => setShowSwipeHint(false), 3000);
      
      return () => {
        animation.stop();
        clearTimeout(timer);
      };
    }, []);

    const sellerInfo = useMemo(() => {
      const sellerName = car.seller?.name || 'Неизвестный продавец';
      return {
        name: sellerName,
        verified: car.seller?.is_verified || false,
        avatar:
          car.seller?.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}`,
      };
    }, [car.seller]);

    const handleSellerPress = () => {
      if (car.seller_id) {
        router.push({
          pathname: '/profile/[id]',
          params: { id: car.seller_id },
        });
      }
    };

    const handleMessagePress = async () => {
      try {
        if (!currentUser) {
          Alert.alert('Требуется вход', 'Войдите в аккаунт, чтобы написать продавцу');
          router.push({ pathname: '/(tabs)/profile' });
          return;
        }
        
        // Создаем или получаем существующий чат
        const { data, error } = await db.getOrCreateConversation(
          car.id,
          currentUser.id,
          car.seller_id
        );
        
        if (error) throw error;
        
        if (data) {
          router.push({
            pathname: '/chat/[conversationId]',
            params: { conversationId: data.id },
          });
        }
      } catch (error) {
        console.error('Create conversation error:', error);
        Alert.alert('Ошибка', 'Не удалось создать чат. Попробуйте позже.');
      }
    };

    // Debounced like handler - предотвращает множественные запросы
    const debouncedLikeRequest = useRef(
      debounce(async (userId: string | null, carId: string, shouldLike: boolean) => {
        try {
          if (userId) {
            if (shouldLike) {
              await db.likeCar(userId, carId);
            } else {
              await db.unlikeCar(userId, carId);
            }
          }
        } catch (error) {
          console.error('Like request error:', error);
        }
      }, 500) // 500ms задержка
    ).current;

    const handleLike = async () => {
      const previousIsLiked = isLiked;
      const previousLikes = likesCount;
      const nextIsLiked = !previousIsLiked;
      const delta = nextIsLiked ? 1 : -1;

      try {
        // ✅ Немедленное обновление UI (работает для всех, включая гостей)
        setIsLiked(nextIsLiked);
        setLikesCount((prev) => Math.max(prev + delta, 0));

        // Debounced API запрос (только для авторизованных)
        if (currentUser?.id) {
          debouncedLikeRequest(currentUser.id, car.id, nextIsLiked);
        } else {
          // Для гостей - просто локальное изменение
          console.log('Guest liked/unliked car:', car.id);
        }
        
        // Callback для родителя
        onLike?.(car.id);
      } catch (error) {
        console.error('Like error:', error);
        // Откат при ошибке
        setIsLiked(previousIsLiked);
        setLikesCount(previousLikes);
      }
    };

    const handleVideoTap = () => {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        lastTapRef.current = 0;
        if (!isLiked) {
          void handleLike();
        }
      } else {
        lastTapRef.current = now;
      }
    };

    // Cleanup debounce при unmount
    useEffect(() => {
      return () => {
        debouncedLikeRequest.cancel();
      };
    }, []);

    const handleSave = async () => {
      if (!currentUser) {
        Alert.alert('Требуется вход', 'Войдите в аккаунт, чтобы сохранять объявления');
        return;
      }

      try {
        const nextIsSaved = !isSaved;
        setIsSaved(nextIsSaved);
        
        if (nextIsSaved) {
          await db.saveCar(currentUser.id, car.id);
          if (isMountedRef.current) {
            Alert.alert('Сохранено', 'Объявление добавлено в избранное');
          }
        } else {
          await db.unsaveCar(currentUser.id, car.id);
          if (isMountedRef.current) {
            Alert.alert('Удалено', 'Объявление удалено из избранного');
          }
        }
        
        if (isMountedRef.current) {
          onSave?.(car.id);
        }
      } catch (error) {
        console.error('Save error:', error);
        if (isMountedRef.current) {
          setIsSaved(prev => !prev); // Откат с функциональным обновлением
        }
      }
    };

    const handleShare = async () => {
      try {
        const brand = (car.details as any)?.brand || 'Авто';
        const model = (car.details as any)?.model || '';
        const year = (car.details as any)?.year || '';
        const mileage = (car.details as any)?.mileage || 0;
        const location = car.location || 'Не указано';
        
        const message = `🚗 ${brand} ${model} ${year}\n` +
                       `💰 ${car.price?.toLocaleString('ru-RU')} ₸\n` +
                       `📍 ${location}\n` +
                       `⚡️ ${mileage?.toLocaleString('ru-RU')} км\n\n` +
                       `Смотрите на 360°!`;
        
        const result = await Share.share({
          message,
          title: `${brand} ${model}`,
        });
        
        if (result.action === Share.sharedAction) {
          onShare?.(car.id);
        }
      } catch (error) {
        console.error('Share error:', error);
      }
    };

    const toggleMute = async () => {
      const nextMuted = !isMuted;
      if (player) {
        player.muted = nextMuted;
        setIsMuted(nextMuted);
      }
    };

    const handleCarPress = () => {
      router.push({
        pathname: '/car/[id]',
        params: { id: car.id },
      });
    };

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (player) {
          player.play();
        }
      },
      pause: async () => {
        if (player) {
          player.pause();
        }
      },
      togglePlayPause: async () => {
        if (player) {
          if (player.playing) {
            player.pause();
          } else {
            player.play();
          }
        }
      },
      getStatus: () => ({ isLoaded: true, isPlaying: player?.playing || false }),
    }));

    const handlePlaybackStatusUpdate = async (newStatus: any) => {
      setStatus(newStatus);
      onPlaybackStatusUpdate?.(newStatus);

      // Обработка ошибок видео
      if (newStatus.error) {
        console.error('Video playback error:', newStatus.error);
        setVideoError(true);
        setIsVideoLoading(false);
        return;
      }

      // Видео загружено
      if (newStatus.isLoaded && isVideoLoading) {
        setIsVideoLoading(false);
        setVideoError(false);
      }

      // Трекинг просмотра
      if (
        newStatus.isLoaded &&
        newStatus.isPlaying &&
        !hasTrackedView &&
        newStatus.positionMillis > 3000
      ) {
        setHasTrackedView(true);
        
        try {
          await db.incrementViews(car.id);
          if (car.video_id) {
            await apiVideoService.incrementViews(car.video_id);
          }
        } catch (error) {
          console.error('Error tracking view:', error);
        }
      }
    };

    return (
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.container}>
        {/* 
          TODO: Заменить на api.video Player для лучшей производительности
          import { VideoPlayer as ApiVideoPlayer } from '@api.video/react-native-player';
          
          <ApiVideoPlayer
            videoId={car.video_id}
            autoplay={autoPlay && isActive}
            hideControls
            style={styles.video}
          />
        */}
        <Pressable style={styles.videoWrapper} onPress={handleVideoTap}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
          />
        </Pressable>

        {/* Loading indicator */}
        {isVideoLoading && !videoError && (
          <View style={styles.videoLoadingContainer}>
            <ActivityIndicator size="large" color="#FF3B30" />
          </View>
        )}

        {/* Error fallback */}
        {videoError && (
          <View style={styles.videoErrorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
            <Text style={styles.videoErrorText}>Не удалось загрузить видео</Text>
            <TouchableOpacity 
              style={styles.videoErrorButton}
              onPress={() => {
                setVideoError(false);
                setIsVideoLoading(true);
                if (player) {
                  player.currentTime = 0;
                  player.play();
                }
              }}
            >
              <Text style={styles.videoErrorButtonText}>Попробовать снова</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Overlay с информацией */}
        <View style={styles.overlay}>
          {/* Информация о продавце */}
          <TouchableOpacity style={styles.sellerInfo} onPress={handleSellerPress}>
            <Image source={{ uri: sellerInfo.avatar }} style={styles.avatar} />
            <Text style={styles.sellerName}>{sellerInfo.name}</Text>
            {sellerInfo.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#0A84FF" />
            )}
          </TouchableOpacity>

          {/* Информация об автомобиле */}
          <TouchableOpacity style={styles.carInfo} onPress={handleCarPress} activeOpacity={0.9}>
            <Text style={styles.carTitle}>
              {(car.details as any)?.brand || 'Авто'} {(car.details as any)?.model || ''} {(car.details as any)?.year || ''}
            </Text>
            <Text style={styles.carDetails}>
              {(car.details as any)?.mileage?.toLocaleString('ru-RU') || '0'} км • {car.location || 'Не указано'}
            </Text>
            {car.price && (
              <View style={styles.priceRow}>
                <Text style={styles.carPrice}>
                  💰 {car.price.toLocaleString('ru-RU')} ₸
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </View>
            )}

            {/* AI Score */}
            {car.ai_score && (
              <View style={styles.conditionBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#0A84FF" style={{ marginRight: 4 }} />
                <Text style={styles.conditionText}>
                  Состояние {car.ai_score}%
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Car Management (Top Right) */}
          <View style={styles.topRightActions}>
            <CarManagement 
              carId={car.id} 
              currentUserId={currentUser?.id}
              onDelete={() => router.back()}
            />
          </View>

          {/* Боковая панель с кнопками (как в TikTok) */}
          <View style={styles.actionButtons}>
            {/* Подробнее */}
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={handleCarPress}
            >
              <View style={styles.detailsButtonGradient}>
                <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.detailsButtonText}>Подробнее</Text>
            </TouchableOpacity>

            {/* Лайк */}
            <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
              <View style={[styles.iconContainer, isLiked && styles.iconContainerActive]}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={28} 
                  color={isLiked ? "#FF3B30" : "#FFF"} 
                />
              </View>
              <Text style={styles.actionText}>{likesCount > 0 ? likesCount : ''}</Text>
            </TouchableOpacity>

            {/* Написать продавцу */}
            <TouchableOpacity style={styles.actionButton} onPress={handleMessagePress} activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <Ionicons name="chatbubble-ellipses" size={26} color="#FFF" />
              </View>
              <Text style={styles.actionText}>Написать</Text>
            </TouchableOpacity>

            {/* Комментарии */}
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(true)} activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <Ionicons name="chatbubble-outline" size={26} color="#FFF" />
              </View>
              <Text style={styles.actionText}>Комменты</Text>
            </TouchableOpacity>

            {/* Сохранить */}
            <TouchableOpacity style={styles.actionButton} onPress={handleSave} activeOpacity={0.7}>
              <View style={[styles.iconContainer, isSaved && styles.iconContainerActive]}>
                <Ionicons 
                  name={isSaved ? "bookmark" : "bookmark-outline"} 
                  size={26} 
                  color={isSaved ? "#FFD60A" : "#FFF"} 
                />
              </View>
              <Text style={styles.actionText}>{isSaved ? 'Сохранено' : 'Сохранить'}</Text>
            </TouchableOpacity>

            {/* Поделиться */}
            <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <Ionicons name="share-outline" size={26} color="#FFF" />
              </View>
              <Text style={styles.actionText}>Поделиться</Text>
            </TouchableOpacity>

            {/* Звук */}
            <TouchableOpacity style={styles.actionButton} onPress={toggleMute} activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={isMuted ? "volume-mute" : "volume-high"} 
                  size={26} 
                  color="#FFF" 
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Modal */}
        <Modal
          visible={showComments}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowComments(false)}
        >
          <CommentsList carId={car.id} onClose={() => setShowComments(false)} />
        </Modal>

        {/* Swipe Hint */}
        {showSwipeHint && (
          <Animated.View 
            style={styles.swipeHint}
            entering={FadeIn.delay(500)}
            exiting={FadeOut}
          >
            <RNAnimated.View 
              style={[
                styles.swipeArrow,
                { transform: [{ translateY: arrowAnimation }] }
              ]}
            >
              <Text style={styles.swipeArrowIcon}>⬆️</Text>
            </RNAnimated.View>
            <Text style={styles.swipeHintText}>
              Проведи вверх для деталей
            </Text>
          </Animated.View>
        )}
      </View>
      </GestureDetector>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoWrapper: {
    width,
    height,
  },
  video: {
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 100,
    justifyContent: 'flex-end',
  },
  topRightActions: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sellerName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  carInfo: {
    marginBottom: 8,
    maxWidth: width * 0.65,
  },
  carTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  carDetails: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.95,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  carPrice: {
    color: '#FFD60A',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  conditionBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#0A84FF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionText: {
    color: '#0A84FF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtons: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
    gap: 18,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: 70,
  },
  videoLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoErrorText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  videoErrorButton: {
    marginTop: 20,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  videoErrorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Swipe hint styles
  swipeHint: {
    position: 'absolute',
    bottom: 300,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  swipeArrow: {
    alignItems: 'center',
  },
  swipeArrowIcon: {
    fontSize: 32,
  },
  swipeHintText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  // Price row styles
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  // Details button styles
  detailsButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E63946',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default VideoPlayer;
