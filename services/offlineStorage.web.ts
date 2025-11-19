// services/offlineStorage.web.ts — Fallback для веба
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К ПРОДАКШЕНУ

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeedListing } from '@/lib/store/api/apiSlice';

const CACHE_PREFIX = 'offline_cache_';
const LISTINGS_KEY = `${CACHE_PREFIX}listings`;
const VIDEOS_KEY = `${CACHE_PREFIX}videos`;
const PENDING_KEY = `${CACHE_PREFIX}pending`;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires_at?: number;
}

interface PendingAction {
  id: string;
  type: string;
  payload: any;
  created_at: number;
  retry_count: number;
}

export async function initOfflineStorage(): Promise<void> {
  console.log('[OfflineStorage.web] Using AsyncStorage + IndexedDB fallback');
  // Web платформа готова к использованию
}

export async function getCachedListings(category?: string): Promise<FeedListing[]> {
  try {
    const data = await AsyncStorage.getItem(LISTINGS_KEY);
    if (!data) return [];

    const cache: Record<string, CacheEntry<FeedListing[]>> = JSON.parse(data);
    const now = Date.now();

    // Фильтруем по категории и сроку действия
    const allListings: FeedListing[] = [];
    for (const [key, entry] of Object.entries(cache)) {
      if (category && !key.includes(category)) continue;
      if (entry.expires_at && now > entry.expires_at) continue;
      allListings.push(...entry.data);
    }

    return allListings;
  } catch (error) {
    console.error('[OfflineStorage.web] Error getting cached listings:', error);
    return [];
  }
}

export async function cacheListings(
  listings: FeedListing[],
  category?: string,
  ttlMinutes: number = 60
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(LISTINGS_KEY);
    const cache: Record<string, CacheEntry<FeedListing[]>> = data ? JSON.parse(data) : {};

    const key = category || 'all';
    cache[key] = {
      data: listings,
      timestamp: Date.now(),
      expires_at: Date.now() + ttlMinutes * 60 * 1000,
    };

    await AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[OfflineStorage.web] Error caching listings:', error);
  }
}

export async function cacheVideoUrl(
  listingId: string,
  videoUrl: string,
  thumbnailUrl?: string
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(VIDEOS_KEY);
    const cache: Record<string, { videoUrl: string; thumbnailUrl?: string; cachedAt: number }> =
      data ? JSON.parse(data) : {};

    cache[listingId] = {
      videoUrl,
      thumbnailUrl,
      cachedAt: Date.now(),
    };

    await AsyncStorage.setItem(VIDEOS_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[OfflineStorage.web] Error caching video URL:', error);
  }
}

export async function getCachedVideoUrl(
  listingId: string
): Promise<{ videoUrl: string; thumbnailUrl?: string } | null> {
  try {
    const data = await AsyncStorage.getItem(VIDEOS_KEY);
    if (!data) return null;

    const cache: Record<string, { videoUrl: string; thumbnailUrl?: string; cachedAt: number }> =
      JSON.parse(data);
    const entry = cache[listingId];

    if (!entry) return null;

    return {
      videoUrl: entry.videoUrl,
      thumbnailUrl: entry.thumbnailUrl,
    };
  } catch (error) {
    console.error('[OfflineStorage.web] Error getting cached video URL:', error);
    return null;
  }
}

export async function savePendingAction(
  type: string,
  payload: any,
  id?: string
): Promise<string> {
  try {
    const actionId = id || `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const data = await AsyncStorage.getItem(PENDING_KEY);
    const actions: Record<string, PendingAction> = data ? JSON.parse(data) : {};

    actions[actionId] = {
      id: actionId,
      type,
      payload,
      created_at: Date.now(),
      retry_count: 0,
    };

    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(actions));
    return actionId;
  } catch (error) {
    console.error('[OfflineStorage.web] Error saving pending action:', error);
    throw error;
  }
}

export async function getPendingActions(): Promise<
  Array<{ id: string; type: string; payload: any; created_at: number; retry_count: number }>
> {
  try {
    const data = await AsyncStorage.getItem(PENDING_KEY);
    if (!data) return [];

    const actions: Record<string, PendingAction> = JSON.parse(data);
    return Object.values(actions);
  } catch (error) {
    console.error('[OfflineStorage.web] Error getting pending actions:', error);
    return [];
  }
}

export async function removePendingAction(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(PENDING_KEY);
    if (!data) return;

    const actions: Record<string, PendingAction> = JSON.parse(data);
    delete actions[id];
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error('[OfflineStorage.web] Error removing pending action:', error);
  }
}

export async function incrementPendingActionRetry(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(PENDING_KEY);
    if (!data) return;

    const actions: Record<string, PendingAction> = JSON.parse(data);
    if (actions[id]) {
      actions[id].retry_count += 1;
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(actions));
    }
  } catch (error) {
    console.error('[OfflineStorage.web] Error incrementing retry:', error);
  }
}

export async function clearExpiredCache(): Promise<void> {
  try {
    const now = Date.now();

    // Очистка listings cache
    const listingsData = await AsyncStorage.getItem(LISTINGS_KEY);
    if (listingsData) {
      const cache: Record<string, CacheEntry<FeedListing[]>> = JSON.parse(listingsData);
      const filtered: Record<string, CacheEntry<FeedListing[]>> = {};

      for (const [key, entry] of Object.entries(cache)) {
        if (!entry.expires_at || entry.expires_at > now) {
          filtered[key] = entry;
        }
      }

      await AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(filtered));
    }

    // Очистка старых pending actions (старше 7 дней)
    const pendingData = await AsyncStorage.getItem(PENDING_KEY);
    if (pendingData) {
      const actions: Record<string, PendingAction> = JSON.parse(pendingData);
      const filtered: Record<string, PendingAction> = {};
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      for (const [id, action] of Object.entries(actions)) {
        if (action.created_at > sevenDaysAgo) {
          filtered[id] = action;
        }
      }

      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('[OfflineStorage.web] Error clearing expired cache:', error);
  }
}

export async function getCacheSize(): Promise<{ listings: number; videos: number; pending: number }> {
  try {
    const listingsData = await AsyncStorage.getItem(LISTINGS_KEY);
    const videosData = await AsyncStorage.getItem(VIDEOS_KEY);
    const pendingData = await AsyncStorage.getItem(PENDING_KEY);

    const listings = listingsData ? Object.keys(JSON.parse(listingsData)).length : 0;
    const videos = videosData ? Object.keys(JSON.parse(videosData)).length : 0;
    const pending = pendingData ? Object.keys(JSON.parse(pendingData)).length : 0;

    return { listings, videos, pending };
  } catch (error) {
    console.error('[OfflineStorage.web] Error getting cache size:', error);
    return { listings: 0, videos: 0, pending: 0 };
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([LISTINGS_KEY, VIDEOS_KEY, PENDING_KEY]);
  } catch (error) {
    console.error('[OfflineStorage.web] Error clearing all cache:', error);
  }
}
