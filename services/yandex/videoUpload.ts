// services/yandex/videoUpload.ts
// Optimized video upload for Yandex Cloud Video
// Features: TUS resumable upload, progress tracking, error recovery

import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { appLogger } from '@/utils/logger';
import { auth as supabaseAuth } from '@/services/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface UploadOptions {
  title: string;
  fileUri: string;
  fileSize: number;
  onProgress?: (progress: number) => void;
  targetQuality?: '720p' | '1080p' | 'auto'; // Transcoding quality preference
}

interface UploadResult {
  videoId: string;
  hlsUrl: string;
}

/**
 * Upload video to Yandex Cloud Video
 */
export async function uploadToYandex(
  options: UploadOptions
): Promise<UploadResult> {
  const {
    title,
    fileUri,
    fileSize,
    onProgress,
    targetQuality = 'auto',
  } = options;

  try {
    // 1. Get auth token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // 2. Create video on Yandex
    appLogger.info('[YandexUpload] Creating video...', { title, fileSize });
    const createResponse = await axios.post(
      `${API_URL}/api/video-yandex/create`,
      {
        title,
        fileSize,
        fileName: fileUri.split('/').pop() || 'video.mp4',
        isPublic: true,
        quality: targetQuality, // Pass quality preference
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { videoId, uploadUrl } = createResponse.data;
    appLogger.info('[YandexUpload] Video created', { videoId });

    if (onProgress) {
      onProgress(10); // 10% - video created
    }

    // 3. Upload video file via TUS
    appLogger.info('[YandexUpload] Uploading file...');
    await uploadFileTUS(uploadUrl, fileUri, fileSize, (uploadProgress) => {
      // Upload progress: 10% - 90% (80% of total)
      const totalProgress = 10 + Math.round((uploadProgress / 100) * 80);
      if (onProgress) {
        onProgress(totalProgress);
      }
    });

    // 4. Wait for transcoding
    appLogger.info('[YandexUpload] Waiting for transcoding...');
    const hlsUrl = await waitForTranscoding(videoId, token, (transcodingProgress) => {
      // Transcoding progress: 90% - 100% (10% of total)
      const totalProgress = 90 + Math.round((transcodingProgress / 100) * 10);
      if (onProgress) {
        onProgress(totalProgress);
      }
    });

    appLogger.info('[YandexUpload] Upload complete', { videoId, hlsUrl });
    return { videoId, hlsUrl };
  } catch (error) {
    appLogger.error('[YandexUpload] Upload failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Upload file using TUS protocol
 */
async function uploadFileTUS(
  uploadUrl: string,
  fileUri: string,
  fileSize: number,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64' as const,
    });

    // Convert to binary
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Upload via TUS PATCH
    await axios.patch(uploadUrl, bytes, {
      headers: {
        'Content-Type': 'application/offset+octet-stream',
        'Upload-Offset': '0',
        'Tus-Resumable': '1.0.0',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  } catch (error) {
    appLogger.error('[YandexUpload] TUS upload failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Wait for video transcoding to complete
 */
async function waitForTranscoding(
  videoId: string,
  token: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const maxAttempts = 120; // 10 minutes max (5 sec intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(
        `${API_URL}/api/video-yandex/status/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { status, hlsUrl } = response.data;

      if (status === 'READY') {
        if (onProgress) {
          onProgress(100);
        }
        return hlsUrl;
      }

      if (status === 'ERROR') {
        throw new Error('Video transcoding failed');
      }

      // Update progress (upload complete, transcoding in progress)
      if (onProgress && status === 'PROCESSING') {
        // Estimate transcoding progress (rough estimate)
        const transcodingProgress = Math.min(
          95,
          50 + (attempts / maxAttempts) * 45
        );
        onProgress(transcodingProgress);
      }

      // Wait 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      if (attempts < 3) {
        // Retry on first few errors
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error('Video transcoding timeout');
}

/**
 * Get auth token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabaseAuth.getSession();
    return data?.session?.access_token || null;
  } catch (error) {
    appLogger.warn('[YandexUpload] Failed to get auth token', { error });
    return null;
  }
}

