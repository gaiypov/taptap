// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  createdAt: string;
  updatedAt: string;
}

// Video types
export interface Video {
  id: string;
  uri: string;
  thumbnailUri?: string;
  title: string;
  description?: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  carInfo: CarInfo;
  owner: User;
  tags: string[];
  isPublic: boolean;
  isLiked?: boolean;
}

// Car types
export interface CarInfo {
  id: string;
  make: string;
  model: string;
  year: number;
  price?: number;
  mileage?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  color?: string;
  transmission?: 'manual' | 'automatic' | 'cvt';
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  features: string[];
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  videoId: string;
  likes: number;
  replies?: Comment[];
  isLiked?: boolean;
}

// Message types
export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'car_link';
  createdAt: string;
  sender: User;
  receiver: User;
  isRead: boolean;
  metadata?: {
    carId?: string;
    videoId?: string;
    imageUri?: string;
  };
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Upload types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadState {
  isUploading: boolean;
  progress: UploadProgress;
  error?: string;
  videoId?: string;
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  'car/[id]': { id: string };
  '+not-found': undefined;
};

export type TabParamList = {
  index: undefined;
  upload: undefined;
  search: undefined;
  messages: undefined;
  profile: undefined;
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

// Camera types
export interface CameraSettings {
  quality: 'low' | 'medium' | 'high';
  flashMode: 'off' | 'on' | 'auto';
  focusMode: 'auto' | 'manual';
  whiteBalance: 'auto' | 'sunny' | 'cloudy' | 'fluorescent' | 'incandescent';
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

// Search types
export interface SearchFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  condition?: string[];
  features?: string[];
}

export interface SearchResult {
  videos: Video[];
  cars: CarInfo[];
  users: User[];
  totalResults: number;
}
