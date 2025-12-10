// services/videoAnalytics.ts
// Video analytics service for tracking performance and usage

import { appLogger } from '@/utils/logger';

interface AnalyticsEvent {
  event: string;
  videoId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Video Analytics Service
 * Tracks video upload, playback, preload, and error events
 */
class VideoAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 100; // Keep last 100 events in memory

  /**
   * Track video upload
   */
  trackUpload(videoId: string, duration: number, success: boolean): void {
    const event: AnalyticsEvent = {
      event: 'video_upload',
      videoId,
      timestamp: Date.now(),
      metadata: {
        duration,
        success,
      },
    };

    this.addEvent(event);
    appLogger.debug('[VideoAnalytics] Upload tracked', { videoId, duration, success });
  }

  /**
   * Track video playback
   */
  trackPlayback(
    videoId: string,
    watchTime: number,
    totalDuration: number
  ): void {
    const event: AnalyticsEvent = {
      event: 'video_playback',
      videoId,
      timestamp: Date.now(),
      metadata: {
        watchTime,
        totalDuration,
        completionRate: totalDuration > 0 ? watchTime / totalDuration : 0,
      },
    };

    this.addEvent(event);
    appLogger.debug('[VideoAnalytics] Playback tracked', {
      videoId,
      watchTime,
      completionRate: event.metadata?.completionRate,
    });
  }

  /**
   * Track preload
   */
  trackPreload(videoId: string, success: boolean, duration?: number): void {
    const event: AnalyticsEvent = {
      event: 'video_preload',
      videoId,
      timestamp: Date.now(),
      metadata: {
        success,
        duration,
      },
    };

    this.addEvent(event);
    appLogger.debug('[VideoAnalytics] Preload tracked', { videoId, success });
  }

  /**
   * Track error
   */
  trackError(videoId: string, error: string, context?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      event: 'video_error',
      videoId,
      timestamp: Date.now(),
      metadata: {
        error,
        ...context,
      },
    };

    this.addEvent(event);
    appLogger.warn('[VideoAnalytics] Error tracked', { videoId, error });

    // Send to Sentry if available
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureException(new Error(error), {
    //     tags: { videoId },
    //     extra: context,
    //   });
    // }
  }

  /**
   * Track video load time
   */
  trackLoadTime(videoId: string, loadTime: number): void {
    const event: AnalyticsEvent = {
      event: 'video_load_time',
      videoId,
      timestamp: Date.now(),
      metadata: {
        loadTime,
      },
    };

    this.addEvent(event);
    appLogger.debug('[VideoAnalytics] Load time tracked', { videoId, loadTime });
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalUploads: number;
    totalPlaybacks: number;
    totalPreloads: number;
    totalErrors: number;
    averageLoadTime: number;
  } {
    const uploads = this.events.filter((e) => e.event === 'video_upload');
    const playbacks = this.events.filter((e) => e.event === 'video_playback');
    const preloads = this.events.filter((e) => e.event === 'video_preload');
    const errors = this.events.filter((e) => e.event === 'video_error');
    const loadTimes = this.events
      .filter((e) => e.event === 'video_load_time')
      .map((e) => e.metadata?.loadTime as number)
      .filter((t) => typeof t === 'number');

    const averageLoadTime =
      loadTimes.length > 0
        ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
        : 0;

    return {
      totalUploads: uploads.length,
      totalPlaybacks: playbacks.length,
      totalPreloads: preloads.length,
      totalErrors: errors.length,
      averageLoadTime,
    };
  }

  /**
   * Add event to queue
   */
  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);

    // Keep only last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // TODO: Send to analytics service (e.g., Yandex.Metrica, Google Analytics)
    // For now, we just log and keep in memory
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

// Singleton export
export const videoAnalytics = new VideoAnalyticsService();

