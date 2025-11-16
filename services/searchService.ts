// services/searchService.ts
// 🔍 Универсальный поисковый сервис для всех категорий
import { CategoryType, FILTER_CONFIG } from '@/config/filterConfig';
import { FALLBACK_LISTINGS } from '@/utils/fallbackData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_SEARCH_RESULT } from './mockData';
import { supabase } from './supabase';

// ============================================
// ТИПЫ
// ============================================

export interface SearchParams {
  category: CategoryType;
  query?: string;
  filters?: Record<string, any>;
  sortBy?: 'date' | 'price_asc' | 'price_desc' | 'popularity' | 'rating' | 'ai_score';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  data: any[];
  total: number;
  hasMore: boolean;
}

export interface ParsedQuery {
  text: string;
  brand?: string;
  model?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  age?: number;
  location?: string;
  breed?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  category: CategoryType;
  filters: Record<string, any>;
  createdAt: string;
}

// ============================================
// КОНСТАНТЫ
// ============================================

const CACHE_TTL = 5 * 60 * 1000; // 5 минут
const MAX_HISTORY = 10;
const MAX_SAVED_SEARCHES = 20;

const STORAGE_KEYS = {
  SEARCH_HISTORY: '@search_history',
  SAVED_SEARCHES: '@saved_searches',
  LAST_FILTERS: '@last_filters',
  SEARCH_CACHE: '@search_cache',
};

// Словари для парсинга
const AUTO_BRANDS = [
  'toyota', 'honda', 'bmw', 'mercedes', 'hyundai', 'kia', 'mazda',
  'nissan', 'lexus', 'subaru', 'mitsubishi', 'suzuki', 'ford',
  'chevrolet', 'volkswagen', 'audi', 'тойота', 'хонда', 'бмв'
];

const COLORS = {
  'черный': 'black',
  'белый': 'white',
  'красный': 'red',
  'синий': 'blue',
  'серый': 'gray',
  'серебристый': 'silver',
  'зеленый': 'green',
  'желтый': 'yellow',
};

const HORSE_BREEDS = [
  'ахалтекинская', 'киргизская', 'карабаирская', 'арабская', 
  'орловская', 'першеронская', 'английская'
];

// ============================================
// 1. УМНЫЙ ПАРСИНГ ЗАПРОСА
// ============================================

export function parseSearchQuery(query: string, category: CategoryType): ParsedQuery {
  const parsed: ParsedQuery = {
    text: query.toLowerCase().trim(),
  };

  if (!parsed.text) return parsed;

  // Извлекаем числа
  const numbers = parsed.text.match(/\d+/g);
  if (numbers) {
    numbers.forEach((num) => {
      const n = parseInt(num);
      
      // Определяем год (1980-2025)
      if (n >= 1980 && n <= 2025 && category === 'car') {
        parsed.year = n;
      }
      // Определяем возраст (1-25) для лошадей
      else if (n >= 1 && n <= 25 && category === 'horse') {
        parsed.age = n;
      }
      // Определяем цену (больше 100,000)
      else if (n >= 100000) {
        parsed.maxPrice = n;
      }
    });
  }

  // Ищем марку для автомобилей
  if (category === 'car') {
    AUTO_BRANDS.forEach((brand) => {
      if (parsed.text.includes(brand)) {
        parsed.brand = brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    });
  }

  // Ищем породу для лошадей
  if (category === 'horse') {
    HORSE_BREEDS.forEach((breed) => {
      if (parsed.text.includes(breed)) {
        parsed.breed = breed.charAt(0).toUpperCase() + breed.slice(1);
      }
    });
  }

  // Ищем цвет
  Object.entries(COLORS).forEach(([ru, en]) => {
    if (parsed.text.includes(ru)) {
      parsed.color = en;
    }
  });

  // Ищем город
  const cities = ['бишкек', 'ош', 'джалал-абад', 'каракол', 'нарын'];
  cities.forEach((city) => {
    if (parsed.text.includes(city)) {
      parsed.location = city.charAt(0).toUpperCase() + city.slice(1);
    }
  });

  // Обработка фраз
  if (parsed.text.includes('до миллиона') || parsed.text.includes('до 1млн')) {
    parsed.maxPrice = 1000000;
  }
  if (parsed.text.includes('до 500')) {
    parsed.maxPrice = 500000;
  }

  return parsed;
}

// ============================================
// 2. УНИВЕРСАЛЬНЫЙ ПОИСК
// ============================================

export async function searchListings(params: SearchParams): Promise<SearchResult> {
  const {
    category,
    query = '',
    filters = {},
    sortBy = 'date',
    limit = 20,
    offset = 0,
  } = params;

  try {
    // Проверяем кэш
    const cacheKey = generateCacheKey(params);
    const cached = await getCachedResults(cacheKey);
    if (cached) {
      console.log('📦 Using cached results');
      return cached;
    }

    // Парсим запрос
    const parsedQuery = parseSearchQuery(query, category);
    
    // Объединяем распарсенный запрос с фильтрами
    const mergedFilters = {
      ...filters,
      ...parsedQuery,
    };

    // Строим запрос в зависимости от категории
    let result;
    switch (category) {
      case 'car':
        result = await searchAuto(query, mergedFilters, sortBy, limit, offset);
        break;
      case 'horse':
        result = await searchHorse(query, mergedFilters, sortBy, limit, offset);
        break;
      case 'real_estate':
        result = await searchRealEstate(query, mergedFilters, sortBy, limit, offset);
        break;
      default:
        throw new Error(`Unknown category: ${category}`);
    }

    // Кэшируем результат
    await cacheResults(cacheKey, result);

    return result;
  } catch (error: any) {
    // Проверка на сетевые ошибки
    const isNetworkError = 
      error?.message?.includes('Network request failed') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('network') ||
      error?.code === 'PGRST301' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ETIMEDOUT';
    
    if (isNetworkError) {
      console.warn('Search error (network):', error?.message || 'Network request failed');
      // Для сетевых ошибок возвращаем пустой результат
      return {
        data: [],
        total: 0,
        hasMore: false
      };
    }
    
    console.error('Search error:', error);
    
    // Если ошибка связана с правами доступа (42501), возвращаем моковые данные
    if (error?.code === '42501' || error?.message?.includes('insufficient_privilege')) {
      console.log('🔒 Access denied, using mock data for development');
      return MOCK_SEARCH_RESULT;
    }
    
    // Для других ошибок тоже возвращаем моковые данные в dev режиме
    if (__DEV__) {
      console.log('🚧 Development mode: using mock data due to error');
      return MOCK_SEARCH_RESULT;
    }
    
    throw error;
  }
}

// ============================================
// 3. ПОИСК ПО КАТЕГОРИЯМ
// ============================================

async function searchAuto(
  query: string,
  filters: any,
  sortBy: string,
  limit: number,
  offset: number
): Promise<SearchResult> {
  let queryBuilder = supabase
    .from('listings')
    .select('*, seller:users!seller_id(id, name, avatar_url, is_verified)', { count: 'exact' })
    .eq('category', 'car');

  // Текстовый поиск
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  // Фильтры
  if (filters.brand) queryBuilder = queryBuilder.eq('brand', filters.brand);
  if (filters.model) queryBuilder = queryBuilder.eq('model', filters.model);
  if (filters.city && filters.city !== 'Весь Кыргызстан') queryBuilder = queryBuilder.eq('city', filters.city);
  if (filters.transmission) queryBuilder = queryBuilder.eq('transmission', filters.transmission);
  if (filters.fuel_type) queryBuilder = queryBuilder.eq('fuel_type', filters.fuel_type);
  if (filters.color) queryBuilder = queryBuilder.eq('color', filters.color);

  // Диапазоны
  if (filters.minPrice) queryBuilder = queryBuilder.gte('price', filters.minPrice);
  if (filters.maxPrice) queryBuilder = queryBuilder.lte('price', filters.maxPrice);
  if (filters.minYear) queryBuilder = queryBuilder.gte('year', filters.minYear);
  if (filters.maxYear) queryBuilder = queryBuilder.lte('year', filters.maxYear);
  if (filters.maxMileage) queryBuilder = queryBuilder.lte('mileage', filters.maxMileage);
  if (filters.minAiScore) queryBuilder = queryBuilder.gte('ai_score', filters.minAiScore);

  // Toggles
  if (filters.verified_only) queryBuilder = queryBuilder.eq('is_verified', true);
  if (filters.with_warranty) queryBuilder = queryBuilder.eq('has_warranty', true);
  if (filters.with_ai_analysis) queryBuilder = queryBuilder.not('ai_analysis', 'is', null);

  // Сортировка
  queryBuilder = applySorting(queryBuilder, sortBy);

  const { data, error, count } = await queryBuilder;

  if (error) {
    // Проверка на сетевые ошибки
    const isNetworkError = 
      error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('network') ||
      error.code === 'PGRST301' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT';
    
    if (isNetworkError) {
      console.warn('Search error (network):', error.message || 'Network request failed');
      return {
        data: [],
        total: 0,
        hasMore: false
      };
    }
    
    console.error('Search error:', error);
    // Если ошибка RLS (permission denied), используем mock данные
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      console.log('🚧 Using universal fallback data due to RLS permission error');
      return {
        data: FALLBACK_LISTINGS,
        total: FALLBACK_LISTINGS.length,
        hasMore: false
      };
    }
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

async function searchHorse(
  query: string,
  filters: any,
  sortBy: string,
  limit: number,
  offset: number
): Promise<SearchResult> {
  let queryBuilder = supabase
    .from('listings')
    .select('*, seller:users!seller_id(id, name, avatar_url, is_verified)', { count: 'exact' })
    .eq('category', 'horse');

  // Текстовый поиск
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,breed.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  // Фильтры
  if (filters.breed) queryBuilder = queryBuilder.eq('breed', filters.breed);
  if (filters.gender) queryBuilder = queryBuilder.eq('gender', filters.gender);
  if (filters.color) queryBuilder = queryBuilder.eq('color', filters.color);
  if (filters.city && filters.city !== 'Весь Кыргызстан') queryBuilder = queryBuilder.eq('city', filters.city);

  // Диапазоны
  if (filters.minPrice) queryBuilder = queryBuilder.gte('price', filters.minPrice);
  if (filters.maxPrice) queryBuilder = queryBuilder.lte('price', filters.maxPrice);
  if (filters.minAge) queryBuilder = queryBuilder.gte('age', filters.minAge);
  if (filters.maxAge) queryBuilder = queryBuilder.lte('age', filters.maxAge);
  if (filters.minHeight) queryBuilder = queryBuilder.gte('height', filters.minHeight);
  if (filters.maxHeight) queryBuilder = queryBuilder.lte('height', filters.maxHeight);

  // Toggles
  if (filters.verified_only) queryBuilder = queryBuilder.eq('is_verified', true);
  if (filters.has_documents) queryBuilder = queryBuilder.eq('has_documents', true);
  if (filters.has_vet_passport) queryBuilder = queryBuilder.eq('has_vet_passport', true);
  if (filters.competition_ready) queryBuilder = queryBuilder.eq('competition_ready', true);

  // Сортировка
  queryBuilder = applySorting(queryBuilder, sortBy);

  const { data, error, count } = await queryBuilder;

  if (error) {
    // Проверка на сетевые ошибки
    const isNetworkError = 
      error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('network') ||
      error.code === 'PGRST301' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT';
    
    if (isNetworkError) {
      console.warn('Search error (network):', error.message || 'Network request failed');
      return {
        data: [],
        total: 0,
        hasMore: false
      };
    }
    
    console.error('Search error:', error);
    // Если ошибка RLS (permission denied), используем mock данные
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      console.log('🚧 Using universal fallback data due to RLS permission error');
      return {
        data: FALLBACK_LISTINGS,
        total: FALLBACK_LISTINGS.length,
        hasMore: false
      };
    }
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

async function searchRealEstate(
  query: string,
  filters: any,
  sortBy: string,
  limit: number,
  offset: number
): Promise<SearchResult> {
  let queryBuilder = supabase
    .from('listings')
    .select('*, seller:users!seller_id(id, name, avatar_url, is_verified)', { count: 'exact' })
    .eq('category', 'real_estate');

  // Текстовый поиск
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,address.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  // Фильтры
  if (filters.property_type) queryBuilder = queryBuilder.eq('property_type', filters.property_type);
  if (filters.rooms) queryBuilder = queryBuilder.eq('rooms', filters.rooms);
  if (filters.city && filters.city !== 'Весь Кыргызстан') queryBuilder = queryBuilder.eq('city', filters.city);
  if (filters.building_type) queryBuilder = queryBuilder.eq('building_type', filters.building_type);

  // Диапазоны
  if (filters.minPrice) queryBuilder = queryBuilder.gte('price', filters.minPrice);
  if (filters.maxPrice) queryBuilder = queryBuilder.lte('price', filters.maxPrice);
  if (filters.minArea) queryBuilder = queryBuilder.gte('area', filters.minArea);
  if (filters.maxArea) queryBuilder = queryBuilder.lte('area', filters.maxArea);
  if (filters.floor) queryBuilder = queryBuilder.eq('floor', filters.floor);

  // Toggles
  if (filters.verified_only) queryBuilder = queryBuilder.eq('is_verified', true);
  if (filters.clean_documents) queryBuilder = queryBuilder.eq('clean_documents', true);
  if (filters.with_furniture) queryBuilder = queryBuilder.eq('with_furniture', true);
  if (filters.with_parking) queryBuilder = queryBuilder.eq('with_parking', true);

  // Сортировка
  queryBuilder = applySorting(queryBuilder, sortBy);

  const { data, error, count } = await queryBuilder;

  if (error) {
    // Проверка на сетевые ошибки
    const isNetworkError = 
      error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('network') ||
      error.code === 'PGRST301' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT';
    
    if (isNetworkError) {
      console.warn('Search error (network):', error.message || 'Network request failed');
      return {
        data: [],
        total: 0,
        hasMore: false
      };
    }
    
    console.error('Search error:', error);
    // Если ошибка RLS (permission denied), используем mock данные
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      console.log('🚧 Using universal fallback data due to RLS permission error');
      return {
        data: FALLBACK_LISTINGS,
        total: FALLBACK_LISTINGS.length,
        hasMore: false
      };
    }
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

// ============================================
// 4. СОРТИРОВКА
// ============================================

function applySorting(queryBuilder: any, sortBy: string) {
  switch (sortBy) {
    case 'date':
      return queryBuilder.order('created_at', { ascending: false });
    case 'price_asc':
      return queryBuilder.order('price', { ascending: true });
    case 'price_desc':
      return queryBuilder.order('price', { ascending: false });
    case 'popularity':
      return queryBuilder.order('views', { ascending: false });
    case 'rating':
      return queryBuilder.order('seller_rating', { ascending: false });
    case 'ai_score':
      return queryBuilder.order('ai_score', { ascending: false });
    default:
      return queryBuilder.order('created_at', { ascending: false });
  }
}

// ============================================
// 5. КЭШИРОВАНИЕ
// ============================================

function generateCacheKey(params: SearchParams): string {
  return `search_${params.category}_${params.query}_${JSON.stringify(params.filters)}`;
}

async function getCachedResults(key: string): Promise<SearchResult | null> {
  try {
    const cached = await AsyncStorage.getItem(`${STORAGE_KEYS.SEARCH_CACHE}_${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp > CACHE_TTL) {
      // Кэш устарел
      await AsyncStorage.removeItem(`${STORAGE_KEYS.SEARCH_CACHE}_${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function cacheResults(key: string, data: SearchResult): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.SEARCH_CACHE}_${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// ============================================
// 6. ИСТОРИЯ ПОИСКА
// ============================================

export async function addToSearchHistory(query: string, category: CategoryType): Promise<void> {
  try {
    const history = await getSearchHistory();
    const newItem = {
      id: Date.now().toString(),
      query,
      category,
      timestamp: Date.now(),
    };

    // Удаляем дубликаты
    const filtered = history.filter((item) => item.query !== query || item.category !== category);
    
    // Добавляем в начало
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);

    await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error('Add to history error:', error);
  }
}

export async function getSearchHistory(): Promise<any[]> {
  try {
    const history = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Get history error:', error);
    return [];
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (error) {
    console.error('Clear history error:', error);
  }
}

// ============================================
// 7. СОХРАНЕННЫЕ ПОИСКИ
// ============================================

export async function saveSearch(name: string, category: CategoryType, filters: any): Promise<void> {
  try {
    const saved = await getSavedSearches();
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      category,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSearch, ...saved].slice(0, MAX_SAVED_SEARCHES);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updated));
  } catch (error) {
    console.error('Save search error:', error);
  }
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Get saved searches error:', error);
    return [];
  }
}

export async function deleteSavedSearch(id: string): Promise<void> {
  try {
    const saved = await getSavedSearches();
    const updated = saved.filter((s) => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updated));
  } catch (error) {
    console.error('Delete saved search error:', error);
  }
}

// ============================================
// 8. ПОСЛЕДНИЕ ФИЛЬТРЫ
// ============================================

export async function saveLastFilters(category: CategoryType, filters: any): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.LAST_FILTERS}_${category}`,
      JSON.stringify(filters)
    );
  } catch (error) {
    console.error('Save last filters error:', error);
  }
}

export async function getLastFilters(category: CategoryType): Promise<any> {
  try {
    const filters = await AsyncStorage.getItem(`${STORAGE_KEYS.LAST_FILTERS}_${category}`);
    return filters ? JSON.parse(filters) : {};
  } catch (error) {
    console.error('Get last filters error:', error);
    return {};
  }
}

// ============================================
// 9. АВТОДОПОЛНЕНИЕ
// ============================================

export async function getAutocomplete(query: string, category: CategoryType): Promise<string[]> {
  if (!query || query.length < 2) return [];

  try {
    // Получаем популярные поисковые запросы из истории
    const history = await getSearchHistory();
    const filtered = history
      .filter((item) => item.category === category && item.query.toLowerCase().includes(query.toLowerCase()))
      .map((item) => item.query)
      .slice(0, 5);

    // Добавляем статические предложения
    const config = FILTER_CONFIG[category];
    const suggestions: string[] = [];

    if (category === 'car') {
      // Марки
      AUTO_BRANDS.forEach((brand) => {
        if (brand.includes(query.toLowerCase())) {
          suggestions.push(brand.charAt(0).toUpperCase() + brand.slice(1));
        }
      });
    } else if (category === 'horse') {
      // Породы
      HORSE_BREEDS.forEach((breed) => {
        if (breed.includes(query.toLowerCase())) {
          suggestions.push(breed.charAt(0).toUpperCase() + breed.slice(1));
        }
      });
    }

    // Объединяем и удаляем дубликаты
    return [...new Set([...filtered, ...suggestions])].slice(0, 10);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

// ============================================
// ЭКСПОРТ
// ============================================

export const searchService = {
  search: searchListings,
  searchWithFilters: searchListings, // Алиас для совместимости
  parseQuery: parseSearchQuery,
  addToHistory: addToSearchHistory,
  getHistory: getSearchHistory,
  clearHistory: clearSearchHistory,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  saveLastFilters,
  getLastFilters,
  getAutocomplete,
};

