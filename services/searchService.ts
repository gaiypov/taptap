// services/searchService.ts — УНИВЕРСАЛЬНЫЙ ПОИСК 360AutoMVP 2025
// УЛУЧШЕННАЯ ВЕРСИЯ с историей, fuzzy search, релевантностью и автокомплитом

import { CategoryType } from '@/config/filterConfig';
import { MOCK_SEARCH_RESULT } from './mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { appLogger } from '@/utils/logger';

// ============ TYPES ============
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
  /** Relevance scores for each result (0-100) */
  scores?: number[];
}

export interface SearchHistoryItem {
  query: string;
  category: CategoryType;
  timestamp: number;
  resultsCount: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'history' | 'trending' | 'autocomplete' | 'brand' | 'city';
  category?: CategoryType;
  score?: number;
}

// ============ CONSTANTS ============
const CACHE_TTL = 3 * 60 * 1000; // 3 минуты
const HISTORY_KEY = 'search_history_v2';
const TRENDING_KEY = 'trending_searches';
const MAX_HISTORY = 20;
const MAX_SUGGESTIONS = 8;

// ============ CACHE ============
const cache = new Map<string, { data: SearchResult; timestamp: number }>();

const getCacheKey = (params: SearchParams) =>
  `search_${params.category}_${params.query || ''}_${JSON.stringify(params.filters || {})}_${params.sortBy || 'relevance'}`;

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
  // LRU cleanup
  if (cache.size > 100) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
};

// ============ SEARCH HISTORY ============
let historyCache: SearchHistoryItem[] | null = null;

export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  if (historyCache) return historyCache;

  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    historyCache = stored ? JSON.parse(stored) : [];
    return historyCache || [];
  } catch (e) {
    appLogger.warn('[Search] History read error', { error: e });
    return [];
  }
}

export async function addToSearchHistory(
  query: string,
  category: CategoryType,
  resultsCount: number
): Promise<void> {
  if (!query || query.trim().length < 2) return;

  try {
    const history = await getSearchHistory();

    // Remove duplicates
    const filtered = history.filter(
      h => !(h.query.toLowerCase() === query.toLowerCase() && h.category === category)
    );

    // Add new item at the beginning
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      category,
      timestamp: Date.now(),
      resultsCount,
    };

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    historyCache = updated;

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    appLogger.warn('[Search] History save error', { error: e });
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    historyCache = [];
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    appLogger.warn('[Search] History clear error', { error: e });
  }
}

export async function removeFromHistory(query: string, category: CategoryType): Promise<void> {
  try {
    const history = await getSearchHistory();
    const filtered = history.filter(
      h => !(h.query.toLowerCase() === query.toLowerCase() && h.category === category)
    );
    historyCache = filtered;
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (e) {
    appLogger.warn('[Search] History remove error', { error: e });
  }
}

// ============ FUZZY SEARCH & TYPO TOLERANCE ============
const CYRILLIC_SIMILAR: Record<string, string[]> = {
  'а': ['a', 'о'],
  'о': ['a', 'о', '0'],
  'е': ['е', 'ё', 'э'],
  'и': ['и', 'й', 'ы'],
  'с': ['с', 'c'],
  'к': ['к', 'k'],
  'м': ['м', 'm'],
  'н': ['н', 'n'],
  'р': ['р', 'p'],
  'х': ['х', 'x'],
  'у': ['у', 'y'],
};

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Normalize text for comparison (lowercase, remove extra spaces)
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Check if strings are similar (fuzzy match)
function isFuzzyMatch(query: string, target: string, threshold = 0.7): boolean {
  const q = normalizeText(query);
  const t = normalizeText(target);

  // Exact match
  if (t.includes(q) || q.includes(t)) return true;

  // Levenshtein for short strings
  if (q.length <= 6) {
    const distance = levenshteinDistance(q, t.slice(0, q.length + 2));
    const maxLen = Math.max(q.length, t.length);
    const similarity = 1 - distance / maxLen;
    return similarity >= threshold;
  }

  // Word-level matching for longer queries
  const qWords = q.split(' ');
  const tWords = t.split(' ');
  let matchedWords = 0;

  for (const qWord of qWords) {
    for (const tWord of tWords) {
      if (tWord.includes(qWord) || qWord.includes(tWord)) {
        matchedWords++;
        break;
      }
      // Fuzzy word match
      if (qWord.length >= 3) {
        const distance = levenshteinDistance(qWord, tWord);
        if (distance <= Math.floor(qWord.length / 3)) {
          matchedWords++;
          break;
        }
      }
    }
  }

  return matchedWords / qWords.length >= threshold;
}

// ============ RELEVANCE SCORING ============
interface RelevanceFactors {
  exactMatch: number;
  partialMatch: number;
  titleMatch: number;
  descriptionMatch: number;
  categoryBoost: number;
  freshnessBoost: number;
  popularityBoost: number;
  aiScoreBoost: number;
  verifiedBoost: number;
}

const RELEVANCE_WEIGHTS: RelevanceFactors = {
  exactMatch: 40,
  partialMatch: 20,
  titleMatch: 25,
  descriptionMatch: 10,
  categoryBoost: 5,
  freshnessBoost: 10,
  popularityBoost: 15,
  aiScoreBoost: 10,
  verifiedBoost: 5,
};

const CATEGORY_PRICE_GUIDE: Record<CategoryType, { sweetSpot: number; min: number; max: number }> = {
  car: { min: 4000, sweetSpot: 15000, max: 60000 },
  horse: { min: 500, sweetSpot: 5000, max: 20000 },
  real_estate: { min: 15000, sweetSpot: 65000, max: 250000 },
};

interface BuyerSignalResult {
  score: number;
  highlights: string[];
}

function analyzeBuyerSignals(
  item: any,
  category: CategoryType,
  filters: Record<string, any>
): BuyerSignalResult {
  const highlights: string[] = [];
  let score = 0;
  const guide = CATEGORY_PRICE_GUIDE[category];
  const price = item.price || 0;

  if (guide && price) {
    const clampedPrice = Math.min(Math.max(price, guide.min), guide.max);
    const normalized =
      1 - Math.min(Math.abs(clampedPrice - guide.sweetSpot) / (guide.max - guide.min), 1);
    if (normalized >= 0.6) {
      highlights.push('💰 Выгодная цена');
    }
    score += normalized * 20;
  }

  const createdAt = new Date(item.created_at).getTime();
  const daysSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  if (Number.isFinite(daysSinceCreation) && daysSinceCreation <= 2) {
    highlights.push('⚡ Недавно добавлено');
    score += 8;
  }

  if (filters?.city && filters.city !== 'Весь Кыргызстан' && item.city === filters.city) {
    highlights.push(`📍 ${item.city}`);
    score += 8;
  }

  const verifiedSeller = item.seller?.is_verified;
  if (verifiedSeller) {
    highlights.push('🛡 Проверенный продавец');
    score += 10;
  }

  const hasDocuments =
    item.has_documents ||
    item.details?.has_documents ||
    item.details?.hasDocuments ||
    item.details?.documents_ready;
  if (hasDocuments) {
    highlights.push('📄 Документы проверены');
    score += 8;
  }

  if (item.ai_score && item.ai_score >= 0.85) {
    highlights.push(`🤖 AI ${Math.round(item.ai_score * 100)}%`);
    score += 6;
  }

  const engagement = (item.views_count || 0) + (item.likes_count || 0) * 5;
  if (engagement > 300) {
    highlights.push('🔥 Популярно у покупателей');
    score += 6;
  }

  const uniqueHighlights = Array.from(new Set(highlights)).slice(0, 3);

  return {
    score: Math.min(100, Math.round(score)),
    highlights: uniqueHighlights,
  };
}

function calculateRelevanceScore(
  item: any,
  query: string,
  category: CategoryType
): number {
  if (!query) return 50; // Default score when no query

  let score = 0;
  const q = normalizeText(query);
  const title = normalizeText(item.title || '');
  const description = normalizeText(item.description || '');
  const brand = normalizeText(item.brand || item.details?.brand || '');
  const model = normalizeText(item.model || item.details?.model || '');

  // Exact match in title
  if (title.includes(q)) {
    score += RELEVANCE_WEIGHTS.exactMatch;
  } else if (isFuzzyMatch(q, title)) {
    score += RELEVANCE_WEIGHTS.partialMatch;
  }

  // Brand/model match (for cars)
  if (category === 'car') {
    if (brand.includes(q) || q.includes(brand)) {
      score += RELEVANCE_WEIGHTS.titleMatch;
    }
    if (model.includes(q) || q.includes(model)) {
      score += RELEVANCE_WEIGHTS.titleMatch * 0.8;
    }
  }

  // Description match
  if (description.includes(q)) {
    score += RELEVANCE_WEIGHTS.descriptionMatch;
  }

  // Freshness boost (items from last 7 days)
  const createdAt = new Date(item.created_at).getTime();
  const daysSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 1) {
    score += RELEVANCE_WEIGHTS.freshnessBoost;
  } else if (daysSinceCreation < 7) {
    score += RELEVANCE_WEIGHTS.freshnessBoost * (1 - daysSinceCreation / 7);
  }

  // Popularity boost
  const viewsCount = item.views_count || 0;
  const likesCount = item.likes_count || 0;
  const popularityScore = Math.min(viewsCount / 100 + likesCount / 10, 15);
  score += popularityScore;

  // AI score boost
  if (item.ai_score && item.ai_score > 0.8) {
    score += RELEVANCE_WEIGHTS.aiScoreBoost * item.ai_score;
  }

  // Verified seller boost
  if (item.seller?.is_verified) {
    score += RELEVANCE_WEIGHTS.verifiedBoost;
  }

  return Math.min(Math.round(score), 100);
}

// ============ EXPANDED QUERY PARSING ============
// Extended brand lists by category
const CAR_BRANDS: Record<string, string[]> = {
  // Japanese
  'toyota': ['тойота', 'тоёта', 'toyota'],
  'honda': ['хонда', 'honda'],
  'nissan': ['ниссан', 'nissan'],
  'mazda': ['мазда', 'mazda'],
  'mitsubishi': ['митсубиси', 'мицубиси', 'mitsubishi'],
  'subaru': ['субару', 'subaru'],
  'suzuki': ['сузуки', 'suzuki'],
  'lexus': ['лексус', 'lexus'],
  'infiniti': ['инфинити', 'infiniti'],
  'acura': ['акура', 'acura'],
  // German
  'mercedes': ['мерседес', 'мерс', 'mercedes', 'benz'],
  'bmw': ['бмв', 'бэха', 'bmw'],
  'audi': ['ауди', 'audi'],
  'volkswagen': ['фольксваген', 'vw', 'volkswagen'],
  'porsche': ['порше', 'porsche'],
  // Korean
  'hyundai': ['хендай', 'хундай', 'хюндай', 'hyundai'],
  'kia': ['киа', 'kia'],
  'genesis': ['генезис', 'genesis'],
  // American
  'ford': ['форд', 'ford'],
  'chevrolet': ['шевроле', 'шеви', 'chevrolet', 'chevy'],
  'jeep': ['джип', 'jeep'],
  'dodge': ['додж', 'dodge'],
  'cadillac': ['кадиллак', 'cadillac'],
  'tesla': ['тесла', 'tesla'],
  // Chinese
  'geely': ['джили', 'geely'],
  'changan': ['чанган', 'changan'],
  'haval': ['хавал', 'haval'],
  'chery': ['чери', 'chery'],
  'byd': ['бид', 'byd'],
  // Other
  'volvo': ['вольво', 'volvo'],
  'land rover': ['ленд ровер', 'land rover', 'range rover'],
  'renault': ['рено', 'renault'],
  'peugeot': ['пежо', 'peugeot'],
  'skoda': ['шкода', 'skoda'],
};

const HORSE_BREEDS: Record<string, string[]> = {
  'ахалтекинская': ['ахалтекинская', 'ахалтекинец', 'akhal-teke'],
  'арабская': ['арабская', 'араб', 'арабский', 'arabian'],
  'киргизская': ['киргизская', 'кыргызская', 'kyrgyz'],
  'орловская': ['орловская', 'орловский', 'orlov'],
  'английская': ['английская', 'английский', 'thoroughbred'],
  'донская': ['донская', 'донской', 'don'],
  'буденновская': ['буденновская', 'budyonny'],
  'карачаевская': ['карачаевская', 'karachai'],
  'кабардинская': ['кабардинская', 'kabardian'],
  'новокиргизская': ['новокиргизская', 'new kyrgyz'],
};

const PROPERTY_TYPES: Record<string, string[]> = {
  'квартира': ['квартира', 'квартиру', 'кв', 'apartment', 'flat'],
  'дом': ['дом', 'коттедж', 'house', 'cottage'],
  'участок': ['участок', 'земля', 'сотка', 'land', 'plot'],
  'коммерческая': ['офис', 'магазин', 'склад', 'commercial', 'office'],
};

const COLORS: Record<string, string[]> = {
  'black': ['черный', 'чёрный', 'black', 'вороной'],
  'white': ['белый', 'white', 'светлый'],
  'silver': ['серебристый', 'серебряный', 'silver'],
  'gray': ['серый', 'gray', 'grey'],
  'red': ['красный', 'red', 'бордовый', 'рыжий', 'гнедой'],
  'blue': ['синий', 'голубой', 'blue'],
  'green': ['зеленый', 'зелёный', 'green'],
  'brown': ['коричневый', 'brown', 'бурый', 'каурый'],
  'beige': ['бежевый', 'beige', 'песочный'],
  'gold': ['золотой', 'золотистый', 'gold', 'буланый'],
};

const KYRGYZSTAN_CITIES: Record<string, string[]> = {
  'Бишкек': ['бишкек', 'bishkek', 'фрунзе'],
  'Ош': ['ош', 'osh'],
  'Джалал-Абад': ['джалал-абад', 'джалалабад', 'jalal-abad'],
  'Каракол': ['каракол', 'karakol', 'пржевальск'],
  'Талас': ['талас', 'talas'],
  'Нарын': ['нарын', 'naryn'],
  'Баткен': ['баткен', 'batken'],
  'Токмок': ['токмок', 'tokmok'],
  'Кара-Балта': ['кара-балта', 'караблата', 'kara-balta'],
  'Чолпон-Ата': ['чолпон-ата', 'cholpon-ata', 'иссык-куль'],
};

const TRANSMISSIONS: Record<string, string[]> = {
  'automatic': ['автомат', 'акпп', 'automatic', 'auto'],
  'manual': ['механика', 'мкпп', 'manual', 'ручная'],
  'cvt': ['вариатор', 'cvt'],
  'robot': ['робот', 'роботизированная', 'robot', 'dct'],
};

const FUEL_TYPES: Record<string, string[]> = {
  'petrol': ['бензин', 'petrol', 'gasoline'],
  'diesel': ['дизель', 'diesel'],
  'gas': ['газ', 'lpg', 'метан'],
  'hybrid': ['гибрид', 'hybrid'],
  'electric': ['электро', 'электрический', 'electric', 'ev'],
};

// Smart query parsing
export const parseQuery = (query: string, category: CategoryType): Record<string, any> => {
  if (!query) return {};

  const q = normalizeText(query);
  const parsed: Record<string, any> = {};
  const words = q.split(/\s+/);

  // ===== PRICE PARSING =====
  const pricePatterns = [
    /(?:от|from)\s*(\d+(?:\s*\d+)*)/i,
    /(?:до|to|по)\s*(\d+(?:\s*\d+)*)/i,
    /(\d+(?:\s*\d+)*)\s*(?:сом|som|сомов|тыс|млн)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = q.match(pattern);
    if (match) {
      let price = parseInt(match[1].replace(/\s/g, ''));
      // Handle "тыс" (thousands) and "млн" (millions)
      if (q.includes('тыс') || q.includes('тысяч')) price *= 1000;
      if (q.includes('млн') || q.includes('миллион')) price *= 1000000;

      if (price > 10000) {
        if (q.includes('от') || q.includes('from')) parsed.minPrice = price;
        else if (q.includes('до') || q.includes('по') || q.includes('to')) parsed.maxPrice = price;
        else {
          // Range guess: ±20%
          parsed.minPrice = Math.round(price * 0.8);
          parsed.maxPrice = Math.round(price * 1.2);
        }
      }
    }
  }

  // ===== YEAR PARSING =====
  const yearMatch = q.match(/\b(19[89]\d|20[0-2]\d)\b/);
  if (yearMatch && category === 'car') {
    const year = parseInt(yearMatch[0]);
    const currentYear = new Date().getFullYear();
    if (year >= 1980 && year <= currentYear + 1) {
      parsed.year = year;
    }
  }

  // ===== BRAND PARSING (Cars) =====
  if (category === 'car') {
    for (const [brandKey, aliases] of Object.entries(CAR_BRANDS)) {
      for (const alias of aliases) {
        if (q.includes(alias)) {
          parsed.brand = brandKey.charAt(0).toUpperCase() + brandKey.slice(1);
          // Try to find model after brand
          const brandIndex = q.indexOf(alias);
          const afterBrand = q.slice(brandIndex + alias.length).trim();
          const modelMatch = afterBrand.match(/^([a-zA-Zа-яА-Я0-9]+)/);
          if (modelMatch && modelMatch[1].length > 1) {
            parsed.model = modelMatch[1];
          }
          break;
        }
      }
      if (parsed.brand) break;
    }

    // Transmission
    for (const [transKey, aliases] of Object.entries(TRANSMISSIONS)) {
      for (const alias of aliases) {
        if (q.includes(alias)) {
          parsed.transmission = transKey;
          break;
        }
      }
      if (parsed.transmission) break;
    }

    // Fuel type
    for (const [fuelKey, aliases] of Object.entries(FUEL_TYPES)) {
      for (const alias of aliases) {
        if (q.includes(alias)) {
          parsed.fuel_type = fuelKey;
          break;
        }
      }
      if (parsed.fuel_type) break;
    }
  }

  // ===== BREED PARSING (Horses) =====
  if (category === 'horse') {
    for (const [breedKey, aliases] of Object.entries(HORSE_BREEDS)) {
      for (const alias of aliases) {
        if (q.includes(alias)) {
          parsed.breed = breedKey.charAt(0).toUpperCase() + breedKey.slice(1);
          break;
        }
      }
      if (parsed.breed) break;
    }

    // Age parsing for horses
    const ageMatch = q.match(/(\d+)\s*(?:лет|год|года|л\.)/);
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      if (age > 0 && age < 40) {
        parsed.age = age;
      }
    }

    // Gender
    if (q.includes('жереб') || q.includes('мерин')) {
      parsed.gender = 'male';
    } else if (q.includes('кобыл')) {
      parsed.gender = 'female';
    }
  }

  // ===== PROPERTY TYPE PARSING (Real Estate) =====
  if (category === 'real_estate') {
    for (const [typeKey, aliases] of Object.entries(PROPERTY_TYPES)) {
      for (const alias of aliases) {
        if (q.includes(alias)) {
          parsed.property_type = typeKey;
          break;
        }
      }
      if (parsed.property_type) break;
    }

    // Rooms
    const roomsMatch = q.match(/(\d+)\s*(?:комн|комнат|к\.)/);
    if (roomsMatch) {
      parsed.rooms = roomsMatch[1];
    }

    // Area
    const areaMatch = q.match(/(\d+)\s*(?:м2|м²|кв\.м|квадрат)/);
    if (areaMatch) {
      const area = parseInt(areaMatch[1]);
      if (area > 10 && area < 10000) {
        parsed.area = area;
      }
    }
  }

  // ===== COLOR PARSING =====
  for (const [colorKey, aliases] of Object.entries(COLORS)) {
    for (const alias of aliases) {
      if (q.includes(alias)) {
        parsed.color = colorKey;
        break;
      }
    }
    if (parsed.color) break;
  }

  // ===== CITY PARSING =====
  for (const [cityKey, aliases] of Object.entries(KYRGYZSTAN_CITIES)) {
    for (const alias of aliases) {
      if (q.includes(alias)) {
        parsed.city = cityKey;
        break;
      }
    }
    if (parsed.city) break;
  }

  return parsed;
};

// ============ AUTOCOMPLETE SUGGESTIONS ============
export async function getSuggestions(
  query: string,
  category: CategoryType
): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) return [];

  const suggestions: SearchSuggestion[] = [];
  const q = normalizeText(query);

  // 1. From search history
  const history = await getSearchHistory();
  const historyMatches = history
    .filter(h => h.category === category && normalizeText(h.query).includes(q))
    .slice(0, 3)
    .map(h => ({
      text: h.query,
      type: 'history' as const,
      category: h.category,
      score: 90,
    }));
  suggestions.push(...historyMatches);

  // 2. Brand suggestions (for cars)
  if (category === 'car') {
    for (const [brand, aliases] of Object.entries(CAR_BRANDS)) {
      const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
      if (aliases.some(a => a.includes(q) || q.includes(a.slice(0, 3)))) {
        if (!suggestions.find(s => s.text.toLowerCase() === brandName.toLowerCase())) {
          suggestions.push({
            text: brandName,
            type: 'brand',
            category,
            score: 85,
          });
        }
      }
    }
  }

  // 3. Breed suggestions (for horses)
  if (category === 'horse') {
    for (const [breed, aliases] of Object.entries(HORSE_BREEDS)) {
      const breedName = breed.charAt(0).toUpperCase() + breed.slice(1);
      if (aliases.some(a => a.includes(q))) {
        if (!suggestions.find(s => s.text.toLowerCase() === breedName.toLowerCase())) {
          suggestions.push({
            text: breedName,
            type: 'autocomplete',
            category,
            score: 85,
          });
        }
      }
    }
  }

  // 4. City suggestions
  for (const [city, aliases] of Object.entries(KYRGYZSTAN_CITIES)) {
    if (aliases.some(a => a.includes(q))) {
      if (!suggestions.find(s => s.text === city)) {
        suggestions.push({
          text: city,
          type: 'city',
          score: 80,
        });
      }
    }
  }

  // Sort by score and limit
  return suggestions
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, MAX_SUGGESTIONS);
}

// ============ TRENDING SEARCHES ============
const DEFAULT_TRENDING: Record<CategoryType, string[]> = {
  car: ['Toyota Camry', 'BMW X5', 'Mercedes', 'Hyundai', 'Автомат'],
  horse: ['Ахалтекинская', 'Арабская', 'Жеребец', 'Молодая лошадь'],
  real_estate: ['Квартира Бишкек', '3 комнаты', 'Новостройка', 'С ремонтом'],
};

export function getTrendingSearches(category: CategoryType): string[] {
  return DEFAULT_TRENDING[category] || [];
}

// ============ MAIN SEARCH FUNCTION ============
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

    // Text search with fuzzy capabilities
    if (query && query.length >= 2) {
      // Use multiple OR conditions for better matching
      const searchTerms = query.split(/\s+/).filter(t => t.length >= 2);
      if (searchTerms.length > 0) {
        const orConditions = searchTerms
          .map(term => `title.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%`)
          .join(',');
        qb = qb.or(orConditions);
      }
    }

    // Apply filters
    Object.entries(mergedFilters).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === null) return;

      switch (key) {
        case 'minPrice':
          qb = qb.gte('price', value);
          break;
        case 'maxPrice':
          qb = qb.lte('price', value);
          break;
        case 'minYear':
          qb = qb.gte('year', value);
          break;
        case 'maxYear':
          qb = qb.lte('year', value);
          break;
        case 'city':
          if (value !== 'Весь Кыргызстан') {
            qb = qb.eq('city', value);
          }
          break;
        case 'brand':
        case 'model':
        case 'transmission':
        case 'fuel_type':
        case 'color':
        case 'breed':
        case 'gender':
        case 'property_type':
        case 'rooms':
          qb = qb.eq(key, value);
          break;
        case 'verified_only':
          if (value === true) {
            qb = qb.eq('seller.is_verified', true);
          }
          break;
        default:
          // Dynamic filter
          if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
            qb = qb.eq(key, value);
          }
      }
    });

    // Sorting
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
      case 'date':
        qb = qb.order('created_at', { ascending: false });
        break;
      case 'relevance':
      default:
        // For relevance, we'll sort client-side after scoring
        qb = qb.order('created_at', { ascending: false });
    }

    const { data, error, count } = await qb.range(offset, offset + limit - 1);

    if (error) throw error;

    let results = data || [];
    let scores: number[] = [];

    // Calculate relevance scores and re-sort if needed
    if (sortBy === 'relevance' && query) {
      const scoredResults = results.map(item => ({
        item,
        score: calculateRelevanceScore(item, query, category),
      }));

      scoredResults.sort((a, b) => b.score - a.score);
      results = scoredResults.map(sr => sr.item);
      scores = scoredResults.map(sr => sr.score);
    }

    results = results.map(item => {
      const buyerSignals = analyzeBuyerSignals(item, category, mergedFilters);
      return {
        ...item,
        buyer_highlights: buyerSignals.highlights,
        buyer_score: buyerSignals.score,
      };
    });

    const result: SearchResult = {
      data: results,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
      scores: scores.length > 0 ? scores : undefined,
    };

    setCached(cacheKey, result);

    // Save to history (async, don't wait)
    if (query && query.length >= 2) {
      addToSearchHistory(query, category, result.total).catch(() => {});
    }

    return result;
  } catch (error: any) {
    appLogger.warn('[Search] Error, using fallback', error);

    if (__DEV__) {
      return MOCK_SEARCH_RESULT;
    }

    return { data: [], total: 0, hasMore: false };
  }
}

// ============ EXPORT ============
export const searchService = {
  search,
  parseQuery,
  getSuggestions,
  getTrendingSearches,
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
  removeFromHistory,
  isFuzzyMatch,
  calculateRelevanceScore,
};
