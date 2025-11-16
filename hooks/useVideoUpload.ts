/**
 * React Hook for Video Upload
 * Provides upload functionality with progress tracking and state management
 */

import { useState, useCallback, useRef } from 'react';
import { uploadVideoWithOfflineSupport, UploadResult, UploadProgressCallback } from '@/services/videoUploader';
import { appLogger } from '@/utils/logger';

export interface UseVideoUploadReturn {
  upload: (uri: string, category: string, metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  }) => Promise<UploadResult>;
  uploading: boolean;
  progress: number;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for uploading videos with progress tracking
 * 
 * @example
 * ```tsx
 * const { upload, uploading, progress, error } = useVideoUpload();
 * 
 * const handleUpload = async () => {
 *   try {
 *     const result = await upload(videoUri, 'car', {
 *       title: 'My Car Video',
 *       description: 'Test upload',
 *     });
 *     console.log('Upload complete:', result.hlsUrl);
 *   } catch (err) {
 *     console.error('Upload failed:', err);
 *   }
 * };
 * ```
 */
export function useVideoUpload(): UseVideoUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (
      uri: string,
      category: string,
      metadata?: {
        title?: string;
        description?: string;
        tags?: string[];
      }
    ): Promise<UploadResult> => {
      // Reset state
      setUploading(true);
      setProgress(0);
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        appLogger.debug('useVideoUpload: Starting upload', { uri, category });

        const progressCallback: UploadProgressCallback = (p) => {
          setProgress(p);
          appLogger.debug('useVideoUpload: Progress update', { progress: p });
        };

        const result = await uploadVideoWithOfflineSupport(
          uri,
          category,
          progressCallback,
          metadata
        );

        setProgress(100);
        setUploading(false);
        
        appLogger.info('useVideoUpload: Upload successful', {
          videoId: result.videoId,
          hlsUrl: result.hlsUrl,
        });

        return result;
      } catch (err: any) {
        const uploadError = err instanceof Error ? err : new Error(String(err));
        setError(uploadError);
        setUploading(false);
        setProgress(0);

        appLogger.error('useVideoUpload: Upload failed', {
          error: uploadError.message,
          uri,
          category,
        });

        throw uploadError;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    appLogger.debug('useVideoUpload: State reset');
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
  };
}

