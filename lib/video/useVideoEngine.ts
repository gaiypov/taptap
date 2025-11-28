// lib/video/useVideoEngine.ts — Hook для интеграции с VideoEngine360V4
// Полный lifecycle управления видео с учетом AppState, feed focus и активности карточки
// OPTIMIZED: Uses event subscriptions instead of polling for state updates

import { getVideoEngine, GlobalEngineEvent, VideoState } from '@/lib/video/videoEngine';
import { isRealVideo, normalizeVideoUrl, PLACEHOLDER_VIDEO_URL } from '@/lib/video/videoSource';
import { appLogger } from '@/utils/logger';
import { useVideoPlayer } from '@expo/video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Параметры для useVideoEngine
 */
export interface UseVideoEngineParams {
  id: string; // listing id
  index: number; // feed index
  rawUrl: string | null | undefined;
  isVisible: boolean; // from FlatList onViewableItemsChanged (currentIndex === index)
  isFeedFocused: boolean; // Feed screen is in focus (tab)
}

/**
 * Результат useVideoEngine
 */
export interface UseVideoEngineResult {
  player: ReturnType<typeof useVideoPlayer> | null;
  shouldPlay: boolean;
  normalizedUrl: string;
  hasRealVideo: boolean;
  engineState: VideoState | undefined;
}

/**
 * Hook для интеграции видео с VideoEngine360V4
 *
 * OPTIMIZED VERSION:
 * - Uses event subscriptions instead of 100ms polling
 * - Global AppState is handled by VideoEngine singleton
 * - Consolidated effects for better performance
 *
 * Видео играет ТОЛЬКО когда:
 * 1. isFeedFocused === true (feed tab в фокусе)
 * 2. isVisible === true (currentIndex === index)
 * 3. AppState === 'active' (handled by engine)
 */
export function useVideoEngine(params: UseVideoEngineParams): UseVideoEngineResult {
  const { id, index, rawUrl, isVisible, isFeedFocused } = params;

  // Use stable ref for engine to avoid dependency issues
  const engineRef = useRef(getVideoEngine());
  const engine = engineRef.current;
  const mountedRef = useRef(true);

  // 1. Normalize URL ONCE (removed id from deps - not needed)
  const normalizedUrl = useMemo(() => {
    return normalizeVideoUrl(rawUrl);
  }, [rawUrl]);

  // 2. Check if real video
  const hasRealVideo = useMemo(() => {
    return isRealVideo(normalizedUrl);
  }, [normalizedUrl]);

  // 3. Create safe URL for player
  const safeUrl = useMemo(() => {
    if (typeof normalizedUrl !== 'string') {
      appLogger.error('[useVideoEngine] normalizedUrl is not a string!', {
        type: typeof normalizedUrl,
        value: String(normalizedUrl),
      });
      return PLACEHOLDER_VIDEO_URL;
    }
    let cleanUrl = normalizedUrl.trim();
    if (cleanUrl.includes('Optional(')) {
      cleanUrl = cleanUrl.replace(/Optional\(/g, '').replace(/\)/g, '').trim();
      if ((cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) ||
          (cleanUrl.startsWith("'") && cleanUrl.endsWith("'"))) {
        cleanUrl = cleanUrl.slice(1, -1).trim();
      }
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') &&
        !cleanUrl.startsWith('file://') && !cleanUrl.startsWith('content://') &&
        !cleanUrl.startsWith('asset://') && !cleanUrl.startsWith('blob:')) {
      appLogger.warn('[useVideoEngine] URL does not have valid protocol', {
        url: cleanUrl.substring(0, 50),
      });
      return PLACEHOLDER_VIDEO_URL;
    }

    return cleanUrl;
  }, [normalizedUrl]);

  // 4. Create player source - ALWAYS use { uri: string } format for both platforms
  const playerSource = useMemo(() => {
    if (!safeUrl || safeUrl.length === 0) {
      return null;
    }
    return { uri: safeUrl };
  }, [safeUrl]);

  // Android requires { uri: string } object, not just string
  const player = useVideoPlayer(playerSource as any);

  // 5. Track engine state via SUBSCRIPTION (not polling!)
  const [engineState, setEngineState] = useState<VideoState | undefined>(() =>
    engine.getState(id)
  );

  // 6. Track AppState from engine (global listener)
  const [appState, setAppState] = useState(() => engine.getAppState());

  // 7. Subscribe to video state changes (replaces 100ms polling)
  useEffect(() => {
    const unsubscribe = engine.subscribe(id, (state) => {
      if (mountedRef.current) {
        setEngineState(state);
      }
    });

    return unsubscribe;
  }, [id, engine]);

  // 8. Subscribe to global events (AppState changes)
  useEffect(() => {
    const unsubscribe = engine.subscribeGlobal((event: GlobalEngineEvent) => {
      if (!mountedRef.current) return;

      if (event.type === 'appStateChanged' && event.appState) {
        setAppState(event.appState);
      }
    });

    return unsubscribe;
  }, [engine]);

  // 9. CONSOLIDATED: Register video + attach player (single effect)
  useEffect(() => {
    mountedRef.current = true;

    if (!hasRealVideo) return;

    try {
      // Register video
      engine.registerOrUpdateVideo({
        id,
        index,
        url: normalizedUrl,
      });

      // Attach player if available
      if (player) {
        engine.setPlayer(id, player);
      }

      if (__DEV__) {
        appLogger.debug('[useVideoEngine] Video registered + player attached', {
          id,
          index,
          hasPlayer: !!player
        });
      }
    } catch (e: any) {
      appLogger.warn('[useVideoEngine] register error', { id, error: e?.message });
    }

    return () => {
      mountedRef.current = false;
      try {
        if (player) {
          player.pause();
        }
        engine.detachPlayer(id);
      } catch (e) {
        appLogger.warn('[useVideoEngine] cleanup error', { id, error: (e as any)?.message });
      }
    };
  }, [id, index, normalizedUrl, hasRealVideo, player, engine]);

  // 10. CONSOLIDATED: Visibility + feed focus handling (single effect)
  // AppState is now handled by engine globally
  useEffect(() => {
    if (!hasRealVideo) return;

    const shouldBeActive = isFeedFocused && isVisible && appState === 'active';

    if (shouldBeActive) {
      // Ensure player is attached before setting active
      if (player) {
        const state = engine.getState(id);
        if (!state?.player) {
          engine.setPlayer(id, player);
        }
      }
      engine.setActiveIndex(index);

      if (__DEV__) {
        appLogger.debug('[useVideoEngine] Set active', { id, index });
      }
    }
    // Note: Engine handles pausing when another video becomes active
  }, [isVisible, isFeedFocused, hasRealVideo, id, index, player, engine, appState]);

  // 11. Calculate shouldPlay (memoized)
  const shouldPlay = useMemo(() => {
    return hasRealVideo && isVisible && isFeedFocused && appState === 'active';
  }, [hasRealVideo, isVisible, isFeedFocused, appState]);

  return {
    player,
    shouldPlay,
    normalizedUrl,
    hasRealVideo,
    engineState,
  };
}
