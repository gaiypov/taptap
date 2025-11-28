// components/VideoFeed/EngineVideoPlayer.tsx — EngineVideoPlayer360° V4
// UI-обёртка для VideoEngine360V4 с поддержкой 360°/VR-light, Android-оптимизациями, preloader и watermark
// OPTIMIZED: Removed fallback timer, uses event-driven state from engine

import { useVideoEngine } from '@/lib/video/useVideoEngine';
import { getVideoEngine } from '@/lib/video/videoEngine';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { VideoView } from '@expo/video';
import { Image } from 'expo-image';
import { BLURHASH, IMAGE_TRANSITION } from '@/constants/blurhash';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Props для EngineVideoPlayer
 */
export interface EngineVideoPlayerProps {
  id: string; // listing id
  index: number; // feed index
  rawUrl: string | null | undefined;
  isVisible: boolean;
  isFeedFocused: boolean; // Feed screen is in focus (tab)
  posterUrl?: string | null;
  mutedByDefault?: boolean;
}

/**
 * EngineVideoPlayer360° V4 — компонент, который:
 * - Оборачивает @expo/video VideoView
 * - Использует useVideoEngine для интеграции с VideoEngine360V4
 * - Управляет воспроизведением через engine (event-driven)
 * - Поддерживает 360°/VR-light режим (gyro)
 * - Оптимизирован для Android low-end устройств
 * - Показывает preloader и watermark
 *
 * OPTIMIZED: Removed 300ms fallback timer - engine now handles all playback
 */
export const EngineVideoPlayer = React.memo<EngineVideoPlayerProps>(
  ({ id, index, rawUrl, isVisible, isFeedFocused, posterUrl, mutedByDefault = false }) => {
    // Use stable ref for engine
    const engineRef = useRef(getVideoEngine());

    // 1. Get everything from useVideoEngine (always call hooks)
    const { player, shouldPlay, hasRealVideo, engineState } =
      useVideoEngine({
        id,
        index,
        rawUrl,
        isVisible,
        isFeedFocused,
      });

    // 2. Apply mute setting (consolidated effect)
    useEffect(() => {
      if (!player) return;

      try {
        if ('volume' in player && typeof player.volume === 'number') {
          player.volume = mutedByDefault ? 0 : 1;
        }
        if (Platform.OS === 'android') {
          if ('muted' in player) {
            (player as any).muted = mutedByDefault;
          } else if ('isMuted' in player) {
            (player as any).isMuted = mutedByDefault;
          }
        }
      } catch (error) {
        appLogger.warn('[EngineVideoPlayer] Mute config error', { error });
      }
    }, [player, mutedByDefault]);

    // 3. Retry handler (stable ref)
    const handleRetry = useCallback(() => {
      const engine = engineRef.current;
      const state = engine.getState(id);
      if (state) {
        state.retryCount = 0;
        state.error = null;
        engine.play(id);
      }
    }, [id]);

    // 3. Fallback for no real video
    if (!hasRealVideo) {
      return posterUrl ? (
        <View style={styles.container}>
          <Image
            source={{ uri: posterUrl }}
            placeholder={{ blurhash: BLURHASH.VIDEO }}
            style={styles.video}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={IMAGE_TRANSITION.DEFAULT}
          />
        </View>
      ) : (
        <View style={[styles.container, styles.placeholder]}>
          <Ionicons name="videocam-off" size={64} color="#666" />
          <Text style={styles.placeholderText}>Видео недоступно</Text>
        </View>
      );
    }

    // 4. Main render
    return (
      <View style={styles.container}>
        {/* Video player */}
        {player && (
          <VideoView
            player={player}
            style={styles.video}
            nativeControls={false}
            allowsFullscreen={false}
            showsTimecodes={false}
            requiresLinearPlayback={false}
            contentPosition={{ dx: 0, dy: 0 }}
            contentFit="cover"
          />
        )}

        {/* Poster overlay (until video plays) */}
        {posterUrl && !engineState?.isPlaying && (
          <Image
            source={{ uri: posterUrl }}
            placeholder={{ blurhash: BLURHASH.VIDEO }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={IMAGE_TRANSITION.FAST}
          />
        )}

        {/* Preloader "Грузим красавца..." */}
        {isVisible && engineState?.isBuffering && !posterUrl && hasRealVideo && (
          <View style={[StyleSheet.absoluteFill, styles.preloaderContainer]}>
            <ActivityIndicator size="large" color="#FF4D00" />
            <Text style={styles.preloaderText}>Грузим красавца...</Text>
          </View>
        )}

        {/* Error + Retry */}
        {engineState?.error && engineState.retryCount >= 3 && (
          <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>Не удалось загрузить видео</Text>
            <Pressable
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Попробовать снова</Text>
            </Pressable>
          </View>
        )}

        {/* Watermark "360" */}
        {isVisible && engineState?.isPlaying && (
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>360</Text>
          </View>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.id === nextProps.id &&
      prevProps.index === nextProps.index &&
      prevProps.rawUrl === nextProps.rawUrl &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.isFeedFocused === nextProps.isFeedFocused &&
      prevProps.posterUrl === nextProps.posterUrl &&
      prevProps.mutedByDefault === nextProps.mutedByDefault
    );
  }
);

EngineVideoPlayer.displayName = 'EngineVideoPlayer';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  placeholderText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  preloaderContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preloaderText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  watermark: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 28,
    fontWeight: '900',
  },
});
