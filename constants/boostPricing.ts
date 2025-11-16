/**
 * Boost Pricing Configuration
 * According to CURSOR AI RULES (Jan 30, 2025)
 * 
 * Pricing:
 * - 3 hours: 50 сом
 * - 24 hours: 200 сом
 * - 7 days: 700 сом
 * - 30 days: 1500 сом
 */

export interface BoostOption {
  id: '3h' | '24h' | '7d' | '30d';
  label: string;
  durationSeconds: number;
  price: number; // in KGS (сом)
}

export const BOOST_PRICES: Record<string, BoostOption> = {
  '3h': {
    id: '3h',
    label: '3 часа',
    durationSeconds: 3 * 60 * 60, // 3 hours
    price: 50, // 50 сом
  },
  '24h': {
    id: '24h',
    label: '24 часа',
    durationSeconds: 24 * 60 * 60, // 24 hours
    price: 200, // 200 сом
  },
  '7d': {
    id: '7d',
    label: '7 дней',
    durationSeconds: 7 * 24 * 60 * 60, // 7 days
    price: 700, // 700 сом
  },
  '30d': {
    id: '30d',
    label: '30 дней',
    durationSeconds: 30 * 24 * 60 * 60, // 30 days
    price: 1500, // 1500 сом
  },
};

/**
 * Get boost option by ID
 */
export function getBoostOption(id: string): BoostOption | undefined {
  return BOOST_PRICES[id];
}

/**
 * Get all boost options sorted by price
 */
export function getAllBoostOptions(): BoostOption[] {
  return Object.values(BOOST_PRICES).sort((a, b) => a.price - b.price);
}

/**
 * Get boost option with best value (price per day)
 */
export function getBestValueBoostOption(): BoostOption {
  const options = getAllBoostOptions();
  
  // Calculate price per day for each option
  const withValue = options.map(option => ({
    ...option,
    pricePerDay: option.price / (option.durationSeconds / (24 * 60 * 60)),
  }));
  
  // Sort by price per day (ascending)
  withValue.sort((a, b) => a.pricePerDay - b.pricePerDay);
  
  return withValue[0];
}

