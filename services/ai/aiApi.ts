// services/ai/aiApi.ts — AI API CLIENT
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_CONFIG } from './config';
import {
  AIAnalysisResult,
  AnalysisRequest,
  ContentModerationResult,
  GeneratedContent,
  ListingCategory,
} from './types';

// ==============================================
// AI API CLIENT
// ==============================================

class AIApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AI_CONFIG.API_BASE_URL;
  }

  // Получить токен авторизации
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  // Базовый запрос
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any
  ): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.result;
  }

  // ==============================================
  // ОСНОВНЫЕ МЕТОДЫ
  // ==============================================

  /**
   * Универсальный анализ видео/изображений
   */
  async analyze(request: AnalysisRequest): Promise<AIAnalysisResult> {
    return this.request<AIAnalysisResult>('/ai/analyze', 'POST', {
      frames: request.frames,
      category: request.category,
      strategy: request.strategy || 'balanced',
      options: {
        isFirstListing: request.isFirstListing,
        isPremium: request.isPremium,
        estimatedPrice: request.estimatedPrice,
      },
    });
  }

  /**
   * Только модерация контента (быстро и дёшево)
   */
  async moderate(frames: string[]): Promise<ContentModerationResult> {
    return this.request<ContentModerationResult>('/ai/moderate', 'POST', { frames });
  }

  /**
   * Генерация описания (YandexGPT дешевле, Claude качественнее)
   */
  async generateContent(
    category: ListingCategory,
    analysisData: any,
    provider: 'yandex' | 'claude' = 'yandex'
  ): Promise<GeneratedContent> {
    return this.request<GeneratedContent>('/ai/generate-content', 'POST', {
      category,
      analysisData,
      provider,
      language: 'ru',
    });
  }

  /**
   * OCR распознавание (пробег, номера)
   */
  async recognizeText(
    imageBase64: string,
    model: 'page' | 'license-plates' = 'page'
  ): Promise<{
    fullText: string;
    blocks: Array<{ text: string; confidence: number }>;
    mileage: number | null;
    year: number | null;
    licensePlate: string | null;
  }> {
    return this.request('/ai/yandex-vision', 'POST', {
      imageBase64,
      model,
    });
  }

  /**
   * Проверка статуса AI сервисов
   */
  async getStatus(): Promise<{
    status: Record<string, boolean>;
    summary: string;
    costRates?: any;
  }> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.baseUrl}/ai/status`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    const data = await response.json();
    return data;
  }
}

export const aiApi = new AIApiClient();
export default aiApi;

