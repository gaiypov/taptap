// lib/video/videoEngine.ts — VIDEO ENGINE 360° V4
// Production-grade система управления видео для TikTok-style ленты
// Index-oriented control, preloading window, memory management, retry logic

import { appLogger } from '@/utils/logger';
import { useVideoPlayer } from '@expo/video';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { preloadManager } from './preloadManager';

// Type for Expo video player
type ExpoVideoPlayer = ReturnType<typeof useVideoPlayer>;

// Event types for state subscriptions
type VideoStateCallback = (state: VideoState) => void;
type GlobalEventCallback = (event: GlobalEngineEvent) => void;

export interface GlobalEngineEvent {
  type: 'activeIndexChanged' | 'appStateChanged' | 'cleanup';
  activeIndex: number | null;
  activeId: string | null;
  appState?: AppStateStatus;
}

/**
 * Конфигурация Video Engine V4
 */
export interface VideoEngineConfig {
  /** Количество видео для предзагрузки вперед */
  preloadAhead: number;
  /** Количество видео для предзагрузки назад */
  preloadBehind: number;
  /** Максимальное количество видео в памяти */
  maxCachedVideos: number;
  /** Время буферизации перед воспроизведением (мс) */
  bufferTimeMs: number;
  /** Таймаут для загрузки видео (мс) */
  loadTimeoutMs: number;
  /** Максимальное количество попыток повтора */
  maxRetries: number;
  /** Включить автоматическую паузу вне экрана */
  autoPauseOffScreen: boolean;
}

/**
 * Get device-aware config values
 * Adjusts memory thresholds based on platform and available resources
 * OPTIMIZED: Better buffer times for smoother playback
 */
function getDeviceAwareConfig(): VideoEngineConfig {
  // Base config
  const config: VideoEngineConfig = {
    preloadAhead: 2,
    preloadBehind: 1,
    maxCachedVideos: 5,
    bufferTimeMs: Platform.OS === 'ios' ? 800 : 1000, // Increased for smoother playback
    loadTimeoutMs: 10000,
    maxRetries: 3,
    autoPauseOffScreen: true,
  };

  // iOS typically has better memory management
  if (Platform.OS === 'ios') {
    config.maxCachedVideos = 7;
    config.preloadAhead = 3;
    config.bufferTimeMs = 800; // Increased from 500ms for better HLS preloading
  }

  // Android - more conservative settings for stability
  if (Platform.OS === 'android') {
    config.maxCachedVideos = 5;
    config.preloadAhead = 2;
    config.preloadBehind = 1; // Keep 1 behind for smooth back-swipe
    config.bufferTimeMs = 1000; // Increased from 800ms for better surface stability
    config.maxRetries = 4; // More retries on Android due to surface issues
  }

  return config;
}

/**
 * Дефолтная конфигурация (device-aware)
 */
const DEFAULT_CONFIG: VideoEngineConfig = getDeviceAwareConfig();

/**
 * Регистрация видео в Engine
 */
export interface VideoRegistration {
  id: string; // stable listing/video id
  index: number; // index in feed
  url: string; // already normalized URL
}

/**
 * Состояние видео в Engine
 */
export interface VideoState {
  id: string;
  index: number;
  url: string;
  player: ExpoVideoPlayer | null;
  isPreloaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  loadStartTime: number | null;
  error: Error | null;
  retryCount: number; // how many times we retried loading
  lastRetryTime: number | null;
}

/**
 * VIDEO ENGINE 360° V4
 * Управляет жизненным циклом всех видео в ленте на основе индексов
 */
export class VideoEngine360V4 {
  private config: VideoEngineConfig;
  private videoStates: Map<string, VideoState> = new Map();
  private videosByIndex: Map<number, string> = new Map();
  private activeIndex: number | null = null;
  private activeId: string | null = null;
  private cleanupCallbacks: Map<string, () => void> = new Map();
  private preloadDebounceTimer: ReturnType<typeof setTimeout> | null = null; // Debounce timer
  private setPlayerTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // Timer tracking for setPlayer
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // Timer tracking for play() retry

  // Event emitter for state subscriptions (replaces polling)
  private stateListeners: Map<string, Set<VideoStateCallback>> = new Map();
  private globalListeners: Set<GlobalEventCallback> = new Set();
  private pendingEmits: Set<string> = new Set(); // Batch state emissions
  private emitScheduled = false;

  // Global AppState tracking (single listener instead of per-card)
  private appState: AppStateStatus = 'active';
  private appStateSubscription: { remove: () => void } | null = null;

  // Scroll direction tracking for preload optimization
  private lastActiveIndex: number | null = null;
  private scrollDirection: 'up' | 'down' | 'none' = 'none';

  constructor(config: Partial<VideoEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupAppStateListener();
    if (__DEV__) {
      appLogger.info('[VideoEngine360V4] Initialized', { config: this.config });
    }
  }

  /**
   * Setup global AppState listener (single listener for all videos)
   */
  private setupAppStateListener(): void {
    this.appState = AppState.currentState;
    this.appStateSubscription = AppState.addEventListener('change', (nextState) => {
      const prevState = this.appState;
      this.appState = nextState;

      if (__DEV__) {
        appLogger.debug('[VideoEngine360V4] AppState changed', { prevState, nextState });
      }

      // Pause all when going to background
      if (nextState === 'background' || nextState === 'inactive') {
        this.pauseAll();
      }

      // Resume active video when returning to foreground
      if (prevState.match(/inactive|background/) && nextState === 'active') {
        if (this.activeId && this.activeIndex !== null) {
          const state = this.videoStates.get(this.activeId);
          if (state?.player) {
            this.play(this.activeId).catch(() => {});
          }
        }
      }

      // Emit global event
      this.emitGlobalEvent({
        type: 'appStateChanged',
        activeIndex: this.activeIndex,
        activeId: this.activeId,
        appState: nextState,
      });
    });
  }

  /**
   * Get current AppState
   */
  getAppState(): AppStateStatus {
    return this.appState;
  }

  /**
   * Subscribe to state changes for a specific video
   * Returns unsubscribe function
   */
  subscribe(id: string, callback: VideoStateCallback): () => void {
    if (!this.stateListeners.has(id)) {
      this.stateListeners.set(id, new Set());
    }
    this.stateListeners.get(id)!.add(callback);

    // Immediately emit current state
    const state = this.videoStates.get(id);
    if (state) {
      callback(state);
    }

    return () => {
      const listeners = this.stateListeners.get(id);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.stateListeners.delete(id);
        }
      }
    };
  }

  /**
   * Subscribe to global engine events
   */
  subscribeGlobal(callback: GlobalEventCallback): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /**
   * Emit state change for a video (batched for performance)
   */
  private emitStateChange(id: string): void {
    this.pendingEmits.add(id);
    this.scheduleEmit();
  }

  /**
   * Schedule batched emit using microtask
   */
  private scheduleEmit(): void {
    if (this.emitScheduled) return;
    this.emitScheduled = true;

    // Use queueMicrotask for batching (faster than setTimeout)
    queueMicrotask(() => {
      this.emitScheduled = false;
      const toEmit = Array.from(this.pendingEmits);
      this.pendingEmits.clear();

      for (const id of toEmit) {
        const state = this.videoStates.get(id);
        const listeners = this.stateListeners.get(id);
        if (state && listeners) {
          listeners.forEach(cb => {
            try {
              cb(state);
            } catch (e) {
              appLogger.warn('[VideoEngine360V4] State listener error', { id, error: e });
            }
          });
        }
      }
    });
  }

  /**
   * Emit global event
   */
  private emitGlobalEvent(event: GlobalEngineEvent): void {
    this.globalListeners.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        appLogger.warn('[VideoEngine360V4] Global listener error', { error: e });
      }
    });
  }

  /**
   * Register or update video in the engine.
   * Safe to call multiple times as feed re-renders.
   */
  registerOrUpdateVideo(reg: VideoRegistration): void {
    const existing = this.videoStates.get(reg.id);

    if (existing) {
      // Update existing registration
      if (existing.index !== reg.index) {
        // Index changed - update mappings
        this.videosByIndex.delete(existing.index);
        this.videosByIndex.set(reg.index, reg.id);
        existing.index = reg.index;
      }
      if (existing.url !== reg.url) {
        // URL changed - update state
        existing.url = reg.url;
        // Reset player if URL changed (React will recreate)
        if (existing.player) {
          try {
            existing.player.pause();
          } catch {
            // Ignore
          }
          existing.player = null;
        }
        existing.isPreloaded = false;
        existing.isPlaying = false;
        existing.isBuffering = false;
        existing.error = null;
        existing.retryCount = 0;
      }
    } else {
      // Register new video
      this.videoStates.set(reg.id, {
        id: reg.id,
        index: reg.index,
        url: reg.url,
        player: null,
        isPreloaded: false,
        isPlaying: false,
        isBuffering: false,
        loadStartTime: null,
        error: null,
        retryCount: 0,
        lastRetryTime: null,
      });
      this.videosByIndex.set(reg.index, reg.id);

      if (__DEV__) {
        appLogger.debug('[VideoEngine360V4] Video registered', {
          id: reg.id,
          index: reg.index,
          url: reg.url.substring(0, 50),
        });
      }
    }

    // Emit state change
    this.emitStateChange(reg.id);
  }

  /**
   * Update video index when feed data changes (filter, sort, etc).
   * Call this when items move positions in the feed.
   */
  updateVideoIndex(id: string, newIndex: number): void {
    const state = this.videoStates.get(id);
    if (!state) {
      if (__DEV__) {
        appLogger.warn('[VideoEngine360V4] Cannot update index for unregistered video', { id });
      }
      return;
    }

    const oldIndex = state.index;
    if (oldIndex === newIndex) return;

    // Update mappings
    this.videosByIndex.delete(oldIndex);
    this.videosByIndex.set(newIndex, id);
    state.index = newIndex;

    // If this was the active video, update activeIndex
    if (this.activeId === id) {
      this.activeIndex = newIndex;
    }

    // Recalculate preload window if needed
    if (this.activeIndex !== null) {
      this.cleanupDistantVideos();
    }

    if (__DEV__) {
      appLogger.debug('[VideoEngine360V4] Video index updated', { id, oldIndex, newIndex });
    }
  }

  /**
   * Attach or detach player instance.
   * Called from useVideoEngine hook.
   */
  setPlayer(id: string, player: ExpoVideoPlayer | null): void {
    const state = this.videoStates.get(id);
    if (!state) {
      if (__DEV__) {
        appLogger.warn('[VideoEngine360V4] Cannot set player for unregistered video', { id });
      }
      return;
    }

    // Detach old player if exists
    if (state.player && state.player !== player) {
      try {
        state.player.pause();
      } catch {
        // Ignore
      }
    }

    state.player = player;
    this.emitStateChange(id);

    if (__DEV__) {
      appLogger.debug('[VideoEngine360V4] Player set', {
        id,
        hasPlayer: !!player,
        isActive: this.activeId === id,
        activeId: this.activeId,
      });
    }

    // КРИТИЧНО: Если это активное видео и player готов, запускаем воспроизведение
    // Используем небольшую задержку для гарантии, что player полностью инициализирован
    if (player && this.activeId === id) {
      if (__DEV__) {
        appLogger.debug('[VideoEngine360V4] Active video player attached, will play', { id });
      }
      
      // Clear existing timer if any
      const existingTimer = this.setPlayerTimers.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      const timer = setTimeout(() => {
        this.setPlayerTimers.delete(id);
        // Double-check it's still active and player is still set
        if (this.activeId === id && state.player === player) {
          this.play(id).catch((error) => {
            appLogger.warn('[VideoEngine360V4] Play error in setPlayer', { id, error });
          });
        }
      }, this.config.bufferTimeMs);
      
      this.setPlayerTimers.set(id, timer);
    }
  }

  /**
   * Detach player but keep video registration.
   * Used in useEffect cleanup.
   */
  detachPlayer(id: string): void {
    const state = this.videoStates.get(id);
    if (!state) return;

    // Clear setPlayer timer if exists
    const setPlayerTimer = this.setPlayerTimers.get(id);
    if (setPlayerTimer) {
      clearTimeout(setPlayerTimer);
      this.setPlayerTimers.delete(id);
    }

    // Clear retry timer if exists
    const retryTimer = this.retryTimers.get(id);
    if (retryTimer) {
      clearTimeout(retryTimer);
      this.retryTimers.delete(id);
    }

    if (state.player) {
      try {
        state.player.pause();
      } catch {
        // Ignore
      }
      state.player = null;
    }

    state.isPlaying = false;
    state.isBuffering = false;

    if (__DEV__) {
      appLogger.debug('[VideoEngine360V4] Player detached', { id });
    }
  }

  /**
   * Set active index (from onViewableItemsChanged).
   * Triggers:
   * - Pause all except active
   * - Play active video
   * - Update preload window
   * - Cleanup distant videos
   * - Android warm-up for first video
   */
  setActiveIndex(index: number): void {
    if (this.activeIndex === index) return;

    const newActiveId = this.videosByIndex.get(index);
    if (!newActiveId) {
      // Это нормально при инициализации - видео могут еще не быть зарегистрированы
      // Не логируем warning, если это первый вызов (activeIndex === null) или индекс 0
      // Это предотвращает спам в логах при нормальной инициализации
      if (__DEV__ && this.activeIndex !== null && index !== 0) {
        appLogger.warn('[VideoEngine360V4] Active index not found', {
          index,
          availableIndices: Array.from(this.videosByIndex.keys()).sort((a, b) => a - b),
          totalVideos: this.videoStates.size,
        });
      }
      return;
    }

    // Track scroll direction for preload optimization
    if (this.lastActiveIndex !== null) {
      this.scrollDirection = index > this.lastActiveIndex ? 'down' : index < this.lastActiveIndex ? 'up' : 'none';
    }
    this.lastActiveIndex = this.activeIndex;

    // Pause all except new active
    this.pauseAllExcept(newActiveId);

    // Update active state
    const oldActiveId = this.activeId;
    this.activeIndex = index;
    this.activeId = newActiveId;

    // Android warm-up (cold start fix)
    if (Platform.OS === 'android') {
      const activeState = this.videoStates.get(newActiveId);
      if (activeState?.url) {
        // Use requestAnimationFrame for warm-up
        requestAnimationFrame(() => {
          try {
            preloadManager.warmUp(activeState.url);
          } catch (error) {
            if (__DEV__) {
              appLogger.warn('[VideoEngine360V4] Warm-up error', { error });
            }
          }
        });
      }
    }

    // Play active video if player is ready
    const activeState = this.videoStates.get(newActiveId);
    if (activeState?.player) {
      // Android guard: check if player has play method
      if (Platform.OS === 'android' && !activeState.player.play) {
        if (__DEV__) {
          appLogger.warn('[VideoEngine360V4] Android player missing play method', { id: newActiveId });
        }
        return;
      }
      
      if (__DEV__) {
        appLogger.debug('[VideoEngine360V4] Active video has player, calling play', { 
          id: newActiveId, 
          index 
        });
      }
      this.play(newActiveId).catch((error) => {
        appLogger.warn('[VideoEngine360V4] Play error in setActiveIndex', { id: newActiveId, error });
      });
    } else {
      if (__DEV__) {
        appLogger.debug('[VideoEngine360V4] Active video player not ready yet', { 
          id: newActiveId, 
          index,
          willPlayWhenPlayerAttached: true,
        });
      }
      // Player will be attached later via setPlayer, which will trigger play()
    }

    // Update preload window and cleanup
    this.cleanupDistantVideos();

    // Trigger preloading for videos around new index (debounced)
    this.debouncedPreloadVideos();

    if (__DEV__) {
      appLogger.debug('[VideoEngine360V4] Active index changed', {
        index,
        videoId: newActiveId,
        oldVideoId: oldActiveId,
        scrollDirection: this.scrollDirection,
      });
    }

    // Emit global event for active index change
    this.emitGlobalEvent({
      type: 'activeIndexChanged',
      activeIndex: index,
      activeId: newActiveId,
      appState: this.appState,
    });

    // Emit state changes for old and new active videos
    if (oldActiveId) {
      this.emitStateChange(oldActiveId);
    }
    this.emitStateChange(newActiveId);
  }

  /**
   * Get scroll direction for preload optimization
   */
  getScrollDirection(): 'up' | 'down' | 'none' {
    return this.scrollDirection;
  }

  /**
   * Get preload indices (config-based, no cache to avoid stale state)
   */
  private getPreloadIndices(currentIndex: number): number[] {
    const indices: number[] = [];
    
    // Current index (highest priority)
    indices.push(currentIndex);
    
    // Preload ahead (next videos)
    for (let i = 1; i <= this.config.preloadAhead; i++) {
      indices.push(currentIndex + i);
    }
    
    // Preload behind (previous videos)
    for (let i = 1; i <= this.config.preloadBehind; i++) {
      const prevIndex = currentIndex - i;
      if (prevIndex >= 0) {
        indices.push(prevIndex);
      }
    }
    
    return indices;
  }

  /**
   * Debounced preload videos (avoids rapid-fire preloads)
   */
  private debouncedPreloadVideos(): void {
    // Clear existing timer
    if (this.preloadDebounceTimer) {
      clearTimeout(this.preloadDebounceTimer);
    }

    // Set new timer (100ms debounce)
    this.preloadDebounceTimer = setTimeout(() => {
      this.preloadVideos();
      this.preloadDebounceTimer = null;
    }, 100);
  }

  /**
   * Preload videos around current index (passes scroll direction for optimization)
   */
  private async preloadVideos(): Promise<void> {
    if (this.activeIndex === null) return;

    // Get preload indices (config-based)
    const indices = this.getPreloadIndices(this.activeIndex);

    // Get videos from engine (batch)
    const videos: { id: string; hlsUrl: string }[] = [];

    for (const index of indices) {
      const videoId = this.videosByIndex.get(index);
      if (!videoId) continue;

      const state = this.videoStates.get(videoId);
      if (!state || !state.url) continue;

      videos.push({
        id: videoId,
        hlsUrl: state.url,
      });
    }

    if (videos.length === 0) return;

    // Trigger preload manager with scroll direction (fire and forget)
    try {
      await preloadManager.preloadForIndex(this.activeIndex, videos, this.scrollDirection);
    } catch (error) {
      appLogger.warn('[VideoEngine360V4] Preload error', { error });
    }
  }

  /**
   * Pause all videos except the specified id.
   * Internal helper used by setActiveIndex.
   */
  /**
   * Pause all videos (used when app goes to background or user leaves feed)
   */
  pauseAll(): void {
    this.videoStates.forEach((state) => {
      if (state.player && state.isPlaying) {
        try {
          state.player.pause();
          state.isPlaying = false;
        } catch {
          // Ignore pause errors
        }
      }
    });
  }

  pauseAllExcept(exceptId: string): void {
    this.videoStates.forEach((state, id) => {
      if (id !== exceptId && state.isPlaying && state.player) {
        try {
          state.player.pause();
          state.isPlaying = false;
          state.isBuffering = false;
        } catch (error) {
          if (__DEV__) {
            appLogger.warn('[VideoEngine360V4] Error pausing video', { id, error });
          }
        }
      }
    });
  }

  /**
   * Play specific video with retry logic.
   * Android-safe with guards for surface lost / background.
   */
  async play(id: string): Promise<void> {
    const state = this.videoStates.get(id);
    if (!state?.player) {
      // Mark as preloaded for future play
      if (state) {
        state.isPreloaded = true;
      }
      return;
    }

    // Android guard: check if player has play method
    if (Platform.OS === 'android' && !state.player.play) {
      if (__DEV__) {
        appLogger.warn('[VideoEngine360V4] Android player missing play method (surface lost?)', { id });
      }
      return;
    }

    try {
      state.isBuffering = true;
      state.loadStartTime = Date.now();

      await state.player.play();

      state.isPlaying = true;
      state.isBuffering = false;
      state.error = null;
      state.retryCount = 0;
      state.lastRetryTime = null;
      this.emitStateChange(id);

      if (__DEV__) {
        appLogger.debug('[VideoEngine360V4] Video playing', { id, index: state.index });
      }
    } catch (error) {
      state.isPlaying = false;
      state.isBuffering = false;
      state.error = error as Error;
      state.retryCount++;
      state.lastRetryTime = Date.now();
      this.emitStateChange(id);

      // Android-specific: detect surface lost errors
      const errorMsg = String(error);
      const isAndroidSurfaceError = Platform.OS === 'android' && (
        errorMsg.includes('surface') ||
        errorMsg.includes('Surface') ||
        errorMsg.includes('destroyed') ||
        errorMsg.includes('released') ||
        errorMsg.includes('null')
      );

      if (isAndroidSurfaceError) {
        appLogger.warn('[VideoEngine360V4] Android surface error detected', { id, error: errorMsg });
        // For surface errors, detach player and wait for component to recreate it
        state.player = null;
        state.isPlaying = false;
        state.isBuffering = false;
        this.emitStateChange(id);
        return; // Don't retry with broken player
      }

      appLogger.warn('[VideoEngine360V4] Play failed', {
        id,
        retryCount: state.retryCount,
        error,
      });

      // Auto-retry with exponential backoff
      if (state.retryCount <= this.config.maxRetries) {
        const backoffMs = Math.pow(2, state.retryCount - 1) * 1000; // 1s, 2s, 4s

        // Clear existing retry timer if any
        const existingTimer = this.retryTimers.get(id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          this.retryTimers.delete(id);
          // Double-check it's still active before retrying
          if (this.activeId === id && state.player) {
            // Android: verify player is still valid before retry
            if (Platform.OS === 'android') {
              if (!state.player.play || typeof state.player.play !== 'function') {
                if (__DEV__) {
                  appLogger.warn('[VideoEngine360V4] Skipping retry - player invalid', { id });
                }
                // Detach invalid player
                state.player = null;
                this.emitStateChange(id);
                return;
              }
            }
            this.play(id);
          }
        }, backoffMs);

        this.retryTimers.set(id, timer);
      } else {
        appLogger.error('[VideoEngine360V4] Max retries exceeded', { id });
        // Fallback to poster/placeholder handled by component
      }
    }
  }

  /**
   * Pause specific video.
   */
  pause(id: string): void {
    const state = this.videoStates.get(id);
    if (!state || !state.player || !state.isPlaying) return;

    try {
      state.player.pause();
      state.isPlaying = false;
      state.isBuffering = false;
      this.emitStateChange(id);

      if (__DEV__) {
        appLogger.debug('[VideoEngine360V4] Video paused', { id, index: state.index });
      }
    } catch (error) {
      appLogger.warn('[VideoEngine360V4] Pause error', { id, error });
    }
  }

  /**
   * Clear all state (called on feed unmount).
   */
  clear(): void {
    // Pause and detach all players
    this.videoStates.forEach((state) => {
      if (state.player) {
        try {
          state.player.pause();
        } catch {
          // Ignore
        }
        state.player = null;
      }
    });

    // Call all cleanup callbacks
    this.cleanupCallbacks.forEach((cleanup) => {
      try {
        cleanup();
      } catch {
        // Ignore cleanup errors
      }
    });
    this.cleanupCallbacks.clear();

    // Clear debounce timer
    if (this.preloadDebounceTimer) {
      clearTimeout(this.preloadDebounceTimer);
      this.preloadDebounceTimer = null;
    }

    // Clear all setPlayer timers
    this.setPlayerTimers.forEach(timer => clearTimeout(timer));
    this.setPlayerTimers.clear();

    // Clear all retry timers
    this.retryTimers.forEach(timer => clearTimeout(timer));
    this.retryTimers.clear();

    // Clear event listeners
    this.stateListeners.clear();
    this.globalListeners.clear();
    this.pendingEmits.clear();
    this.emitScheduled = false;

    // Clear all maps
    this.videoStates.clear();
    this.videosByIndex.clear();
    this.activeIndex = null;
    this.activeId = null;
    this.lastActiveIndex = null;
    this.scrollDirection = 'none';

    // Emit cleanup event before clearing
    this.emitGlobalEvent({
      type: 'cleanup',
      activeIndex: null,
      activeId: null,
    });

    if (__DEV__) {
      appLogger.info('[VideoEngine360V4] Cleared all videos');
    }
  }

  /**
   * Destroy engine (cleanup AppState listener)
   */
  destroy(): void {
    this.clear();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Get state for specific video.
   */
  getState(id: string): VideoState | undefined {
    return this.videoStates.get(id);
  }

  /**
   * Get engine statistics for debugging.
   */
  getStats(): {
    totalVideos: number;
    activeIndex: number | null;
    activeId: string | null;
    cachedIds: string[];
    preloadWindowIndices: number[];
  } {
    const preloadWindowIndices: number[] = [];
    if (this.activeIndex !== null) {
      for (
        let i = this.activeIndex - this.config.preloadBehind;
        i <= this.activeIndex + this.config.preloadAhead;
        i++
      ) {
        if (i >= 0 && this.videosByIndex.has(i)) {
          preloadWindowIndices.push(i);
        }
      }
    }

    return {
      totalVideos: this.videoStates.size,
      activeIndex: this.activeIndex,
      activeId: this.activeId,
      cachedIds: Array.from(this.videoStates.keys()),
      preloadWindowIndices,
    };
  }

  /**
   * Register cleanup callback for specific video.
   * Called when video is removed from engine.
   */
  registerCleanup(id: string, callback: () => void): void {
    this.cleanupCallbacks.set(id, callback);
  }

  /**
   * Cleanup distant videos outside preload window.
   * OPTIMIZED: Uses Set for O(1) lookup, defers heavy cleanup with requestIdleCallback
   */
  private cleanupDistantVideos(): void {
    if (this.activeIndex === null) return;

    const activeIdx = this.activeIndex;

    // Calculate preload window (Set for O(1) lookup)
    const windowStart = Math.max(0, activeIdx - this.config.preloadBehind);
    const windowEnd = activeIdx + this.config.preloadAhead;
    const preloadWindow = new Set<number>();
    for (let i = windowStart; i <= windowEnd; i++) {
      preloadWindow.add(i);
    }

    // Collect videos outside window with their distances (avoid recalculation in sort)
    const outsideWindow: { id: string; distance: number }[] = [];

    this.videoStates.forEach((state, id) => {
      if (!preloadWindow.has(state.index)) {
        // Pause player immediately (important for performance)
        if (state.player) {
          try {
            state.player.pause();
          } catch {
            // Ignore
          }
          state.player = null;
        }
        state.isPlaying = false;
        state.isBuffering = false;
        this.emitStateChange(id);

        // Store with pre-calculated distance
        outsideWindow.push({
          id,
          distance: Math.abs(state.index - activeIdx),
        });
      }
    });

    // Check if we need to remove videos (over limit)
    const toRemoveCount = this.videoStates.size - this.config.maxCachedVideos;
    if (toRemoveCount <= 0 || outsideWindow.length === 0) return;

    // Sort by distance (furthest first) - O(k log k) where k = outside videos
    outsideWindow.sort((a, b) => b.distance - a.distance);

    // Defer actual removal to idle time to avoid blocking UI
    const videosToRemove = outsideWindow.slice(0, toRemoveCount).map(v => v.id);

    // Use requestIdleCallback if available, otherwise setTimeout
    const scheduleCleanup = (typeof requestIdleCallback === 'function')
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 0);

    scheduleCleanup(() => {
      for (const id of videosToRemove) {
        // Skip if video became active during wait
        if (this.activeId === id) continue;

        // Call cleanup callback if registered
        const cleanup = this.cleanupCallbacks.get(id);
        if (cleanup) {
          try {
            cleanup();
          } catch {
            // Ignore cleanup errors
          }
          this.cleanupCallbacks.delete(id);
        }

        // Remove from maps
        const state = this.videoStates.get(id);
        if (state) {
          this.videosByIndex.delete(state.index);
          this.videoStates.delete(id);
          this.stateListeners.delete(id); // Clean up listeners too
        }

        if (__DEV__) {
          appLogger.debug('[VideoEngine360V4] Cleaned up distant video', { id });
        }
      }
    });
  }
}

/**
 * Глобальный экземпляр Video Engine V4 (singleton)
 */
let globalEngine: VideoEngine360V4 | null = null;

/**
 * Получает глобальный экземпляр Video Engine V4
 */
export function getVideoEngine(): VideoEngine360V4 {
  if (!globalEngine) {
    globalEngine = new VideoEngine360V4();
  }
  return globalEngine;
}

/**
 * Сбрасывает глобальный Video Engine V4 (для тестов)
 */
export function resetVideoEngineForTests(): void {
  if (globalEngine) {
    globalEngine.clear();
  }
  globalEngine = null;
}
