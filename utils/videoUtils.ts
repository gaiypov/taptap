import { VideoTrimData } from '@/types/video.types';

// ==============================================
// VIDEO UTILS
// ==============================================

/**
 * Генерировать URL для api.video с параметрами обрезки
 * api.video поддерживает ?time=X для начала воспроизведения
 */
export function getVideoPlaybackUrl(
  videoId: string,
  trim?: VideoTrimData
): string {
  const baseUrl = `https://embed.api.video/vod/${videoId}`;

  if (!trim) {
    return baseUrl;
  }

  // api.video параметры
  const params = new URLSearchParams();

  if (trim.startTime > 0) {
    params.append('time', trim.startTime.toString());
  }

  // Для автоостановки используем JavaScript в плеере
  // api.video не поддерживает end параметр напрямую

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Генерировать URL thumbnail с учётом обрезки
 */
export function getThumbnailUrl(
  videoId: string,
  trim?: VideoTrimData,
  width: number = 640
): string {
  // Берём кадр из середины обрезанного участка
  const time = trim
    ? Math.floor((trim.startTime + trim.endTime) / 2)
    : 0;

  return `https://vod.api.video/vod/${videoId}/thumbnail.jpg?time=${time}&width=${width}`;
}

/**
 * Форматировать время в MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Валидация параметров обрезки
 */
export function validateTrim(
  trim: VideoTrimData,
  minDuration: number = 3
): { valid: boolean; error?: string } {
  if (trim.startTime < 0) {
    return { valid: false, error: 'Начало не может быть отрицательным' };
  }

  if (trim.endTime > trim.originalDuration) {
    return { valid: false, error: 'Конец превышает длительность видео' };
  }

  if (trim.startTime >= trim.endTime) {
    return { valid: false, error: 'Начало должно быть раньше конца' };
  }

  const duration = trim.endTime - trim.startTime;
  if (duration < minDuration) {
    return { valid: false, error: `Минимальная длительность: ${minDuration} сек` };
  }

  return { valid: true };
}

/**
 * Рассчитать trimmedDuration
 */
export function calculateTrimmedDuration(trim: Partial<VideoTrimData>): number {
  if (!trim.startTime && !trim.endTime) return trim.originalDuration || 0;

  const start = trim.startTime || 0;
  const end = trim.endTime || trim.originalDuration || 0;

  return Math.max(0, end - start);
}
