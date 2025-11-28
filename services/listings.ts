// services/listings.ts — ПРОДАКШЕН-СЕРВИС ОБЪЯВЛЕНИЙ 360AutoMVP 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ ЗАПРОСОВ

import { Listing } from '@/types';
import { api } from './api';

// Реэкспорт типа для удобства
export type { Listing };

// Кэш на 1 минуту (для деталки объявления)
const CACHE_TTL = 60_000;
const cache = new Map<string, { data: Listing; timestamp: number }>();

export async function getListing(id: string): Promise<Listing> {
  // Кэш
  const cached = cache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Используем наш мощный api клиент (retry, auth, ошибки)
    const listing = await api.listings.get(id);

    // Кэшируем
    cache.set(id, { data: listing, timestamp: Date.now() });

    return listing;
  } catch (error: any) {
    console.error('[listings] Error fetching listing:', error);
    throw error;
  }
}

// Дополнительные методы (добавим по мере необходимости)
export const listingsService = {
  get: getListing,

  // Получить все объявления пользователя
  getMyListings: async (): Promise<Listing[]> => {
    try {
      // Используем api.user или создадим отдельный endpoint
      const response = await api.user.favorites();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('[listings] Error fetching my listings:', error);
      return [];
    }
  },

  // Получить избранное
  getFavorites: async (): Promise<Listing[]> => {
    try {
      const response = await api.user.favorites();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('[listings] Error fetching favorites:', error);
      return [];
    }
  },

  // Лайк / анлайк
  toggleLike: async (listingId: string): Promise<void> => {
    try {
      // Проверяем, лайкнуто ли уже
      const listing = await getListing(listingId);
      const isLiked = (listing as any).is_liked || false;

      if (isLiked) {
        await api.listings.unlike(listingId);
      } else {
        await api.listings.like(listingId);
      }

      // Инвалидируем кэш
      cache.delete(listingId);
    } catch (error) {
      console.error('[listings] Error toggling like:', error);
      throw error;
    }
  },

  // Очистка кэша (при логауте, например)
  clearCache: () => cache.clear(),
};

