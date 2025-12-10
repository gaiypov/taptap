// hooks/useVideoFrameExtractor.ts
import { useState, useCallback } from 'react';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

interface FrameExtractionOptions {
  count?: number;           // Количество кадров (по умолчанию 5)
  quality?: number;         // Качество 0-1 (по умолчанию 0.7)
  maxWidth?: number;        // Макс. ширина (по умолчанию 640)
}

interface ExtractedFrame {
  uri: string;
  base64: string;
  timestamp: number;
}

export function useVideoFrameExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Извлечь кадры из локального видео файла
   */
  const extractFramesFromFile = useCallback(async (
    videoUri: string,
    duration: number,          // Длительность видео в секундах
    options: FrameExtractionOptions = {}
  ): Promise<ExtractedFrame[]> => {
    const {
      count = 5,
      quality = 0.7,
      maxWidth = 640,
    } = options;

    setIsExtracting(true);
    setProgress(0);
    setError(null);

    const frames: ExtractedFrame[] = [];
    const interval = duration / (count + 1);

    try {
      for (let i = 1; i <= count; i++) {
        const timestamp = Math.floor(interval * i * 1000); // в миллисекундах
        
        setProgress(Math.round((i / count) * 100));

        // Генерируем thumbnail
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: timestamp,
          quality,
        });

        // Конвертируем в base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64' as const,
        });

        frames.push({
          uri,
          base64: `data:image/jpeg;base64,${base64}`,
          timestamp: timestamp / 1000,
        });
      }

      setIsExtracting(false);
      setProgress(100);
      return frames;

    } catch (err: any) {
      setError(err.message || 'Ошибка извлечения кадров');
      setIsExtracting(false);
      throw err;
    }
  }, []);

  /**
   * Извлечь кадры из api.video по videoId
   */
  const extractFramesFromApiVideo = useCallback(async (
    videoId: string,
    duration: number,
    options: FrameExtractionOptions = {}
  ): Promise<string[]> => {
    const { count = 5 } = options;

    setIsExtracting(true);
    setProgress(0);
    setError(null);

    const frames: string[] = [];
    const interval = duration / (count + 1);

    try {
      for (let i = 1; i <= count; i++) {
        const timestamp = Math.floor(interval * i);
        
        setProgress(Math.round((i / count) * 80));

        // URL thumbnail из api.video
        const thumbnailUrl = `https://vod.api.video/vod/${videoId}/thumbnail.jpg?time=${timestamp}`;
        
        // Скачиваем и конвертируем в base64
        const response = await fetch(thumbnailUrl);
        const blob = await response.blob();
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        frames.push(base64);
      }

      setIsExtracting(false);
      setProgress(100);
      return frames;

    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки кадров');
      setIsExtracting(false);
      throw err;
    }
  }, []);

  /**
   * Конвертировать изображения из галереи в base64
   */
  const convertImagesToBase64 = useCallback(async (
    imageUris: string[]
  ): Promise<string[]> => {
    setIsExtracting(true);
    setProgress(0);
    setError(null);

    const frames: string[] = [];

    try {
      for (let i = 0; i < imageUris.length; i++) {
        setProgress(Math.round(((i + 1) / imageUris.length) * 100));

        const base64 = await FileSystem.readAsStringAsync(imageUris[i], {
          encoding: 'base64' as const,
        });

        frames.push(`data:image/jpeg;base64,${base64}`);
      }

      setIsExtracting(false);
      setProgress(100);
      return frames;

    } catch (err: any) {
      setError(err.message || 'Ошибка конвертации изображений');
      setIsExtracting(false);
      throw err;
    }
  }, []);

  return {
    extractFramesFromFile,
    extractFramesFromApiVideo,
    convertImagesToBase64,
    isExtracting,
    progress,
    error,
  };
}

export default useVideoFrameExtractor;

