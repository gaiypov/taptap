// backend/services/yandex/yandexCDN.ts

/**
 * Yandex Cloud CDN Management
 * For optimized video delivery in CIS region
 */

export class YandexCDNService {
  private cdnDomain: string;
  private channelId: string;

  constructor() {
    this.cdnDomain = process.env.YANDEX_CDN_DOMAIN || 'video.cloud.yandex.net';
    this.channelId = process.env.YANDEX_VIDEO_CHANNEL_ID || '';

    if (!this.channelId) {
      console.warn('[CDN] YANDEX_VIDEO_CHANNEL_ID not set, CDN URLs may be incorrect');
    }
  }

  /**
   * Get CDN URL for video HLS stream
   */
  getVideoURL(videoId: string): string {
    if (this.cdnDomain.includes('cdn.yandex.net')) {
      // Custom CDN domain
      return `https://${this.cdnDomain}/videos/${this.channelId}/${videoId}/master.m3u8`;
    }
    
    // Default Yandex Cloud Video domain
    return `https://${this.cdnDomain}/${this.channelId}/${videoId}/master.m3u8`;
  }

  /**
   * Get CDN URL for thumbnail
   */
  getThumbnailURL(videoId: string): string {
    if (this.cdnDomain.includes('cdn.yandex.net')) {
      return `https://${this.cdnDomain}/thumbnails/${this.channelId}/${videoId}.jpg`;
    }
    
    return `https://${this.cdnDomain}/${this.channelId}/${videoId}/thumbnail.jpg`;
  }

  /**
   * Get CDN URL for MP4 (if available)
   */
  getMP4URL(videoId: string): string {
    if (this.cdnDomain.includes('cdn.yandex.net')) {
      return `https://${this.cdnDomain}/videos/${this.channelId}/${videoId}/video.mp4`;
    }
    
    return `https://${this.cdnDomain}/${this.channelId}/${videoId}/video.mp4`;
  }

  /**
   * Purge CDN cache for video (if supported)
   * Note: This requires Yandex Cloud CDN API access
   */
  async purgeCache(videoId: string): Promise<void> {
    // TODO: Implement CDN cache purge via Yandex Cloud API
    // This requires additional API setup
    console.log(`[CDN] Cache purge requested for video: ${videoId}`);
    console.log(`[CDN] Note: Cache purge API not yet implemented`);
  }

  /**
   * Check if CDN is configured
   */
  isConfigured(): boolean {
    return !!this.cdnDomain && !!this.channelId;
  }
}

export const yandexCDN = new YandexCDNService();

