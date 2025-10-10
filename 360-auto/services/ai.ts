import { Car, Damage } from '../types';
import { api } from './api';

export interface AIAnalysisResult {
  carMake: string;
  carModel: string;
  year: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  conditionScore: number; // 0-100
  estimatedValue: {
    min: number;
    max: number;
  };
  features: string[];
  damages: Damage[];
  confidence: number;
}

export interface VideoAnalysisRequest {
  videoUrl: string;
  metadata?: {
    location?: string;
    timestamp?: string;
    duration?: number;
  };
}

class AIService {
  private readonly AI_API_URL = 'https://ai.360auto.com/v1';

  async analyzeCar(videoUrl: string): Promise<AIAnalysisResult> {
    try {
      const response = await api.ai.analyzeCar(videoUrl);
      return response.data;
    } catch (error) {
      console.error('AI car analysis failed:', error);
      throw new Error('Failed to analyze car');
    }
  }

  async analyzeCarVideo(videoUrl: string): Promise<Partial<Car>> {
    try {
      // Симуляция AI анализа для демо
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Возвращаем mock данные в формате Car
      return {
        id: `car_${Date.now()}`,
        sellerId: 'current_user',
        sellerName: 'Текущий пользователь',
        videoUrl: videoUrl,
        thumbnailUrl: 'https://picsum.photos/400/600',
        brand: 'Toyota',
        model: 'Camry',
        year: 2020,
        price: 2500000,
        mileage: 45000,
        location: 'Бишкек',
        views: 0,
        likes: 0,
        saves: 0,
        createdAt: new Date().toISOString(),
        isVerified: false,
        aiAnalysis: {
          condition: 'good',
          conditionScore: 85,
          damages: [
            {
              type: 'scratch',
              severity: 'minor',
              location: 'Передний бампер',
              confidence: 0.85,
            }
          ],
          estimatedPrice: { 
            min: 2400000, 
            max: 2600000 
          },
          features: ['Кожаный салон', 'Камера заднего вида', 'Кондиционер'],
        },
      };
    } catch (error) {
      console.error('AI video analysis failed:', error);
      throw new Error('Failed to analyze video');
    }
  }

  async detectDamages(imageUrl: string): Promise<Damage[]> {
    try {
      const response = await api.ai.detectDamages(imageUrl);
      return response.data.damages;
    } catch (error) {
      console.error('Damage detection failed:', error);
      return [];
    }
  }

  async detectCarFeatures(videoUrl: string): Promise<string[]> {
    try {
      const response = await api.ai.detectFeatures(videoUrl);
      return response.data.features;
    } catch (error) {
      console.error('Feature detection failed:', error);
      return [];
    }
  }

  async estimateCarPrice(carData: Partial<Car>): Promise<{ min: number; max: number }> {
    try {
      const response = await api.ai.estimatePrice(carData);
      return response.data.estimatedPrice;
    } catch (error) {
      console.error('Price estimation failed:', error);
      return { min: 0, max: 0 };
    }
  }

  async generateCarDescription(carData: {
    brand: string;
    model: string;
    year: number;
    features: string[];
  }): Promise<string> {
    try {
      const response = await api.ai.generateDescription(carData);
      return response.data.description;
    } catch (error) {
      console.error('Description generation failed:', error);
      return 'No description available';
    }
  }

  async searchSimilarCars(carData: {
    brand: string;
    model: string;
    year: number;
    priceRange?: { min: number; max: number };
  }): Promise<Car[]> {
    try {
      const response = await api.ai.searchSimilarCars(carData);
      return response.data.cars;
    } catch (error) {
      console.error('Similar cars search failed:', error);
      return [];
    }
  }

  async moderateContent(content: string): Promise<{
    isApproved: boolean;
    reason?: string;
  }> {
    try {
      const response = await api.ai.moderateContent(content);
      return response.data;
    } catch (error) {
      console.error('Content moderation failed:', error);
      return { isApproved: true }; // Default to approved if moderation fails
    }
  }

  async analyzeCarCondition(videoUrl: string): Promise<{
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    details: string[];
  }> {
    try {
      const response = await api.ai.analyzeCondition(videoUrl);
      return response.data;
    } catch (error) {
      console.error('Condition analysis failed:', error);
      return {
        condition: 'fair',
        score: 50,
        details: ['Unable to analyze condition']
      };
    }
  }
}

export const aiService = new AIService();
export default aiService;