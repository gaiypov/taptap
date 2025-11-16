import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeedListing } from '@/lib/store/api/apiSlice';

// Web версия использует только AsyncStorage (без SQLite)

// Инициализация базы данных (для web - просто заглушка)
export async function initOfflineStorage(): Promise<void> {
  console.log('[OfflineStorage] Using AsyncStorage for web platform');
  // Ничего не делаем - AsyncStorage всегда доступен
}

// Получить кэшированные объявления
export async function getCachedListings(category?: string): Promise<FeedListing[]> {
  try {
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
  try {
    const now = Date.now();
    const expiresAt = ttlHours > 0 ? now + ttlHours * 60 * 60 * 1000 : null;
    const key = category ? `listings_cache_${category}` : 'listings_cache_all';
    
    const dataToStore = listings.map(listing => ({
      ...listing,
      expires_at: expiresAt,
      cached_at: now,
    }));
    
    await AsyncStorage.setItem(key, JSON.stringify(dataToStore));
  } catch (error) {
    console.error('[OfflineStorage] Failed to cache listings:', error);
  }
}

// Кэшировать URL видео
export async function cacheVideoUrl(
  listingId: string,
  videoUrl: string,
  thumbnailUrl?: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `video_cache_${listingId}`,
      JSON.stringify({ videoUrl, thumbnailUrl, cached_at: Date.now() })
    );
  } catch (error) {
    console.error('[OfflineStorage] Failed to cache video URL:', error);
  }
}

// Получить кэшированный URL видео
export async function getCachedVideoUrl(listingId: string): Promise<{ videoUrl: string; thumbnailUrl?: string } | null> {
  try {
    const data = await AsyncStorage.getItem(`video_cache_${listingId}`);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        videoUrl: parsed.videoUrl,
        thumbnailUrl: parsed.thumbnailUrl,
      };
    }
    return null;
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
  try {
    const id = `${actionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    return id;
  } catch (error) {
    console.error('[OfflineStorage] Failed to save pending action:', error);
    throw error;
  }
}

// Получить отложенные действия
export async function getPendingActions(): Promise<Array<{ id: string; type: string; payload: any; retryCount: number }>> {
  try {
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
  } catch (error) {
    console.error('[OfflineStorage] Failed to get pending actions:', error);
    return [];
  }
}

// Удалить отложенное действие
export async function removePendingAction(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem('pending_actions');
    if (data) {
      const actions = JSON.parse(data);
      const filtered = actions.filter((action: any) => action.id !== id);
      await AsyncStorage.setItem('pending_actions', JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to remove pending action:', error);
  }
}

// Очистить старый кэш
export async function clearExpiredCache(): Promise<void> {
  try {
    const now = Date.now();
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
  } catch (error) {
    console.error('[OfflineStorage] Failed to clear expired cache:', error);
  }
}

// Получить размер кэша
export async function getCacheSize(): Promise<{ listings: number; videos: number; pending: number }> {
  try {
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
  } catch (error) {
    console.error('[OfflineStorage] Failed to get cache size:', error);
    return { listings: 0, videos: 0, pending: 0 };
  }
}

