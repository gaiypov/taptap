// Утилита для валидации объявлений
import type { Listing } from '@/types';
import { appLogger } from './logger';

export interface ListingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

/**
 * Валидирует объявление и возвращает результат
 */
export function validateListing(listing: Listing): ListingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Проверка title
  if (!listing.title || listing.title.trim() === '') {
    errors.push('Отсутствует заголовок объявления');
    missingFields.push('title');
  } else if (listing.title.trim().length < 3) {
    warnings.push('Заголовок слишком короткий (менее 3 символов)');
  }

  // Проверка description
  if (!listing.description || listing.description.trim() === '') {
    warnings.push('Отсутствует описание объявления');
    missingFields.push('description');
  } else if (listing.description.trim().length < 10) {
    warnings.push('Описание слишком короткое (менее 10 символов)');
  }

  // Проверка price
  if (listing.price === undefined || listing.price === null) {
    errors.push('Отсутствует цена');
    missingFields.push('price');
  } else if (typeof listing.price !== 'number' || !Number.isFinite(listing.price)) {
    errors.push('Некорректная цена');
    missingFields.push('price');
  } else if (listing.price < 0) {
    warnings.push('Цена отрицательная');
  } else if (listing.price === 0) {
    warnings.push('Цена равна нулю');
  }

  // Проверка video
  const hasVideo = !!(
    listing.video_id ||
    listing.video_url ||
    (listing as any).video_hls_url
  );
  if (!hasVideo) {
    errors.push('Отсутствует видео');
    missingFields.push('video');
  }

  // Проверка thumbnail
  const hasThumbnail = !!(
    listing.thumbnail_url ||
    (listing as any).video_thumbnail_url
  );
  if (!hasThumbnail) {
    warnings.push('Отсутствует превью изображение');
    missingFields.push('thumbnail');
  }

  // Проверка локализации
  const hasLocation = !!(
    listing.location?.trim() ||
    listing.city?.trim() ||
    (listing as any).latitude ||
    (listing as any).longitude
  );
  if (!hasLocation) {
    warnings.push('Отсутствует информация о местоположении');
    missingFields.push('location');
  }

  // Проверка seller
  if (!listing.seller || !listing.seller.id) {
    warnings.push('Отсутствует информация о продавце');
    missingFields.push('seller');
  }

  // Логирование в консоль
  if (errors.length > 0 || warnings.length > 0) {
    appLogger.warn('[ListingValidation] Validation issues', {
      listingId: listing.id,
      errors,
      warnings,
      missingFields,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields,
  };
}

/**
 * Форматирует сообщения валидации для отображения в UI
 */
export function formatValidationMessages(result: ListingValidationResult): string[] {
  const messages: string[] = [];

  if (result.errors.length > 0) {
    messages.push(...result.errors.map(e => `❌ ${e}`));
  }

  if (result.warnings.length > 0) {
    messages.push(...result.warnings.map(w => `⚠️ ${w}`));
  }

  return messages;
}

