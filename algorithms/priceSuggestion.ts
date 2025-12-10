// algorithms/priceSuggestion.ts
// AI алгоритм оценки цены на основе похожих объявлений

import { supabase } from '@/services/supabase';

export interface PriceData {
  category: 'car' | 'horse' | 'real_estate';
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  area?: number; // для недвижимости
  breed?: string; // для лошадей
  age?: number;   // для лошадей
  city?: string;
}

export interface PriceRange {
  suggested: number;
  min: number;
  max: number;
  confidence: 'low' | 'medium' | 'high';
  basedOn: number; // количество похожих объявлений
  explanation?: string;
  marketTrend?: 'rising' | 'stable' | 'falling';
}

/**
 * Получить рекомендуемую цену на основе похожих объявлений
 */
export async function suggestPrice(data: PriceData): Promise<PriceRange> {
  console.log('[PriceSuggestion] 🔍 Analyzing market...', data);

  try {
    // 1. Поиск похожих объявлений
    const similarListings = await findSimilarListings(data);

    if (!similarListings || similarListings.length < 3) {
      console.log('[PriceSuggestion] ⚠️ Not enough data, using defaults');
      return getDefaultPriceRange(data.category);
    }

    // 2. Извлекаем цены
    const prices = similarListings.map(l => l.price).sort((a, b) => a - b);
    console.log('[PriceSuggestion] 📊 Found prices:', prices);

    // 3. Вычисляем статистику
    const median = calculateMedian(prices);
    const mean = calculateMean(prices);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const stdDev = calculateStdDev(prices, mean);

    console.log('[PriceSuggestion] 📈 Statistics:', {
      median,
      mean,
      min,
      max,
      stdDev,
      count: prices.length
    });

    // 4. Применяем корректировки
    let adjustedPrice = median;

    // 4.1. Корректировка по состоянию
    if (data.condition) {
      const conditionMultiplier = getConditionMultiplier(data.condition);
      adjustedPrice *= conditionMultiplier;
      console.log('[PriceSuggestion] ✨ Condition adjustment:', {
        condition: data.condition,
        multiplier: conditionMultiplier
      });
    }

    // 4.2. Корректировка по пробегу (для авто)
    if (data.category === 'car' && data.mileage !== undefined) {
      const avgMileage = calculateAverageMileage(similarListings);
      const mileageAdjustment = getMileageAdjustment(data.mileage, avgMileage);
      adjustedPrice *= mileageAdjustment;
      console.log('[PriceSuggestion] 🚗 Mileage adjustment:', {
        mileage: data.mileage,
        avg: avgMileage,
        multiplier: mileageAdjustment
      });
    }

    // 4.3. Корректировка по году (для авто)
    if (data.category === 'car' && data.year) {
      const ageYears = new Date().getFullYear() - data.year;
      const ageAdjustment = getAgeAdjustment(ageYears);
      adjustedPrice *= ageAdjustment;
      console.log('[PriceSuggestion] 📅 Age adjustment:', {
        year: data.year,
        age: ageYears,
        multiplier: ageAdjustment
      });
    }

    // 4.4. Корректировка по городу (Бишкек обычно дороже)
    if (data.city) {
      const cityAdjustment = getCityAdjustment(data.city);
      adjustedPrice *= cityAdjustment;
      console.log('[PriceSuggestion] 📍 City adjustment:', {
        city: data.city,
        multiplier: cityAdjustment
      });
    }

    // 5. Определяем диапазон
    const range = {
      suggested: Math.round(adjustedPrice),
      min: Math.round(adjustedPrice * 0.85), // -15%
      max: Math.round(adjustedPrice * 1.15), // +15%
      confidence: getConfidence(prices.length, stdDev),
      basedOn: prices.length,
      explanation: getExplanation(data, prices.length),
      marketTrend: detectMarketTrend(similarListings)
    };

    console.log('[PriceSuggestion] ✅ Final suggestion:', range);
    return range;
  } catch (error) {
    console.error('[PriceSuggestion] ❌ Error:', error);
    return getDefaultPriceRange(data.category);
  }
}

/**
 * Найти похожие объявления в базе данных
 */
async function findSimilarListings(data: PriceData): Promise<any[]> {
  let query = supabase
    .from('listings')
    .select('price, details, created_at')
    .eq('category', data.category)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Категория-специфичные фильтры
  if (data.category === 'car') {
    if (data.brand) {
      query = query.eq('details->>brand', data.brand);
    }
    if (data.model) {
      query = query.eq('details->>model', data.model);
    }
    if (data.year) {
      // Ищем ±2 года
      query = query
        .gte('details->>year', (data.year - 2).toString())
        .lte('details->>year', (data.year + 2).toString());
    }
  }

  if (data.category === 'horse') {
    if (data.breed) {
      query = query.eq('details->>breed', data.breed);
    }
    if (data.age !== undefined) {
      // Ищем ±2 года
      query = query
        .gte('details->>age', Math.max(0, data.age - 2).toString())
        .lte('details->>age', (data.age + 2).toString());
    }
  }

  if (data.category === 'real_estate') {
    if (data.area) {
      // Ищем ±20% площади
      const minArea = data.area * 0.8;
      const maxArea = data.area * 1.2;
      query = query
        .gte('details->>area', minArea.toString())
        .lte('details->>area', maxArea.toString());
    }
  }

  // Ограничиваем последними 50 объявлениями
  query = query.limit(50);

  const { data: listings, error } = await query;

  if (error) {
    console.error('[PriceSuggestion] Query error:', error);
    return [];
  }

  return listings || [];
}

/**
 * Получить дефолтный диапазон цен для категории
 */
function getDefaultPriceRange(category: string): PriceRange {
  const defaults: Record<string, PriceRange> = {
    car: {
      suggested: 500000,
      min: 300000,
      max: 800000,
      confidence: 'low',
      basedOn: 0,
      explanation: 'Недостаточно данных. Средняя цена автомобиля в Бишкеке.',
      marketTrend: 'stable'
    },
    horse: {
      suggested: 100000,
      min: 50000,
      max: 200000,
      confidence: 'low',
      basedOn: 0,
      explanation: 'Недостаточно данных. Средняя цена лошади в Кыргызстане.',
      marketTrend: 'stable'
    },
    real_estate: {
      suggested: 2000000,
      min: 1000000,
      max: 3000000,
      confidence: 'low',
      basedOn: 0,
      explanation: 'Недостаточно данных. Средняя цена недвижимости.',
      marketTrend: 'stable'
    }
  };

  return defaults[category] || defaults.car;
}

/**
 * Вычислить медиану
 */
function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Вычислить среднее
 */
function calculateMean(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Вычислить стандартное отклонение
 */
function calculateStdDev(numbers: number[], mean: number): number {
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

/**
 * Получить множитель по состоянию
 */
function getConditionMultiplier(condition: string): number {
  const multipliers: Record<string, number> = {
    excellent: 1.10,
    good: 1.00,
    fair: 0.90,
    poor: 0.75
  };
  return multipliers[condition] || 1.0;
}

/**
 * Вычислить средний пробег
 */
function calculateAverageMileage(listings: any[]): number {
  const mileages = listings
    .map(l => l.details?.mileage)
    .filter((m): m is number => typeof m === 'number' && m > 0);

  if (mileages.length === 0) return 100000; // дефолт

  return mileages.reduce((a, b) => a + b, 0) / mileages.length;
}

/**
 * Получить корректировку по пробегу
 */
function getMileageAdjustment(mileage: number, avgMileage: number): number {
  if (mileage < avgMileage * 0.7) return 1.08;  // Намного меньше среднего
  if (mileage < avgMileage * 0.9) return 1.04;  // Немного меньше среднего
  if (mileage > avgMileage * 1.3) return 0.92;  // Намного больше среднего
  if (mileage > avgMileage * 1.1) return 0.96;  // Немного больше среднего
  return 1.0; // В пределах среднего
}

/**
 * Получить корректировку по возрасту авто
 */
function getAgeAdjustment(ageYears: number): number {
  if (ageYears < 3) return 1.05;   // Почти новый
  if (ageYears < 5) return 1.02;   // Свежий
  if (ageYears > 15) return 0.85;  // Старый
  if (ageYears > 10) return 0.92;  // Возрастной
  return 1.0; // Средний возраст
}

/**
 * Получить корректировку по городу
 */
function getCityAdjustment(city: string): number {
  const cityLower = city.toLowerCase();

  if (cityLower.includes('бишкек')) return 1.10;  // Столица дороже
  if (cityLower.includes('ош')) return 0.95;      // Ош чуть дешевле
  if (cityLower.includes('джалал')) return 0.90;  // Регионы дешевле

  return 1.0; // Другие города
}

/**
 * Определить уровень уверенности
 */
function getConfidence(
  sampleSize: number,
  stdDev: number
): 'low' | 'medium' | 'high' {
  if (sampleSize >= 20 && stdDev < 100000) return 'high';
  if (sampleSize >= 10 && stdDev < 200000) return 'medium';
  return 'low';
}

/**
 * Получить объяснение
 */
function getExplanation(data: PriceData, count: number): string {
  const category = {
    car: 'автомобилей',
    horse: 'лошадей',
    real_estate: 'объектов недвижимости'
  }[data.category];

  let explanation = `На основе ${count} похожих ${category}`;

  if (data.brand && data.model) {
    explanation += ` ${data.brand} ${data.model}`;
  }

  if (data.year) {
    explanation += ` ${data.year} года`;
  }

  return explanation;
}

/**
 * Определить тренд рынка
 */
function detectMarketTrend(listings: any[]): 'rising' | 'stable' | 'falling' {
  if (listings.length < 10) return 'stable';

  // Сортируем по дате создания
  const sorted = [...listings].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Делим на две половины (старые и новые)
  const mid = Math.floor(sorted.length / 2);
  const oldListings = sorted.slice(0, mid);
  const newListings = sorted.slice(mid);

  // Вычисляем средние цены
  const oldAvg = calculateMean(oldListings.map(l => l.price));
  const newAvg = calculateMean(newListings.map(l => l.price));

  const change = (newAvg - oldAvg) / oldAvg;

  if (change > 0.05) return 'rising';   // +5% = растёт
  if (change < -0.05) return 'falling'; // -5% = падает
  return 'stable'; // Стабильно
}

/**
 * Форматировать цену для отображения
 */
export function formatPrice(price: number, currency: string = 'KGS'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}
