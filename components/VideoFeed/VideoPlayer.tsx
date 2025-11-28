// components/VideoPlayer.tsx — 100% РАБОТАЕТ В EXPO SDK 54+ (2025)
// Использует единый helper normalizeVideoUrl для безопасной нормализации VideoSource

import { isRealVideo, normalizeVideoUrl } from '@/lib/video/videoSource';
import { appLogger } from '@/utils/logger';
import { VideoView, useVideoPlayer } from '@expo/video';
import React, { useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  url: string | undefined | null;
  isActive: boolean;
  muted?: boolean;
}

export const VideoPlayer = React.memo<Props>(({ url, isActive, muted = false }) => {
  // КРИТИЧНО: Нормализуем url ПЕРЕД использованием
  const finalUrl = useMemo(() => {
    const normalized = normalizeVideoUrl(url);
    
    // DEBUG лог для поиска источника Optional
    if (__DEV__) {
      appLogger.debug('DEBUG videoUrl source', {
        original: url,
        normalized: normalized,
        component: 'VideoPlayer',
      });
    }
    
    return normalized;
  }, [url]);

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

  useEffect(() => {
    // Настройки плеера - только если есть реальное видео
    if (!hasRealVideo) return;

    try {
      if ('loop' in player) {
        (player as any).loop = true;
      }
      if ('isMuted' in player) {
        (player as any).isMuted = muted;
      } else if ('muted' in player) {
        (player as any).muted = muted;
      }

      if (isActive) {
        try {
          player.play();
        } catch (playError) {
          appLogger.warn('[VideoPlayer] Play error', { error: playError });
        }
      } else {
        player.pause();
      }
    } catch (error) {
      appLogger.error('[VideoPlayer] Player config error', { error });
    }
    
    // Cleanup при размонтировании или изменении URL
    return () => {
      try {
        if (player && 'pause' in player) {
          player.pause();
        }
      } catch {
        // Игнорируем ошибки cleanup
      }
    };
  }, [isActive, muted, player, hasRealVideo]);

  // ← Если нет реального видео — не рендерим VideoView!
  if (!hasRealVideo) {
    return null;
  }

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: SCREEN_HEIGHT }}
      nativeControls={false}
      allowsFullscreen={false}
      showsTimecodes={false}
      requiresLinearPlayback={false}
      contentPosition={{ dx: 0, dy: 0 }}
      contentFit="cover"
    />
  );
});

VideoPlayer.displayName = 'VideoPlayer';
