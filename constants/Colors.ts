/**
 * Цвета согласно промпту CursorAI-Prompt.md
 * Основные цвета для UI/UX стандартов проекта
 */
export const Colors = {
  // Primary colors (согласно промпту)
  primary: '#FF3B30',      // Красный (из промпта)
  primaryDark: '#0056CC',   // Сохраняем для совместимости
  primaryLight: '#4DA6FF',  // Сохраняем для совместимости
  primaryAlt: '#007AFF',    // Альтернативный синий (было primary)
  
  // Secondary colors
  secondary: '#007AFF',     // Синий (из промпта)
  secondaryDark: '#495057',
  secondaryLight: '#ADB5BD',
  
  // Success colors
  success: '#34C759',        // Зеленый (из промпта)
  successDark: '#388E3C',
  successLight: '#81C784',
  
  // Warning colors
  warning: '#FF9500',       // Оранжевый (из промпта)
  warningDark: '#F57C00',
  warningLight: '#FFB74D',
  
  // Background colors
  background: '#000000',    // Черный (из промпта)
  backgroundSecondary: '#111111',
  backgroundTertiary: '#1A1A1A',
  
  // Surface colors
  surface: '#1C1C1E',       // Темно-серый (из промпта)
  surfaceSecondary: '#2A2A2A',
  surfaceTertiary: '#3A3A3A',
  
  // Text colors
  text: '#FFFFFF',          // Белый (из промпта)
  textSecondary: '#8E8E93', // Серый (из промпта)
  textTertiary: '#999999',
  textDisabled: '#666666',
  
  // Border colors
  border: '#333333',
  borderSecondary: '#444444',
  borderLight: '#555555',
  
  // Status colors
  error: '#F44336',
  errorDark: '#D32F2F',
  errorLight: '#EF5350',
  
  info: '#2196F3',
  infoDark: '#1976D2',
  infoLight: '#64B5F6',
  
  // Social colors
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  youtube: '#FF0000',
  
  // Car brand colors
  bmw: '#0066CC',
  mercedes: '#00A651',
  audi: '#BB0A30',
  toyota: '#EB0A1E',
  honda: '#C8102E',
  ford: '#003478',
  chevrolet: '#FFC72C',
  nissan: '#C8102E',
  
  // Transparent colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Gradient colors
  gradients: {
    primary: ['#007AFF', '#0056CC'],
    secondary: ['#6C757D', '#495057'],
    sunset: ['#FF6B6B', '#4ECDC4'],
    ocean: ['#667eea', '#764ba2'],
    fire: ['#f093fb', '#f5576c'],
    forest: ['#4facfe', '#00f2fe'],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeights = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const AnimationDurations = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export const ZIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export const API_ENDPOINTS = {
  BASE_URL: 'https://api.360auto.com/v1',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  VIDEOS: {
    LIST: '/videos',
    DETAIL: '/videos/:id',
    UPLOAD: '/videos/upload',
    LIKE: '/videos/:id/like',
    COMMENT: '/videos/:id/comments',
  },
  CARS: {
    LIST: '/cars',
    DETAIL: '/cars/:id',
    SEARCH: '/cars/search',
  },
  USERS: {
    PROFILE: '/users/profile',
    VIDEOS: '/users/:id/videos',
  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  USER_PREFERENCES: 'user_preferences',
  OFFLINE_VIDEOS: 'offline_videos',
  CACHED_DATA: 'cached_data',
};

export const VIDEO_QUALITIES = {
  LOW: '480p',
  MEDIUM: '720p',
  HIGH: '1080p',
  ULTRA: '4K',
};

export const CAR_CONDITIONS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
} as const;

export const TRANSMISSION_TYPES = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
  CVT: 'cvt',
} as const;

export const FUEL_TYPES = {
  GASOLINE: 'gasoline',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
} as const;
