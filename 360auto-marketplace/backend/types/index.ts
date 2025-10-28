// backend/types/index.ts
// Backend типы для AI сервиса

// Car types
export interface Car {
  id?: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  location: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  saves: number;
  createdAt: string;
  isVerified: boolean;
  aiAnalysis?: {
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    conditionScore: number;
    damages: Damage[];
    estimatedPrice: {
      min: number;
      max: number;
    };
    features: string[];
  };
}

// Damage types
export interface Damage {
  type: 'scratch' | 'dent' | 'rust' | 'crack' | 'other';
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  confidence: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

// Analysis request types
export interface AnalysisRequest {
  videoFrames: string[];
  metadata?: {
    videoUrl?: string;
    duration?: number;
    width?: number;
    height?: number;
    userId?: string;
  };
}

export interface QuickIdentifyRequest {
  imageBase64: string;
}

export interface VideoValidationRequest {
  videoMetadata: {
    duration: number;
    width: number;
    height: number;
    size?: number;
    format?: string;
  };
}

// Analysis status types
export interface AnalysisStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  result?: Partial<Car>;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
  lastLoginAt?: string;
}

// Authentication types
export interface AuthToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Error types
export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: any;
}

// Rate limiting types
export interface RateLimitInfo {
  count: number;
  resetTime: number;
  limit: number;
  remaining: number;
}

// Configuration types
export interface AIConfig {
  apiKeys: {
    openai: string;
    anthropic: string;
    google: string;
    roboflow: string;
  };
  providers: {
    carIdentification: string;
    damageDetection: string;
    conditionAnalysis: string;
    ocrMileage: string;
    priceEstimation: string;
  };
}

// Database types
export interface DatabaseCar extends Car {
  id: string;
  userId: string;
  analysisId: string;
  status: 'draft' | 'published' | 'sold' | 'archived';
  publishedAt?: string;
  soldAt?: string;
}

export interface DatabaseAnalysis {
  id: string;
  userId: string;
  videoFrames: string[];
  status: AnalysisStatus['status'];
  progress: number;
  currentStep?: string;
  result?: Partial<Car>;
  error?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: any;
}

// WebSocket types (для real-time обновлений)
export interface WebSocketMessage {
  type: 'analysis_progress' | 'analysis_complete' | 'analysis_error';
  analysisId: string;
  userId: string;
  data: any;
}

export interface AnalysisProgressMessage extends WebSocketMessage {
  type: 'analysis_progress';
  data: {
    step: string;
    progress: number;
  };
}

export interface AnalysisCompleteMessage extends WebSocketMessage {
  type: 'analysis_complete';
  data: {
    result: Partial<Car>;
  };
}

export interface AnalysisErrorMessage extends WebSocketMessage {
  type: 'analysis_error';
  data: {
    error: string;
    code: string;
  };
}
