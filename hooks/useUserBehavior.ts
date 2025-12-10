// hooks/useUserBehavior.ts — Хук для отслеживания поведения пользователя
// Упрощает интеграцию трекинга в компоненты

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { CategoryType } from '@/config/filterConfig';
import {
  userBehavior,
  trackView,
  trackLongView,
  trackLike,
  trackUnlike,
  trackFavorite,
  trackUnfavorite,
  trackShare,
  trackChatStart,
  trackCall,
  trackSearch,
  trackFilterApply,
  trackVideoWatch,
  trackVideoComplete,
  trackScrollPast,
  trackSellerView,
  getRecommendations,
  getSimilarListings,
  getRecentlyViewed,
  calculateUserPreferences,
  RecommendedListing,
  UserPreferences,
} from '@/services/userBehavior';

interface UseUserBehaviorResult {
  // Tracking methods
  trackView: (listingId: string, category: CategoryType, metadata?: Record<string, any>) => void;
  trackLongView: (listingId: string, category: CategoryType, durationSeconds: number) => void;
  trackLike: (listingId: string, category: CategoryType, metadata?: Record<string, any>) => void;
  trackUnlike: (listingId: string, category: CategoryType) => void;
  trackFavorite: (listingId: string, category: CategoryType, metadata?: Record<string, any>) => void;
  trackUnfavorite: (listingId: string, category: CategoryType) => void;
  trackShare: (listingId: string, category: CategoryType) => void;
  trackChatStart: (listingId: string, category: CategoryType) => void;
  trackCall: (listingId: string, category: CategoryType) => void;
  trackSearch: (category: CategoryType, query: string, resultsCount: number, filters?: Record<string, any>) => void;
  trackFilterApply: (category: CategoryType, filters: Record<string, any>) => void;
  trackVideoWatch: (listingId: string, category: CategoryType) => void;
  trackVideoComplete: (listingId: string, category: CategoryType) => void;
  trackScrollPast: (listingId: string, category: CategoryType) => void;
  trackSellerView: (listingId: string, category: CategoryType, sellerId: string) => void;
  // View duration tracking
  startViewTimer: (listingId: string, category: CategoryType) => void;
  stopViewTimer: () => void;
  // Data fetching
  getRecommendations: (category?: CategoryType, limit?: number, excludeIds?: string[]) => Promise<RecommendedListing[]>;
  getSimilarListings: (listingId: string, limit?: number) => Promise<any[]>;
  getRecentlyViewed: (limit?: number) => Promise<string[]>;
  getPreferences: () => Promise<UserPreferences | null>;
  // State
  isAuthenticated: boolean;
  userId: string | null;
}

/**
 * Hook для отслеживания поведения пользователя
 *
 * Автоматически проверяет авторизацию — если пользователь не авторизован,
 * методы трекинга ничего не делают.
 *
 * @example
 * ```tsx
 * const { trackView, trackLike, getRecommendations } = useUserBehavior();
 *
 * // Отслеживание просмотра
 * trackView(listing.id, 'car', { brand: 'Toyota', price: 1500000 });
 *
 * // Отслеживание лайка
 * trackLike(listing.id, 'car');
 *
 * // Получение рекомендаций
 * const recommendations = await getRecommendations('car', 10);
 * ```
 */
export function useUserBehavior(): UseUserBehaviorResult {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || null;

  // View duration timer
  const viewTimerRef = useRef<{
    listingId: string;
    category: CategoryType;
    startTime: number;
  } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewTimerRef.current && userId) {
        const duration = Math.floor((Date.now() - viewTimerRef.current.startTime) / 1000);
        if (duration >= 10) {
          trackLongView(
            userId,
            viewTimerRef.current.listingId,
            viewTimerRef.current.category,
            duration
          );
        }
      }
    };
  }, [userId]);

  // ===== Tracking Methods =====
  const handleTrackView = useCallback(
    (listingId: string, category: CategoryType, metadata?: Record<string, any>) => {
      if (!userId) return;
      trackView(userId, listingId, category, metadata);
    },
    [userId]
  );

  const handleTrackLongView = useCallback(
    (listingId: string, category: CategoryType, durationSeconds: number) => {
      if (!userId) return;
      trackLongView(userId, listingId, category, durationSeconds);
    },
    [userId]
  );

  const handleTrackLike = useCallback(
    (listingId: string, category: CategoryType, metadata?: Record<string, any>) => {
      if (!userId) return;
      trackLike(userId, listingId, category, metadata);
    },
    [userId]
  );

  const handleTrackUnlike = useCallback(
    (listingId: string, category: CategoryType) => {
      if (!userId) return;
      trackUnlike(userId, listingId, category);
    },
    [userId]
  );

  const handleTrackFavorite = useCallback(
    (listingId: string, category: CategoryType, metadata?: Record<string, any>) => {
      if (!userId) return;
      trackFavorite(userId, listingId, category, metadata);
    },
    [userId]
  );

  const handleTrackUnfavorite = useCallback(
    (listingId: string, category: CategoryType) => {
      if (!userId) return;
      trackUnfavorite(userId, listingId, category);
    },
    [userId]
  );

  const handleTrackShare = useCallback(
    (listingId: string, category: CategoryType) => {
      if (!userId) return;
      trackShare(userId, listingId, category);
    },
    [userId]
  );

  const handleTrackChatStart = useCallback(
    (listingId: string, category: CategoryType) => {
      if (!userId) return;
      trackChatStart(userId, listingId, category);
    },
    [userId]
  );

  const handleTrackCall = useCallback(
    (listingId: string, category: CategoryType) => {
      if (!userId) return;
      trackCall(userId, listingId, category);
    },
    [userId]
  );

  const handleTrackSearch = useCallback(
    (category: CategoryType, query: string, resultsCount: number, filters?: Record<string, any>) => {
      if (!userId) return;
      trackSearch(userId, category, query, resultsCount, filters);
    },
    [userId]
  );

  const handleTrackFilterApply = useCallback(
    (category: CategoryType, filters: Record<string, any>) => {
      if (!userId) return;
      trackFilterApply(userId, category, filters);
    },
    [userId]
  );

  const handleTrackVideoWatch = useCallback(
    (listingId: string, category: CategoryType) => {
      if (!userId) return;
      trackVideoWatch(userId, listingId, category);
    },
    [userId]
  );

  const handleTrackVideoComplete = useCallback(
    (listingId: string, category: CategoryType) => {
      if (!userId) return;
      trackVideoComplete(userId, listingId, category);
    },
    [userId]
  );

  const handleTrackScrollPast = useCallback(
    (listingId: string, category: CategoryType) => {
      if (!userId) return;
      trackScrollPast(userId, listingId, category);
    },
    [userId]
  );

  const handleTrackSellerView = useCallback(
    (listingId: string, category: CategoryType, sellerId: string) => {
      if (!userId) return;
      trackSellerView(userId, listingId, category, sellerId);
    },
    [userId]
  );

  // ===== View Duration Timer =====
  const startViewTimer = useCallback(
    (listingId: string, category: CategoryType) => {
      // Остановим предыдущий таймер если есть
      if (viewTimerRef.current && userId) {
        const duration = Math.floor((Date.now() - viewTimerRef.current.startTime) / 1000);
        if (duration >= 10) {
          trackLongView(
            userId,
            viewTimerRef.current.listingId,
            viewTimerRef.current.category,
            duration
          );
        }
      }

      viewTimerRef.current = {
        listingId,
        category,
        startTime: Date.now(),
      };

      // Трекаем обычный просмотр сразу
      if (userId) {
        trackView(userId, listingId, category);
      }
    },
    [userId]
  );

  const stopViewTimer = useCallback(() => {
    if (viewTimerRef.current && userId) {
      const duration = Math.floor((Date.now() - viewTimerRef.current.startTime) / 1000);
      if (duration >= 10) {
        trackLongView(
          userId,
          viewTimerRef.current.listingId,
          viewTimerRef.current.category,
          duration
        );
      }
      viewTimerRef.current = null;
    }
  }, [userId]);

  // ===== Data Fetching Methods =====
  const handleGetRecommendations = useCallback(
    async (category?: CategoryType, limit = 20, excludeIds: string[] = []): Promise<RecommendedListing[]> => {
      if (!userId) return [];
      return getRecommendations({ userId, category, limit, excludeIds });
    },
    [userId]
  );

  const handleGetSimilarListings = useCallback(
    async (listingId: string, limit = 6): Promise<any[]> => {
      return getSimilarListings(listingId, limit);
    },
    []
  );

  const handleGetRecentlyViewed = useCallback(
    async (limit = 10): Promise<string[]> => {
      if (!userId) return [];
      return getRecentlyViewed(userId, limit);
    },
    [userId]
  );

  const handleGetPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    if (!userId) return null;
    return calculateUserPreferences(userId);
  }, [userId]);

  return {
    // Tracking
    trackView: handleTrackView,
    trackLongView: handleTrackLongView,
    trackLike: handleTrackLike,
    trackUnlike: handleTrackUnlike,
    trackFavorite: handleTrackFavorite,
    trackUnfavorite: handleTrackUnfavorite,
    trackShare: handleTrackShare,
    trackChatStart: handleTrackChatStart,
    trackCall: handleTrackCall,
    trackSearch: handleTrackSearch,
    trackFilterApply: handleTrackFilterApply,
    trackVideoWatch: handleTrackVideoWatch,
    trackVideoComplete: handleTrackVideoComplete,
    trackScrollPast: handleTrackScrollPast,
    trackSellerView: handleTrackSellerView,
    // View timer
    startViewTimer,
    stopViewTimer,
    // Data fetching
    getRecommendations: handleGetRecommendations,
    getSimilarListings: handleGetSimilarListings,
    getRecentlyViewed: handleGetRecentlyViewed,
    getPreferences: handleGetPreferences,
    // State
    isAuthenticated,
    userId,
  };
}

export default useUserBehavior;
