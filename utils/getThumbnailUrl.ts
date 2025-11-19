// utils/getThumbnailUrl.ts
// Утилита для получения thumbnail URL с безопасным fallback

import { appLogger } from './logger';
import { safeUrl } from './safeUrl';

// Единый статический fallback placeholder для всех случаев
// Используем Supabase storage для надежного fallback
export const FALLBACK_THUMB = 'https://thqlfkngyipdscckbhor.supabase.co/storage/v1/object/public/placeholders/auto/auto_1.png';

/**
 * Получает thumbnail URL с безопасным fallback
 * @param thumbnailUrl - Основной thumbnail URL
 * @param category - Категория листинга (не используется, оставлено для совместимости)
 * @returns Валидный URL или FALLBACK_THUMB
 */
export const getThumbnailUrlWithFallback = (
  thumbnailUrl: string | undefined | null,
  category?: string
): string => {
  // Validate the URL using safeUrl
  const safeThumbnail = safeUrl(thumbnailUrl);

  // If we have a valid URL, return it
  if (safeThumbnail) {
    return safeThumbnail;
  }

  // Always return the static fallback if no valid URL
  appLogger.debug('[getThumbnailUrl] No valid thumbnail URL, using static fallback', {
    raw: thumbnailUrl?.substring(0, 50) || 'null/undefined',
    category,
  });

  return FALLBACK_THUMB;
};

/**
 * Определяет категорию из листинга
 */
export const getCategoryFromListing = (listing: {
  category?: string;
  details?: any;
}): 'auto' | 'horse' | 'real_estate' => {
  const category = listing.category?.toLowerCase() || '';

  if (category === 'car' || category === 'auto') {
    return 'auto';
  }
  if (category === 'horse') {
    return 'horse';
  }
  if (category === 'real_estate' || category === 'estate') {
    return 'real_estate';
  }

  // Fallback: пытаемся определить по details
  if (listing.details) {
    if (listing.details.brand || listing.details.model) {
      return 'auto';
    }
    if (listing.details.breed) {
      return 'horse';
    }
    if (listing.details.property_type || listing.details.rooms) {
      return 'real_estate';
    }
  }

  // Default fallback
  return 'auto';
};
