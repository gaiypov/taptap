// services/cache/videoCache.ts
// VIDEO CACHE SERVICE — ЛОКАЛЬНЫЙ КЭШ ТЯЖЁЛЫХ ВИДЕО
// Использует expo-file-system для хранения видео на устройстве

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { appLogger } from '@/utils/logger';
import mmkvStorage from './mmkvStorage';

// ============================================
// CONFIGURATION
// ============================================

const CACHE_DIR = (FileSystem as any).cacheDirectory ?? '';
const VIDEO_CACHE_DIR = `${CACHE_DIR}videos/`;
const THUMBNAIL_CACHE_DIR = `${CACHE_DIR}thumbnails/`;

// Лимиты
const MAX_CACHE_SIZE_MB = 500; // 500MB максимум для видео
const MAX_CACHE_ITEMS = 50; // Максимум 50 видео в кэше
const CLEANUP_THRESHOLD_MB = 400; // Начинаем чистить при 400MB

// MMKV ключ для метаданных кэша
const CACHE_META_KEY = 'video_cache_meta';

// ============================================
// TYPES
// ============================================

export interface CachedVideo {
  id: string;
  originalUrl: string;
  localUri: string;
  thumbnailUri?: string;
  size: number; // В байтах
  duration?: number;
  cachedAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

interface CacheMeta {
  videos: { [id: string]: CachedVideo };
  totalSize: number;
}

// ============================================
// INITIALIZATION
// ============================================

let initialized = false;

async function ensureDirectories(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (initialized) return;
  
  try {
    // Создаём директории если не существуют
    const videoDirInfo = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR);
    if (!videoDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VIDEO_CACHE_DIR, { intermediates: true });
    }
    
    const thumbDirInfo = await FileSystem.getInfoAsync(THUMBNAIL_CACHE_DIR);
    if (!thumbDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(THUMBNAIL_CACHE_DIR, { intermediates: true });
    }
    
    initialized = true;
    appLogger.info('[VideoCache] Directories initialized');
  } catch (error) {
    appLogger.error('[VideoCache] Failed to initialize directories', error);
  }
}

// ============================================
// CACHE METADATA
// ============================================

function getCacheMeta(): CacheMeta {
  return mmkvStorage.get<CacheMeta>(CACHE_META_KEY, { videos: {}, totalSize: 0 });
}

function setCacheMeta(meta: CacheMeta): void {
  mmkvStorage.set(CACHE_META_KEY, meta);
}

// ============================================
// CORE OPERATIONS
// ============================================

/**
 * Проверить есть ли видео в кэше
 */
export function isCached(videoId: string): boolean {
  const meta = getCacheMeta();
  return !!meta.videos[videoId];
}

/**
 * Получить локальный URI для видео (или null если не кэшировано)
 */
export function getCachedUri(videoId: string): string | null {
  const meta = getCacheMeta();
  const cached = meta.videos[videoId];
  
  if (cached) {
    // Обновляем статистику доступа
    cached.lastAccessedAt = Date.now();
    cached.accessCount++;
    setCacheMeta(meta);
    
    return cached.localUri;
  }
  
  return null;
}

/**
 * Получить полную информацию о кэшированном видео
 */
export function getCachedVideo(videoId: string): CachedVideo | null {
  const meta = getCacheMeta();
  return meta.videos[videoId] || null;
}

/**
 * Загрузить видео в кэш
 */
export async function cacheVideo(
  videoId: string,
  videoUrl: string,
  options?: {
    thumbnailUrl?: string;
    duration?: number;
    priority?: 'high' | 'normal' | 'low';
  }
): Promise<CachedVideo | null> {
  if (Platform.OS === 'web') return null;
  
  await ensureDirectories();
  
  // Проверяем, не кэшировано ли уже
  if (isCached(videoId)) {
    appLogger.debug(`[VideoCache] Video ${videoId} already cached`);
    return getCachedVideo(videoId);
  }
  
  // Проверяем и чистим кэш если нужно
  await cleanupIfNeeded();
  
  try {
    appLogger.info(`[VideoCache] Caching video ${videoId}`);
    
    // Определяем расширение файла
    const extension = videoUrl.split('.').pop()?.split('?')[0] || 'mp4';
    const localUri = `${VIDEO_CACHE_DIR}${videoId}.${extension}`;
    
    // Загружаем видео
    const downloadResult = await FileSystem.downloadAsync(videoUrl, localUri, {
      headers: {
        'Accept': 'video/*',
      },
    });
    
    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }
    
    // Получаем размер файла
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const size = 'size' in fileInfo ? fileInfo.size ?? 0 : 0;
    
    // Загружаем превью если есть
    let thumbnailUri: string | undefined;
    if (options?.thumbnailUrl) {
      try {
        const thumbExtension = options.thumbnailUrl.split('.').pop()?.split('?')[0] || 'jpg';
        thumbnailUri = `${THUMBNAIL_CACHE_DIR}${videoId}.${thumbExtension}`;
        
        await FileSystem.downloadAsync(options.thumbnailUrl, thumbnailUri);
      } catch (thumbError) {
        appLogger.warn(`[VideoCache] Failed to cache thumbnail for ${videoId}`, thumbError);
      }
    }
    
    // Создаём запись в метаданных
    const cachedVideo: CachedVideo = {
      id: videoId,
      originalUrl: videoUrl,
      localUri,
      thumbnailUri,
      size,
      duration: options?.duration,
      cachedAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
    };
    
    // Сохраняем метаданные
    const meta = getCacheMeta();
    meta.videos[videoId] = cachedVideo;
    meta.totalSize += size;
    setCacheMeta(meta);
    
    appLogger.info(`[VideoCache] Cached video ${videoId} (${(size / 1024 / 1024).toFixed(2)}MB)`);
    
    return cachedVideo;
  } catch (error) {
    appLogger.error(`[VideoCache] Failed to cache video ${videoId}`, error);
    return null;
  }
}

/**
 * Предзагрузка нескольких видео (для feed preloading)
 */
export async function preloadVideos(
  videos: Array<{ id: string; url: string; thumbnailUrl?: string }>,
  maxConcurrent = 2
): Promise<void> {
  if (Platform.OS === 'web') return;
  
  const toCache = videos.filter(v => !isCached(v.id));
  
  if (toCache.length === 0) {
    appLogger.debug('[VideoCache] All videos already cached');
    return;
  }
  
  appLogger.info(`[VideoCache] Preloading ${toCache.length} videos`);
  
  // Загружаем параллельно с ограничением
  const chunks: typeof toCache[] = [];
  for (let i = 0; i < toCache.length; i += maxConcurrent) {
    chunks.push(toCache.slice(i, i + maxConcurrent));
  }
  
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(v => cacheVideo(v.id, v.url, { thumbnailUrl: v.thumbnailUrl }))
    );
  }
}

/**
 * Удалить видео из кэша
 */
export async function removeFromCache(videoId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  
  const meta = getCacheMeta();
  const cached = meta.videos[videoId];
  
  if (!cached) return;
  
  try {
    // Удаляем файлы
    await FileSystem.deleteAsync(cached.localUri, { idempotent: true });
    
    if (cached.thumbnailUri) {
      await FileSystem.deleteAsync(cached.thumbnailUri, { idempotent: true });
    }
    
    // Обновляем метаданные
    meta.totalSize -= cached.size;
    delete meta.videos[videoId];
    setCacheMeta(meta);
    
    appLogger.info(`[VideoCache] Removed video ${videoId} from cache`);
  } catch (error) {
    appLogger.error(`[VideoCache] Failed to remove video ${videoId}`, error);
  }
}

// ============================================
// CLEANUP & MAINTENANCE
// ============================================

/**
 * Очистка кэша если превышен лимит
 */
async function cleanupIfNeeded(): Promise<void> {
  const meta = getCacheMeta();
  const totalSizeMB = meta.totalSize / 1024 / 1024;
  const itemCount = Object.keys(meta.videos).length;
  
  // Проверяем нужна ли очистка
  if (totalSizeMB < CLEANUP_THRESHOLD_MB && itemCount < MAX_CACHE_ITEMS) {
    return;
  }
  
  appLogger.info(`[VideoCache] Cleanup started (${totalSizeMB.toFixed(2)}MB, ${itemCount} items)`);
  
  // Сортируем по LRU (Least Recently Used)
  const videos = Object.values(meta.videos).sort((a, b) => {
    // Приоритет по времени последнего доступа и количеству просмотров
    const scoreA = a.lastAccessedAt + (a.accessCount * 60000); // +1 min за каждый просмотр
    const scoreB = b.lastAccessedAt + (b.accessCount * 60000);
    return scoreA - scoreB; // Сначала самые старые/непопулярные
  });
  
  // Удаляем пока не войдём в лимиты
  let currentSize = meta.totalSize;
  let currentCount = itemCount;
  
  for (const video of videos) {
    if (currentSize / 1024 / 1024 < CLEANUP_THRESHOLD_MB * 0.8 && currentCount < MAX_CACHE_ITEMS * 0.8) {
      break; // Достигли целевого размера
    }
    
    await removeFromCache(video.id);
    currentSize -= video.size;
    currentCount--;
  }
  
  const newMeta = getCacheMeta();
  appLogger.info(`[VideoCache] Cleanup finished (${(newMeta.totalSize / 1024 / 1024).toFixed(2)}MB, ${Object.keys(newMeta.videos).length} items)`);
}

/**
 * Полная очистка кэша
 */
export async function clearCache(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    // Удаляем все файлы
    await FileSystem.deleteAsync(VIDEO_CACHE_DIR, { idempotent: true });
    await FileSystem.deleteAsync(THUMBNAIL_CACHE_DIR, { idempotent: true });
    
    // Сбрасываем метаданные
    setCacheMeta({ videos: {}, totalSize: 0 });
    
    // Пересоздаём директории
    initialized = false;
    await ensureDirectories();
    
    appLogger.info('[VideoCache] Cache cleared');
  } catch (error) {
    appLogger.error('[VideoCache] Failed to clear cache', error);
  }
}

/**
 * Синхронизация метаданных с файловой системой
 * (на случай если файлы были удалены вручную)
 */
export async function syncWithFileSystem(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  const meta = getCacheMeta();
  const toRemove: string[] = [];
  
  for (const [id, cached] of Object.entries(meta.videos)) {
    try {
      const info = await FileSystem.getInfoAsync(cached.localUri);
      if (!info.exists) {
        toRemove.push(id);
      }
    } catch {
      toRemove.push(id);
    }
  }
  
  if (toRemove.length > 0) {
    appLogger.warn(`[VideoCache] Found ${toRemove.length} orphaned entries, removing`);
    
    for (const id of toRemove) {
      const cached = meta.videos[id];
      meta.totalSize -= cached.size;
      delete meta.videos[id];
    }
    
    setCacheMeta(meta);
  }
}

// ============================================
// STATS
// ============================================

export interface CacheStats {
  totalSize: number;
  totalSizeMB: number;
  itemCount: number;
  maxSizeMB: number;
  usagePercent: number;
  oldestItem?: CachedVideo;
  newestItem?: CachedVideo;
  mostAccessed?: CachedVideo;
}

export function getCacheStats(): CacheStats {
  const meta = getCacheMeta();
  const videos = Object.values(meta.videos);
  
  const stats: CacheStats = {
    totalSize: meta.totalSize,
    totalSizeMB: meta.totalSize / 1024 / 1024,
    itemCount: videos.length,
    maxSizeMB: MAX_CACHE_SIZE_MB,
    usagePercent: (meta.totalSize / 1024 / 1024 / MAX_CACHE_SIZE_MB) * 100,
  };
  
  if (videos.length > 0) {
    stats.oldestItem = videos.reduce((a, b) => a.cachedAt < b.cachedAt ? a : b);
    stats.newestItem = videos.reduce((a, b) => a.cachedAt > b.cachedAt ? a : b);
    stats.mostAccessed = videos.reduce((a, b) => a.accessCount > b.accessCount ? a : b);
  }
  
  return stats;
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Core
  isCached,
  getCachedUri,
  getCachedVideo,
  cacheVideo,
  preloadVideos,
  removeFromCache,
  
  // Maintenance
  clearCache,
  syncWithFileSystem,
  
  // Stats
  getCacheStats,
};

