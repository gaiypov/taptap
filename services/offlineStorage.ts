// Платформо-специфичный экспорт
// Metro автоматически выберет правильный файл по расширению (.native.ts или .web.ts)
// Для TypeScript используем явные реэкспорты из native версии (она более полная)
// Metro bundler выберет правильный файл во время выполнения на основе расширения

// Re-export from native (TypeScript will use this for type checking)
// Metro will resolve to the correct platform-specific file at runtime
export {
  initOfflineStorage,
  getCachedListings,
  cacheListings,
  cacheVideoUrl,
  getCachedVideoUrl,
  savePendingAction,
  removePendingAction,
  getPendingActions,
  clearExpiredCache,
  getCacheSize,
} from './offlineStorage.native';

