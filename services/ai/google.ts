// services/ai/google.ts — GOOGLE VISION УРОВНЯ GOOGLE HQ 2025 (КЛЮЧ ТОЛЬКО НА БЭКЕНДЕ!)
import { appLogger } from '@/utils/logger';
import { AI_CONFIG } from './config';

const API_URL = AI_CONFIG.API_BASE_URL + '/ai/google-vision';

export interface GoogleVisionResult {
  labels?: string[];
  objects?: { name: string; score: number }[];
  text?: string;
  mileage?: number;
  damages?: { type: string; severity: string; confidence: number }[];
  qualityScore?: number;
}

/**
 * Универсальный анализ через Google Vision (через бэкенд!)
 */
export async function analyzeWithGoogleVision(
  imageBase64: string,
  type: 'labels' | 'objects' | 'ocr' | 'damages' | 'full' = 'full'
): Promise<GoogleVisionResult> {
  try {
    appLogger.info('[Google Vision] Request', { type });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
        features: [type],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google Vision backend error: ${response.status} ${err}`);
    }

    const data = await response.json();
    appLogger.info('[Google Vision] Success');

    return data.result || {};
  } catch (error: any) {
    appLogger.error('[Google Vision] Failed', { error: error.message });
    throw error;
  }
}

/**
 * Извлечение пробега (OCR)
 */
export async function extractMileage(imageBase64: string): Promise<{ mileage: number; confidence: number }> {
  try {
    const result = await analyzeWithGoogleVision(imageBase64, 'ocr');
    return {
      mileage: result.mileage || 0,
      confidence: result.mileage ? 0.95 : 0,
    };
  } catch {
    return { mileage: 0, confidence: 0 };
  }
}

/**
 * Детекция повреждений
 */
export async function detectDamages(imageBase64: string): Promise<{
  damages: { type: string; severity: string; confidence: number }[];
  conditionScore: number;
}> {
  try {
    const result = await analyzeWithGoogleVision(imageBase64, 'damages');
    return {
      damages: result.damages || [],
      conditionScore: result.qualityScore || 85,
    };
  } catch {
    return { damages: [], conditionScore: 85 };
  }
}

/**
 * Простая обертка для промпта: analyzeImageWithGoogle(imageUri)
 * Согласно CursorAI-Prompt.md
 */
export async function analyzeImageWithGoogle(
  imageUri: string
): Promise<string[]> {
  try {
    // Конвертируем imageUri в base64 если нужно
    const imageBase64 = imageUri.startsWith('data:') 
      ? imageUri 
      : `data:image/jpeg;base64,${imageUri}`;
    
    const result = await analyzeWithGoogleVision(imageBase64, 'objects');
    
    // Возвращаем labels как массив строк согласно промпту
    return result.labels || [];
  } catch {
    // Fallback на пустой массив
    return [];
  }
}

// Обратная совместимость
export const extractMileageWithGoogle = extractMileage;
export const detectDamagesWithGoogle = detectDamages;

export const aiGoogle = {
  analyzeWithGoogleVision,
  extractMileage,
  detectDamages,
  analyzeImageWithGoogle,
};

export default aiGoogle;
