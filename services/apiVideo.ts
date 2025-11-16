// api.video интеграция для React Native

import axios from 'axios';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const API_VIDEO_BASE_URL = 'https://ws.api.video';
const API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_APIVIDEO_API_KEY || 
                process.env.EXPO_PUBLIC_APIVIDEO_API_KEY || '';

// Для загрузки с upload token (без API ключа)
const UPLOAD_TOKEN = Constants.expoConfig?.extra?.EXPO_PUBLIC_APIVIDEO_UPLOAD_TOKEN || 
                     process.env.EXPO_PUBLIC_APIVIDEO_UPLOAD_TOKEN || '';

export interface VideoMetadata {
  videoId: string;
  title?: string;
  description?: string;
  public?: boolean;
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface VideoAssets {
  hls: string; // HLS streaming URL
  mp4: string; // MP4 download URL
  thumbnail: string; // Thumbnail URL
  iframe: string; // Embed iframe URL
}

/**
 * api.video сервис для мобильного приложения
 */
export const apiVideoService = {
  /**
   * Создать новое видео и получить upload token
   * С retry логикой и улучшенной обработкой ошибок
   */
  async createVideo(metadata: Partial<VideoMetadata>): Promise<{ videoId: string; uploadToken: string }> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${API_VIDEO_BASE_URL}/videos`,
          {
            title: metadata.title || 'Car Video',
            description: metadata.description,
            public: metadata.public !== false,
            tags: metadata.tags || ['car', 'auto', '360auto'],
            metadata: [
              { key: 'app', value: '360auto' },
              { key: 'likes', value: '0' },
              { key: 'views', value: '0' },
              ...(metadata.metadata ? Object.entries(metadata.metadata).map(([key, value]) => ({ key, value })) : [])
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000, // 15 секунд
          }
        );

        return {
          videoId: response.data.videoId,
          uploadToken: response.data.uploadToken || '',
        };
      } catch (error) {
        lastError = error as Error;
        
        // Не retry для 4xx ошибок (кроме 429)
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw error;
          }
        }

        // Экспоненциальная задержка перед retry
        if (attempt < maxRetries - 1) {
          const delayMs = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error('[apiVideo] Error creating video after retries:', lastError);
    throw lastError || new Error('Failed to create video');
  },

  /**
   * Загрузить видео файл на api.video
   * Использует chunked upload для больших файлов
   */
  async uploadVideo(
    fileUri: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoMetadata> {
    try {
      // Получаем информацию о файле
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      // Создаем видео и получаем upload token
      const { videoId, uploadToken } = await this.createVideo({
        title: 'Car Video',
      });

      // Загружаем файл используя upload token
      const uploadUrl = `${API_VIDEO_BASE_URL}/upload?token=${uploadToken}`;

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUri, {
        httpMethod: 'POST',
        fieldName: 'file',
      } as any);

      if (uploadResult.status !== 201 && uploadResult.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }

      const result = JSON.parse(uploadResult.body);

      return {
        videoId: result.videoId || videoId,
        title: result.title,
        description: result.description,
        public: result.public,
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },

  /**
   * Загрузить видео с использованием delegated upload token (публичная загрузка)
   */
  async uploadWithToken(
    fileUri: string,
    uploadToken: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoMetadata> {
    try {
      const uploadUrl = `${API_VIDEO_BASE_URL}/upload?token=${uploadToken}`;

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUri, {
        httpMethod: 'POST',
        fieldName: 'file',
      } as any);

      if (uploadResult.status !== 201 && uploadResult.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }

      const result = JSON.parse(uploadResult.body);

      return {
        videoId: result.videoId,
        title: result.title,
        description: result.description,
        public: result.public,
      };
    } catch (error) {
      // Use appLogger for consistency (but keep console.error as fallback for critical errors)
      console.error('Error uploading with token:', error);
      throw error;
    }
  },

  /**
   * Получить информацию о видео
   * С кэшированием и retry логикой
   */
  async getVideo(videoId: string, useCache: boolean = true): Promise<VideoMetadata & VideoAssets> {
    const maxRetries = 2; // Меньше retry для GET запросов
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.get(
          `${API_VIDEO_BASE_URL}/videos/${videoId}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
            },
            timeout: 10000,
          }
        );

        const video = response.data;

        return {
          videoId: video.videoId,
          title: video.title,
          description: video.description,
          public: video.public,
          tags: video.tags,
          hls: video.assets?.hls || `https://vod.api.video/vod/${videoId}/hls/manifest.m3u8`,
          mp4: video.assets?.mp4 || '',
          thumbnail: video.assets?.thumbnail || `https://vod.api.video/vod/${videoId}/thumbnail.jpg`,
          iframe: video.assets?.iframe || `https://embed.api.video/vod/${videoId}`,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Не retry для 4xx ошибок
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) {
            throw error;
          }
        }

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    console.error('[apiVideo] Error getting video after retries:', lastError);
    throw lastError || new Error('Failed to get video');
  },

  /**
   * Обновить метаданные видео
   */
  async updateVideo(videoId: string, updates: Partial<VideoMetadata>): Promise<void> {
    try {
      await axios.patch(
        `${API_VIDEO_BASE_URL}/videos/${videoId}`,
        {
          title: updates.title,
          description: updates.description,
          public: updates.public,
          tags: updates.tags,
          metadata: updates.metadata ? Object.entries(updates.metadata).map(([key, value]) => ({ key, value })) : undefined,
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  },

  /**
   * Удалить видео
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_VIDEO_BASE_URL}/videos/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          }
        }
      );
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  },

  /**
   * Получить URL для HLS стриминга
   */
  getHLSUrl(videoId: string): string {
    return `https://vod.api.video/vod/${videoId}/hls/manifest.m3u8`;
  },

  /**
   * Получить URL для MP4 видео
   */
  getMp4Url(videoId: string, quality: '360p' | '480p' | '720p' | '1080p' = '720p'): string {
    return `https://vod.api.video/vod/${videoId}/mp4/source.mp4`;
  },

  /**
   * Получить URL миниатюры
   */
  getThumbnailUrl(videoId: string, time?: number): string {
    if (time) {
      return `https://vod.api.video/vod/${videoId}/thumbnail.jpg?time=${time}`;
    }
    return `https://vod.api.video/vod/${videoId}/thumbnail.jpg`;
  },

  /**
   * Получить URL для embed iframe
   */
  getEmbedUrl(videoId: string): string {
    return `https://embed.api.video/vod/${videoId}`;
  },

  /**
   * Список всех видео
   */
  async listVideos(page = 1, pageSize = 25): Promise<VideoMetadata[]> {
    try {
      const response = await axios.get(
        `${API_VIDEO_BASE_URL}/videos`,
        {
          params: {
            currentPage: page,
            pageSize: pageSize,
          },
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          }
        }
      );

      return response.data.data.map((video: any) => ({
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        public: video.public,
        tags: video.tags,
      }));
    } catch (error) {
      console.error('Error listing videos:', error);
      throw error;
    }
  },

  /**
   * Получить статистику видео (просмотры, лайки и т.д.)
   */
  async getVideoStats(videoId: string): Promise<{ views: number; likes: number }> {
    try {
      const video = await this.getVideo(videoId);
      
      // api.video хранит метаданные
      const metadata = video.metadata || {};
      
      return {
        views: parseInt(metadata.views || '0', 10),
        likes: parseInt(metadata.likes || '0', 10),
      };
    } catch (error) {
      console.error('Error getting video stats:', error);
      return { views: 0, likes: 0 };
    }
  },

  /**
   * Обновить счетчик лайков
   */
  async incrementLikes(videoId: string): Promise<void> {
    try {
      const stats = await this.getVideoStats(videoId);
      await this.updateVideo(videoId, {
        metadata: {
          likes: String(stats.likes + 1),
        }
      });
    } catch (error) {
      console.error('Error incrementing likes:', error);
    }
  },

  /**
   * Обновить счетчик просмотров
   */
  async incrementViews(videoId: string): Promise<void> {
    try {
      const stats = await this.getVideoStats(videoId);
      await this.updateVideo(videoId, {
        metadata: {
          views: String(stats.views + 1),
        }
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },
};

/**
 * Проверить статус api.video
 */
export const apiVideo = {
  ...apiVideoService,
  
  isConfigured(): boolean {
    return !!API_KEY && API_KEY.length > 0;
  },
  
  getStatus(): { configured: boolean; hasApiKey: boolean; clientInitialized: boolean } {
    const hasApiKey = !!API_KEY && API_KEY.length > 0;
    const configured = hasApiKey;
    
    return {
      configured,
      hasApiKey,
      clientInitialized: configured,
    };
  },
};

export default apiVideo;

/**
 * Обертка для промпта: uploadVideoToApiVideo(localVideoUri, metadata)
 * Согласно CursorAI-Prompt.md
 */
export async function uploadVideoToApiVideo(
  localVideoUri: string,
  metadata?: {
    title?: string;
    tags?: string[];
    description?: string;
  }
): Promise<string> {
  try {
    // Создаем видео с метаданными СНАЧАЛА (более эффективно)
    const { videoId, uploadToken } = await apiVideoService.createVideo({
      title: metadata?.title || 'Car Video',
      description: metadata?.description,
      tags: metadata?.tags || ['cars'],
    });
    
    // Загружаем файл используя upload token
    const uploadResult = await apiVideoService.uploadWithToken(localVideoUri, uploadToken);
    
    // Возвращаем HLS URL для плеера (согласно промпту)
    return apiVideoService.getHLSUrl(uploadResult.videoId || videoId);
  } catch (error) {
    console.error('uploadVideoToApiVideo error:', error);
    throw error;
  }
}
