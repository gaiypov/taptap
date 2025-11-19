// services/ai/claude.ts — БЕЗОПАСНЫЙ CLAUDE 2025 (КЛЮЧ ТОЛЬКО НА БЭКЕНДЕ!)
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ АНАЛИЗОВ

import { appLogger } from '@/utils/logger';
import { AI_CONFIG } from './config';

const API_URL = AI_CONFIG.API_BASE_URL + '/ai/claude';

const DEFAULT_PROMPT = `Проанализируй изображения автомобиля и верни JSON с полями: brand, model, year, color, mileage, transmission, condition, condition_score, damages, features, estimated_price.`;

export async function analyzeWithClaude(
  frames: string[],
  prompt: string = DEFAULT_PROMPT,
  options: {
    model?: 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229' | 'claude-3-haiku-20240307';
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<any> {
  try {
    const model = options.model || 'claude-3-5-sonnet-20241022';
    appLogger.info('[Claude] Request', { framesCount: frames.length, model });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frames,
        prompt,
        model,
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude backend error: ${response.status} ${err}`);
    }

    const data = await response.json();
    appLogger.info('[Claude] Success');

    return data.result; // { brand, model, year, ... }
  } catch (error: any) {
    appLogger.error('[Claude] Failed', { error: error.message });
    throw error;
  }
}

export async function quickIdentifyWithClaude(imageBase64: string): Promise<{
  brand: string;
  model: string;
  year: number;
  confidence: number;
}> {
  try {
    const result = await analyzeWithClaude(
      [imageBase64],
      `Определи марку, модель и год автомобиля. Верни JSON: {brand, model, year, confidence}`,
      {
        model: 'claude-3-haiku-20240307',
        maxTokens: 300,
      }
    );

    return {
      brand: result.brand || 'Unknown',
      model: result.model || 'Unknown',
      year: result.year || 2020,
      confidence: result.confidence || 0.7,
    };
  } catch (error: any) {
    appLogger.error('[Claude] Quick identify failed', { error: error.message });
    return {
      brand: 'Unknown',
      model: 'Unknown',
      year: 2020,
      confidence: 0,
    };
  }
}
