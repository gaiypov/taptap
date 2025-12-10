// services/cache/mediaLibrary.ts
// MEDIA LIBRARY SERVICE — ИМПОРТ ВИДЕО ИЗ ГАЛЕРЕИ
// Использует expo-media-library для работы с медиа устройства

import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { appLogger } from '@/utils/logger';

// ============================================
// TYPES
// ============================================

export interface GalleryVideo {
  id: string;
  uri: string;
  filename: string;
  duration: number; // В секундах
  width: number;
  height: number;
  createdAt: Date;
  modifiedAt: Date;
  fileSize?: number;
  albumId?: string;
  albumTitle?: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  assetCount: number;
  type: string;
}

export interface GalleryPageResult {
  videos: GalleryVideo[];
  hasNextPage: boolean;
  endCursor?: string;
  totalCount: number;
}

// ============================================
// PERMISSIONS
// ============================================

/**
 * Запросить разрешение на доступ к галерее
 */
export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status === 'granted') {
      appLogger.info('[MediaLibrary] Permission granted');
      return true;
    }
    
    appLogger.warn('[MediaLibrary] Permission denied');
    return false;
  } catch (error) {
    appLogger.error('[MediaLibrary] Permission request failed', error);
    return false;
  }
}

/**
 * Проверить текущий статус разрешения
 */
export async function checkPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'denied';
  
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status;
  } catch {
    return 'denied';
  }
}

// ============================================
// VIDEO FETCHING
// ============================================

/**
 * Получить видео из галереи с пагинацией
 */
export async function getVideos(options?: {
  first?: number;
  after?: string;
  albumId?: string;
  sortBy?: 'creationTime' | 'modificationTime' | 'duration';
  sortOrder?: 'asc' | 'desc';
}): Promise<GalleryPageResult> {
  if (Platform.OS === 'web') {
    return { videos: [], hasNextPage: false, totalCount: 0 };
  }
  
  try {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }
    
    // Строим параметры запроса
    const queryOptions: MediaLibrary.AssetsOptions = {
      mediaType: MediaLibrary.MediaType.video,
      first: options?.first ?? 20,
      sortBy: [
        options?.sortBy === 'duration'
          ? MediaLibrary.SortBy.duration
          : options?.sortBy === 'modificationTime'
            ? MediaLibrary.SortBy.modificationTime
            : MediaLibrary.SortBy.creationTime,
      ],
    };
    
    if (options?.after) {
      queryOptions.after = options.after;
    }
    
    if (options?.albumId) {
      queryOptions.album = options.albumId;
    }
    
    // Получаем ассеты
    const { assets, endCursor, hasNextPage, totalCount } = await MediaLibrary.getAssetsAsync(queryOptions);
    
    // Конвертируем в наш формат
    const videos: GalleryVideo[] = assets.map(asset => ({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
      createdAt: new Date(asset.creationTime),
      modifiedAt: new Date(asset.modificationTime),
      albumId: asset.albumId,
    }));
    
    // Сортируем если нужно в обратном порядке
    if (options?.sortOrder === 'asc') {
      videos.reverse();
    }
    
    return {
      videos,
      hasNextPage,
      endCursor,
      totalCount,
    };
  } catch (error) {
    appLogger.error('[MediaLibrary] Failed to get videos', error);
    return { videos: [], hasNextPage: false, totalCount: 0 };
  }
}

/**
 * Получить конкретное видео по ID
 */
export async function getVideoById(assetId: string): Promise<GalleryVideo | null> {
  if (Platform.OS === 'web') return null;
  
  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    
    if (!asset || asset.mediaType !== MediaLibrary.MediaType.video) {
      return null;
    }
    
    return {
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
      createdAt: new Date(asset.creationTime),
      modifiedAt: new Date(asset.modificationTime),
      fileSize: (asset as any).fileSize,
      albumId: asset.albumId,
    };
  } catch (error) {
    appLogger.error(`[MediaLibrary] Failed to get video ${assetId}`, error);
    return null;
  }
}

/**
 * Получить последние N видео (для быстрого доступа)
 */
export async function getRecentVideos(count = 10): Promise<GalleryVideo[]> {
  const result = await getVideos({
    first: count,
    sortBy: 'modificationTime',
    sortOrder: 'desc',
  });
  
  return result.videos;
}

// ============================================
// ALBUMS
// ============================================

/**
 * Получить все альбомы с видео
 */
export async function getVideoAlbums(): Promise<GalleryAlbum[]> {
  if (Platform.OS === 'web') return [];
  
  try {
    const hasPermission = await requestPermission();
    if (!hasPermission) return [];
    
    const albums = await MediaLibrary.getAlbumsAsync({
      includeSmartAlbums: true,
    });
    
    // Фильтруем альбомы с видео
    const videoAlbums: GalleryAlbum[] = [];
    
    for (const album of albums) {
      const { totalCount } = await MediaLibrary.getAssetsAsync({
        album: album.id,
        mediaType: MediaLibrary.MediaType.video,
        first: 1,
      });
      
      if (totalCount > 0) {
        videoAlbums.push({
          id: album.id,
          title: album.title,
          assetCount: totalCount,
          type: album.type || 'album',
        });
      }
    }
    
    return videoAlbums.sort((a, b) => b.assetCount - a.assetCount);
  } catch (error) {
    appLogger.error('[MediaLibrary] Failed to get albums', error);
    return [];
  }
}

// ============================================
// COPY / IMPORT
// ============================================

/**
 * Скопировать видео из галереи в кэш приложения
 * (для обработки перед загрузкой)
 */
export async function copyVideoToCache(
  assetId: string,
  filename?: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  
  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    const localUri = asset.localUri || asset.uri;
    const targetFilename = filename || asset.filename || `video_${Date.now()}.mp4`;
    const cacheDir = (FileSystem as any).cacheDirectory ?? '';
    const targetUri = `${cacheDir}imported_${targetFilename}`;
    
    // Копируем файл
    await FileSystem.copyAsync({
      from: localUri,
      to: targetUri,
    });
    
    appLogger.info(`[MediaLibrary] Copied video to ${targetUri}`);
    
    return targetUri;
  } catch (error) {
    appLogger.error(`[MediaLibrary] Failed to copy video ${assetId}`, error);
    return null;
  }
}

/**
 * Сохранить видео в галерею устройства
 */
export async function saveVideoToGallery(
  videoUri: string,
  albumName?: string
): Promise<MediaLibrary.Asset | null> {
  if (Platform.OS === 'web') return null;
  
  try {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      throw new Error('Permission not granted');
    }
    
    // Сохраняем видео
    const asset = await MediaLibrary.createAssetAsync(videoUri);
    
    // Если указан альбом, добавляем туда
    if (albumName) {
      let album = await MediaLibrary.getAlbumAsync(albumName);
      
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    }
    
    appLogger.info(`[MediaLibrary] Saved video to gallery: ${asset.id}`);
    
    return asset;
  } catch (error) {
    appLogger.error('[MediaLibrary] Failed to save video to gallery', error);
    return null;
  }
}

// ============================================
// VIDEO INFO & VALIDATION
// ============================================

/**
 * Проверить что видео подходит для загрузки
 */
export interface VideoValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  fileSize: number;
  resolution: { width: number; height: number };
}

export async function validateVideo(
  assetId: string,
  options?: {
    maxDuration?: number; // В секундах
    maxSize?: number; // В байтах
    minResolution?: { width: number; height: number };
  }
): Promise<VideoValidation> {
  const defaults = {
    maxDuration: 60, // 60 секунд
    maxSize: 100 * 1024 * 1024, // 100MB
    minResolution: { width: 480, height: 480 },
  };
  
  const opts = { ...defaults, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    
    if (!asset) {
      return {
        isValid: false,
        errors: ['Видео не найдено'],
        warnings: [],
        duration: 0,
        fileSize: 0,
        resolution: { width: 0, height: 0 },
      };
    }
    
    // Проверка длительности
    if (asset.duration > opts.maxDuration) {
      errors.push(`Видео слишком длинное (${Math.round(asset.duration)}с). Максимум: ${opts.maxDuration}с`);
    } else if (asset.duration > opts.maxDuration * 0.8) {
      warnings.push(`Видео близко к лимиту длительности`);
    }
    
    // Проверка размера
    const fileSize = (asset as any).fileSize as number | undefined;
    if (fileSize && fileSize > opts.maxSize) {
      errors.push(`Файл слишком большой (${Math.round(fileSize / 1024 / 1024)}MB). Максимум: ${Math.round(opts.maxSize / 1024 / 1024)}MB`);
    }
    
    // Проверка разрешения
    if (asset.width < opts.minResolution.width || asset.height < opts.minResolution.height) {
      warnings.push(`Низкое разрешение видео (${asset.width}x${asset.height})`);
    }
    
    // Проверка соотношения сторон (для вертикального видео)
    const aspectRatio = asset.width / asset.height;
    if (aspectRatio > 1.2) {
      warnings.push('Горизонтальное видео. Рекомендуется вертикальное (9:16)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      duration: asset.duration,
      fileSize: fileSize || 0,
      resolution: { width: asset.width, height: asset.height },
    };
  } catch (error) {
    appLogger.error(`[MediaLibrary] Failed to validate video ${assetId}`, error);
    return {
      isValid: false,
      errors: ['Не удалось проверить видео'],
      warnings: [],
      duration: 0,
      fileSize: 0,
      resolution: { width: 0, height: 0 },
    };
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Permissions
  requestPermission,
  checkPermission,
  
  // Videos
  getVideos,
  getVideoById,
  getRecentVideos,
  
  // Albums
  getVideoAlbums,
  
  // Copy/Import
  copyVideoToCache,
  saveVideoToGallery,
  
  // Validation
  validateVideo,
};

