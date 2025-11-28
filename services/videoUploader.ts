/**
 * Video Upload Service
 * Handles video uploads to api.video with retry logic, progress tracking, and offline support
 */

import * as FileSystem from 'expo-file-system/legacy';
import NetInfo from '@react-native-community/netinfo';
import { appLogger } from '@/utils/logger';
import { savePendingAction, removePendingAction, getPendingActions } from '@/services/offlineStorage';
import { createVideoOnBackend, uploadVideo, getHLSUrl, getThumbnailUrl, getMp4Url } from './apiVideo';

export type UploadProgressCallback = (progress: number) => void;

export interface UploadResult {
  videoId: string;
  hlsUrl: string;
  thumbnailUrl: string;
  mp4Url?: string;
}

export interface PendingUpload {
  id: string;
  uri: string;
  category: string;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
  createdAt: number;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds base delay

/**
 * Check if device is online
 */
async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

/**
 * Get upload URL from Supabase Edge Function (if available)
 * Falls back to direct api.video upload
 */
async function getUploadEndpoint(category: string): Promise<{
  method: 'direct' | 'supabase';
  uploadToken?: string;
  videoId?: string;
}> {
  try {
    // Try Supabase Edge Function first (if exists)
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase.functions.invoke('get-upload-url', {
      body: { category },
    });

    if (!error && data?.url) {
      appLogger.debug('Using Supabase upload endpoint', { category });
      return { method: 'supabase', uploadToken: data.token, videoId: data.videoId };
    }
  } catch (error) {
    appLogger.debug('Supabase function not available, using direct upload', { error });
  }

  // Fallback to direct api.video upload
  return { method: 'direct' };
}

/**
 * Enhanced video upload with progress tracking, retry logic, and offline support
 * 
 * This is an enhanced wrapper around apiVideo service with:
 * - Network connectivity checks
 * - Offline queue support
 * - Progress tracking
 * - Automatic retry
 * 
 * NOTE: This is a different function from apiVideo.uploadVideoToApiVideo()
 * - apiVideo.uploadVideoToApiVideo() - basic upload, returns HLS URL string
 * - videoUploader.uploadVideoWithOfflineSupport() - enhanced upload, returns UploadResult
 * 
 * @param uri - Local file URI
 * @param category - Video category (car, horse, real_estate)
 * @param onProgress - Optional progress callback (0-100)
 * @param metadata - Optional video metadata
 * @returns UploadResult with video URLs
 */
export async function uploadVideoWithOfflineSupport(
  uri: string,
  category: string,
  onProgress?: UploadProgressCallback,
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  }
): Promise<UploadResult> {
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    appLogger.info('upload_started', { uri, category, uploadId });

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error(`Video file not found: ${uri}`);
    }

    // Check network connectivity
    const online = await isOnline();
    if (!online) {
      appLogger.warn('upload_offline', { uri, category });
      // Save for later retry
      await savePendingAction('video_upload', {
        uri,
        category,
        metadata: metadata || {},
        uploadId,
        createdAt: Date.now(),
      } as any);
      throw new Error('No internet connection. Upload will resume when online.');
    }

    // Prepare metadata
    const videoMetadata = {
      title: metadata?.title || `${category} Video`,
      description: metadata?.description || `Video uploaded from 360Auto app`,
      tags: metadata?.tags || [category, '360auto'],
    };

    // api.video всегда доступен через бэкенд

    // Report initial progress
    if (onProgress) {
      onProgress(5);
    }

    // Get upload token from backend
    let uploadToken: string;

    const endpoint = await getUploadEndpoint(category);

    if (endpoint.method === 'supabase' && endpoint.uploadToken) {
      // Use Supabase endpoint if available
      uploadToken = endpoint.uploadToken;
      appLogger.debug('Using Supabase upload token');
      if (onProgress) {
        onProgress(15);
      }
    } else {
      // Direct api.video upload через бэкенд
      const createResult = await createVideoOnBackend(videoMetadata);
      uploadToken = createResult.uploadToken;
      appLogger.debug('Got upload token from backend');
      if (onProgress) {
        onProgress(15);
      }
    }

    // Upload file using apiVideo service
    if (onProgress) {
      onProgress(20); // Start upload
    }

    // Загружаем видео напрямую на api.video
    // videoId создаётся автоматически при загрузке
    const uploadResult = await uploadVideo(uri, uploadToken);

    // Simulate progress during upload
    if (onProgress) {
      onProgress(90); // Near completion
    }

    const finalVideoId = uploadResult.videoId;

    // Report completion
    if (onProgress) {
      onProgress(100);
    }

    // Get final video URLs
    const hlsUrl = getHLSUrl(finalVideoId);
    const thumbnailUrl = getThumbnailUrl(finalVideoId);
    const mp4Url = getMp4Url(finalVideoId);

    appLogger.info('upload_success', {
      videoId: finalVideoId,
      hlsUrl,
      thumbnailUrl,
      uploadId,
    });

    // Remove from pending uploads if was queued
    try {
      const pendingActions = await getPendingActions();
      const pendingUpload = pendingActions.find(
        (action: any) => action.type === 'video_upload' && action.payload?.uploadId === uploadId
      );
      if (pendingUpload) {
        await removePendingAction(pendingUpload.id);
        appLogger.debug('Removed pending upload after success', { uploadId });
      }
    } catch (error) {
      appLogger.warn('Failed to remove pending upload', { error, uploadId });
    }

    return {
      videoId: finalVideoId,
      hlsUrl,
      thumbnailUrl,
      mp4Url,
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown upload error';
    appLogger.error('upload_failed', {
      uri,
      category,
      error: errorMessage,
      uploadId,
    });

    // Save for retry if it's a network error
    const isNetworkError =
      errorMessage.includes('Network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('offline');

    if (isNetworkError) {
      await savePendingAction('video_upload', {
        uri,
        category,
        metadata: metadata || {},
        uploadId,
        error: errorMessage,
        createdAt: Date.now(),
      });
      appLogger.info('Upload queued for retry', { uploadId, error: errorMessage });
    }

    throw error;
  }
}

/**
 * Retry failed upload with exponential backoff
 */
async function retryUpload(
  pendingUpload: PendingUpload,
  onProgress?: UploadProgressCallback,
  attempt: number = 1
): Promise<UploadResult> {
  appLogger.info('upload_retry', {
    uploadId: pendingUpload.id,
    attempt,
    uri: pendingUpload.uri,
  });

  try {
    return await uploadVideoWithOfflineSupport(
      pendingUpload.uri,
      pendingUpload.category,
      onProgress,
      pendingUpload.metadata
    );
  } catch (error: any) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
      appLogger.debug('Retry scheduled', { uploadId: pendingUpload.id, delay, attempt });
      
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryUpload(pendingUpload, onProgress, attempt + 1);
    }
    throw error;
  }
}

/**
 * Process pending uploads when network is available
 */
export async function processPendingUploads(
  onProgress?: (uploadId: string, progress: number) => void
): Promise<{ success: number; failed: number }> {
  appLogger.info('Processing pending uploads');

  const pendingActions = await getPendingActions();
  const videoUploads = pendingActions.filter(
    (action: any) => action.type === 'video_upload'
  ) as Array<{ id: string; payload: PendingUpload; retryCount: number }>;

  if (videoUploads.length === 0) {
    appLogger.debug('No pending uploads found');
    return { success: 0, failed: 0 };
  }

  appLogger.info('Found pending uploads', { count: videoUploads.length });

  const online = await isOnline();
  if (!online) {
    appLogger.warn('Cannot process pending uploads: offline');
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const uploadAction of videoUploads) {
    try {
      const upload: PendingUpload = {
        id: uploadAction.id,
        uri: uploadAction.payload.uri,
        category: uploadAction.payload.category,
        metadata: uploadAction.payload.metadata,
        createdAt: uploadAction.payload.createdAt || Date.now(),
        retryCount: uploadAction.retryCount || 0,
      };

      // Skip if too many retries
      if (upload.retryCount >= MAX_RETRIES) {
        appLogger.warn('Upload exceeded max retries', { uploadId: upload.id });
        await removePendingAction(upload.id);
        failed++;
        continue;
      }

      const progressCallback = onProgress
        ? (progress: number) => onProgress(upload.id, progress)
        : undefined;

      await retryUpload(upload, progressCallback, upload.retryCount + 1);
      
      await removePendingAction(upload.id);
      success++;
      
      appLogger.info('Pending upload completed', { uploadId: upload.id });
    } catch (error: any) {
      appLogger.error('Failed to process pending upload', {
        uploadId: uploadAction.id,
        error: error?.message,
      });
      failed++;
    }
  }

  appLogger.info('Pending uploads processed', { success, failed, total: videoUploads.length });
  return { success, failed };
}

/**
 * Initialize upload service - set up network listener for auto-retry
 */
export function initVideoUploadService(): () => void {
  appLogger.info('Initializing video upload service');

  // Listen for network state changes
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      appLogger.debug('Network connected, processing pending uploads');
      // Process pending uploads in background (don't await)
      processPendingUploads().catch((error) => {
        appLogger.error('Error processing pending uploads', { error });
      });
    }
  });

  // Process any existing pending uploads
  processPendingUploads().catch((error) => {
    appLogger.error('Error processing initial pending uploads', { error });
  });

  // Return cleanup function
  return () => {
    unsubscribe();
    appLogger.debug('Video upload service cleaned up');
  };
}

