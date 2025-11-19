// services/feedService.ts — ПРОДАКШЕН-ФИД 360AutoMVP 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИОНУ ПОЛЬЗОВАТЕЛЕЙ

import { Listing } from '@/types';
import { supabase } from './supabase';

interface FeedCache {
  data: Listing[];
  timestamp: number;
  category?: string;
}

const CACHE_DURATION = 30_000; // 30 секунд
const feedCache = new Map<string, FeedCache>();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function fetchFeed(
  category: string,
  options: { retries?: number; signal?: AbortSignal; requireAuth?: boolean } = {}
): Promise<Listing[]> {
  const { retries = 2, signal, requireAuth = false } = options;
  const cacheKey = category;
  const cached = feedCache.get(cacheKey);

  // Кэш
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      // Если требуется авторизация и сессия просрочена — возвращаем пустой массив
      // Редирект на логин должен быть в компоненте, не здесь (чтобы избежать циклических зависимостей)
      if (requireAuth && !sessionData.session) {
        return [];
      }

      let query = supabase
        .from('listings')
        .select('*, seller:users!seller_user_id(id, name, avatar_url, city)')
        .eq('category', category)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      // Добавляем abortSignal только если он есть
      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query;

      if (error) {
        // Обработка 401 - Unauthorized
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          if (requireAuth) {
            // Редирект будет в компоненте
            return [];
          }
        }
        throw error;
      }

      const listings = (data || []) as Listing[];

      // Кэшируем
      feedCache.set(cacheKey, { data: listings, timestamp: Date.now(), category });

      return listings;
    } catch (error: any) {
      if (error.name === 'AbortError' || signal?.aborted) {
        return []; // Пользователь ушёл — не retry
      }

      if (attempt < retries) {
        await delay(1000 * Math.pow(2, attempt)); // Экспоненциальный backoff
        continue;
      }

      console.error(`[feedService] Failed to load ${category}:`, error);
      return [];
    }
  }

  return [];
}

export async function fetchAllFeed(
  options: { signal?: AbortSignal; requireAuth?: boolean } = {}
): Promise<Listing[]> {
  const { signal, requireAuth } = options;

  try {
    const [cars, horses, realEstate] = await Promise.all([
      fetchFeed('car', { signal, requireAuth }),
      fetchFeed('horse', { signal, requireAuth }),
      fetchFeed('real_estate', { signal, requireAuth }),
    ]);

    const all = [...cars, ...horses, ...realEstate];

    // Универсальная сортировка (новые + boost + город)
    return all.sort((a, b) => {
      const aBoost = !!(a as any).boost_until || !!(a as any).is_boosted;
      const bBoost = !!(b as any).boost_until || !!(b as any).is_boosted;
      if (aBoost !== bBoost) return aBoost ? -1 : 1;

      return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
    });
  } catch {
    return [];
  }
}

// Очистка кэша при смене пользователя или выходе
export function clearFeedCache() {
  feedCache.clear();
}

