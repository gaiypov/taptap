// services/ai/openai.ts — OPENAI УРОВНЯ OPENAI HQ 2025 (КЛЮЧ ТОЛЬКО НА БЭКЕНДЕ!)
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ АНАЛИЗОВ

import { appLogger } from '@/utils/logger';
import { AI_CONFIG } from './config';

const API_URL = `${AI_CONFIG.API_BASE_URL}/ai/openai`;

export async function analyzeWithOpenAI(
  frames: string[],
  analysisType: 'full_analysis' | 'quick_identify' | 'damage_detection' = 'full_analysis',
  options: {
    model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<any> {
  try {
    const model = options.model || 'gpt-4o';
    appLogger.info('[OpenAI] Request', { framesCount: frames.length, type: analysisType, model });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frames,
        analysisType,
        model,
        maxTokens: options.maxTokens || (analysisType === 'quick_identify' ? 500 : 4096),
        temperature: options.temperature ?? 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI backend error: ${response.status} ${err}`);
    }

    const data = await response.json();
    appLogger.info('[OpenAI] Success');

    return data.result;
  } catch (error: any) {
    appLogger.error('[OpenAI] Failed', { error: error.message });
    throw error;
  }
}

export async function quickIdentifyWithOpenAI(imageBase64: string): Promise<{
  brand: string;
  model: string;
  year: number;
  confidence: number;
}> {
  const result = await analyzeWithOpenAI([imageBase64], 'quick_identify', {
    model: 'gpt-4o-mini',
    maxTokens: 300,
  });

  return {
    brand: result.brand || 'Unknown',
    model: result.model || 'Unknown',
    year: result.year || 2020,
    confidence: result.confidence || 0.7,
  };
}

export const aiOpenAI = {
  analyzeWithOpenAI,
  quickIdentifyWithOpenAI,
};

export default aiOpenAI;
