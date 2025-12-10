import { VideoMetadata, VideoTrimData } from '@/types/video.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================================
// VIDEO SERVICE
// ==============================================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

class VideoService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/videos`;
  }

  // Получить токен
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  /**
   * Загрузить видео с метаданными обрезки
   */
  async uploadVideo(
    videoUri: string,
    metadata: {
      category: 'car' | 'horse' | 'real_estate';
      trim?: VideoTrimData;
      title?: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<{ videoId: string; metadata: VideoMetadata }> {
    const token = await this.getAuthToken();

    // Создаем FormData
    const formData = new FormData();

    formData.append('video', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'video.mp4',
    } as any);

    // Добавляем метаданные
    formData.append('category', metadata.category);

    if (metadata.trim) {
      formData.append('trimStart', metadata.trim.startTime.toString());
      formData.append('trimEnd', metadata.trim.endTime.toString());
      formData.append('trimmedDuration', metadata.trim.trimmedDuration.toString());
    }

    if (metadata.title) {
      formData.append('title', metadata.title);
    }

    // Загружаем через XMLHttpRequest для отслеживания прогресса
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress?.(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));

      xhr.open('POST', `${this.baseUrl}/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }

  /**
   * Обновить метаданные обрезки (без перезагрузки видео)
   */
  async updateTrim(
    videoId: string,
    trim: VideoTrimData
  ): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${videoId}/trim`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        startTime: trim.startTime,
        endTime: trim.endTime,
        trimmedDuration: trim.trimmedDuration,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update trim');
    }
  }

  /**
   * Получить метаданные видео
   */
  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${videoId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get video metadata');
    }

    return response.json();
  }

  /**
   * Запросить серверную обрезку (опционально, для популярных видео)
   */
  async requestServerTrim(videoId: string): Promise<{ jobId: string }> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${videoId}/process-trim`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to request trim processing');
    }

    return response.json();
  }
}

export const videoService = new VideoService();
export default videoService;
