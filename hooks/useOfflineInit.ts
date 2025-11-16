import { useEffect, useState } from 'react';
import { initOfflineStorage, clearExpiredCache } from '@/services/offlineStorage';
import { useAppDispatch } from '@/lib/store/hooks';
import { cacheListings as cacheListingsToRedux } from '@/lib/store/slices/offlineSlice';
import { getCachedListings } from '@/services/offlineStorage';

export function useOfflineInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Инициализируем SQLite базу
        await initOfflineStorage();

        // Очищаем устаревший кэш
        await clearExpiredCache();

        // Загружаем кэшированные объявления в Redux
        const cachedListings = await getCachedListings();
        if (cachedListings.length > 0 && mounted) {
          dispatch(cacheListingsToRedux(cachedListings));
        }

        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('[useOfflineInit] Failed to initialize offline storage:', error);
        if (mounted) {
          setIsInitialized(true); // Все равно показываем приложение
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return isInitialized;
}
