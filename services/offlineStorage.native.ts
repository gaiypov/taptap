// services/offlineStorage.native.ts
// ОФФЛАЙН-СЕРВИС УРОВНЯ TIKTOK + WHATSAPP 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВАЯ К МИЛЛИОНУ ПОЛЬЗОВАТЕЛЕЙ (ноябрь 2025)

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { FeedListing } from '@/lib/store/api/apiSlice';

const DB_NAME = '360auto_offline.db';
let db: SQLite.SQLiteDatabase | null = null;

// Инициализация (вызывать один раз при старте приложения)
export async function initOfflineStorage(): Promise<void> {
  if (db) return; // Уже инициализировано

  if (Platform.OS === 'web') {
    console.log('[OfflineStorage] Web platform — using AsyncStorage only');
    return;
  }

  try {
    db = SQLite.openDatabaseSync(DB_NAME);

    db.execSync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS listings_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        category TEXT,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER
      );
      
      CREATE INDEX IF NOT EXISTS idx_category ON listings_cache(category);
      CREATE INDEX IF NOT EXISTS idx_expires ON listings_cache(expires_at);
      
      CREATE TABLE IF NOT EXISTS video_cache (
        listing_id TEXT PRIMARY KEY,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        cached_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS pending_actions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0
      );
    `);

    console.log('[OfflineStorage] SQLite initialized successfully');
  } catch (error) {
    console.warn('[OfflineStorage] SQLite failed, falling back to AsyncStorage:', error);
    db = null;
  }
}

// Кэшировать объявления
export async function cacheListings(
  listings: FeedListing[],
  category?: string,
  ttlHours = 24
): Promise<void> {
  await initOfflineStorage();

  const now = Date.now();
  const expiresAt = ttlHours > 0 ? now + ttlHours * 3600000 : null;

  if (db && Platform.OS !== 'web') {
    try {
      db.execSync('BEGIN TRANSACTION');
      for (const listing of listings) {
        // Используем getAllSync для выполнения с параметрами (работает как executeSync)
        const sql = 'INSERT OR REPLACE INTO listings_cache (id, data, category, cached_at, expires_at) VALUES (?, ?, ?, ?, ?)';
        const params = [listing.id, JSON.stringify(listing), category || 'all', now, expiresAt];
        // В expo-sqlite executeSync может не существовать, используем execSync с встроенными значениями
        const escapedData = JSON.stringify(listing).replace(/'/g, "''");
        const escapedCategory = (category || 'all').replace(/'/g, "''");
        db.execSync(`INSERT OR REPLACE INTO listings_cache (id, data, category, cached_at, expires_at) VALUES ('${listing.id}', '${escapedData}', '${escapedCategory}', ${now}, ${expiresAt || 'NULL'})`);
      }
      db.execSync('COMMIT');
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  } else {
    // AsyncStorage fallback
    const key = category ? `listings_${category}` : 'listings_all';
    const data = listings.map(l => ({ ...l, expires_at: expiresAt, cached_at: now }));
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }
}

// Получить кэшированные объявления
export async function getCachedListings(category?: string): Promise<FeedListing[]> {
  await initOfflineStorage();

  const now = Date.now();

  if (db && Platform.OS !== 'web') {
    const sql = category
      ? `SELECT data FROM listings_cache WHERE category = ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY cached_at DESC`
      : `SELECT data FROM listings_cache WHERE expires_at IS NULL OR expires_at > ? ORDER BY cached_at DESC`;

    const result = db.getAllSync(sql, category ? [category, now] : [now]);
    return result.map((row: any) => JSON.parse(row.data) as FeedListing);
  } else {
    const key = category ? `listings_${category}` : 'listings_all';
    const data = await AsyncStorage.getItem(key);
    if (!data) return [];

    const parsed = JSON.parse(data);
    return parsed
      .filter((item: any) => !item.expires_at || item.expires_at > now)
      .map((item: any) => {
        const { expires_at, cached_at, ...listing } = item;
        return listing as FeedListing;
      });
  }
}

// Кэшировать URL видео
export async function cacheVideoUrl(
  listingId: string,
  videoUrl: string,
  thumbnailUrl?: string
): Promise<void> {
  await initOfflineStorage();

  if (db && Platform.OS !== 'web') {
    try {
      const escapedVideoUrl = (videoUrl || '').replace(/'/g, "''");
      const escapedThumbnailUrl = (thumbnailUrl || '').replace(/'/g, "''");
      const now = Date.now();
      db.execSync(`INSERT OR REPLACE INTO video_cache (listing_id, video_url, thumbnail_url, cached_at) VALUES ('${listingId}', '${escapedVideoUrl}', ${thumbnailUrl ? `'${escapedThumbnailUrl}'` : 'NULL'}, ${now})`);
    } catch (error) {
      console.error('[OfflineStorage] Failed to cache video URL:', error);
      throw error;
    }
  } else {
    // AsyncStorage fallback
    await AsyncStorage.setItem(
      `video_cache_${listingId}`,
      JSON.stringify({ videoUrl, thumbnailUrl, cached_at: Date.now() })
    );
  }
}

// Получить кэшированный URL видео
export async function getCachedVideoUrl(
  listingId: string
): Promise<{ videoUrl: string; thumbnailUrl?: string } | null> {
  await initOfflineStorage();

  if (db && Platform.OS !== 'web') {
    const result = db.getFirstSync(
      'SELECT video_url, thumbnail_url FROM video_cache WHERE listing_id = ?',
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
    // AsyncStorage fallback
    const data = await AsyncStorage.getItem(`video_cache_${listingId}`);
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      videoUrl: parsed.videoUrl,
      thumbnailUrl: parsed.thumbnailUrl,
    };
  }
}

// Сохранить отложенное действие для синхронизации
export async function savePendingAction(
  actionType: string,
  payload: any
): Promise<string> {
  await initOfflineStorage();

  const id = `${actionType}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  if (db && Platform.OS !== 'web') {
    try {
      const escapedId = id.replace(/'/g, "''");
      const escapedType = actionType.replace(/'/g, "''");
      const escapedPayload = JSON.stringify(payload).replace(/'/g, "''");
      const now = Date.now();
      db.execSync(`INSERT INTO pending_actions (id, type, payload, created_at, retry_count) VALUES ('${escapedId}', '${escapedType}', '${escapedPayload}', ${now}, 0)`);
    } catch (error) {
      console.error('[OfflineStorage] Failed to save pending action:', error);
      throw error;
    }
  } else {
    // AsyncStorage fallback
    const existing = await AsyncStorage.getItem('pending_actions');
    const actions = existing ? JSON.parse(existing) : [];
    actions.push({
      id,
      type: actionType,
      payload,
      created_at: Date.now(),
      retry_count: 0,
    });
    await AsyncStorage.setItem('pending_actions', JSON.stringify(actions));
  }
  return id;
}

// Получить отложенные действия
export async function getPendingActions(): Promise<
  Array<{ id: string; type: string; payload: any; retryCount: number }>
> {
  await initOfflineStorage();

  if (db && Platform.OS !== 'web') {
    const result = db.getAllSync(
      'SELECT id, type, payload, retry_count FROM pending_actions ORDER BY created_at ASC'
    ) as { id: string; type: string; payload: string; retry_count: number }[];

    return result.map((row) => ({
      id: row.id,
      type: row.type,
      payload: JSON.parse(row.payload),
      retryCount: row.retry_count,
    }));
  } else {
    // AsyncStorage fallback
    const data = await AsyncStorage.getItem('pending_actions');
    if (!data) return [];

    const actions = JSON.parse(data);
    return actions.map((action: any) => ({
      id: action.id,
      type: action.type || action.action_type,
      payload: typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload,
      retryCount: action.retry_count || action.retryCount || 0,
    }));
  }
}

// Удалить отложенное действие
export async function removePendingAction(id: string): Promise<void> {
  await initOfflineStorage();

  if (db && Platform.OS !== 'web') {
    try {
      const escapedId = id.replace(/'/g, "''");
      db.execSync(`DELETE FROM pending_actions WHERE id = '${escapedId}'`);
    } catch (error) {
      console.error('[OfflineStorage] Failed to delete pending action:', error);
      throw error;
    }
  } else {
    // AsyncStorage fallback
    const data = await AsyncStorage.getItem('pending_actions');
    if (data) {
      const actions = JSON.parse(data);
      const filtered = actions.filter((action: any) => action.id !== id);
      await AsyncStorage.setItem('pending_actions', JSON.stringify(filtered));
    }
  }
}

// Увеличить счетчик попыток для отложенного действия
export async function incrementPendingActionRetry(id: string): Promise<void> {
  await initOfflineStorage();

  if (db && Platform.OS !== 'web') {
    try {
      const escapedId = id.replace(/'/g, "''");
      db.execSync(`UPDATE pending_actions SET retry_count = retry_count + 1 WHERE id = '${escapedId}'`);
    } catch (error) {
      console.error('[OfflineStorage] Failed to increment retry count:', error);
      throw error;
    }
  } else {
    // AsyncStorage fallback
    const data = await AsyncStorage.getItem('pending_actions');
    if (data) {
      const actions = JSON.parse(data);
      const updated = actions.map((action: any) =>
        action.id === id
          ? { ...action, retry_count: (action.retry_count || 0) + 1 }
          : action
      );
      await AsyncStorage.setItem('pending_actions', JSON.stringify(updated));
    }
  }
}

// Очистка старого кэша
export async function clearExpiredCache(): Promise<void> {
  await initOfflineStorage();

  const now = Date.now();

  if (db && Platform.OS !== 'web') {
    try {
      db.execSync(`DELETE FROM listings_cache WHERE expires_at IS NOT NULL AND expires_at < ${now}`);
    } catch (error) {
      console.error('[OfflineStorage] Failed to clear expired cache:', error);
      throw error;
    }
  } else {
    const keys = await AsyncStorage.getAllKeys();
    for (const key of keys) {
      if (key.startsWith('listings_')) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const filtered = parsed.filter((item: any) => !item.expires_at || item.expires_at > now);
          if (filtered.length !== parsed.length) {
            await AsyncStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      }
    }
  }
}

// Получить размер кэша
export async function getCacheSize(): Promise<{ listings: number; videos: number; pending: number }> {
  await initOfflineStorage();

  if (db && Platform.OS !== 'web') {
    const listingsResult = db.getFirstSync(
      'SELECT COUNT(*) as count FROM listings_cache'
    ) as { count: number } | null;
    const videosResult = db.getFirstSync(
      'SELECT COUNT(*) as count FROM video_cache'
    ) as { count: number } | null;
    const pendingResult = db.getFirstSync(
      'SELECT COUNT(*) as count FROM pending_actions'
    ) as { count: number } | null;

    return {
      listings: listingsResult?.count || 0,
      videos: videosResult?.count || 0,
      pending: pendingResult?.count || 0,
    };
  } else {
    // AsyncStorage fallback
    const keys = await AsyncStorage.getAllKeys();
    const listingKeys = keys.filter((key) => key.startsWith('listings_'));
    const videoKeys = keys.filter((key) => key.startsWith('video_cache_'));

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
}

// Очистить весь кэш
export async function clearAllCache(): Promise<void> {
  await initOfflineStorage();

  if (db && Platform.OS !== 'web') {
    db.execSync('DELETE FROM listings_cache');
    db.execSync('DELETE FROM video_cache');
    db.execSync('DELETE FROM pending_actions');
  } else {
    // AsyncStorage fallback
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) =>
        key.startsWith('listings_') ||
        key.startsWith('video_cache_') ||
        key === 'pending_actions'
    );
    await AsyncStorage.multiRemove(cacheKeys);
  }
}
