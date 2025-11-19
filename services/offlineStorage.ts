// services/offlineStorage.ts — ПЛАТФОРМО-СПЕЦИФИЧНЫЙ БАРРЕЛЬ (ГОТОВ К ПРОДАКШЕНУ)
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ ЗАПРОСОВ

// Metro автоматически выберет правильный файл:
// - offlineStorage.native.ts для iOS/Android (expo-sqlite)
// - offlineStorage.web.ts для Web (AsyncStorage + IndexedDB)
// TypeScript использует этот файл для типизации

export {
  initOfflineStorage,
  getCachedListings,
  cacheListings,
  cacheVideoUrl,
  getCachedVideoUrl,
  savePendingAction,
  removePendingAction,
  getPendingActions,
  incrementPendingActionRetry,
  clearExpiredCache,
  clearAllCache,
  getCacheSize,
} from './offlineStorage.native';

