// services/cache/index.ts
// CACHE SERVICES — ЦЕНТРАЛЬНЫЙ ЭКСПОРТ
// Все сервисы кэширования и медиа в одном месте

// ============================================
// MMKV STORAGE — Сверхбыстрое хранилище (~0.1ms)
// ============================================
export {
  // Likes
  getLikes,
  isLiked,
  setLike,
  markLikeSynced,
  getUnsyncedLikes,
  
  // Saves (Favorites)
  getSaves,
  isSaved,
  setSave,
  markSaveSynced,
  getUnsyncedSaves,
  
  // Feed State
  getFeedState,
  setFeedState,
  clearFeedState,
  
  // Video Playback
  getVideoPosition,
  setVideoPosition,
  
  // Quick Preferences
  getQuickPrefs,
  setQuickPref,
  setQuickPrefs,
  
  // Generic
  get as mmkvGet,
  set as mmkvSet,
  remove as mmkvRemove,
  getBoolean,
  setBoolean,
  getNumber,
  setNumber,
  
  // Utils
  clearAll as clearMmkv,
  getAllKeys as getMmkvKeys,
  getStorageSize as getMmkvSize,
  
  // Types
  type LikesState,
  type SavesState,
  type FeedState,
  type QuickPrefs,
} from './mmkvStorage';

export { default as mmkvStorage } from './mmkvStorage';

// ============================================
// VIDEO CACHE — Локальный кэш видеофайлов
// ============================================
export {
  // Core
  isCached as isVideoCached,
  getCachedUri,
  getCachedVideo,
  cacheVideo,
  preloadVideos,
  removeFromCache as removeVideoFromCache,
  
  // Maintenance
  clearCache as clearVideoCache,
  syncWithFileSystem,
  
  // Stats
  getCacheStats as getVideoCacheStats,
  
  // Types
  type CachedVideo,
  type CacheStats,
} from './videoCache';

export { default as videoCache } from './videoCache';

// ============================================
// MEDIA LIBRARY — Работа с галереей устройства
// ============================================
export {
  // Permissions
  requestPermission as requestMediaPermission,
  checkPermission as checkMediaPermission,
  
  // Videos
  getVideos as getGalleryVideos,
  getVideoById as getGalleryVideoById,
  getRecentVideos,
  
  // Albums
  getVideoAlbums,
  
  // Copy/Import
  copyVideoToCache,
  saveVideoToGallery,
  
  // Validation
  validateVideo,
  
  // Types
  type GalleryVideo,
  type GalleryAlbum,
  type GalleryPageResult,
  type VideoValidation,
} from './mediaLibrary';

export { default as mediaLibrary } from './mediaLibrary';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import mmkvStorage from './mmkvStorage';
import videoCache from './videoCache';
import mediaLibrary from './mediaLibrary';

/**
 * Очистить все кэши (для logout или debug)
 */
export async function clearAllCaches(): Promise<void> {
  mmkvStorage.clearAll();
  await videoCache.clearCache();
}

/**
 * Получить общую статистику кэшей
 */
export function getCacheOverview() {
  const mmkvSize = mmkvStorage.getStorageSize();
  const videoStats = videoCache.getCacheStats();
  
  return {
    mmkv: {
      sizeBytes: mmkvSize,
      sizeMB: mmkvSize / 1024 / 1024,
      keys: mmkvStorage.getAllKeys().length,
    },
    video: {
      sizeBytes: videoStats.totalSize,
      sizeMB: videoStats.totalSizeMB,
      items: videoStats.itemCount,
      usagePercent: videoStats.usagePercent,
    },
    total: {
      sizeBytes: mmkvSize + videoStats.totalSize,
      sizeMB: (mmkvSize + videoStats.totalSize) / 1024 / 1024,
    },
  };
}

/**
 * Инициализация всех кэш-сервисов (вызывать при старте приложения)
 */
export async function initCacheServices(): Promise<void> {
  // MMKV инициализируется лениво при первом использовании
  
  // Синхронизируем видео-кэш с файловой системой
  await videoCache.syncWithFileSystem();
  
  // Проверяем разрешения галереи
  const mediaStatus = await mediaLibrary.checkPermission();
  
  console.log('[CacheServices] Initialized', {
    mmkvKeys: mmkvStorage.getAllKeys().length,
    videoCache: videoCache.getCacheStats().itemCount,
    mediaPermission: mediaStatus,
  });
}

// Default export for convenience
export default {
  mmkv: mmkvStorage,
  video: videoCache,
  media: mediaLibrary,
  clearAll: clearAllCaches,
  getOverview: getCacheOverview,
  init: initCacheServices,
};

