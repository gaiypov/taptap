import { api } from './api';

export interface AIAnalysisResult {
  carMake: string;
  carModel: string;
  year: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedValue: number;
  features: string[];
  issues: string[];
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

  async analyzeVideo(request: VideoAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      const response = await api.post('/ai/analyze-video', request);
      return response.data;
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error('Failed to analyze video');
    }
  }

  async detectCarFeatures(videoUrl: string): Promise<string[]> {
    try {
      const response = await api.post('/ai/detect-features', { videoUrl });
      return response.data.features;
    } catch (error) {
      console.error('Feature detection failed:', error);
      return [];
    }
  }

  async estimateCarValue(carData: {
    make: string;
    model: string;
    year: number;
    condition: string;
    mileage?: number;
  }): Promise<number> {
    try {
      const response = await api.post('/ai/estimate-value', carData);
      return response.data.estimatedValue;
    } catch (error) {
      console.error('Value estimation failed:', error);
      return 0;
    }
  }

  async generateCarDescription(carData: {
    make: string;
    model: string;
    year: number;
    features: string[];
  }): Promise<string> {
    try {
      const response = await api.post('/ai/generate-description', carData);
      return response.data.description;
    } catch (error) {
      console.error('Description generation failed:', error);
      return 'No description available';
    }
  }

  async searchSimilarCars(carData: {
    make: string;
    model: string;
    year: number;
    priceRange?: { min: number; max: number };
  }): Promise<any[]> {
    try {
      const response = await api.post('/ai/similar-cars', carData);
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
      const response = await api.post('/ai/moderate', { content });
      return response.data;
    } catch (error) {
      console.error('Content moderation failed:', error);
      return { isApproved: true }; // Default to approved if moderation fails
    }
  }
}

export const aiService = new AIService();
export default aiService;
