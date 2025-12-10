// components/Video/VideoPlayer.tsx
// Универсальный видео-плеер с поддержкой обрезки

import { VideoTrimData } from '@/types/video.types';
import { getVideoPlaybackUrl } from '@/utils/videoUtils';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface VideoPlayerProps {
  // Источник видео (api.video ID или локальный URI)
  videoId?: string;
  uri?: string;

  // Метаданные обрезки
  trim?: VideoTrimData;

  // Настройки воспроизведения
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;

  // Стили
  style?: ViewStyle;
  contentFit?: 'contain' | 'cover';

  // Callbacks
  onPlaybackStatusUpdate?: (status: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  }) => void;
  onError?: (error: Error) => void;
}

export default function VideoPlayer({
  videoId,
  uri,
  trim,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  style,
  contentFit = 'contain',
  onPlaybackStatusUpdate,
  onError,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Определяем URL видео
  const videoUrl = uri || (videoId ? getVideoPlaybackUrl(videoId, trim) : '');
  
  // Create player source - object format for Android compatibility
  const videoSource = useMemo(() => {
    if (!videoUrl) return null;
    return { uri: videoUrl };
  }, [videoUrl]);

  // Создаем плеер
  const player = useVideoPlayer(videoSource, (p) => {
    if (videoUrl) {
      p.muted = muted;
      p.loop = loop && !trim; // Если есть trim, обрабатываем loop вручную

      // Если есть trim, начинаем с startTime
      if (trim && trim.startTime > 0) {
        p.currentTime = trim.startTime;
      }

      if (autoplay) {
        p.play();
      }

      setIsLoading(false);
    }
  });

  // Обработка обрезки - останавливаем на endTime и перематываем
  useEffect(() => {
    if (!player || !trim) return;

    // Проверяем текущее время каждые 100ms
    intervalRef.current = setInterval(() => {
      try {
        const time = player.currentTime || 0;
        const dur = player.duration || 0;

        setCurrentTime(time);
        setDuration(dur);
        setIsPlaying(player.playing || false);

        // Callback для родителя
        onPlaybackStatusUpdate?.({
          isPlaying: player.playing || false,
          currentTime: time,
          duration: dur,
        });

        // Если достигли конца обрезки
        if (time >= trim.endTime) {
          if (loop) {
            // Перематываем на начало обрезки
            player.currentTime = trim.startTime;
            player.play();
          } else {
            // Останавливаем
            player.pause();
            player.currentTime = trim.startTime;
          }
        }

        // Если вышли за пределы начала (пользователь перемотал назад)
        if (time < trim.startTime) {
          player.currentTime = trim.startTime;
        }
      } catch (error) {
        console.warn('Video playback error:', error);
        onError?.(error as Error);
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [player, trim, loop, onPlaybackStatusUpdate, onError]);

  // Управление воспроизведением
  const togglePlayPause = () => {
    if (!player) return;

    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.warn('Toggle play/pause error:', error);
      onError?.(error as Error);
    }
  };

  // Скрыть контролы через 3 секунды
  useEffect(() => {
    if (!showControls || !isPlaying) return;

    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  if (!videoSource) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off" size={48} color="#666" />
          <Text style={styles.errorText}>Видео не доступно</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Video Player */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit={contentFit}
        nativeControls={false}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
        </View>
      )}

      {/* Trim Badge */}
      {trim && (
        <View style={styles.trimBadge}>
          <Ionicons name="cut" size={12} color="#A855F7" />
          <Text style={styles.trimBadgeText}>Обрезано</Text>
        </View>
      )}

      {/* Controls */}
      {controls && !isLoading && (
        <TouchableOpacity
          style={styles.controlsOverlay}
          activeOpacity={1}
          onPress={() => setShowControls(true)}
        >
          {showControls && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={togglePlayPause}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color="#FFF"
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  trimBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  trimBadgeText: {
    fontSize: 11,
    color: '#A855F7',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
