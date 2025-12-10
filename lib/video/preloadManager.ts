// lib/video/preloadManager.ts
// PreloadManager for TikTok-style video feed
// OPTIMIZED: Uses GET with Range for actual segment preloading, direction-aware
// Preloads HLS manifests and segments for smooth playback

import { appLogger } from '@/utils/logger';
import { videoAnalytics } from '@/services/videoAnalytics';
import NetInfo from '@react-native-community/netinfo';

interface PreloadItem {
  videoId: string;
  hlsUrl: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'loading' | 'loaded' | 'error';
  manifest?: string;
  segments?: string[];
  loadedAt?: number;
}

interface VideoInfo {
  id: string;
  hlsUrl: string;
}

// Preload config
const PRELOAD_CONFIG = {
  // Segment preload size (100KB for fast start)
  SEGMENT_PRELOAD_BYTES: 102400,
  // Max concurrent preloads
  MAX_CONCURRENT: 3,
  // Cache TTL (5 minutes)
  CACHE_TTL_MS: 300000,
};

/**
 * PreloadManager for TikTok-style video feed
 * Preloads HLS manifests and segments for smooth playback
 */
class PreloadManager {
  private cache = new Map<string, PreloadItem>();
  private maxCacheSize = 10; // Max videos in cache
  private isWiFi = true;
  private networkUnsubscribe: (() => void) | null = null;
  private pendingRequests = new Map<string, Promise<void>>(); // Request deduplication
  private activePreloads = 0; // Track concurrent preloads
  private preloadQueue: Array<{ videoId: string; hlsUrl: string; priority: 'high' | 'medium' | 'low' }> = [];

  constructor() {
    this.monitorNetworkType();
  }

  /**
   * Warm-up for Android cold start (preload first segment immediately)
   */
  async warmUp(hlsUrl: string): Promise<void> {
    try {
      // Fetch manifest to trigger DNS resolution and connection warm-up
      await fetch(hlsUrl, {
        method: 'HEAD',
        headers: {
          'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, text/plain',
        },
      }).catch(() => {
        // Ignore errors - warm-up is best-effort
      });
    } catch {
      // Ignore all errors - warm-up should never fail playback
    }
  }

  /**
   * Preload videos around current index (direction-aware)
   * @param scrollDirection - 'up' | 'down' | 'none' from VideoEngine
   */
  async preloadForIndex(
    currentIndex: number,
    videos: VideoInfo[],
    scrollDirection: 'up' | 'down' | 'none' = 'none'
  ): Promise<void> {
    if (videos.length === 0) return;

    // Direction-aware preload window
    // Prioritize forward when scrolling down, backward when scrolling up
    const preloadIndices: number[] = [currentIndex]; // Current always highest priority

    if (scrollDirection === 'down' || scrollDirection === 'none') {
      // Scrolling down - prioritize next videos
      preloadIndices.push(currentIndex + 1); // Next (high)
      preloadIndices.push(currentIndex + 2); // Next+1 (high)
      preloadIndices.push(currentIndex - 1); // Previous (medium)
      if (this.isWiFi) {
        preloadIndices.push(currentIndex + 3); // Future (low - WiFi only)
      }
    } else {
      // Scrolling up - prioritize previous videos
      preloadIndices.push(currentIndex - 1); // Previous (high)
      preloadIndices.push(currentIndex - 2); // Previous-1 (high)
      preloadIndices.push(currentIndex + 1); // Next (medium)
      if (this.isWiFi) {
        preloadIndices.push(currentIndex - 3); // Past (low - WiFi only)
      }
    }

    // Cleanup old cache
    this.cleanupCache(preloadIndices, videos);

    // Build priority queue
    const toPreload: Array<{ videoId: string; hlsUrl: string; priority: 'high' | 'medium' | 'low' }> = [];

    for (const index of preloadIndices) {
      if (index < 0 || index >= videos.length) continue;

      const video = videos[index];
      const priority = this.getPriorityDirectionAware(index, currentIndex, scrollDirection);

      // Skip low priority on cellular
      if (!this.isWiFi && priority === 'low') continue;

      // Skip already loaded
      const cached = this.cache.get(video.id);
      if (cached?.status === 'loaded') {
        cached.priority = priority; // Update priority
        continue;
      }

      toPreload.push({ videoId: video.id, hlsUrl: video.hlsUrl, priority });
    }

    // Sort by priority (high first)
    toPreload.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

    // Add to queue and process
    this.preloadQueue = toPreload;
    this.processQueue();
  }

  /**
   * Process preload queue with concurrency limit
   */
  private async processQueue(): Promise<void> {
    while (this.preloadQueue.length > 0 && this.activePreloads < PRELOAD_CONFIG.MAX_CONCURRENT) {
      const item = this.preloadQueue.shift();
      if (!item) break;

      this.activePreloads++;
      this.preloadVideo(item.videoId, item.hlsUrl, item.priority)
        .finally(() => {
          this.activePreloads--;
          // Process next in queue
          this.processQueue();
        });
    }
  }

  /**
   * Get priority based on direction
   */
  private getPriorityDirectionAware(
    index: number,
    currentIndex: number,
    scrollDirection: 'up' | 'down' | 'none'
  ): 'high' | 'medium' | 'low' {
    const distance = Math.abs(index - currentIndex);
    const isForward = index > currentIndex;

    if (distance === 0) return 'high'; // Current

    if (scrollDirection === 'down' || scrollDirection === 'none') {
      // Scrolling down - forward is high priority
      if (isForward && distance <= 2) return 'high';
      if (!isForward && distance === 1) return 'medium';
    } else {
      // Scrolling up - backward is high priority
      if (!isForward && distance <= 2) return 'high';
      if (isForward && distance === 1) return 'medium';
    }

    return 'low';
  }

  /**
   * Preload single video
   * Includes request deduplication to avoid duplicate requests
   */
  private async preloadVideo(
    videoId: string,
    hlsUrl: string,
    priority: 'high' | 'medium' | 'low'
  ): Promise<void> {
    // Check cache
    if (this.cache.has(videoId)) {
      const cached = this.cache.get(videoId)!;
      if (cached.status === 'loaded') {
        // Update priority if needed
        if (cached.priority !== priority) {
          cached.priority = priority;
        }
        return; // Already loaded
      }
      if (cached.status === 'loading') {
        // Already loading, update priority
        cached.priority = priority;
        // Return existing promise if available
        if (this.pendingRequests.has(videoId)) {
          return this.pendingRequests.get(videoId)!;
        }
      }
    }

    // Check for pending request (deduplication)
    if (this.pendingRequests.has(videoId)) {
      return this.pendingRequests.get(videoId)!;
    }

    // Add to cache
    this.cache.set(videoId, {
      videoId,
      hlsUrl,
      priority,
      status: 'loading',
    });

    // Create and store promise for deduplication
    const preloadPromise = this._preloadVideoInternal(videoId, hlsUrl, priority);
    this.pendingRequests.set(videoId, preloadPromise);

    try {
      await preloadPromise;
    } finally {
      this.pendingRequests.delete(videoId);
    }
  }

  /**
   * Internal preload implementation
   */
  private async _preloadVideoInternal(
    videoId: string,
    hlsUrl: string,
    priority: 'high' | 'medium' | 'low'
  ): Promise<void> {
    try {
      // 1. Fetch HLS manifest (master.m3u8)
      const manifestResponse = await fetch(hlsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, text/plain',
        },
      });

      if (!manifestResponse.ok) {
        throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
      }

      const manifestText = await manifestResponse.text();

      // 2. Parse manifest to get segment URLs
      const segments = this.parseHLSManifest(manifestText, hlsUrl);

      // 3. Preload first 2 segments with actual content (not just HEAD)
      // Use GET with Range header to cache content in browser/native HTTP cache
      if (priority === 'high' && segments.length > 0) {
        const segmentPromises: Promise<void>[] = [];

        // Preload first segment (always) - GET with Range for actual caching
        segmentPromises.push(
          fetch(segments[0], {
            method: 'GET',
            headers: {
              'Range': `bytes=0-${PRELOAD_CONFIG.SEGMENT_PRELOAD_BYTES}`,
            },
          }).then(response => {
            // Read the response to trigger caching
            if (response.ok || response.status === 206) {
              return response.arrayBuffer().then(() => undefined);
            }
          }).catch(() => {
            // Ignore errors, just prefetch
          })
        );

        // Preload second segment if available (smaller range)
        if (segments[1]) {
          segmentPromises.push(
            fetch(segments[1], {
              method: 'GET',
              headers: {
                'Range': `bytes=0-${Math.floor(PRELOAD_CONFIG.SEGMENT_PRELOAD_BYTES / 2)}`,
              },
            }).then(response => {
              if (response.ok || response.status === 206) {
                return response.arrayBuffer().then(() => undefined);
              }
            }).catch(() => {
              // Ignore errors
            })
          );
        }

        // Fire and forget segment preloads
        Promise.all(segmentPromises).catch(() => {
          // Ignore errors
        });
      }

      // Update cache
      this.cache.set(videoId, {
        videoId,
        hlsUrl,
        priority,
        status: 'loaded',
        manifest: manifestText,
        segments,
        loadedAt: Date.now(),
      });

      if (__DEV__) {
        appLogger.debug('[PreloadManager] Preloaded', {
          videoId,
          priority,
          segmentsCount: segments.length,
        });
      }

      // Track success for analytics (static import - no async overhead)
      try {
        videoAnalytics.trackPreload(videoId, true);
      } catch {
        // Analytics not critical, ignore errors
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      appLogger.warn('[PreloadManager] Preload failed', {
        videoId,
        error: errorMessage,
      });

      this.cache.set(videoId, {
        videoId,
        hlsUrl,
        priority,
        status: 'error',
      });

      // Track failure for analytics (static import - no async overhead)
      try {
        videoAnalytics.trackPreload(videoId, false);
      } catch {
        // Analytics not critical, ignore errors
      }

      // Don't throw - preload failures shouldn't break playback
      // The video will still load when needed
    }
  }

  /**
   * Parse HLS manifest to extract segment URLs
   */
  private parseHLSManifest(manifestText: string, baseUrl: string): string[] {
    const segments: string[] = [];
    const lines = manifestText.split('\n');

    // Find base URL
    let base = baseUrl;
    const baseMatch = manifestText.match(/^#EXT-X-STREAM-INF:.*\n(.+)$/m);
    if (baseMatch) {
      base = new URL(baseMatch[1], baseUrl).toString();
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Check for .ts or .m4s segments
      if (trimmed.endsWith('.ts') || trimmed.endsWith('.m4s')) {
        // Relative URL → absolute URL
        const segmentUrl = trimmed.startsWith('http')
          ? trimmed
          : new URL(trimmed, base).toString();
        segments.push(segmentUrl);
      }
    }

    return segments;
  }

  /**
   * Handle memory pressure by clearing low-priority cache
   */
  private handleMemoryPressure(): void {
    // Clear low-priority cache on memory warning
    const lowPriorityVideos = Array.from(this.cache.entries())
      .filter(([_, item]) => item.priority === 'low')
      .map(([id]) => id);

    lowPriorityVideos.forEach((id) => {
      this.cache.delete(id);
      // Also cancel pending requests if any
      this.pendingRequests.delete(id);
    });

    if (lowPriorityVideos.length > 0 && __DEV__) {
      appLogger.debug(
        `[PreloadManager] Cleared ${lowPriorityVideos.length} low-priority items due to memory pressure`
      );
    }
  }

  /**
   * Cleanup old cache entries
   */
  private cleanupCache(
    keepIndices: number[],
    videos: VideoInfo[]
  ): void {
    const keepIds = new Set(
      keepIndices
        .filter((i) => i >= 0 && i < videos.length)
        .map((i) => videos[i].id)
    );

    // Remove videos not in keep list
    for (const [videoId] of this.cache.entries()) {
      if (!keepIds.has(videoId)) {
        this.cache.delete(videoId);
        if (__DEV__) {
          appLogger.debug('[PreloadManager] Removed from cache', { videoId });
        }
      }
    }

    // Enforce max cache size
    if (this.cache.size > this.maxCacheSize) {
      const entriesToRemove = this.cache.size - this.maxCacheSize;
      const entries = Array.from(this.cache.entries());

      // Remove lowest priority entries
      entries
        .sort((a, b) => {
          const priorityOrder = { low: 0, medium: 1, high: 2 };
          return (
            priorityOrder[a[1].priority] - priorityOrder[b[1].priority]
          );
        })
        .slice(0, entriesToRemove)
        .forEach(([videoId]) => {
          this.cache.delete(videoId);
        });
    }
  }

  /**
   * Monitor network type (WiFi vs cellular)
   */
  private monitorNetworkType(): void {
    try {
      NetInfo.addEventListener((state) => {
        const wasWiFi = this.isWiFi;
        this.isWiFi = state.type === 'wifi' || state.type === 'ethernet';

        if (wasWiFi !== this.isWiFi && __DEV__) {
          appLogger.debug('[PreloadManager] Network changed', {
            type: state.type,
            isWiFi: this.isWiFi,
          });
        }
      });
    } catch (error) {
      appLogger.warn('[PreloadManager] NetInfo not available, assuming WiFi', { error });
      this.isWiFi = true; // Assume WiFi by default
    }
  }

  /**
   * Check if video is preloaded
   */
  isPreloaded(videoId: string): boolean {
    const item = this.cache.get(videoId);
    return item?.status === 'loaded';
  }

  /**
   * Get preload status
   */
  getPreloadStatus(videoId: string): PreloadItem | null {
    return this.cache.get(videoId) || null;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    if (__DEV__) {
      appLogger.debug('[PreloadManager] Cache cleared');
    }
  }

  /**
   * Get memory pressure and clear if needed
   */
  checkMemoryPressure(): void {
    // If cache is getting large, clear low-priority items
    if (this.cache.size > this.maxCacheSize * 1.5) {
      this.handleMemoryPressure();
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats(): {
    size: number;
    loaded: number;
    loading: number;
    error: number;
  } {
    let loaded = 0;
    let loading = 0;
    let error = 0;

    for (const item of this.cache.values()) {
      if (item.status === 'loaded') loaded++;
      else if (item.status === 'loading') loading++;
      else if (item.status === 'error') error++;
    }

    return {
      size: this.cache.size,
      loaded,
      loading,
      error,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
    this.clearCache();
  }
}

// Singleton export
export const preloadManager = new PreloadManager();

