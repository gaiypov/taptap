// services/searchService.ts — УНИВЕРСАЛЬНЫЙ ПОИСК 360AutoMVP 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К ЗАПУСКУ

import { CategoryType } from '@/config/filterConfig';
import { MOCK_SEARCH_RESULT } from './mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { appLogger } from '@/utils/logger';

export interface SearchParams {
  category: CategoryType;
  query?: string;
  filters?: Record<string, any>;
  sortBy?: 'relevance' | 'date' | 'price_asc' | 'price_desc' | 'views' | 'ai_score';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  data: any[];
  total: number;
  hasMore: boolean;
}

// Кэш
const CACHE_TTL = 3 * 60 * 1000; // 3 минуты
const cache = new Map<string, { data: SearchResult; timestamp: number }>();

const getCacheKey = (params: SearchParams) =>
  `search_${params.category}_${params.query || ''}_${JSON.stringify(params.filters || {})}`;

const getCached = (key: string): SearchResult | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCached = (key: string, data: SearchResult) => {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 100) {
    // Очистка старого
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
};

// Умный парсинг (ещё умнее!)
export const parseQuery = (query: string, category: CategoryType): Record<string, any> => {
  if (!query) return {};

  const q = query.toLowerCase().trim();
  const parsed: Record<string, any> = {};

  // Цена
  const priceMatch = q.match(/(?:от|до|по)\s*(\d+(?:\s*\d+)*)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/\s/g, ''));
    if (price > 100000) {
      if (q.includes('от')) parsed.minPrice = price;
      if (q.includes('до') || q.includes('по')) parsed.maxPrice = price;
    }
  }

  // Год
  const yearMatch = q.match(/\b(19|20)\d{2}\b/);
  if (yearMatch && category === 'car') {
    const year = parseInt(yearMatch[0]);
    if (year >= 1980 && year <= new Date().getFullYear() + 1) {
      parsed.year = year;
    }
  }

  // Марка авто (расширенный список)
  const brands = [
    'toyota',
    'bmw',
    'mercedes',
    'honda',
    'hyundai',
    'kia',
    'lexus',
    'audi',
    'nissan',
    'mazda',
  ];
  for (const brand of brands) {
    if (q.includes(brand)) {
      parsed.brand = brand.charAt(0).toUpperCase() + brand.slice(1);
      break;
    }
  }

  // Порода лошадей
  if (category === 'horse') {
    const breeds = ['ахалтекинская', 'арабская', 'киргизская', 'орловская'];
    for (const breed of breeds) {
      if (q.includes(breed)) {
        parsed.breed = breed.charAt(0).toUpperCase() + breed.slice(1);
        break;
      }
    }
  }

  // Цвет
  const colors: Record<string, string> = {
    черный: 'black',
    белый: 'white',
    красный: 'red',
    синий: 'blue',
    серый: 'gray',
    серебристый: 'silver',
    зеленый: 'green',
  };
  for (const [ru, en] of Object.entries(colors)) {
    if (q.includes(ru)) parsed.color = en;
  }

  // Город
  const cities = ['бишкек', 'ош', 'джалал-абад', 'каракол', 'талас'];
  for (const city of cities) {
    if (q.includes(city)) {
      parsed.city = city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  return parsed;
};

// Универсальный поиск
export async function search(params: SearchParams): Promise<SearchResult> {
  const {
    category,
    query = '',
    filters = {},
    sortBy = 'relevance',
    limit = 20,
    offset = 0,
  } = params;

  const cacheKey = getCacheKey(params);
  const cached = getCached(cacheKey);
  if (cached) {
    appLogger.info('[Search] From cache', { category, query });
    return cached;
  }

  try {
    const parsed = parseQuery(query, category);
    const mergedFilters = { ...filters, ...parsed };

    let qb = supabase
      .from('listings')
      .select('*, seller:users!seller_user_id(id, name, avatar_url, is_verified)', { count: 'exact' })
      .eq('category', category)
      .eq('status', 'active');

    // Текстовый поиск (используем ilike, так как fts может не быть)
    if (query) {
      qb = qb.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Фильтры
    Object.entries(mergedFilters).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === null) return;

      if (key === 'minPrice') qb = qb.gte('price', value);
      else if (key === 'maxPrice') qb = qb.lte('price', value);
      else if (key === 'city' && value !== 'Весь Кыргызстан') qb = qb.eq('city', value);
      else qb = qb.eq(key, value);
    });

    // Сортировка
    switch (sortBy) {
      case 'price_asc':
        qb = qb.order('price', { ascending: true });
        break;
      case 'price_desc':
        qb = qb.order('price', { ascending: false });
        break;
      case 'views':
        qb = qb.order('views_count', { ascending: false });
        break;
      case 'ai_score':
        qb = qb.order('ai_score', { ascending: false });
        break;
      default:
        qb = qb.order('created_at', { ascending: false });
    }

    const { data, error, count } = await qb.range(offset, offset + limit - 1);

    if (error) throw error;

    const result = {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };

    setCached(cacheKey, result);
    return result;
  } catch (error: any) {
    appLogger.warn('[Search] Error, using fallback', error);

    if (__DEV__) {
      return MOCK_SEARCH_RESULT;
    }

    return { data: [], total: 0, hasMore: false };
  }
}

export const searchService = {
  search,
  parseQuery,
};
