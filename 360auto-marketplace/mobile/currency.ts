// constants/currency.ts
// Конфигурация валют для приложения 360Auto

export const CURRENCIES = {
  KGS: {
    code: 'KGS',
    symbol: '⊆',
    name: 'Кыргызский сом',
    nameShort: 'сом',
    decimals: 0, // Сом обычно без дробных частей
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Доллар США',
    nameShort: 'USD',
    decimals: 2,
  },
} as const;

// Основная валюта приложения
export const PRIMARY_CURRENCY = CURRENCIES.KGS;

// Дополнительная валюта (для дублирования)
export const SECONDARY_CURRENCY = CURRENCIES.USD;

// Курс обмена (можно будет обновлять из API)
// TODO: Интегрировать API для получения актуального курса
export const EXCHANGE_RATE = {
  KGS_TO_USD: 0.0115, // 1 KGS = 0.0115 USD (примерно 87 сом = 1 доллар)
  USD_TO_KGS: 87.0,   // 1 USD = 87 KGS
};

/**
 * Форматирует цену в основной валюте (KGS)
 * @param price - цена в сомах
 * @returns строка с форматированной ценой
 * @example formatPrice(2500000) => "2 500 000 ⊆"
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ru-RU')} ${PRIMARY_CURRENCY.symbol}`;
}

/**
 * Форматирует цену с дублированием в USD
 * @param priceKGS - цена в сомах
 * @returns объект с ценами в обеих валютах
 * @example formatPriceWithUSD(2500000) => { kgs: "2 500 000 ⊆", usd: "$28,750" }
 */
export function formatPriceWithUSD(priceKGS: number): {
  kgs: string;
  usd: string;
  kgsValue: number;
  usdValue: number;
} {
  const usdValue = Math.round(priceKGS * EXCHANGE_RATE.KGS_TO_USD);
  
  return {
    kgs: formatPrice(priceKGS),
    usd: `${SECONDARY_CURRENCY.symbol}${usdValue.toLocaleString('en-US')}`,
    kgsValue: priceKGS,
    usdValue: usdValue,
  };
}

/**
 * Конвертирует USD в KGS
 * @param usd - цена в долларах
 * @returns цена в сомах
 */
export function convertUSDtoKGS(usd: number): number {
  return Math.round(usd * EXCHANGE_RATE.USD_TO_KGS);
}

/**
 * Конвертирует KGS в USD
 * @param kgs - цена в сомах
 * @returns цена в долларах
 */
export function convertKGStoUSD(kgs: number): number {
  return Math.round(kgs * EXCHANGE_RATE.KGS_TO_USD);
}

/**
 * Компактное форматирование больших чисел
 * @param price - цена
 * @returns строка с сокращением (например: 2.5M)
 * @example formatPriceCompact(2500000) => "2.5M ⊆"
 */
export function formatPriceCompact(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M ${PRIMARY_CURRENCY.symbol}`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K ${PRIMARY_CURRENCY.symbol}`;
  }
  return formatPrice(price);
}

/**
 * Проверяет, является ли цена в разумных пределах для автомобиля
 * @param price - цена в сомах
 * @returns true если цена разумная
 */
export function isValidCarPrice(price: number): boolean {
  const MIN_PRICE = 50000;  // Минимум 50,000 сом
  const MAX_PRICE = 50000000; // Максимум 50 млн сом
  return price >= MIN_PRICE && price <= MAX_PRICE;
}

// Примеры использования:
// 
// const car = { price: 2500000 };
// 
// // Простое форматирование
// console.log(formatPrice(car.price)); 
// // "2 500 000 ⊆"
// 
// // С дублированием в USD
// const priceFormatted = formatPriceWithUSD(car.price);
// console.log(priceFormatted.kgs); // "2 500 000 ⊆"
// console.log(priceFormatted.usd); // "$28,750"
// 
// // Компактный формат для карточек
// console.log(formatPriceCompact(car.price)); 
// // "2.5M ⊆"

