// ============================================
// Mobile Types
// ============================================

// Re-export ALL types from shared (single source of truth)
export * from '@shared/constants';
export * from '@shared/types';

// Mobile-specific types (только то чего НЕТ в shared)
export interface UploadProgress {
  percentage: number;
  bytesUploaded: number;
  totalBytes: number;
}

export interface CameraSettings {
  quality: number;
  duration: number;
}

export interface MobileNavigationParams {
  '(tabs)': undefined;
  'car/[id]': { id: string };
  'listing/[id]': { id: string };
  '+not-found': undefined;
}

export interface TabNavigationParams {
  index: undefined;
  search: undefined;
  create: undefined;
  favorites: undefined;
  profile: undefined;
}
