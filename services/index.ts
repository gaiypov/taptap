// services/index.ts — ЕДИНЫЙ БАРРЕЛЬ СЕРВИСОВ 360AutoMVP 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ ЗАПРОСОВ

// Основные сервисы
export { default as api } from './api';
export { apiVideo } from './apiVideo';
export { auth } from './auth';
export { checkStorageLimit, LIMITS, default as storage, storageService } from './storage';
export { db, realtime, supabase, storage as supabaseStorage } from './supabase';

// Модерация и отслеживание ошибок
export * from './contentModeration';
export { errorTracking, withErrorTracking } from './errorTracking';

// Feed сервисы
export { getUserCity, sortFeedListings } from './feedAlgorithm';
export { clearFeedCache, fetchAllFeed, fetchFeed } from './feedService';

// Business Boost сервисы
export {
  applyBusinessBoost,
  insertProBanners,
  sortWithBusinessBoost,
  loadBusinessBoostMap,
  getProBanners,
  processFeedWithBusinessBoost,
} from './business/feedBoost';
export type { BusinessBoost } from './business/feedBoost';

// Listings сервис
export { getListing, listingsService } from './listings';

// AI сервисы
export {
    AI_CONFIG, analyzeCarVideo, checkAPIKeys, compareCars, logAPICost, quickIdentifyCar, selectAvailableAI, TEST_CONFIG, validateVideoQuality
} from './ai';

// AI Horse service
export { analyzeHorseVideo, aiHorse } from './aiHorse';

// AI Real Estate service
export { analyzeRealEstateVideo, aiRealEstate } from './aiRealEstate';

// Утилиты
export { getHLSUrl, getMp4Url, getThumbnailUrl, uploadVideoToApiVideo } from './apiVideo';

// Mock данные для demo и тестирования
export { MOCK_LISTINGS, MOCK_SEARCH_RESULT } from './mockData';

// Push уведомления
export { pushNotifications } from './pushNotifications';

// Offline storage
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
} from './offlineStorage';

// Quick upload
export { quickUploadVideo } from './quickUpload';
export type { QuickUploadResult } from './quickUpload';

// Rate limiting
export {
  rateLimiter,
  canUpload,
  canSendMessage,
  canLike,
  canSearch,
  getUserTier,
  getUserLimits,
} from './rateLimiting';
export type { UserTier, RateLimits } from './rateLimiting';

// Search service
export { search, searchService, parseQuery } from './searchService';
export type { SearchParams, SearchResult } from './searchService';

// SMS service
export { sendVerificationCode, verifyCode, sendSMS, getSmsStatus } from './sms';

// Trust Score
export {
  calculateTrustScore,
  trustScoreService,
  moderationRules,
  getTrustLevel,
  shouldAutoApproveListing,
  requireManualReview,
  updateUserTrustScore,
} from './trustScore';
export type { TrustScoreFactors } from './trustScore';

// Video service
export {
  extractKeyFrames,
  getVideoMetadata,
  validateVideo,
  getVideoThumbnail,
  videoService,
  extractFramesFromVideo,
  validateVideoQuality,
  videoUtils,
} from './video';
export type { VideoFrame, VideoMetadata } from './video';

// AI Upload service
export { uploadAndAnalyzeVideo } from './aiUpload';
export type { UploadAndAnalyzeResult } from './aiUpload';

