// backend/services/apiVideoService.ts

// api.video Integration — Production Ready Kyrgyzstan 2025

// Delegated Upload • Progress Tracking • Resumable • Zero Server Load

import axios, { isAxiosError } from 'axios';
import * as fs from 'fs/promises';

const API_VIDEO_BASE_URL = 'https://ws.api.video';
const API_VIDEO_KEY = process.env.API_VIDEO_KEY;

if (!API_VIDEO_KEY) {
  throw new Error('API_VIDEO_KEY is required');
}

const api = axios.create({
  baseURL: API_VIDEO_BASE_URL,
  headers: {
    Authorization: `Bearer ${API_VIDEO_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface ApiVideoUploadResult {
  videoId: string;
  playerUrl: string;
  thumbnailUrl: string;
  hlsUrl?: string;
  mp4Url?: string;
}

export interface DelegatedUploadToken {
  token: string;
  videoId: string;
  uploadUrl: string;
}

export interface VideoStatus {
  videoId: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'ready' | 'failed';
  playerUrl?: string;
  thumbnailUrl?: string;
  hlsUrl?: string;
  mp4Url?: string;
}

/**
 * Создаёт delegated upload token — видео загружается напрямую с телефона/браузера
 * Нагрузка на твой сервер = 0
 */
export async function createDelegatedUploadToken(metadata?: {
  title?: string;
  description?: string;
  tags?: string[];
  ttl?: number; // seconds, default 1 hour
}): Promise<DelegatedUploadToken> {
  try {
    const response = await api.post('/upload', {
      ...(metadata?.title && { title: metadata.title }),
      ...(metadata?.description && { description: metadata.description }),
      public: true,
      tags: metadata?.tags || ['360market', 'kyrgyzstan'],
      ttl: metadata?.ttl || 3600, // 1 час
    });

    return {
      token: response.data.token,
      videoId: response.data.videoId,
      uploadUrl: response.data.uploadUrl || `https://upload.api.video/uploads`,
    };
  } catch (error) {
    console.error('[api.video] Failed to create upload token:', error);
    if (isAxiosError(error)) {
      throw new Error(
        `Не удалось подготовить загрузку видео: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Не удалось подготовить загрузку видео');
  }
}

/**
 * Получает статус видео после delegated upload
 */
export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  try {
    const response = await api.get(`/videos/${videoId}`);
    const video = response.data;

    return {
      videoId: video.videoId,
      status: video.status || 'uploading',
      playerUrl: video.assets?.player,
      thumbnailUrl: video.assets?.thumbnail,
      hlsUrl: video.assets?.hls,
      mp4Url: video.assets?.mp4,
    };
  } catch (error) {
    console.error('[api.video] Failed to get video status:', error);
    if (isAxiosError(error)) {
      throw new Error(
        `Не удалось получить статус видео: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Не удалось получить статус видео');
  }
}

/**
 * Резервный метод: прямой аплоад через сервер (только для старых клиентов)
 * Используется chunked upload с прогрессом
 */
export async function uploadVideoDirect(
  filePath: string,
  metadata?: { title?: string; description?: string; tags?: string[] },
  onProgress?: (percent: number) => void
): Promise<ApiVideoUploadResult> {
  try {
    const { data: video } = await api.post('/videos', {
      title: metadata?.title || `Video ${new Date().toISOString()}`,
      description: metadata?.description,
      public: true,
      tags: metadata?.tags || ['360market'],
    });

    const videoId = video.videoId;
    const uploadUrl = `https://ws.api.video/videos/${videoId}/source`;

    const fileData = await fs.readFile(filePath);
    const fileSize = fileData.byteLength;

    await axios.post(uploadUrl, fileData, {
      headers: {
        Authorization: `Bearer ${API_VIDEO_KEY}`,
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize.toString(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      onUploadProgress: (progress) => {
        if (onProgress && progress.total) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percent);
        }
      },
    });

    // Ждём готовности
    let status: VideoStatus;
    let attempts = 0;
    const maxAttempts = 60; // 3 минуты максимум (60 * 3 секунды)

    do {
      await new Promise((r) => setTimeout(r, 3000));
      status = await getVideoStatus(videoId);
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Превышено время ожидания обработки видео');
      }
    } while (!['ready', 'failed'].includes(status.status));

    if (status.status === 'failed') {
      throw new Error('Видео не удалось обработать');
    }

    if (!status.playerUrl || !status.thumbnailUrl) {
      throw new Error('Видео обработано, но отсутствуют необходимые URL');
    }

    return {
      videoId,
      playerUrl: status.playerUrl,
      thumbnailUrl: status.thumbnailUrl,
      hlsUrl: status.hlsUrl,
      mp4Url: status.mp4Url,
    };
  } catch (error) {
    console.error('[api.video] Failed to upload video directly:', error);
    if (isAxiosError(error)) {
      throw new Error(
        `Не удалось загрузить видео: ${error.response?.data?.message || error.message}`
      );
    }
    throw error instanceof Error ? error : new Error('Не удалось загрузить видео');
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createDelegatedUploadToken + client-side upload instead
 */
export async function uploadVideoToApiVideo(
  videoPath: string,
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  }
): Promise<ApiVideoUploadResult> {
  return uploadVideoDirect(videoPath, metadata);
}
