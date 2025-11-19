// services/aiUpload.ts — AI-UPLOAD УРОВНЯ TIKTOK + APPLE 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИОНУ ЗАГРУЗОК

import { appLogger } from '@/utils/logger';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import storageService from './storage';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
  (__DEV__ ? 'http://192.168.1.16:3001/api' : 'https://api.360auto.kg/api');

export interface UploadAndAnalyzeResult {
  listingId: string;
  videoId: string;
  playerUrl: string;
  thumbnailUrl: string;
  analysis: {
    brand: string;
    model: string;
    year: number;
    color: string;
    mileage: number;
    condition: string;
    conditionScore: number;
    estimatedPrice: { min: number; max: number; avg: number };
    damages: { type: string; severity: string; location: string; confidence: number }[];
    features: string[];
  };
}

/**
 * Универсальная загрузка + AI-анализ + создание объявления
 * Работает для авто / лошадей / недвижимости
 */
export async function uploadAndAnalyzeVideo(
  videoUri: string,
  category: 'auto' | 'horse' | 'real_estate' = 'auto',
  onProgress?: (step: string, progress: number) => void
): Promise<UploadAndAnalyzeResult> {
  appLogger.info('[AI Upload] Starting', { category, videoUri });

  try {
    onProgress?.('Подготовка...', 5);

    // 1. Авторизация
    const token = await storageService.getAuthToken();
    if (!token) throw new Error('Требуется авторизация');

    // 2. Проверка файла
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists || (fileInfo as any).size === 0) {
      throw new Error('Видео не найдено');
    }

    onProgress?.('Загрузка видео...', 15);

    // 3. FormData
    const formData = new FormData();
    const ext = videoUri.split('.').pop()?.toLowerCase() || 'mp4';
    const mime = ext === 'mov' ? 'video/quicktime' : `video/${ext}`;

    formData.append('video', {
      uri: videoUri,
      name: `video_${Date.now()}.${ext}`,
      type: mime,
    } as any);

    formData.append('category', category);

    // 4. Отправка
    const response = await fetch(`${API_BASE_URL}/ai/analyze-upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    onProgress?.('AI анализирует...', 60);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Сервер: ${response.status} ${errorText}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'AI анализ не удался');
    }

    onProgress?.('Готово!', 100);

    appLogger.info('[AI Upload] SUCCESS', { listingId: json.data.listingId });

    return {
      listingId: json.data.listingId,
      videoId: json.data.videoId,
      playerUrl: json.data.playerUrl,
      thumbnailUrl: json.data.thumbnailUrl,
      analysis: json.data.analysis,
    };
  } catch (error: any) {
    appLogger.error('[AI Upload] FAILED', { error: error.message });
    throw error;
  }
}
