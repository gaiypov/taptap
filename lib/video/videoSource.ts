// lib/video/videoSource.ts — PRODUCTION-GRADE VIDEO SOURCE NORMALIZER
// Индустриальный стандарт для нормализации VideoSource в @expo/video
// Поддержка: nested Optional (до 20 уровней), file://, blob://, camera URLs, stale URLs, fallback strategies

import { appLogger } from '@/utils/logger';

/**
 * Placeholder видео URL для fallback
 */
export const PLACEHOLDER_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

/**
 * Type guard для проверки валидности VideoSource
 */
export function isValidVideoSource(source: unknown): source is string {
  if (typeof source !== 'string') return false;
  const trimmed = source.trim();
  if (trimmed.length === 0) return false;
  
  // Проверяем валидные протоколы
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('asset://')
  );
}

/**
 * Проверяет, является ли URL реальным видео (не placeholder)
 */
export function isRealVideo(url: string): boolean {
  if (!url || url.trim().length === 0) return false;
  if (url === PLACEHOLDER_VIDEO_URL) return false;
  if (url.includes('BigBuckBunny')) return false;
  return true;
}

/**
 * Проверяет, является ли URL локальным файлом
 */
export function isLocalFile(url: string): boolean {
  return (
    url.startsWith('file://') ||
    url.startsWith('content://') ||
    url.startsWith('asset://')
  );
}

/**
 * Проверяет, является ли URL blob URL
 */
export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Проверяет, является ли URL временным (из camera)
 */
export function isTemporaryUrl(url: string): boolean {
  return (
    url.includes('/tmp/') ||
    url.includes('/cache/') ||
    url.includes('CameraRoll') ||
    url.includes('ImagePicker')
  );
}

/**
 * Проверяет, является ли URL устаревшим (stale)
 */
export function isStaleUrl(url: string): boolean {
  // Проверяем наличие временных меток или токенов, которые могли истечь
  if (url.includes('expires=')) {
    const match = url.match(/expires=(\d+)/);
    if (match) {
      const expires = parseInt(match[1], 10);
      if (Date.now() / 1000 > expires) {
        return true;
      }
    }
  }
  return false;
}

/**
 * PRODUCTION-GRADE: Агрессивно извлекает строку URL из любых структур
 * Поддержка:
 * - Nested Optional до 20 уровней
 * - Локальные файлы (file://, content://, asset://)
 * - Blob URLs (blob:)
 * - Временные URL из camera
 * - Stale URLs
 * - Объекты с вложенными URL
 * - JSON строки с URL
 * - Нативные Optional типы (Swift/Objective-C)
 */
function extractStringFromOptional(value: unknown, depth = 0): string {
  // Защита от бесконечной рекурсии (максимум 20 уровней)
  if (depth > 20) {
    appLogger.warn('[extractStringFromOptional] Max depth reached', { depth });
    return '';
  }

  // Если уже строка - возвращаем сразу (после валидации)
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return '';
    
    // Проверяем валидные протоколы
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('file://') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('content://') ||
      trimmed.startsWith('asset://')
    ) {
      return trimmed;
    }
    
    // Если это не валидный протокол, но похоже на URL, пытаемся извлечь
    if (trimmed.includes('://')) {
      return trimmed;
    }
    
    return '';
  }

  // Если null/undefined
  if (value == null) {
    return '';
  }

  // Пытаемся через JSON (для нативных Optional)
  try {
    const jsonStr = JSON.stringify(value);
    // Ищем URL в JSON строке
    const urlPatterns = [
      /https?:\/\/[^\s"']+/g,
      /file:\/\/[^\s"']+/g,
      /blob:[^\s"']+/g,
      /content:\/\/[^\s"']+/g,
      /asset:\/\/[^\s"']+/g,
    ];
    
    for (const pattern of urlPatterns) {
      const matches = jsonStr.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
  } catch {
    // Игнорируем ошибки JSON
  }

  // Пытаемся через toString и убираем Optional(...) рекурсивно (до 20 уровней)
  let str = String(value);
  let prevStr = '';
  let iterations = 0;
  const maxIterations = 20; // Увеличено с 10 до 20

  // Рекурсивно убираем Optional(Optional(...))
  while (str !== prevStr && str.includes('Optional(') && iterations < maxIterations) {
    prevStr = str;
    const match = str.match(/Optional\(([^)]+)\)/);
    if (match) {
      str = match[1].trim();
      // Убираем кавычки
      if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
        str = str.slice(1, -1).trim();
      }
    } else {
      break;
    }
    iterations++;
  }

  // Проверяем, что это валидный URL
  if (str && (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('file://') ||
    str.startsWith('blob:') ||
    str.startsWith('content://') ||
    str.startsWith('asset://')
  )) {
    return str;
  }

  // Если это объект, пытаемся найти URL в его свойствах
  if (typeof value === 'object' && value !== null) {
    // Расширенный список свойств для поиска URL
    const props = [
      'url', 'uri', 'source', 'value', 'some', 'none',
      'video_url', 'videoUrl', 'video_id', 'videoId',
      'hls_url', 'hlsUrl', 'hls', 'mp4_url', 'mp4Url',
      'stream_url', 'streamUrl', 'playback_url', 'playbackUrl',
      'media_url', 'mediaUrl', 'content_url', 'contentUrl',
    ];
    
    for (const prop of props) {
      if (prop in value) {
        const extracted = extractStringFromOptional((value as any)[prop], depth + 1);
        if (extracted) return extracted;
      }
    }

    // Пытаемся перебрать все свойства (только если не слишком много)
    try {
      const keys = Object.keys(value);
      if (keys.length <= 50) { // Ограничение для производительности
        for (const key of keys) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            const extracted = extractStringFromOptional((value as any)[key], depth + 1);
            if (extracted) return extracted;
          }
        }
      }
    } catch {
      // Игнорируем ошибки
    }
  }

  return '';
}

/**
 * PRODUCTION-GRADE: Нормализует входной VideoSource в чистую строку URL
 * Гарантирует, что вернется либо валидный URL, либо placeholder
 * 
 * Fallback strategies:
 * 1. Прямая нормализация
 * 2. Извлечение из Optional оберток
 * 3. Поиск в объектах
 * 4. Placeholder fallback
 *
 * @param input - Любой тип входных данных (string, Optional, object, null, undefined)
 * @returns Чистая строка URL (всегда валидна для useVideoPlayer)
 */
export function normalizeVideoUrl(input: unknown): string {
  // Шаг 1: Прямое извлечение
  const extracted = extractStringFromOptional(input);

  // Шаг 2: Проверка валидности
  if (extracted && isValidVideoSource(extracted)) {
    // Шаг 3: Проверка на stale URL
    if (isStaleUrl(extracted)) {
      appLogger.warn('[normalizeVideoUrl] Stale URL detected', {
        url: extracted.substring(0, 100),
      });
      // Для stale URL все равно возвращаем, но логируем
    }
    
    return extracted;
  }

  // Шаг 4: Fallback на placeholder
  if (__DEV__) {
    appLogger.debug('[normalizeVideoUrl] Using placeholder', {
      input: typeof input === 'string' 
        ? input.substring(0, 50) 
        : String(input).substring(0, 50),
      extracted: extracted ? extracted.substring(0, 50) : 'empty',
    });
  }

  return PLACEHOLDER_VIDEO_URL;
}

/**
 * PRODUCTION-GRADE: Нормализует URL с дополнительными проверками
 * Используется для критических мест, где нужна максимальная надежность
 */
export function normalizeVideoUrlStrict(input: unknown): string {
  const normalized = normalizeVideoUrl(input);

  // Дополнительные проверки для production
  if (!isRealVideo(normalized)) {
    appLogger.warn('[normalizeVideoUrlStrict] Using placeholder in strict mode', {
      input: typeof input === 'string' ? input.substring(0, 50) : String(input).substring(0, 50),
    });
  }

  return normalized;
}

// ==============================================
// LISTING VIDEO URL HELPERS
// ==============================================

/**
 * Интерфейс для объектов с видео данными
 */
export interface VideoListing {
  video_id?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  videoId?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  video?: string | null;
  videoUri?: string | null;
}

/**
 * Получает URL видео из listing объекта
 * Приоритет: video_id (HLS) -> video_url -> fallback поля
 *
 * @param listing - Объект с видео данными
 * @param apiVideo - Сервис api.video для получения HLS URL (опционально)
 * @returns URL видео или пустая строка
 */
export function getVideoUrl(
  listing: VideoListing,
  apiVideo?: { getHLSUrl: (videoId: string) => string }
): string {
  // Приоритет 1: Если есть video_id от api.video, используем HLS
  if (listing.video_id && String(listing.video_id).trim() !== '') {
    if (apiVideo) {
      try {
        const hlsUrl = apiVideo.getHLSUrl(String(listing.video_id));
        if (hlsUrl && hlsUrl.trim() !== '' && !hlsUrl.includes('BigBuckBunny')) {
          appLogger.debug('[getVideoUrl] Using HLS URL from video_id', {
            videoId: listing.video_id,
            hlsUrl: hlsUrl.substring(0, 50) + '...',
          });
          return hlsUrl;
        }
      } catch (error) {
        appLogger.warn('[getVideoUrl] Error getting HLS URL for video_id', {
          videoId: listing.video_id,
          error,
        });
      }
    }
  }

  // Приоритет 2: Fallback на обычный URL из video_url
  const rawVideoUrl = listing.video_url || listing.videoUrl || '';
  if (rawVideoUrl) {
    const normalized = normalizeVideoUrl(rawVideoUrl);
    if (normalized && normalized.trim() !== '' && !normalized.includes('BigBuckBunny')) {
      appLogger.debug('[getVideoUrl] Using video_url', {
        videoUrl: normalized.substring(0, 50) + '...',
      });
      return normalized;
    }
  }

  // Приоритет 3: Последний fallback - проверяем все возможные поля
  const fallbackUrl = listing.video || listing.videoUri || '';
  if (fallbackUrl && String(fallbackUrl).trim() !== '') {
    const normalized = normalizeVideoUrl(fallbackUrl);
    if (normalized && !normalized.includes('BigBuckBunny')) {
      appLogger.debug('[getVideoUrl] Using fallback video URL', {
        fallbackUrl: normalized.substring(0, 50) + '...',
      });
      return normalized;
    }
  }

  appLogger.warn('[getVideoUrl] No video URL found for listing', {
    hasVideoId: !!listing.video_id,
    hasVideoUrl: !!listing.video_url,
  });

  return '';
}

/**
 * Получает URL превью (thumbnail) из listing объекта
 *
 * @param listing - Объект с видео данными
 * @param apiVideo - Сервис api.video для получения thumbnail URL (опционально)
 * @returns URL превью или undefined
 */
export function getThumbnailUrl(
  listing: VideoListing,
  apiVideo?: { getThumbnailUrl: (videoId: string) => string }
): string | undefined {
  // Приоритет 1: Прямой thumbnail_url
  if (listing.thumbnail_url) {
    return listing.thumbnail_url;
  }
  if (listing.thumbnailUrl) {
    return listing.thumbnailUrl;
  }

  // Приоритет 2: Генерация из video_id через api.video
  if (listing.video_id && apiVideo) {
    try {
      return apiVideo.getThumbnailUrl(String(listing.video_id));
    } catch (error) {
      appLogger.warn('[getThumbnailUrl] Error getting thumbnail URL for video_id', {
        videoId: listing.video_id,
        error,
      });
    }
  }

  return undefined;
}
