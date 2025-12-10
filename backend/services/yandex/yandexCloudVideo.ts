// backend/services/yandex/yandexCloudVideo.ts

/**
 * Yandex Cloud Video Service
 * 
 * Features:
 * - TUS resumable upload
 * - HLS streaming
 * - AI features (subtitles, translation, summarization)
 * - Delegated upload tokens
 * - Status tracking
 * - Error handling with retry
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as fs from 'fs';
import { iamTokenManager } from './iamToken';

interface YandexVideoConfig {
  channelId: string;
  folderId: string;
}

interface CreateVideoRequest {
  title: string;
  fileSize: number;
  fileName: string;
  isPublic?: boolean;
  description?: string;
}

interface CreateVideoResponse {
  videoId: string;
  uploadUrl: string;
  status: string;
}

interface VideoStatus {
  id: string;
  status: 'WAIT_UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR';
  duration?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
  mp4Url?: string;
}

interface VideoInfo {
  id: string;
  status: string;
  duration?: string;
  hlsUrl: string;
  thumbnailUrl?: string;
}

export class YandexCloudVideoService {
  private client: AxiosInstance;
  private config: YandexVideoConfig;
  private baseURL = 'https://video.api.cloud.yandex.net/video/v1';

  constructor(config: YandexVideoConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Get authorization headers with IAM token
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const iamToken = await iamTokenManager.getToken();
    return {
      'Authorization': `Bearer ${iamToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 1. Create video and get upload URL
   */
  async createVideo(params: CreateVideoRequest): Promise<CreateVideoResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await this.client.post(
        '/videos',
        {
          channel_id: this.config.channelId,
          folder_id: this.config.folderId,
          title: params.title,
          description: params.description || '',
          tusd: {
            file_size: params.fileSize,
            file_name: params.fileName,
          },
          ...(params.isPublic ? { public_access: {} } : { sign_url_access: {} }),
        },
        { headers }
      );

      const data = response.data;

      if (!data.metadata?.videoId || !data.response?.tusd?.url) {
        throw new Error('Invalid response from Yandex Cloud Video API');
      }

      return {
        videoId: data.metadata.videoId,
        uploadUrl: data.response.tusd.url,
        status: data.response.status || 'WAIT_UPLOADING',
      };
    } catch (error) {
      console.error('[YandexVideo] Create video error:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          `Failed to create video: ${axiosError.response?.data?.message || axiosError.message}`
        );
      }
      
      throw new Error(`Failed to create video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 2. Upload video file via TUS protocol
   */
  async uploadVideo(
    uploadUrl: string,
    filePath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const fileSize = fs.statSync(filePath).size;
    let offset = 0;

    try {
      // Try to get current offset (for resuming)
      offset = await this.getTusOffset(uploadUrl);
    } catch (error) {
      console.log('[YandexVideo] Starting new upload (offset check failed)');
      offset = 0;
    }

    if (offset > 0) {
      console.log(`[YandexVideo] Resuming upload from offset: ${offset}`);
    }

    const fileStream = fs.createReadStream(filePath, { start: offset });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      fileStream.on('data', (chunk: string | Buffer) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      fileStream.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        const chunkSize = buffer.length;

        try {
          await axios.patch(uploadUrl, buffer, {
            headers: {
              'Content-Type': 'application/offset+octet-stream',
              'Upload-Offset': offset.toString(),
              'Upload-Length': fileSize.toString(),
              'Tus-Resumable': '1.0.0',
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            onUploadProgress: (progressEvent) => {
              if (onProgress && progressEvent.total) {
                const uploaded = offset + progressEvent.loaded;
                const percentCompleted = Math.round((uploaded * 100) / fileSize);
                onProgress(percentCompleted);
              }
            },
            timeout: 300000, // 5 minutes for large files
          });

          // Verify upload completed
          const finalOffset = await this.getTusOffset(uploadUrl);
          if (finalOffset >= fileSize) {
            console.log('[YandexVideo] Upload completed successfully');
            resolve();
          } else {
            // Upload incomplete, retry
            console.log(`[YandexVideo] Upload incomplete (${finalOffset}/${fileSize}), retrying...`);
            await this.uploadVideo(uploadUrl, filePath, onProgress);
            resolve();
          }
        } catch (error) {
          console.error('[YandexVideo] Upload error:', error);
          
          // If error, try to resume
          if (offset + chunkSize < fileSize) {
            console.log('[YandexVideo] Upload failed, will resume on next attempt');
          }
          
          reject(error);
        }
      });

      fileStream.on('error', (error) => {
        console.error('[YandexVideo] File stream error:', error);
        reject(error);
      });
    });
  }

  /**
   * Get current upload offset (for resuming)
   */
  private async getTusOffset(uploadUrl: string): Promise<number> {
    try {
      const response = await axios.head(uploadUrl, {
        headers: {
          'Tus-Resumable': '1.0.0',
        },
        timeout: 10000,
      });

      const offset = parseInt(response.headers['upload-offset'] || '0', 10);
      return offset;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Upload not started yet
        return 0;
      }
      console.error('[YandexVideo] Get offset error:', error);
      return 0;
    }
  }

  /**
   * 3. Get video status and URLs
   */
  async getVideoStatus(videoId: string): Promise<VideoStatus> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await this.client.get(`/videos/${videoId}`, { headers });
      const data = response.data;

      return {
        id: data.id || videoId,
        status: data.status || 'PROCESSING',
        duration: data.duration,
        hlsUrl: this.getHLSUrl(videoId),
        thumbnailUrl: data.thumbnail_url || data.thumbnailUrl,
        mp4Url: data.mp4_url || data.mp4Url,
      };
    } catch (error) {
      console.error('[YandexVideo] Get status error:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          `Failed to get video status: ${axiosError.response?.data?.message || axiosError.message}`
        );
      }
      
      throw new Error(`Failed to get video status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 4. Generate HLS streaming URL
   */
  getHLSUrl(videoId: string): string {
    // Yandex Cloud Video HLS URL format
    // Format: https://video.cloud.yandex.net/{channelId}/{videoId}/master.m3u8
    return `https://video.cloud.yandex.net/${this.config.channelId}/${videoId}/master.m3u8`;
  }

  /**
   * 5. Enable AI features - Subtitles
   */
  async enableSubtitles(videoId: string, language: string = 'ru'): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      await this.client.post(
        `/videos/${videoId}/subtitles`,
        {
          language: language,
          auto_generate: true,
        },
        { headers }
      );
      
      console.log(`[YandexVideo] Subtitles enabled for video: ${videoId}`);
    } catch (error) {
      console.error('[YandexVideo] Enable subtitles error:', error);
      // Don't throw - AI features are optional
    }
  }

  /**
   * 5. Enable AI features - Translation
   */
  async enableTranslation(
    videoId: string,
    sourceLanguage: string,
    targetLanguages: string[]
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      await this.client.post(
        `/videos/${videoId}/translation`,
        {
          source_language: sourceLanguage,
          target_languages: targetLanguages,
          voice_over: true, // Enable neural voice-over
        },
        { headers }
      );
      
      console.log(`[YandexVideo] Translation enabled for video: ${videoId}`);
    } catch (error) {
      console.error('[YandexVideo] Enable translation error:', error);
      // Don't throw - AI features are optional
    }
  }

  /**
   * 5. Enable AI features - Summarization
   */
  async enableSummarization(videoId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      await this.client.post(
        `/videos/${videoId}/summarization`,
        {
          generate_timecodes: true,
        },
        { headers }
      );
      
      console.log(`[YandexVideo] Summarization enabled for video: ${videoId}`);
    } catch (error) {
      console.error('[YandexVideo] Enable summarization error:', error);
      // Don't throw - AI features are optional
    }
  }

  /**
   * 6. Delete video
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      await this.client.delete(`/videos/${videoId}`, { headers });
      console.log(`[YandexVideo] Video deleted: ${videoId}`);
    } catch (error) {
      console.error('[YandexVideo] Delete video error:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          `Failed to delete video: ${axiosError.response?.data?.message || axiosError.message}`
        );
      }
      
      throw new Error(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 7. List all videos in channel
   */
  async listVideos(limit: number = 100): Promise<VideoInfo[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await this.client.get('/videos', {
        headers,
        params: {
          channel_id: this.config.channelId,
          page_size: limit,
        },
      });

      const videos = response.data.videos || response.data.items || [];
      
      return videos.map((video: any) => ({
        id: video.id || video.videoId,
        status: video.status || 'UNKNOWN',
        duration: video.duration,
        hlsUrl: this.getHLSUrl(video.id || video.videoId),
        thumbnailUrl: video.thumbnail_url || video.thumbnailUrl,
      }));
    } catch (error) {
      console.error('[YandexVideo] List videos error:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          `Failed to list videos: ${axiosError.response?.data?.message || axiosError.message}`
        );
      }
      
      throw new Error(`Failed to list videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for video to be ready (with timeout)
   */
  async waitForReady(
    videoId: string,
    timeoutMs: number = 300000, // 5 minutes default
    checkIntervalMs: number = 10000 // Check every 10 seconds
  ): Promise<VideoStatus> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getVideoStatus(videoId);

      if (status.status === 'READY') {
        return status;
      }

      if (status.status === 'ERROR') {
        throw new Error(`Video processing failed: ${videoId}`);
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    }

    throw new Error(`Timeout waiting for video to be ready: ${videoId}`);
  }
}

// Export singleton instance
let yandexVideoService: YandexCloudVideoService | null = null;

export function getYandexVideoService(): YandexCloudVideoService {
  if (!yandexVideoService) {
    const channelId = process.env.YANDEX_VIDEO_CHANNEL_ID;
    const folderId = process.env.YANDEX_FOLDER_ID;

    if (!channelId || !folderId) {
      throw new Error(
        'YANDEX_VIDEO_CHANNEL_ID and YANDEX_FOLDER_ID must be set in environment variables'
      );
    }

    yandexVideoService = new YandexCloudVideoService({
      channelId,
      folderId,
    });
  }

  return yandexVideoService;
}

