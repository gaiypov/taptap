/**
 * Цвета согласно промпту CursorAI-Prompt.md
 * Основные цвета для UI/UX стандартов проекта
 */
export const Colors = {
  // Primary colors - Revolut Ultra Platinum 2025-2026
  primary: '#C0C0C0',      // Серебро (акцент)
  primaryDark: '#707070',   // Темное серебро
  primaryLight: '#E0E0E0',  // Светлое серебро
  primaryAlt: '#C0C0C0',    // Альтернативный серебро
  
  // Secondary colors
  secondary: '#B0B0B0',     // Второстепенное серебро
  secondaryDark: '#707070',
  secondaryLight: '#E0E0E0',
  
  // Success colors
  success: '#34C759',        // Зеленый (оставляем для статусов)
  successDark: '#388E3C',
  successLight: '#81C784',
  
  // Warning colors
  warning: '#FF9500',       // Оранжевый (оставляем для статусов)
  warningDark: '#F57C00',
  warningLight: '#FFB74D',
  
  // Background colors - Revolut Ultra Platinum
  background: '#0D0D0D',    // Глубокий черный
  backgroundSecondary: '#171717',  // Карточки
  backgroundTertiary: '#1A1A1A',
  
  // Surface colors
  surface: '#171717',       // Карточки/панели
  surfaceSecondary: '#1A1A1A',
  surfaceTertiary: '#2C2C2C',
  
  // Text colors
  text: '#FFFFFF',          // Основной текст
  textSecondary: '#B8B8B8', // Второстепенный текст
  textTertiary: '#707070',  // Третичный текст
  textDisabled: '#707070',
  
  // Border colors
  border: '#2A2A2A',
  borderSecondary: '#333333',
  borderLight: '#2A2A2A',
  
  // Status colors (НИКАКОГО КРАСНОГО - используем серебро)
  error: '#C0C0C0',         // Серебро вместо красного
  errorDark: '#A0A0A0',
  errorLight: '#E0E0E0',
  
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
  
  // Gradient colors - Revolut Ultra Platinum
  gradients: {
    primary: ['#2C2C2C', '#1A1A1A'],  // Градиент для кнопок
    secondary: ['#2C2C2C', '#1A1A1A'],
    sunset: ['#2C2C2C', '#1A1A1A'],
    ocean: ['#2C2C2C', '#1A1A1A'],
    fire: ['#2C2C2C', '#1A1A1A'],
    forest: ['#2C2C2C', '#1A1A1A'],
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
