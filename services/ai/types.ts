// ==============================================
// AI TYPES ДЛЯ REACT NATIVE
// ==============================================

export type ListingCategory = 'car' | 'horse' | 'real_estate';
export type ModerationStrategy = 'basic' | 'full' | 'premium';
export type AnalysisStatus = 'idle' | 'processing' | 'completed' | 'failed';
export type HonestyGrade = 'A' | 'B' | 'C' | 'D' | 'F';

// Результат модерации
export interface ContentModerationResult {
  approved: boolean;
  requiresReview: boolean;
  flags: {
    type: 'adult' | 'violence' | 'spam' | 'fake' | 'low_quality' | 'wrong_category';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  reason?: string;
}

// Honesty Score
export interface HonestyScore {
  overall: number;
  grade: HonestyGrade;
  gradeLabel: string;
  factors: {
    photoQuality: number;
    completeness: number;
    consistency: number;
    transparency: number;
  };
  suggestions: string[];
}

// Оценка цены
export interface PriceEstimate {
  min: number;
  max: number;
  currency: 'KGS';
}

// Анализ авто
export interface CarAnalysisResult {
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  color?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  conditionScore?: number;
  damages?: {
    type: string;
    severity: string;
    location: string;
    confidence: number;
  }[];
  features?: string[];
  estimatedPrice?: PriceEstimate;
}

// Анализ лошади
export interface HorseAnalysisResult {
  breed?: string;
  breedRu?: string;
  color?: string;
  colorRu?: string;
  estimatedAge?: string;
  gender?: 'stallion' | 'mare' | 'gelding';
  genderRu?: string;
  gait?: string;
  equipment?: string[];
  environment?: string;
  environmentRu?: string;
  healthIndicators?: string[];
  condition?: 'excellent' | 'good' | 'fair';
  conditionScore?: number;
  estimatedPrice?: PriceEstimate;
}

// Анализ недвижимости
export interface RealEstateAnalysisResult {
  propertyType?: 'apartment' | 'house' | 'land' | 'commercial';
  propertyTypeRu?: string;
  estimatedRooms?: number;
  condition?: 'new' | 'renovated' | 'good' | 'needs_repair';
  conditionRu?: string;
  conditionScore?: number;
  features?: string[];
  roomsShown?: string[];
  exteriorShown?: boolean;
  estimatedArea?: string;
  estimatedPrice?: PriceEstimate;
}

// Сгенерированный контент
export interface GeneratedContent {
  title: string;
  description: string;
  tags: string[];
}

// Полный результат анализа
export interface AIAnalysisResult {
  category: ListingCategory;
  moderation: ContentModerationResult;
  honestyScore: HonestyScore;
  generatedTitle: string;
  generatedDescription: string;
  tags: string[];
  estimatedPrice?: PriceEstimate;
  
  // Категорийные данные (только одно заполнено)
  carAnalysis?: CarAnalysisResult;
  horseAnalysis?: HorseAnalysisResult;
  realEstateAnalysis?: RealEstateAnalysisResult;
  
  // Метаданные
  processingTimeMs: number;
  strategy: ModerationStrategy;
}

// Запрос на анализ
export interface AnalysisRequest {
  frames: string[];           // base64 кадры
  category: ListingCategory;
  isFirstListing?: boolean;
  isPremium?: boolean;
  estimatedPrice?: number;
  strategy?: 'cheapest' | 'best_quality' | 'balanced';
}

// Состояние прогресса
export interface AnalysisProgress {
  step: string;
  progress: number;           // 0-100
}

