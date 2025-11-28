// services/apiVideo.ts — API.VIDEO 2025 (БЕЗОПАСНО, БЫСТРО, КРАСИВО)
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

// ВАЖНО: API_KEY НЕ ДОЛЖЕН БЫТЬ В КЛИЕНТЕ!
// Все запросы идут через бэкенд (delegated upload)

const API_VIDEO_BASE = 'https://ws.api.video';

// Получаем URL бэкенда из конфига
const API_BASE_URL = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:3001/api';

export interface VideoAssets {
  videoId: string;
  hls: string;
  mp4: string;
  thumbnail: string;
  iframe: string;
}

/**
 * Получить upload token (на бэкенде!)
 * Клиент НЕ знает API ключ
 * videoId создаётся автоматически при загрузке
 */
export async function createVideoOnBackend(metadata?: {
  title?: string;
  description?: string;
  tags?: string[];
}): Promise<{ uploadToken: string }> {
  const response = await fetch(`${API_BASE_URL}/video/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata || { title: '360Auto Video' }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create video: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Загрузить видео напрямую на api.video через delegated token
 */
export async function uploadVideo(
  fileUri: string,
  uploadToken: string,
  onProgress?: (progress: { loaded: number; total: number }) => void
): Promise<VideoAssets> {
  const uploadUrl = `${API_VIDEO_BASE}/upload?token=${uploadToken}`;

  console.log('[apiVideo] Starting upload to:', uploadUrl);
  console.log('[apiVideo] File URI:', fileUri);

  const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    headers: { 'Content-Type': 'video/mp4' },
  });

  console.log('[apiVideo] Upload result status:', result.status);
  console.log('[apiVideo] Upload result body:', result.body?.substring(0, 500));

  if (result.status !== 200 && result.status !== 201) {
    throw new Error(`Upload failed: ${result.status} ${result.body}`);
  }

  const data = JSON.parse(result.body);
  const videoId = data.videoId;

  console.log('[apiVideo] Video created with ID:', videoId);

  return {
    videoId,
    hls: `https://cdn.api.video/vod/${videoId}/hls/manifest.m3u8`,
    mp4: `https://cdn.api.video/vod/${videoId}/mp4/source.mp4`,
    thumbnail: `https://cdn.api.video/vod/${videoId}/thumbnail.jpg`,
    iframe: `https://embed.api.video/vod/${videoId}`,
  };
}

/**
 * Универсальная функция для фронта
 */
export async function uploadVideoToApiVideo(
  localUri: string,
  metadata?: { title?: string; description?: string; tags?: string[] }
): Promise<VideoAssets> {
  // 1. Получаем upload token с бэкенда (безопасно)
  const { uploadToken } = await createVideoOnBackend(metadata);

  // 2. Загружаем напрямую на api.video (videoId создаётся автоматически)
  const assets = await uploadVideo(localUri, uploadToken);

  return assets;
}

// ============================================
// ОБРАТНАЯ СОВМЕСТИМОСТЬ (для старых сервисов)
// ============================================

/**
 * Получить upload token (через бэкенд)
 * videoId создаётся при загрузке
 */
export async function createVideo(metadata?: {
  title?: string;
  description?: string;
  tags?: string[];
}): Promise<{ uploadToken: string }> {
  return createVideoOnBackend(metadata);
}

/**
 * Загрузить видео с токеном
 */
export async function uploadWithToken(
  fileUri: string,
  uploadToken: string
): Promise<{ videoId: string }> {
  const assets = await uploadVideo(fileUri, uploadToken);
  return { videoId: assets.videoId };
}

/**
 * Получить HLS URL
 */
export function getHLSUrl(videoId: string): string {
  return `https://cdn.api.video/vod/${videoId}/hls/manifest.m3u8`;
}

/**
 * Получить URL миниатюры
 */
export function getThumbnailUrl(videoId: string): string {
  return `https://cdn.api.video/vod/${videoId}/thumbnail.jpg`;
}

/**
 * Получить MP4 URL
 */
export function getMp4Url(videoId: string): string {
  return `https://cdn.api.video/vod/${videoId}/mp4/source.mp4`;
}

/**
 * Проверка конфигурации (всегда true, так как используем бэкенд)
 */
export function isConfigured(): boolean {
  return true; // Всегда доступно через бэкенд
}

// Экспорт для обратной совместимости
export const apiVideo = {
  createVideo,
  uploadWithToken,
  getHLSUrl,
  getThumbnailUrl,
  getMp4Url,
  isConfigured,
};
