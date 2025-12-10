// components/video/SimpleVideoPlayer.tsx
// Simple standalone video player for preview, listing details, etc.
// No engine - just pure @expo/video with basic controls

import { isRealVideo, normalizeVideoUrl } from '@/lib/video/videoSource';
import { appLogger } from '@/utils/logger';
import { VideoView, useVideoPlayer } from '@expo/video';
import { Image } from 'expo-image';
import { BLURHASH, IMAGE_TRANSITION } from '@/constants/blurhash';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

export interface SimpleVideoPlayerProps {
  videoUrl: string | null | undefined;
  posterUrl?: string | null;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

/**
 * SimpleVideoPlayer - Pure @expo/video player for standalone screens
 * Use this for:
 * - Video preview screens
 * - Listing detail screens
 * - Any screen that needs a single video player (not in feed)
 */
export const SimpleVideoPlayer = React.memo<SimpleVideoPlayerProps>(({
  videoUrl,
  posterUrl,
  autoplay = true,
  loop = true,
  muted = false,
  onReady,
  onError,
}) => {
  // Normalize URL
  const normalizedUrl = useMemo(() => {
    return normalizeVideoUrl(videoUrl);
  }, [videoUrl]);

  // Check if real video
  const hasRealVideo = useMemo(() => {
    return isRealVideo(normalizedUrl);
  }, [normalizedUrl]);

  // Create player source - ALWAYS use { uri: string } format for both platforms
  const playerSource = useMemo(() => {
    if (!normalizedUrl || normalizedUrl.length === 0) {
      return null;
    }
    return { uri: normalizedUrl };
  }, [normalizedUrl]);

  const player = useVideoPlayer(playerSource as any);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Configure player
  useEffect(() => {
    if (!player || !hasRealVideo) return;

    try {
      if ('loop' in player) {
        (player as any).loop = loop;
      }
      if (Platform.OS === 'ios') {
        if ('isMuted' in player) {
          (player as any).isMuted = muted;
        }
      } else {
        if ('muted' in player) {
          (player as any).muted = muted;
        } else if ('isMuted' in player) {
          (player as any).isMuted = muted;
        }
      }
    } catch (error) {
      appLogger.warn('[SimpleVideoPlayer] Config error', { error });
    }
  }, [player, hasRealVideo, loop, muted]);

  // Handle ready state
  useEffect(() => {
    if (!player || !hasRealVideo) return;

    const timeout = setTimeout(() => {
      setIsReady(true);
      onReady?.();
    }, 300);

    return () => clearTimeout(timeout);
  }, [player, hasRealVideo, onReady]);

  // Handle playback
  useEffect(() => {
    if (!player || !hasRealVideo || !isReady) return;

    if (autoplay) {
      try {
        player.play();
      } catch (error) {
        appLogger.warn('[SimpleVideoPlayer] Play exception', { error });
        setHasError(true);
        onError?.(error as Error);
      }
    } else {
      try {
        player.pause();
      } catch {
        // Ignore
      }
    }
  }, [player, hasRealVideo, isReady, autoplay, onError]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch {
          // Ignore
        }
      }
    };
  }, [player]);

  // No real video - show poster or placeholder
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
        <ActivityIndicator size="large" color="#666" />
      </View>
    );
  }

  // Error state
  if (hasError) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            placeholder={{ blurhash: BLURHASH.VIDEO }}
            style={styles.video}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={IMAGE_TRANSITION.DEFAULT}
          />
        ) : (
          <ActivityIndicator size="large" color="#666" />
        )}
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
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

      {/* Poster overlay until ready */}
      {posterUrl && !isReady && (
        <Image
          source={{ uri: posterUrl }}
          placeholder={{ blurhash: BLURHASH.VIDEO }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={IMAGE_TRANSITION.FAST}
        />
      )}

      {/* Loading indicator */}
      {!isReady && !posterUrl && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}
    </View>
  );
});

SimpleVideoPlayer.displayName = 'SimpleVideoPlayer';

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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

