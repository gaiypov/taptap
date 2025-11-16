import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeedListing } from '@/lib/store/api/apiSlice';

// Условный импорт SQLite с fallback на AsyncStorage
let SQLite: typeof import('expo-sqlite') | null = null;
let db: any = null;

// Пытаемся загрузить SQLite, если не получается - используем AsyncStorage
try {
  if (Platform.OS !== 'web') {
    // @ts-ignore - динамический импорт для обработки отсутствия модуля
    SQLite = require('expo-sqlite');
  }
} catch (error) {
  console.warn('[OfflineStorage] SQLite not available, using AsyncStorage fallback:', error);
  SQLite = null;
}

// Инициализация базы данных (только для native)
export async function initOfflineStorage(): Promise<void> {
  try {
    // Если SQLite доступен - используем его
    if (SQLite && Platform.OS !== 'web') {
      db = await SQLite.openDatabaseAsync('360app_offline.db');
      
      // Создаем таблицы для кэширования
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS listings_cache (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          category TEXT,
          cached_at INTEGER NOT NULL,
          expires_at INTEGER
        );
        
        CREATE INDEX IF NOT EXISTS idx_listings_category ON listings_cache(category);
        CREATE INDEX IF NOT EXISTS idx_listings_expires ON listings_cache(expires_at);
        
        CREATE TABLE IF NOT EXISTS video_cache (
          listing_id TEXT PRIMARY KEY,
          video_url TEXT NOT NULL,
          thumbnail_url TEXT,
          cached_at INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS pending_actions (
          id TEXT PRIMARY KEY,
          action_type TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          retry_count INTEGER DEFAULT 0
        );
      `);
      console.log('[OfflineStorage] SQLite database initialized');
    } else {
      // Fallback на AsyncStorage если SQLite недоступен
      console.log('[OfflineStorage] Using AsyncStorage fallback (SQLite not available)');
      // AsyncStorage не требует инициализации
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to initialize, using AsyncStorage fallback:', error);
    // Не бросаем ошибку - используем AsyncStorage fallback
    SQLite = null;
    db = null;
  }
}

// Получить кэшированные объявления
export async function getCachedListings(category?: string): Promise<FeedListing[]> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    // Используем SQLite если доступен
    if (db && SQLite && Platform.OS !== 'web') {
      const now = Date.now();
      let result;

      if (category) {
        result = await db.getAllAsync(
          `SELECT id, data, cached_at FROM listings_cache 
           WHERE category = ? AND (expires_at IS NULL OR expires_at > ?)
           ORDER BY cached_at DESC
           LIMIT 100`,
          [category, now]
        );
      } else {
        result = await db.getAllAsync(
          `SELECT id, data, cached_at FROM listings_cache 
           WHERE expires_at IS NULL OR expires_at > ?
           ORDER BY cached_at DESC
           LIMIT 100`,
          [now]
        );
      }

      return result.map((row: any) => JSON.parse(row.data) as FeedListing);
    } else {
      // Fallback на AsyncStorage
      const key = category ? `listings_cache_${category}` : 'listings_cache_all';
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        const now = Date.now();
        return parsed.filter((item: FeedListing & { expires_at?: number }) => 
          !item.expires_at || item.expires_at > now
        );
      }
      return [];
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to get cached listings:', error);
    return [];
  }
}

// Сохранить объявления в кэш
export async function cacheListings(
  listings: FeedListing[],
  category?: string,
  ttlHours: number = 24
): Promise<void> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    const now = Date.now();
    const expiresAt = ttlHours > 0 ? now + ttlHours * 60 * 60 * 1000 : null;

    // Используем SQLite если доступен
    if (db && SQLite && Platform.OS !== 'web') {
      await db.runAsync('BEGIN TRANSACTION');

      for (const listing of listings) {
        await db.runAsync(
          `INSERT OR REPLACE INTO listings_cache (id, data, category, cached_at, expires_at)
           VALUES (?, ?, ?, ?, ?)`,
          [listing.id, JSON.stringify(listing), category || listing.category || 'all', now, expiresAt]
        );
      }

      await db.runAsync('COMMIT');
    } else {
      // Fallback на AsyncStorage для web
      const key = category ? `listings_cache_${category}` : 'listings_cache_all';
      const dataToStore = listings.map(listing => ({
        ...listing,
        expires_at: expiresAt,
        cached_at: now,
      }));
      await AsyncStorage.setItem(key, JSON.stringify(dataToStore));
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to cache listings:', error);
    if (db && SQLite && Platform.OS !== 'web') {
      try {
        await db.runAsync('ROLLBACK');
      } catch (rollbackError) {
        // Игнорируем ошибки отката
      }
    }
  }
}

// Кэшировать URL видео
export async function cacheVideoUrl(
  listingId: string,
  videoUrl: string,
  thumbnailUrl?: string
): Promise<void> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    if (db && SQLite && Platform.OS !== 'web') {
      await db.runAsync(
        `INSERT OR REPLACE INTO video_cache (listing_id, video_url, thumbnail_url, cached_at)
         VALUES (?, ?, ?, ?)`,
        [listingId, videoUrl, thumbnailUrl || null, Date.now()]
      );
    } else {
      // Fallback на AsyncStorage
      await AsyncStorage.setItem(
        `video_cache_${listingId}`,
        JSON.stringify({ videoUrl, thumbnailUrl, cached_at: Date.now() })
      );
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to cache video URL:', error);
  }
}

// Получить кэшированный URL видео
export async function getCachedVideoUrl(listingId: string): Promise<{ videoUrl: string; thumbnailUrl?: string } | null> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    if (db && SQLite && Platform.OS !== 'web') {
      const result = await db.getFirstAsync(
        `SELECT video_url, thumbnail_url FROM video_cache WHERE listing_id = ?`,
        [listingId]
      ) as { video_url: string; thumbnail_url: string | null } | null;

      if (result) {
        return {
          videoUrl: result.video_url,
          thumbnailUrl: result.thumbnail_url || undefined,
        };
      }
      return null;
    } else {
      // Fallback на AsyncStorage
      const data = await AsyncStorage.getItem(`video_cache_${listingId}`);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          videoUrl: parsed.videoUrl,
          thumbnailUrl: parsed.thumbnailUrl,
        };
      }
      return null;
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to get cached video URL:', error);
    return null;
  }
}

// Сохранить отложенное действие для синхронизации
export async function savePendingAction(
  actionType: string,
  payload: any
): Promise<string> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    const id = `${actionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (db && SQLite && Platform.OS !== 'web') {
      await db.runAsync(
        `INSERT INTO pending_actions (id, action_type, payload, created_at, retry_count)
         VALUES (?, ?, ?, ?, 0)`,
        [id, actionType, JSON.stringify(payload), Date.now()]
      );
    } else {
      // Fallback на AsyncStorage
      const existing = await AsyncStorage.getItem('pending_actions');
      const actions = existing ? JSON.parse(existing) : [];
      actions.push({
        id,
        action_type: actionType,
        payload,
        created_at: Date.now(),
        retry_count: 0,
      });
      await AsyncStorage.setItem('pending_actions', JSON.stringify(actions));
    }
    return id;
  } catch (error) {
    console.error('[OfflineStorage] Failed to save pending action:', error);
    throw error;
  }
}

// Получить отложенные действия
export async function getPendingActions(): Promise<Array<{ id: string; type: string; payload: any; retryCount: number }>> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    if (db && SQLite && Platform.OS !== 'web') {
      const result = await db.getAllAsync(
        `SELECT id, action_type, payload, retry_count FROM pending_actions ORDER BY created_at ASC`
      ) as { id: string; action_type: string; payload: string; retry_count: number }[];

      return result.map((row: any) => ({
        id: row.id,
        type: row.action_type,
        payload: JSON.parse(row.payload),
        retryCount: row.retry_count,
      }));
    } else {
      // Fallback на AsyncStorage
      const data = await AsyncStorage.getItem('pending_actions');
      if (data) {
        const actions = JSON.parse(data);
        return actions.map((action: any) => ({
          id: action.id,
          type: action.action_type,
          payload: typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload,
          retryCount: action.retry_count || 0,
        }));
      }
      return [];
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to get pending actions:', error);
    return [];
  }
}

// Удалить отложенное действие
export async function removePendingAction(id: string): Promise<void> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    if (db && SQLite && Platform.OS !== 'web') {
      await db.runAsync('DELETE FROM pending_actions WHERE id = ?', [id]);
    } else {
      // Fallback на AsyncStorage
      const data = await AsyncStorage.getItem('pending_actions');
      if (data) {
        const actions = JSON.parse(data);
        const filtered = actions.filter((action: any) => action.id !== id);
        await AsyncStorage.setItem('pending_actions', JSON.stringify(filtered));
      }
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to remove pending action:', error);
  }
}

// Очистить старый кэш
export async function clearExpiredCache(): Promise<void> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    const now = Date.now();
    
    if (db && SQLite && Platform.OS !== 'web') {
      await db.runAsync(
        'DELETE FROM listings_cache WHERE expires_at IS NOT NULL AND expires_at < ?',
        [now]
      );
    } else {
      // Fallback на AsyncStorage - очищаем вручную
      const keys = await AsyncStorage.getAllKeys();
      const listingKeys = keys.filter(key => key.startsWith('listings_cache_'));
      
      for (const key of listingKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const listings = JSON.parse(data);
          const filtered = listings.filter((item: FeedListing & { expires_at?: number }) =>
            !item.expires_at || item.expires_at > now
          );
          if (filtered.length !== listings.length) {
            await AsyncStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      }
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to clear expired cache:', error);
  }
}

// Получить размер кэша
export async function getCacheSize(): Promise<{ listings: number; videos: number; pending: number }> {
  if (!db && SQLite && Platform.OS !== 'web') {
    await initOfflineStorage();
  }

  try {
    if (db && SQLite && Platform.OS !== 'web') {
      const listingsCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM listings_cache'
      ) as { count: number } | null;
      const videosCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM video_cache'
      ) as { count: number } | null;
      const pendingCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM pending_actions'
      ) as { count: number } | null;

      return {
        listings: listingsCount?.count || 0,
        videos: videosCount?.count || 0,
        pending: pendingCount?.count || 0,
      };
    } else {
      // Fallback на AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const listingKeys = keys.filter(key => key.startsWith('listings_cache_'));
      const videoKeys = keys.filter(key => key.startsWith('video_cache_'));
      
      let listingsCount = 0;
      for (const key of listingKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          listingsCount += JSON.parse(data).length;
        }
      }
      
      const pendingData = await AsyncStorage.getItem('pending_actions');
      const pendingCount = pendingData ? JSON.parse(pendingData).length : 0;
      
      return {
        listings: listingsCount,
        videos: videoKeys.length,
        pending: pendingCount,
      };
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to get cache size:', error);
    return { listings: 0, videos: 0, pending: 0 };
  }
}
