// services/contentModeration.ts — МОДЕРАЦИЯ КОНТЕНТА УРОВНЯ APPLE + AVITO
// БЕЗОПАСНАЯ ВЕРСИЯ 2025 — API ключи ТОЛЬКО на бэкенде!
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Получаем URL бэкенда из конфига
const API_BASE_URL = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:3001/api';

export interface ModerationResult {
  isApproved: boolean;
  needsReview: boolean;
  reasons: string[];
  confidence: {
    safe: number;
    adult: number;
    violence: number;
    racy: number;
  };
}

/**
 * Отправляет изображение на модерацию через наш бэкенд
 * Ключ Google Vision хранится только на сервере!
 */
export async function moderateImage(imageUri: string): Promise<ModerationResult> {
  try {
    // Читаем изображение как base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Отправляем на бэкенд (безопасно!)
    const response = await fetch(`${API_BASE_URL}/moderate/image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        imageBase64: `data:image/jpeg;base64,${base64}` 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moderation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.result as ModerationResult;

  } catch (error) {
    console.warn('Moderation failed, sending to manual review:', error);
    // В случае ошибки — отправляем на ручную проверку
    return {
      isApproved: false,
      needsReview: true,
      reasons: ['Требуется ручная проверка'],
      confidence: { safe: 50, adult: 0, violence: 0, racy: 0 },
    };
  }
}

/**
 * Модерация видео — по нескольким кадрам
 */
export async function moderateVideo(frames: string[]): Promise<ModerationResult> {
  // Проверяем каждый кадр
  const results = await Promise.all(frames.map(moderateImage));

  // Если хотя бы один кадр отклонён — отклоняем всё
  const rejected = results.find(r => !r.isApproved && !r.needsReview);
  if (rejected) return rejected;

  // Если хотя бы один требует проверки — на проверку
  const needsReview = results.some(r => r.needsReview);
  if (needsReview) {
    return {
      isApproved: false,
      needsReview: true,
      reasons: ['Видео требует ручной проверки'],
      confidence: results.reduce((acc, r) => ({
        safe: acc.safe + r.confidence.safe,
        adult: acc.adult + r.confidence.adult,
        violence: acc.violence + r.confidence.violence,
        racy: acc.racy + r.confidence.racy,
      }), { safe: 0, adult: 0, violence: 0, racy: 0 }),
    };
  }

  // Все кадры одобрены
  return {
    isApproved: true,
    needsReview: false,
    reasons: [],
    confidence: {
      safe: 98,
      adult: 0,
      violence: 0,
      racy: 0,
    },
  };
}
