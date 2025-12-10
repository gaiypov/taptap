// services/userBehavior.ts — СИСТЕМА ОТСЛЕЖИВАНИЯ ПОВЕДЕНИЯ ПОКУПАТЕЛЯ
// Записывает действия авторизованных пользователей для персонализации

import { CategoryType } from '@/config/filterConfig';
import { supabase } from './supabase';
import { appLogger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ TYPES ============
export type BehaviorEventType =
  | 'view'           // Просмотр объявления
  | 'view_long'      // Длительный просмотр (>10 сек)
  | 'like'           // Лайк
  | 'unlike'         // Убрал лайк
  | 'favorite'       // Добавил в избранное
  | 'unfavorite'     // Убрал из избранного
  | 'share'          // Поделился
  | 'comment'        // Комментарий
  | 'chat_start'     // Начал чат с продавцом
  | 'call'           // Позвонил продавцу
  | 'search'         // Поиск
  | 'filter_apply'   // Применил фильтры
  | 'scroll_past'    // Проскроллил мимо (не заинтересовался)
  | 'video_watch'    // Просмотр видео >50%
  | 'video_complete' // Просмотр видео 100%
  | 'price_check'    // Посмотрел цену детально
  | 'seller_view';   // Посмотрел профиль продавца

export interface BehaviorEvent {
  id?: string;
  user_id: string;
  event_type: BehaviorEventType;
  listing_id?: string;
  category?: CategoryType;
  // Метаданные события
  metadata?: {
    // Для просмотров
    duration_seconds?: number;
    scroll_depth?: number;
    // Для поиска
    search_query?: string;
    results_count?: number;
    // Для фильтров
    filters?: Record<string, any>;
    // Для объявлений
    brand?: string;
    model?: string;
    price?: number;
    price_range?: [number, number];
    year?: number;
    city?: string;
    color?: string;
    transmission?: string;
    breed?: string;
    property_type?: string;
    // Общие
    source?: 'feed' | 'search' | 'favorites' | 'profile' | 'direct';
  };
  created_at?: string;
}

export interface UserPreferences {
  user_id: string;
  // Предпочтения по категориям (веса 0-100)
  category_weights: Record<CategoryType, number>;
  // Предпочтения по брендам (для авто)
  preferred_brands: Array<{ brand: string; weight: number }>;
  // Ценовые предпочтения
  price_preferences: {
    car?: { min: number; max: number; avg: number };
    horse?: { min: number; max: number; avg: number };
    real_estate?: { min: number; max: number; avg: number };
  };
  // Предпочтительные города
  preferred_cities: Array<{ city: string; weight: number }>;
  // Предпочтения по характеристикам
  preferred_colors: Array<{ color: string; weight: number }>;
  preferred_transmissions: Array<{ type: string; weight: number }>;
  preferred_years: { min: number; max: number };
  // Для лошадей
  preferred_breeds: Array<{ breed: string; weight: number }>;
  // Для недвижимости
  preferred_property_types: Array<{ type: string; weight: number }>;
  // Метаданные
  total_events: number;
  last_updated: string;
}

// ============ CONSTANTS ============
const LOCAL_EVENTS_KEY = 'user_behavior_events_queue';
const PREFERENCES_CACHE_KEY = 'user_preferences_cache';
const SYNC_INTERVAL = 60 * 1000; // 1 минута
const MAX_LOCAL_EVENTS = 100;
const VIEW_LONG_THRESHOLD = 10; // секунд

// Флаг для отслеживания отсутствия таблицы (graceful degradation)
let tableMissingLogged = false;

// Веса событий для расчёта интереса
const EVENT_WEIGHTS: Record<BehaviorEventType, number> = {
  view: 1,
  view_long: 3,
  like: 5,
  unlike: -3,
  favorite: 8,
  unfavorite: -5,
  share: 10,
  comment: 7,
  chat_start: 15,
  call: 20,
  search: 2,
  filter_apply: 2,
  scroll_past: -1,
  video_watch: 4,
  video_complete: 6,
  price_check: 3,
  seller_view: 4,
};

// ============ LOCAL QUEUE ============
let eventsQueue: BehaviorEvent[] = [];
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let preferencesCache: UserPreferences | null = null;

async function loadLocalQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_EVENTS_KEY);
    if (stored) {
      eventsQueue = JSON.parse(stored);
    }
  } catch (e) {
    appLogger.warn('[UserBehavior] Failed to load local queue', { error: e });
  }
}

async function saveLocalQueue(): Promise<void> {
  try {
    // Ограничиваем размер очереди
    if (eventsQueue.length > MAX_LOCAL_EVENTS) {
      eventsQueue = eventsQueue.slice(-MAX_LOCAL_EVENTS);
    }
    await AsyncStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(eventsQueue));
  } catch (e) {
    appLogger.warn('[UserBehavior] Failed to save local queue', { error: e });
  }
}

// ============ SYNC TO SUPABASE ============
async function syncToSupabase(): Promise<void> {
  if (eventsQueue.length === 0) return;

  const eventsToSync = [...eventsQueue];

  try {
    // Batch insert
    const { error } = await supabase
      .from('user_behavior')
      .insert(eventsToSync.map(e => ({
        user_id: e.user_id,
        event_type: e.event_type,
        listing_id: e.listing_id,
        category: e.category,
        metadata: e.metadata,
        created_at: e.created_at || new Date().toISOString(),
      })));

    if (error) {
      // Проверяем, что таблица не существует (PGRST205)
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        if (!tableMissingLogged) {
          appLogger.warn('[UserBehavior] Table user_behavior does not exist. Behavior tracking disabled. Apply migration: supabase/migrations/20250123_user_behavior_tracking.sql');
          tableMissingLogged = true;
        }
        // Очищаем очередь, чтобы не накапливать события
        eventsQueue = [];
        await saveLocalQueue();
        return;
      }
      throw error;
    }

    // Очищаем синхронизированные события
    eventsQueue = eventsQueue.filter(e => !eventsToSync.includes(e));
    await saveLocalQueue();

    appLogger.info('[UserBehavior] Synced events to Supabase', { count: eventsToSync.length });
  } catch (e) {
    // Проверяем, что таблица не существует
    if ((e as any)?.code === 'PGRST205' || (e as any)?.message?.includes('Could not find the table')) {
      if (!tableMissingLogged) {
        appLogger.warn('[UserBehavior] Table user_behavior does not exist. Behavior tracking disabled. Apply migration: supabase/migrations/20250123_user_behavior_tracking.sql');
        tableMissingLogged = true;
      }
      eventsQueue = [];
      await saveLocalQueue();
      return;
    }
    appLogger.warn('[UserBehavior] Sync failed, will retry', { error: e });
  }
}

function startSyncTimer(): void {
  if (syncTimer) return;

  syncTimer = setInterval(() => {
    syncToSupabase();
  }, SYNC_INTERVAL);
}

function stopSyncTimer(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

// ============ TRACK EVENTS ============
export async function trackEvent(event: Omit<BehaviorEvent, 'id' | 'created_at'>): Promise<void> {
  if (!event.user_id) {
    // Не авторизован — не отслеживаем
    return;
  }

  const fullEvent: BehaviorEvent = {
    ...event,
    created_at: new Date().toISOString(),
  };

  eventsQueue.push(fullEvent);
  await saveLocalQueue();

  // Запускаем синхронизацию если ещё не запущена
  startSyncTimer();

  // Инвалидируем кэш предпочтений при важных событиях
  if (['like', 'favorite', 'chat_start', 'call', 'share'].includes(event.event_type)) {
    preferencesCache = null;
  }

  if (__DEV__) {
    appLogger.debug('[UserBehavior] Event tracked', {
      type: event.event_type,
      listing_id: event.listing_id,
      category: event.category,
    });
  }
}

// Удобные методы для конкретных событий
export const trackView = (userId: string, listingId: string, category: CategoryType, metadata?: BehaviorEvent['metadata']) =>
  trackEvent({ user_id: userId, event_type: 'view', listing_id: listingId, category, metadata });

export const trackLongView = (userId: string, listingId: string, category: CategoryType, durationSeconds: number, metadata?: BehaviorEvent['metadata']) =>
  trackEvent({
    user_id: userId,
    event_type: 'view_long',
    listing_id: listingId,
    category,
    metadata: { ...metadata, duration_seconds: durationSeconds }
  });

export const trackLike = (userId: string, listingId: string, category: CategoryType, metadata?: BehaviorEvent['metadata']) =>
  trackEvent({ user_id: userId, event_type: 'like', listing_id: listingId, category, metadata });

export const trackUnlike = (userId: string, listingId: string, category: CategoryType) =>
  trackEvent({ user_id: userId, event_type: 'unlike', listing_id: listingId, category });

export const trackFavorite = (userId: string, listingId: string, category: CategoryType, metadata?: BehaviorEvent['metadata']) =>
  trackEvent({ user_id: userId, event_type: 'favorite', listing_id: listingId, category, metadata });

export const trackUnfavorite = (userId: string, listingId: string, category: CategoryType) =>
  trackEvent({ user_id: userId, event_type: 'unfavorite', listing_id: listingId, category });

export const trackShare = (userId: string, listingId: string, category: CategoryType) =>
  trackEvent({ user_id: userId, event_type: 'share', listing_id: listingId, category });

export const trackChatStart = (userId: string, listingId: string, category: CategoryType) =>
  trackEvent({ user_id: userId, event_type: 'chat_start', listing_id: listingId, category });

export const trackCall = (userId: string, listingId: string, category: CategoryType) =>
  trackEvent({ user_id: userId, event_type: 'call', listing_id: listingId, category });

export const trackSearch = (userId: string, category: CategoryType, query: string, resultsCount: number, filters?: Record<string, any>) =>
  trackEvent({
    user_id: userId,
    event_type: 'search',
    category,
    metadata: { search_query: query, results_count: resultsCount, filters }
  });

export const trackFilterApply = (userId: string, category: CategoryType, filters: Record<string, any>) =>
  trackEvent({ user_id: userId, event_type: 'filter_apply', category, metadata: { filters } });

export const trackVideoWatch = (userId: string, listingId: string, category: CategoryType) =>
  trackEvent({ user_id: userId, event_type: 'video_watch', listing_id: listingId, category });

export const trackVideoComplete = (userId: string, listingId: string, category: CategoryType) =>
  trackEvent({ user_id: userId, event_type: 'video_complete', listing_id: listingId, category });

export const trackScrollPast = (userId: string, listingId: string, category: CategoryType) =>
  trackEvent({ user_id: userId, event_type: 'scroll_past', listing_id: listingId, category });

export const trackSellerView = (userId: string, listingId: string, category: CategoryType, sellerId: string) =>
  trackEvent({ user_id: userId, event_type: 'seller_view', listing_id: listingId, category, metadata: { source: 'profile' } });

// ============ CALCULATE PREFERENCES ============
export async function calculateUserPreferences(userId: string): Promise<UserPreferences> {
  // Проверяем кэш
  if (preferencesCache && preferencesCache.user_id === userId) {
    return preferencesCache;
  }

  try {
    // Загружаем события за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: events, error } = await supabase
      .from('user_behavior')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      // Если таблица не существует, возвращаем дефолтные предпочтения
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        if (!tableMissingLogged) {
          appLogger.warn('[UserBehavior] Table user_behavior does not exist. Using default preferences.');
          tableMissingLogged = true;
        }
        return getDefaultPreferences(userId);
      }
      throw error;
    }

    // Также учитываем локальные события
    const allEvents = [...(events || []), ...eventsQueue.filter(e => e.user_id === userId)];

    const preferences = computePreferencesFromEvents(userId, allEvents);

    // Кэшируем
    preferencesCache = preferences;
    await AsyncStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(preferences));

    return preferences;
  } catch (e) {
    appLogger.warn('[UserBehavior] Failed to calculate preferences', { error: e });

    // Пробуем загрузить из локального кэша
    try {
      const cached = await AsyncStorage.getItem(PREFERENCES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.user_id === userId) {
          return parsed;
        }
      }
    } catch {}

    // Возвращаем дефолтные предпочтения
    return getDefaultPreferences(userId);
  }
}

function computePreferencesFromEvents(userId: string, events: BehaviorEvent[]): UserPreferences {
  const categoryScores: Record<CategoryType, number> = { car: 0, horse: 0, real_estate: 0 };
  const brandScores: Record<string, number> = {};
  const cityScores: Record<string, number> = {};
  const colorScores: Record<string, number> = {};
  const transmissionScores: Record<string, number> = {};
  const breedScores: Record<string, number> = {};
  const propertyTypeScores: Record<string, number> = {};
  const prices: Record<CategoryType, number[]> = { car: [], horse: [], real_estate: [] };
  const years: number[] = [];

  for (const event of events) {
    const weight = EVENT_WEIGHTS[event.event_type] || 1;
    const category = event.category;
    const meta = event.metadata || {};

    // Категория
    if (category) {
      categoryScores[category] = (categoryScores[category] || 0) + weight;
    }

    // Бренд (для авто)
    if (meta.brand) {
      brandScores[meta.brand] = (brandScores[meta.brand] || 0) + weight;
    }

    // Город
    if (meta.city) {
      cityScores[meta.city] = (cityScores[meta.city] || 0) + weight;
    }

    // Цвет
    if (meta.color) {
      colorScores[meta.color] = (colorScores[meta.color] || 0) + weight;
    }

    // Коробка передач
    if (meta.transmission) {
      transmissionScores[meta.transmission] = (transmissionScores[meta.transmission] || 0) + weight;
    }

    // Порода (для лошадей)
    if (meta.breed) {
      breedScores[meta.breed] = (breedScores[meta.breed] || 0) + weight;
    }

    // Тип недвижимости
    if (meta.property_type) {
      propertyTypeScores[meta.property_type] = (propertyTypeScores[meta.property_type] || 0) + weight;
    }

    // Цена
    if (meta.price && category) {
      prices[category].push(meta.price);
    }

    // Год
    if (meta.year) {
      years.push(meta.year);
    }
  }

  // Нормализуем веса категорий (0-100)
  const totalCategoryScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) || 1;
  const category_weights: Record<CategoryType, number> = {
    car: Math.round((categoryScores.car / totalCategoryScore) * 100),
    horse: Math.round((categoryScores.horse / totalCategoryScore) * 100),
    real_estate: Math.round((categoryScores.real_estate / totalCategoryScore) * 100),
  };

  // Топ бренды
  const preferred_brands = Object.entries(brandScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([brand, weight]) => ({ brand, weight }));

  // Топ города
  const preferred_cities = Object.entries(cityScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, weight]) => ({ city, weight }));

  // Топ цвета
  const preferred_colors = Object.entries(colorScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color, weight]) => ({ color, weight }));

  // Топ коробки передач
  const preferred_transmissions = Object.entries(transmissionScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, weight]) => ({ type, weight }));

  // Топ породы
  const preferred_breeds = Object.entries(breedScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([breed, weight]) => ({ breed, weight }));

  // Топ типы недвижимости
  const preferred_property_types = Object.entries(propertyTypeScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, weight]) => ({ type, weight }));

  // Ценовые предпочтения
  const price_preferences: UserPreferences['price_preferences'] = {};
  for (const cat of ['car', 'horse', 'real_estate'] as CategoryType[]) {
    if (prices[cat].length > 0) {
      const sorted = prices[cat].sort((a, b) => a - b);
      price_preferences[cat] = {
        min: sorted[Math.floor(sorted.length * 0.1)] || sorted[0],
        max: sorted[Math.floor(sorted.length * 0.9)] || sorted[sorted.length - 1],
        avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
      };
    }
  }

  // Предпочтения по годам
  const preferred_years = {
    min: years.length > 0 ? Math.min(...years) : 2010,
    max: years.length > 0 ? Math.max(...years) : new Date().getFullYear(),
  };

  return {
    user_id: userId,
    category_weights,
    preferred_brands,
    price_preferences,
    preferred_cities,
    preferred_colors,
    preferred_transmissions,
    preferred_years,
    preferred_breeds,
    preferred_property_types,
    total_events: events.length,
    last_updated: new Date().toISOString(),
  };
}

function getDefaultPreferences(userId: string): UserPreferences {
  return {
    user_id: userId,
    category_weights: { car: 60, horse: 20, real_estate: 20 },
    preferred_brands: [],
    price_preferences: {},
    preferred_cities: [{ city: 'Бишкек', weight: 100 }],
    preferred_colors: [],
    preferred_transmissions: [],
    preferred_years: { min: 2015, max: new Date().getFullYear() },
    preferred_breeds: [],
    preferred_property_types: [],
    total_events: 0,
    last_updated: new Date().toISOString(),
  };
}

// ============ GET RECOMMENDATIONS ============
export interface RecommendationParams {
  userId: string;
  category?: CategoryType;
  limit?: number;
  excludeIds?: string[];
}

export interface RecommendedListing {
  listing: any;
  score: number;
  reason: string;
}

export async function getRecommendations(params: RecommendationParams): Promise<RecommendedListing[]> {
  const { userId, category, limit = 20, excludeIds = [] } = params;

  try {
    const preferences = await calculateUserPreferences(userId);

    // Определяем основную категорию для поиска
    let targetCategory = category;
    if (!targetCategory) {
      // Выбираем категорию с максимальным весом
      const maxWeight = Math.max(...Object.values(preferences.category_weights));
      targetCategory = (Object.entries(preferences.category_weights)
        .find(([_, w]) => w === maxWeight)?.[0] || 'car') as CategoryType;
    }

    // Строим запрос с учётом предпочтений
    let query = supabase
      .from('listings')
      .select('*, seller:users!seller_user_id(id, name, avatar_url, is_verified)')
      .eq('category', targetCategory)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit * 3); // Берём больше для фильтрации

    // Исключаем уже просмотренные
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Фильтруем по цене если есть предпочтения
    const pricePrefs = preferences.price_preferences[targetCategory];
    if (pricePrefs) {
      query = query
        .gte('price', pricePrefs.min * 0.7) // ±30% от предпочтений
        .lte('price', pricePrefs.max * 1.3);
    }

    // Фильтруем по городу если есть предпочтения
    if (preferences.preferred_cities.length > 0) {
      const topCities = preferences.preferred_cities.slice(0, 3).map(c => c.city);
      query = query.in('city', topCities);
    }

    const { data: listings, error } = await query;

    if (error) throw error;
    if (!listings || listings.length === 0) {
      return [];
    }

    // Скорим и сортируем результаты
    const scoredListings = listings.map(listing => {
      const { score, reason } = calculateListingScore(listing, preferences, targetCategory);
      return { listing, score, reason };
    });

    // Сортируем по скору и берём топ
    return scoredListings
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (e) {
    appLogger.warn('[UserBehavior] Failed to get recommendations', { error: e });
    return [];
  }
}

function calculateListingScore(
  listing: any,
  preferences: UserPreferences,
  category: CategoryType
): { score: number; reason: string } {
  let score = 50; // Базовый скор
  const reasons: string[] = [];

  // Бренд (для авто)
  if (category === 'car' && listing.brand) {
    const brandPref = preferences.preferred_brands.find(
      b => b.brand.toLowerCase() === listing.brand.toLowerCase()
    );
    if (brandPref) {
      score += Math.min(brandPref.weight, 20);
      reasons.push(`Вам нравится ${listing.brand}`);
    }
  }

  // Город
  if (listing.city) {
    const cityPref = preferences.preferred_cities.find(
      c => c.city.toLowerCase() === listing.city.toLowerCase()
    );
    if (cityPref) {
      score += Math.min(cityPref.weight / 5, 10);
      reasons.push(`В вашем городе`);
    }
  }

  // Цена в предпочтительном диапазоне
  const pricePrefs = preferences.price_preferences[category];
  if (pricePrefs && listing.price) {
    if (listing.price >= pricePrefs.min && listing.price <= pricePrefs.max) {
      score += 15;
      reasons.push(`В вашем ценовом диапазоне`);
    } else if (listing.price >= pricePrefs.avg * 0.8 && listing.price <= pricePrefs.avg * 1.2) {
      score += 10;
    }
  }

  // Год (для авто)
  if (category === 'car' && listing.year) {
    if (listing.year >= preferences.preferred_years.min &&
        listing.year <= preferences.preferred_years.max) {
      score += 10;
    }
  }

  // Цвет
  if (listing.color) {
    const colorPref = preferences.preferred_colors.find(
      c => c.color.toLowerCase() === listing.color.toLowerCase()
    );
    if (colorPref) {
      score += 5;
    }
  }

  // Коробка передач (для авто)
  if (category === 'car' && listing.transmission) {
    const transPref = preferences.preferred_transmissions.find(
      t => t.type.toLowerCase() === listing.transmission.toLowerCase()
    );
    if (transPref) {
      score += 8;
      reasons.push(`Предпочитаемая КПП`);
    }
  }

  // Порода (для лошадей)
  if (category === 'horse' && listing.breed) {
    const breedPref = preferences.preferred_breeds.find(
      b => b.breed.toLowerCase() === listing.breed.toLowerCase()
    );
    if (breedPref) {
      score += 15;
      reasons.push(`Вам нравится порода ${listing.breed}`);
    }
  }

  // Тип недвижимости
  if (category === 'real_estate' && listing.property_type) {
    const typePref = preferences.preferred_property_types.find(
      t => t.type.toLowerCase() === listing.property_type.toLowerCase()
    );
    if (typePref) {
      score += 15;
      reasons.push(`Интересующий тип недвижимости`);
    }
  }

  // Буст за высокий AI скор
  if (listing.ai_score && listing.ai_score > 0.8) {
    score += 10;
    reasons.push(`Высокий AI рейтинг`);
  }

  // Буст за верифицированного продавца
  if (listing.seller?.is_verified) {
    score += 5;
  }

  // Буст за свежесть
  const createdAt = new Date(listing.created_at).getTime();
  const daysSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 1) {
    score += 10;
    reasons.push(`Новое объявление`);
  } else if (daysSinceCreation < 3) {
    score += 5;
  }

  // Определяем главную причину
  const reason = reasons.length > 0 ? reasons[0] : 'Может вам понравиться';

  return { score: Math.min(score, 100), reason };
}

// ============ GET SIMILAR LISTINGS ============
export async function getSimilarListings(listingId: string, limit = 6): Promise<any[]> {
  try {
    // Получаем данные текущего объявления
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) return [];

    // Ищем похожие
    let query = supabase
      .from('listings')
      .select('*, seller:users!seller_user_id(id, name, avatar_url, is_verified)')
      .eq('category', listing.category)
      .eq('status', 'active')
      .neq('id', listingId)
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    // По цене (±30%)
    if (listing.price) {
      query = query
        .gte('price', listing.price * 0.7)
        .lte('price', listing.price * 1.3);
    }

    // По бренду (для авто)
    if (listing.category === 'car' && listing.brand) {
      query = query.eq('brand', listing.brand);
    }

    // По породе (для лошадей)
    if (listing.category === 'horse' && listing.breed) {
      query = query.eq('breed', listing.breed);
    }

    const { data: similar, error } = await query;

    if (error) throw error;

    return (similar || []).slice(0, limit);
  } catch (e) {
    appLogger.warn('[UserBehavior] Failed to get similar listings', { error: e });
    return [];
  }
}

// ============ RECENTLY VIEWED ============
export async function getRecentlyViewed(userId: string, limit = 10): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_behavior')
      .select('listing_id')
      .eq('user_id', userId)
      .in('event_type', ['view', 'view_long'])
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (error) {
      // Если таблица не существует, возвращаем пустой массив
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        if (!tableMissingLogged) {
          appLogger.warn('[UserBehavior] Table user_behavior does not exist. Recently viewed disabled.');
          tableMissingLogged = true;
        }
        return [];
      }
      throw error;
    }

    // Убираем дубликаты
    const uniqueIds = [...new Set(data?.map(d => d.listing_id).filter(Boolean))];
    return uniqueIds.slice(0, limit);
  } catch (e) {
    // Проверяем, что таблица не существует
    if ((e as any)?.code === 'PGRST205' || (e as any)?.message?.includes('Could not find the table')) {
      if (!tableMissingLogged) {
        appLogger.warn('[UserBehavior] Table user_behavior does not exist. Recently viewed disabled.');
        tableMissingLogged = true;
      }
      return [];
    }
    appLogger.warn('[UserBehavior] Failed to get recently viewed', { error: e });
    return [];
  }
}

// ============ INITIALIZATION ============
export async function initUserBehavior(): Promise<void> {
  await loadLocalQueue();
  startSyncTimer();
  appLogger.info('[UserBehavior] Initialized');
}

export function cleanupUserBehavior(): void {
  stopSyncTimer();
  syncToSupabase(); // Финальная синхронизация
}

// ============ EXPORT ============
export const userBehavior = {
  // Tracking
  trackEvent,
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
  // Analysis
  calculateUserPreferences,
  getRecommendations,
  getSimilarListings,
  getRecentlyViewed,
  // Lifecycle
  initUserBehavior,
  cleanupUserBehavior,
};
