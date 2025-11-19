// components/video/OptimizedVideoPlayer.tsx

import { useAppSelector } from '@/lib/store/hooks';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from '@expo/video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface OptimizedVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  muted?: boolean;
  listingId: string;
}

export const OptimizedVideoPlayer = React.memo<OptimizedVideoPlayerProps>(({
  videoUrl,
  thumbnailUrl,
  isActive,
  muted: propMuted,
  listingId,
}) => {
  const mutedVideoIds = useAppSelector(state => state.video.mutedVideoIds);
  const isMuted = propMuted ?? mutedVideoIds.includes(listingId);

  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const hasStartedPlayingRef = useRef(false);

  // Нормализуем videoUrl, чтобы избежать проблем с типами Optional
  // Явно указываем тип string, чтобы избежать Optional(Optional(string))
  const normalizedVideoUrl: string = useMemo(() => {
    if (!videoUrl || typeof videoUrl !== 'string') {
      return '';
    }
    const trimmed = videoUrl.trim();
    return trimmed !== '' ? trimmed : '';
  }, [videoUrl]);

  // Создаём плеер один раз (даже если URL пустой, чтобы хуки вызывались всегда)
  // Используем валидный placeholder URL вместо пустой строки для избежания ошибок типов
  const playerSource = normalizedVideoUrl || 'https://invalid-placeholder-url';
  const prevVideoUrlRef = useRef<string>(normalizedVideoUrl);
  const player = useVideoPlayer(
    playerSource,
    player => {
      if (player && normalizedVideoUrl) {
        player.loop = true;
        player.muted = isMuted;
        player.staysActiveInBackground = false;
      }
    }
  );

  // Обновляем URL через replace, если он изменился (избегаем пересоздания плеера)
  useEffect(() => {
    if (player && normalizedVideoUrl && prevVideoUrlRef.current !== normalizedVideoUrl) {
      try {
        // Используем replace для обновления URL без пересоздания плеера
        if (typeof player.replace === 'function') {
          player.replace(normalizedVideoUrl);
        }
        prevVideoUrlRef.current = normalizedVideoUrl;
      } catch (error) {
        console.warn('[OptimizedVideoPlayer] Replace error:', error);
      }
    }
  }, [player, normalizedVideoUrl]);

  // Управление воспроизведением
  useEffect(() => {
    if (!normalizedVideoUrl) {
      setIsLoading(false);
      return;
    }

    if (!player) return;

    if (isActive) {
      // Воспроизводим только если активно
      try {
        player.play();
        hasStartedPlayingRef.current = true;
        
        // Скрываем лоадер и превью после небольшой задержки
        const timer = setTimeout(() => {
          setIsLoading(false);
          setShowThumbnail(false);
        }, 300);
        return () => clearTimeout(timer);
      } catch (error) {
        console.warn('[OptimizedVideoPlayer] Play error:', error);
        // Даже при ошибке скрываем лоадер
        setIsLoading(false);
      }
    } else {
      // Останавливаем видео, если не активно
      try {
        player.pause();
        hasStartedPlayingRef.current = false;
        setShowThumbnail(true); // Показываем превью когда пауза
        setIsLoading(false); // Скрываем лоадер при паузе
      } catch (error) {
        console.warn('[OptimizedVideoPlayer] Pause error:', error);
      }
    }
  }, [isActive, player, normalizedVideoUrl]);
  
  // Дополнительная проверка: если видео играет, но лоадер все еще виден, скрываем его
  useEffect(() => {
    if (isActive && player && isLoading && normalizedVideoUrl) {
      // Проверяем, играет ли видео, и если да - скрываем лоадер
      const checkPlaying = setInterval(() => {
        if (player.playing) {
          setIsLoading(false);
          setShowThumbnail(false);
        }
      }, 100);
      
      // Автоматически скрываем лоадер через 1.5 секунды, даже если видео не играет
      const timeout = setTimeout(() => {
        setIsLoading(false);
        if (player.playing) {
          setShowThumbnail(false);
        }
      }, 1500);
      
      return () => {
        clearInterval(checkPlaying);
        clearTimeout(timeout);
      };
    }
  }, [isActive, player, isLoading, normalizedVideoUrl]);

  // Mute
  useEffect(() => {
    if (player && normalizedVideoUrl) {
      player.muted = isMuted;
    }
  }, [isMuted, player, normalizedVideoUrl]);

  // Проверка на пустой URL — рендер после хуков
  if (!normalizedVideoUrl) {
    return (
      <View style={styles.container}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
        )}
      </View>
    );
  }

  // НИКАКОГО player.release() — ЭТО БЫЛА МОЯ ОШИБКА!

  return (
    <View style={styles.container}>
      {/* Видео */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Превью — показывается только пока загружается или не активно */}
      {showThumbnail && thumbnailUrl && (
        <Image
          source={{ uri: thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      {/* Лоадер — только пока загружается */}
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Кнопка звука убрана - она теперь в EnhancedVideoCard */}
    </View>
  );
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    backgroundColor: '#000',
  },
});
