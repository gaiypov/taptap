import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  setActiveVideo,
  addPlayingVideo,
  removePlayingVideo,
  toggleMuteVideo,
  cacheVideoUrl,
} from '@/lib/store/slices/videoSlice';
import { markListingAsViewed } from '@/lib/store/slices/feedSlice';
import { getCachedVideoUrl, cacheVideoUrl as cacheVideoUrlToDB } from '@/services/offlineStorage';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/constants';
import { appLogger } from '@/utils/logger';
import type { Listing } from '@/types';

interface OptimizedVideoPlayerProps {
  listing: Listing;
  isActive: boolean;
  isPreloaded: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  autoPlay?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export const OptimizedVideoPlayer = React.memo<OptimizedVideoPlayerProps>(({
  listing,
  isActive,
  isPreloaded,
  videoUrl,
  thumbnailUrl,
  autoPlay = true,
  onLoad,
  onError,
}) => {
  const dispatch = useAppDispatch();
  const { isOnline } = useNetworkStatus();
  const { activeVideoId, mutedVideoIds, videoCache } = useAppSelector((state) => state.video);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);

  const isMuted = mutedVideoIds.includes(listing.id);
  const shouldCreatePlayer = (isPreloaded || isActive) && (videoUrl || localVideoUrl);

  // Получаем URL видео (из кэша или пропсов)
  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        if (videoUrl && videoUrl.trim() !== '') {
          appLogger.debug('[OptimizedVideoPlayer] Setting video URL', {
            listingId: listing.id,
            videoUrl: videoUrl.substring(0, 50) + '...',
            hasVideoId: !!listing.video_id,
          });
          setLocalVideoUrl(videoUrl);
          // Кэшируем в Redux
          dispatch(cacheVideoUrl({ id: listing.id, url: videoUrl }));
          // Кэшируем в SQLite для оффлайн режима
          if (thumbnailUrl) {
            await cacheVideoUrlToDB(listing.id, videoUrl, thumbnailUrl);
          }
        } else if (!isOnline) {
          // В оффлайн режиме пытаемся получить из кэша
          appLogger.debug('[OptimizedVideoPlayer] Offline mode, checking cache', {
            listingId: listing.id,
          });
          const cached = await getCachedVideoUrl(listing.id);
          if (cached) {
            appLogger.debug('[OptimizedVideoPlayer] Using cached video URL', {
              listingId: listing.id,
            });
            setLocalVideoUrl(cached.videoUrl);
          } else if (videoCache[listing.id]) {
            appLogger.debug('[OptimizedVideoPlayer] Using Redux cached video URL', {
              listingId: listing.id,
            });
            setLocalVideoUrl(videoCache[listing.id].url);
          } else {
            appLogger.warn('[OptimizedVideoPlayer] No video URL and no cache available', {
              listingId: listing.id,
              isOnline,
            });
          }
        } else {
          appLogger.warn('[OptimizedVideoPlayer] No video URL provided', {
            listingId: listing.id,
            hasVideoId: !!listing.video_id,
            hasVideoUrl: !!listing.video_url,
          });
        }
      } catch (error) {
        appLogger.error('[OptimizedVideoPlayer] Error fetching video URL', {
          error,
          listingId: listing.id,
        });
      }
    };

    fetchVideoUrl();
  }, [videoUrl, listing.id, isOnline, videoCache, thumbnailUrl, dispatch]);

  // Создаем плеер
  const player = useVideoPlayer(
    shouldCreatePlayer && localVideoUrl ? localVideoUrl : '',
    useCallback(
      (player: any) => {
        if (!player) return;
        try {
          player.loop = true;
          player.muted = isMuted;
          player.playbackRate = 1.0;
        } catch (error) {
          appLogger.warn('Error configuring video player', { error, listingId: listing.id });
        }
      },
      [isMuted]
    )
  );

  // Управление активным видео
  useEffect(() => {
    if (isActive) {
      dispatch(setActiveVideo(listing.id));
      dispatch(markListingAsViewed(listing.id));
    }
  }, [isActive, listing.id, dispatch]);

  // Управление воспроизведением
  useEffect(() => {
    if (!shouldCreatePlayer || !player || !localVideoUrl) {
      if (!localVideoUrl) {
        appLogger.debug('[OptimizedVideoPlayer] Cannot create player - no video URL', {
          listingId: listing.id,
          shouldCreatePlayer,
          hasPlayer: !!player,
          hasLocalVideoUrl: !!localVideoUrl,
        });
      }
      return;
    }

    const playVideo = async () => {
      try {
        if (isActive && autoPlay) {
          appLogger.debug('[OptimizedVideoPlayer] Starting video playback', {
            listingId: listing.id,
            videoUrl: localVideoUrl.substring(0, 50) + '...',
          });
          await player.play();
          dispatch(addPlayingVideo(listing.id));
          setShowThumbnail(false);
          setIsLoading(false);
          onLoad?.();
          appLogger.debug('[OptimizedVideoPlayer] Video playback started successfully', {
            listingId: listing.id,
          });
        } else {
          player.pause();
          dispatch(removePlayingVideo(listing.id));
        }
      } catch (error) {
        appLogger.error('[OptimizedVideoPlayer] Video playback error', {
          error,
          listingId: listing.id,
          videoUrl: localVideoUrl.substring(0, 50) + '...',
        });
        setHasError(true);
        setIsLoading(false);
        onError?.(error);
      }
    };

    // Небольшая задержка для стабильности
    const timeout = setTimeout(playVideo, isActive ? 50 : 0);
    return () => clearTimeout(timeout);
  }, [isActive, player, shouldCreatePlayer, localVideoUrl, autoPlay, listing.id, dispatch, onLoad, onError]);

  // Обновление muted
  useEffect(() => {
    if (!player || !shouldCreatePlayer) return;
    try {
      player.muted = isMuted;
    } catch (error) {
      appLogger.warn('Error setting video muted', { error, listingId: listing.id });
    }
  }, [isMuted, player, shouldCreatePlayer]);

  const handleMuteToggle = useCallback(() => {
    dispatch(toggleMuteVideo(listing.id));
  }, [listing.id, dispatch]);

  // handleLoadStart удален - VideoView не поддерживает onLoadStart
  // Устанавливаем loading при начале создания плеера
  useEffect(() => {
    if (shouldCreatePlayer && localVideoUrl) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [shouldCreatePlayer, localVideoUrl]);

  // Обработка загрузки видео через player события (fallback если onLoad не вызвался в playVideo)
  useEffect(() => {
    if (!player || !shouldCreatePlayer || !isLoading) return;
    
    let checkCount = 0;
    const maxChecks = 50; // 5 секунд максимум
    
    // Используем статус player для определения загрузки
    const checkStatus = () => {
      try {
        checkCount++;
        // VideoView не имеет onLoad, используем player статус
        if (player.currentTime !== undefined && player.currentTime >= 0) {
          appLogger.debug('[OptimizedVideoPlayer] Video loaded (via status check)', {
            listingId: listing.id,
            currentTime: player.currentTime,
          });
          setIsLoading(false);
          setShowThumbnail(false);
          onLoad?.();
        } else if (checkCount >= maxChecks) {
          // Если не загрузилось за 5 секунд, считаем что загружено
          appLogger.warn('[OptimizedVideoPlayer] Video load timeout, assuming loaded', {
            listingId: listing.id,
          });
          setIsLoading(false);
          setShowThumbnail(false);
          onLoad?.();
        }
      } catch (error) {
        // Игнорируем ошибки проверки статуса
        if (checkCount >= maxChecks) {
          setIsLoading(false);
          setShowThumbnail(false);
        }
      }
    };
    
    // Проверяем периодически
    const interval = setInterval(checkStatus, 100);
    
    return () => clearInterval(interval);
  }, [player, shouldCreatePlayer, onLoad, isLoading, listing.id]);

  // Обработка ошибок через useEffect для VideoView
  useEffect(() => {
    if (!player || !shouldCreatePlayer) return;
    
    // Обрабатываем ошибки через проверку статуса
    const checkError = () => {
      try {
        // Если есть ошибка - обрабатываем
        if (hasError) {
          onError?.(new Error('Video playback failed'));
        }
      } catch (error) {
        // Игнорируем ошибки проверки
      }
    };
    
    const interval = setInterval(checkError, 1000);
    return () => clearInterval(interval);
  }, [player, shouldCreatePlayer, hasError, onError]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.release();
        } catch (error) {
          appLogger.warn('Error releasing video player', { error, listingId: listing.id });
        }
      }
      dispatch(removePlayingVideo(listing.id));
    };
  }, [player, listing.id, dispatch]);

  // Показываем плейсхолдер если нет видео
  if (!localVideoUrl && !videoUrl) {
    appLogger.warn('[OptimizedVideoPlayer] No video URL available', {
      listingId: listing.id,
      hasVideoId: !!listing.video_id,
      hasVideoUrl: !!(listing as any).video_url,
      hasThumbnail: !!thumbnailUrl,
    });
    
    return (
      <View style={styles.container}>
        {thumbnailUrl ? (
          <Image 
            source={{ uri: thumbnailUrl }} 
            style={styles.video} 
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.video, styles.placeholder]}>
            <Ionicons name="videocam-off" size={48} color="rgba(255,255,255,0.5)" />
            <Text style={styles.placeholderText}>Видео недоступно</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Миниатюра показывается поверх видео пока не загрузилось */}
      {showThumbnail && thumbnailUrl && (
        <Image 
          source={{ uri: thumbnailUrl }} 
          style={styles.thumbnail} 
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      {/* Видео плеер */}
      {shouldCreatePlayer && player && localVideoUrl ? (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      ) : (
        // Fallback пока плеер не готов
        thumbnailUrl ? (
          <Image 
            source={{ uri: thumbnailUrl }} 
            style={styles.video} 
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.video, styles.placeholder]}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )
      )}

      {/* Индикатор загрузки */}
      {isLoading && !hasError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Кнопка mute/unmute */}
      {!isLoading && !hasError && (
        <TouchableOpacity style={styles.muteButton} onPress={handleMuteToggle}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Ошибка загрузки */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle-outline" size={48} color="#fff" />
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Оптимизация: перерендер только при изменении важных пропсов
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPreloaded === nextProps.isPreloaded &&
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.thumbnailUrl === nextProps.thumbnailUrl &&
    prevProps.autoPlay === nextProps.autoPlay
  );
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 3,
  },
  muteButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    zIndex: 4,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 5,
  },
});
