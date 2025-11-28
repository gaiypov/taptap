// services/cache/mmkvStorage.ts
// MMKV STORAGE — 30x БЫСТРЕЕ ASYNCSTORAGE
// Для критичных операций: лайки, состояние фида, мгновенные UI-обновления

import { createMMKV, type MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';

// Singleton instance
let storage: MMKV | null = null;

// Получить инстанс MMKV (lazy init)
function getStorage(): MMKV {
  if (!storage) {
    storage = createMMKV({
      id: '360auto-storage',
    });
  }
  return storage;
}

// ============================================
// LIKES — Мгновенное сохранение лайков
// ============================================

const LIKES_KEY = 'user_likes';
const SAVES_KEY = 'user_saves';

export interface LikesState {
  [listingId: string]: {
    liked: boolean;
    likedAt: number;
    synced: boolean; // Синхронизировано ли с сервером
  };
}

export interface SavesState {
  [listingId: string]: {
    saved: boolean;
    savedAt: number;
    synced: boolean;
  };
}

// Получить все лайки пользователя
export function getLikes(): LikesState {
  if (Platform.OS === 'web') return {};
  
  const data = getStorage().getString(LIKES_KEY);
  if (!data) return {};
  
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Проверить лайк конкретного листинга (микросекунды!)
export function isLiked(listingId: string): boolean {
  const likes = getLikes();
  return likes[listingId]?.liked ?? false;
}

// Поставить/убрать лайк (instant, ~0.1ms)
export function setLike(listingId: string, liked: boolean): void {
  if (Platform.OS === 'web') return;
  
  const likes = getLikes();
  
  if (liked) {
    likes[listingId] = {
      liked: true,
      likedAt: Date.now(),
      synced: false, // Нужно синхронизировать с сервером
    };
  } else {
    delete likes[listingId];
  }
  
  getStorage().set(LIKES_KEY, JSON.stringify(likes));
}

// Отметить лайк как синхронизированный
export function markLikeSynced(listingId: string): void {
  if (Platform.OS === 'web') return;
  
  const likes = getLikes();
  if (likes[listingId]) {
    likes[listingId].synced = true;
    getStorage().set(LIKES_KEY, JSON.stringify(likes));
  }
}

// Получить несинхронизированные лайки
export function getUnsyncedLikes(): string[] {
  const likes = getLikes();
  return Object.entries(likes)
    .filter(([_, data]) => !data.synced && data.liked)
    .map(([id]) => id);
}

// ============================================
// SAVES (Favorites) — Аналогично лайкам
// ============================================

export function getSaves(): SavesState {
  if (Platform.OS === 'web') return {};
  
  const data = getStorage().getString(SAVES_KEY);
  if (!data) return {};
  
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function isSaved(listingId: string): boolean {
  const saves = getSaves();
  return saves[listingId]?.saved ?? false;
}

export function setSave(listingId: string, saved: boolean): void {
  if (Platform.OS === 'web') return;
  
  const saves = getSaves();
  
  if (saved) {
    saves[listingId] = {
      saved: true,
      savedAt: Date.now(),
      synced: false,
    };
  } else {
    delete saves[listingId];
  }
  
  getStorage().set(SAVES_KEY, JSON.stringify(saves));
}

export function markSaveSynced(listingId: string): void {
  if (Platform.OS === 'web') return;
  
  const saves = getSaves();
  if (saves[listingId]) {
    saves[listingId].synced = true;
    getStorage().set(SAVES_KEY, JSON.stringify(saves));
  }
}

export function getUnsyncedSaves(): string[] {
  const saves = getSaves();
  return Object.entries(saves)
    .filter(([_, data]) => !data.synced && data.saved)
    .map(([id]) => id);
}

// ============================================
// FEED STATE — Состояние фида между сессиями
// ============================================

const FEED_STATE_KEY = 'feed_state';

export interface FeedState {
  currentIndex: number;
  activeCategory: string;
  lastViewedAt: number;
  preloadedIds: string[]; // Уже загруженные листинги
}

export function getFeedState(): FeedState | null {
  if (Platform.OS === 'web') return null;
  
  const data = getStorage().getString(FEED_STATE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setFeedState(state: Partial<FeedState>): void {
  if (Platform.OS === 'web') return;
  
  const current = getFeedState() || {
    currentIndex: 0,
    activeCategory: 'all',
    lastViewedAt: Date.now(),
    preloadedIds: [],
  };
  
  const updated = {
    ...current,
    ...state,
    lastViewedAt: Date.now(),
  };
  
  getStorage().set(FEED_STATE_KEY, JSON.stringify(updated));
}

export function clearFeedState(): void {
  if (Platform.OS === 'web') return;
  getStorage().remove(FEED_STATE_KEY);
}

// ============================================
// VIDEO PLAYBACK STATE — Позиция воспроизведения
// ============================================

const VIDEO_POSITION_KEY = 'video_positions';

interface VideoPositions {
  [videoId: string]: {
    position: number; // В секундах
    duration: number;
    updatedAt: number;
  };
}

export function getVideoPosition(videoId: string): number {
  if (Platform.OS === 'web') return 0;
  
  const data = getStorage().getString(VIDEO_POSITION_KEY);
  if (!data) return 0;
  
  try {
    const positions: VideoPositions = JSON.parse(data);
    return positions[videoId]?.position ?? 0;
  } catch {
    return 0;
  }
}

export function setVideoPosition(videoId: string, position: number, duration: number): void {
  if (Platform.OS === 'web') return;
  
  const data = getStorage().getString(VIDEO_POSITION_KEY);
  let positions: VideoPositions = {};
  
  try {
    if (data) positions = JSON.parse(data);
  } catch {
    // ignore
  }
  
  positions[videoId] = {
    position,
    duration,
    updatedAt: Date.now(),
  };
  
  // Ограничиваем до 100 последних видео
  const entries = Object.entries(positions);
  if (entries.length > 100) {
    const sorted = entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt);
    positions = Object.fromEntries(sorted.slice(0, 100));
  }
  
  getStorage().set(VIDEO_POSITION_KEY, JSON.stringify(positions));
}

// ============================================
// USER PREFERENCES — Быстрые настройки
// ============================================

const PREFS_KEY = 'quick_prefs';

export interface QuickPrefs {
  muted: boolean;
  autoplay: boolean;
  videoQuality: 'low' | 'medium' | 'high' | 'auto';
  hapticFeedback: boolean;
}

const DEFAULT_PREFS: QuickPrefs = {
  muted: false,
  autoplay: true,
  videoQuality: 'auto',
  hapticFeedback: true,
};

export function getQuickPrefs(): QuickPrefs {
  if (Platform.OS === 'web') return DEFAULT_PREFS;
  
  const data = getStorage().getString(PREFS_KEY);
  if (!data) return DEFAULT_PREFS;
  
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function setQuickPref<K extends keyof QuickPrefs>(key: K, value: QuickPrefs[K]): void {
  if (Platform.OS === 'web') return;
  
  const prefs = getQuickPrefs();
  prefs[key] = value;
  
  getStorage().set(PREFS_KEY, JSON.stringify(prefs));
}

export function setQuickPrefs(prefs: Partial<QuickPrefs>): void {
  if (Platform.OS === 'web') return;
  
  const current = getQuickPrefs();
  getStorage().set(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
}

// ============================================
// GENERIC METHODS — Общие методы
// ============================================

// Быстрый get/set для любых данных
export function get<T>(key: string, defaultValue: T): T {
  if (Platform.OS === 'web') return defaultValue;
  
  const data = getStorage().getString(key);
  if (!data) return defaultValue;
  
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

export function set(key: string, value: unknown): void {
  if (Platform.OS === 'web') return;
  getStorage().set(key, JSON.stringify(value));
}

export function remove(key: string): void {
  if (Platform.OS === 'web') return;
  getStorage().remove(key);
}

// Boolean shortcuts (ещё быстрее для флагов)
export function getBoolean(key: string, defaultValue = false): boolean {
  if (Platform.OS === 'web') return defaultValue;
  return getStorage().getBoolean(key) ?? defaultValue;
}

export function setBoolean(key: string, value: boolean): void {
  if (Platform.OS === 'web') return;
  getStorage().set(key, value);
}

// Number shortcuts
export function getNumber(key: string, defaultValue = 0): number {
  if (Platform.OS === 'web') return defaultValue;
  return getStorage().getNumber(key) ?? defaultValue;
}

export function setNumber(key: string, value: number): void {
  if (Platform.OS === 'web') return;
  getStorage().set(key, value);
}

// ============================================
// CLEANUP & STATS
// ============================================

export function clearAll(): void {
  if (Platform.OS === 'web') return;
  getStorage().clearAll();
}

export function getAllKeys(): string[] {
  if (Platform.OS === 'web') return [];
  return getStorage().getAllKeys();
}

export function getStorageSize(): number {
  if (Platform.OS === 'web') return 0;
  return getStorage().size;
}

// Экспорт storage instance для advanced use cases
export { getStorage };

export default {
  // Likes
  getLikes,
  isLiked,
  setLike,
  markLikeSynced,
  getUnsyncedLikes,
  
  // Saves
  getSaves,
  isSaved,
  setSave,
  markSaveSynced,
  getUnsyncedSaves,
  
  // Feed
  getFeedState,
  setFeedState,
  clearFeedState,
  
  // Video
  getVideoPosition,
  setVideoPosition,
  
  // Prefs
  getQuickPrefs,
  setQuickPref,
  setQuickPrefs,
  
  // Generic
  get,
  set,
  remove,
  getBoolean,
  setBoolean,
  getNumber,
  setNumber,
  
  // Utils
  clearAll,
  getAllKeys,
  getStorageSize,
};
