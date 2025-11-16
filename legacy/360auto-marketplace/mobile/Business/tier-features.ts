// Функции для работы с тарифами и их особенностями

import { BusinessAccount, BusinessTier, TIER_CONFIGS, TierFeatures } from '@/types/business';

/**
 * Получает конфигурацию тарифа
 */
export function getTierFeatures(tier: BusinessTier): TierFeatures {
  return TIER_CONFIGS[tier];
}

/**
 * Проверяет доступна ли функция для тарифа
 */
export function hasTierFeature(
  tier: BusinessTier,
  feature: keyof TierFeatures
): boolean {
  const config = getTierFeatures(tier);
  return !!config[feature];
}

/**
 * Получает процент скидки на Boost для тарифа
 */
export function getBoostDiscount(tier: BusinessTier): number {
  return getTierFeatures(tier).hasBoostDiscount;
}

/**
 * Получает процент приоритета в ленте для тарифа
 */
export function getPriorityBoost(tier: BusinessTier): number {
  return getTierFeatures(tier).hasPriorityBoost;
}

/**
 * Вычисляет цену с учетом скидки бизнес-аккаунта
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  tier: BusinessTier
): number {
  const discount = getBoostDiscount(tier);
  return Math.round(originalPrice * (1 - discount / 100));
}

/**
 * Вычисляет приоритет объявления с учетом бизнес-аккаунта
 */
export function calculatePriorityScore(
  baseScore: number,
  tier: BusinessTier
): number {
  const boost = getPriorityBoost(tier);
  return baseScore * (1 + boost / 100);
}

/**
 * Проверяет нужно ли показать баннер upgrade
 */
export function shouldShowUpgradePrompt(
  currentTier: BusinessTier,
  activeListingsCount: number,
  category?: 'car' | 'horse' | 'realty'
): boolean {
  // FREE → LITE
  if (currentTier === 'free') {
    if (category === 'car' && activeListingsCount >= 2) return true;
    if (category === 'horse' && activeListingsCount >= 2) return true;
    if (category === 'realty' && activeListingsCount >= 1) return true;
    if (activeListingsCount >= 3) return true;
  }

  // LITE → BUSINESS
  if (currentTier === 'lite' && activeListingsCount >= 10) {
    return true;
  }

  // BUSINESS → PRO
  if (currentTier === 'business' && activeListingsCount >= 30) {
    return true;
  }

  return false;
}

/**
 * Получает рекомендуемый тариф для upgrade
 */
export function getSuggestedTier(
  currentTier: BusinessTier,
  activeListingsCount: number
): BusinessTier | null {
  if (currentTier === 'free' && activeListingsCount >= 3) {
    return 'lite';
  }

  if (currentTier === 'lite' && activeListingsCount >= 10) {
    return 'business';
  }

  if (currentTier === 'business' && activeListingsCount >= 30) {
    return 'pro';
  }

  return null;
}

/**
 * Сравнивает два тарифа (для UI сравнения)
 */
export function compareTiers(tier1: BusinessTier, tier2: BusinessTier): {
  tier1: TierFeatures;
  tier2: TierFeatures;
  differences: string[];
} {
  const config1 = getTierFeatures(tier1);
  const config2 = getTierFeatures(tier2);

  const differences: string[] = [];

  // Сравниваем основные параметры
  if (config2.maxListings !== config1.maxListings) {
    differences.push(`Лимит объявлений: ${config1.maxListings} → ${config2.maxListings}`);
  }

  if (config2.hasAnalytics && !config1.hasAnalytics) {
    differences.push('Добавляется аналитика');
  }

  if (config2.hasAdvancedAnalytics && !config1.hasAdvancedAnalytics) {
    differences.push('Расширенная аналитика');
  }

  if (config2.hasPriorityBoost > config1.hasPriorityBoost) {
    differences.push(`Приоритет: +${config2.hasPriorityBoost}%`);
  }

  if (config2.hasBoostDiscount > config1.hasBoostDiscount) {
    differences.push(`Скидка на Boost: ${config2.hasBoostDiscount}%`);
  }

  return {
    tier1: config1,
    tier2: config2,
    differences,
  };
}

/**
 * Форматирует цену тарифа
 */
export function formatTierPrice(tier: BusinessTier): string {
  const config = getTierFeatures(tier);

  if (config.price === 0) {
    return 'Бесплатно';
  }

  return `${config.price} сом/мес`;
}

/**
 * Получает значок для тарифа
 */
export function getTierBadge(tier: BusinessTier): {
  emoji: string;
  color: string;
  label: string;
} {
  switch (tier) {
    case 'free':
      return { emoji: '⚪', color: '#9CA3AF', label: 'FREE' };
    case 'lite':
      return { emoji: '🟡', color: '#FCD34D', label: 'ЛАЙТ' };
    case 'business':
      return { emoji: '🔵', color: '#3B82F6', label: 'БИЗНЕС' };
    case 'pro':
      return { emoji: '💎', color: '#8B5CF6', label: 'PRO' };
  }
}

/**
 * Проверяет истекает ли подписка скоро (меньше 7 дней)
 */
export function isSubscriptionExpiringSoon(business: BusinessAccount): boolean {
  if (!business.subscription_ends_at) {
    return false;
  }

  const now = new Date();
  const endsAt = new Date(business.subscription_ends_at);
  const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysLeft > 0 && daysLeft <= 7;
}

/**
 * Получает текст для кнопки upgrade
 */
export function getUpgradeButtonText(
  currentTier: BusinessTier,
  targetTier: BusinessTier
): string {
  if (currentTier === 'free') {
    return `Перейти на ${getTierFeatures(targetTier).name}`;
  }

  const tierOrder: BusinessTier[] = ['free', 'lite', 'business', 'pro'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const targetIndex = tierOrder.indexOf(targetTier);

  if (targetIndex > currentIndex) {
    return `Upgrade до ${getTierFeatures(targetTier).name}`;
  } else if (targetIndex < currentIndex) {
    return `Downgrade до ${getTierFeatures(targetTier).name}`;
  } else {
    return 'Продлить подписку';
  }
}

/**
 * Вычисляет экономию от скидки на Boost
 */
export function calculateBoostSavings(
  originalPrice: number,
  tier: BusinessTier,
  boostCount: number
): number {
  const discount = getBoostDiscount(tier);
  const discountedPrice = calculateDiscountedPrice(originalPrice, tier);
  const savings = (originalPrice - discountedPrice) * boostCount;

  return Math.round(savings);
}

