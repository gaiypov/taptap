// backend/services/migration/videoMigration.ts

/**
 * Video Migration Service
 * Migrates videos from api.video to Yandex Cloud Video
 */

import { serviceSupabase } from '../supabaseClient';
import { getYandexVideoService } from '../yandex/yandexCloudVideo';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface MigrationStatus {
  total: number;
  migrated: number;
  failed: number;
  inProgress: number;
  apivideo: number;
  yandex: number;
}

interface MigrationResult {
  success: boolean;
  videoId?: string;
  error?: string;
}

export class VideoMigrationService {
  private yandexVideo = getYandexVideoService();
  private tempDir = path.join(process.cwd(), 'temp', 'migration');

  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Migrate single video
   */
  async migrateVideo(listingId: string): Promise<MigrationResult> {
    try {
      console.log(`[Migration] Starting migration for listing: ${listingId}`);

      // 1. Get listing with api.video video_id
      const { data: listing, error: listingError } = await serviceSupabase
        .from('listings')
        .select('id, title, video_id, video_url, video_provider')
        .eq('id', listingId)
        .single();

      if (listingError || !listing) {
        throw new Error(`Listing not found: ${listingId}`);
      }

      // Check if already migrated
      if (listing.video_provider === 'yandex') {
        console.log(`[Migration] Listing ${listingId} already migrated to Yandex`);
        return { success: true, videoId: listing.video_id || undefined };
      }

      if (!listing.video_id) {
        console.log(`[Migration] No video for listing: ${listingId}`);
        return { success: false, error: 'No video_id found' };
      }

      // 2. Download video from api.video
      console.log(`[Migration] Downloading video from api.video: ${listing.video_id}`);
      const videoPath = await this.downloadFromApiVideo(listing.video_id);

      try {
        // 3. Upload to Yandex Cloud Video
        console.log(`[Migration] Uploading to Yandex: ${listing.title}`);
        const fileSize = fs.statSync(videoPath).size;

        const { videoId, uploadUrl } = await this.yandexVideo.createVideo({
          title: listing.title || `Listing ${listingId}`,
          fileSize,
          fileName: `${listing.id}.mp4`,
          isPublic: true,
        });

        // Upload with progress
        await this.yandexVideo.uploadVideo(uploadUrl, videoPath, (progress) => {
          if (progress % 25 === 0) {
            console.log(`[Migration] Upload progress: ${progress}%`);
          }
        });

        // 4. Wait for processing
        console.log(`[Migration] Waiting for video processing: ${videoId}`);
        const status = await this.yandexVideo.waitForReady(videoId, 600000); // 10 minutes timeout

        if (status.status !== 'READY') {
          throw new Error(`Video processing failed: ${status.status}`);
        }

        // 5. Update database
        const { error: updateError } = await serviceSupabase
          .from('listings')
          .update({
            video_id: videoId,
            video_url: status.hlsUrl,
            video_hls_url: status.hlsUrl,
            video_provider: 'yandex',
            video_status: 'ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', listingId);

        if (updateError) {
          throw new Error(`Failed to update database: ${updateError.message}`);
        }

        console.log(`[Migration] Successfully migrated listing: ${listingId} -> ${videoId}`);

        return { success: true, videoId };
      } finally {
        // 6. Cleanup temp file
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }
    } catch (error) {
      console.error(`[Migration] Failed for ${listingId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download video from api.video
   */
  private async downloadFromApiVideo(videoId: string): Promise<string> {
    try {
      // Get video info from api.video
      const apiKey = process.env.API_VIDEO_KEY;
      if (!apiKey) {
        throw new Error('API_VIDEO_KEY not set');
      }

      const response = await axios.get(`https://ws.api.video/videos/${videoId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const video = response.data;
      const mp4Url = video.assets?.mp4 || video.assets?.hls;

      if (!mp4Url) {
        throw new Error('No MP4 URL found in api.video response');
      }

      // Download video
      const videoResponse = await axios.get(mp4Url, {
        responseType: 'stream',
        timeout: 300000, // 5 minutes
      });

      const videoPath = path.join(this.tempDir, `${videoId}.mp4`);
      const writeStream = fs.createWriteStream(videoPath);

      await new Promise<void>((resolve, reject) => {
        videoResponse.data.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (error) => reject(error));
      });

      return videoPath;
    } catch (error) {
      console.error(`[Migration] Error downloading from api.video:`, error);
      throw error;
    }
  }

  /**
   * Migrate batch of videos
   */
  async migrateBatch(batchSize: number = 100): Promise<MigrationStatus> {
    console.log(`[Migration] Starting batch migration (${batchSize} videos)...`);

    try {
      // Get listings that still use api.video
      const { data: listings, error } = await serviceSupabase
        .from('listings')
        .select('id')
        .not('video_id', 'is', null)
        .or('video_provider.is.null,video_provider.eq.apivideo')
        .limit(batchSize);

      if (error) {
        throw new Error(`Failed to fetch listings: ${error.message}`);
      }

      if (!listings || listings.length === 0) {
        console.log('[Migration] No videos to migrate');
        return await this.getStatus();
      }

      let migrated = 0;
      let failed = 0;

      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        console.log(`[Migration] Processing ${i + 1}/${listings.length}: ${listing.id}`);

        const result = await this.migrateVideo(listing.id);

        if (result.success) {
          migrated++;
        } else {
          failed++;
          console.error(`[Migration] Failed: ${listing.id} - ${result.error}`);
        }

        // Rate limiting: 1 video per 30 seconds to avoid overwhelming services
        if (i < listings.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 30000));
        }
      }

      console.log(
        `[Migration] Batch completed: ${migrated} migrated, ${failed} failed`
      );

      return await this.getStatus();
    } catch (error) {
      console.error('[Migration] Batch migration failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatus> {
    try {
      // Total videos
      const { count: total } = await serviceSupabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .not('video_id', 'is', null);

      // Migrated to Yandex
      const { count: yandex } = await serviceSupabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('video_provider', 'yandex')
        .not('video_id', 'is', null);

      // Still on api.video or no provider set
      const { count: apivideo } = await serviceSupabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .not('video_id', 'is', null)
        .or('video_provider.is.null,video_provider.eq.apivideo');

      return {
        total: total || 0,
        migrated: yandex || 0,
        failed: 0, // Track separately if needed
        inProgress: apivideo || 0,
        apivideo: apivideo || 0,
        yandex: yandex || 0,
      };
    } catch (error) {
      console.error('[Migration] Error getting status:', error);
      throw error;
    }
  }

  /**
   * Cleanup temp files
   */
  async cleanup(): Promise<void> {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.tempDir, file));
        }
        console.log(`[Migration] Cleaned up ${files.length} temp files`);
      }
    } catch (error) {
      console.error('[Migration] Cleanup error:', error);
    }
  }
}

// Singleton export
export const videoMigration = new VideoMigrationService();

