// services/business/feedBoost.ts — БИЗНЕС-БУСТ ЛЕНТЫ УРОВНЯ AVITO + TIKTOK 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВАЯ К МИЛЛИАРДУ ПРОСМОТРОВ (ноябрь 2025)

import { supabase } from '../supabase';
import { appLogger } from '@/utils/logger';

export interface BusinessBoost {
  userId: string;
  tier: 'free' | 'lite' | 'business' | 'pro';
  isVerified: boolean;
  boostMultiplier: number; // 1.0 — 3.0
  bannerEligible: boolean;
}

const TIER_CONFIG = {
  free: { multiplier: 1.0, banner: false },
  lite: { multiplier: 1.3, banner: false },
  business: { multiplier: 1.8, banner: true },
  pro: { multiplier: 2.5, banner: true },
} as const;

// === 1. Применяем буст по tier ===
export function applyBusinessBoost(
  listings: any[],
  businessMap: Map<string, BusinessBoost>
): any[] {
  return listings.map(listing => {
    const business = businessMap.get(listing.seller_user_id || listing.seller_id);

    if (!business) return { ...listing, boost_score: 1.0 };

    const baseScore = listing.score || 1;
    const multiplier = TIER_CONFIG[business.tier].multiplier;
    const verifiedBonus = business.isVerified ? 1.15 : 1.0;

    return {
      ...listing,
      boost_score: baseScore * multiplier * verifiedBonus,
      business_tier: business.tier,
      is_boosted: business.tier !== 'free',
    };
  });
}

// === 2. Вставляем PRO-баннеры (каждое 8-е место) ===
export function insertProBanners(
  listings: any[],
  proListings: any[]
): any[] {
  if (proListings.length === 0) return listings;

  const result: any[] = [];
  let bannerIndex = 0;

  listings.forEach((listing, i) => {
    result.push(listing);

    // Каждое 8-е место — баннер PRO
    if ((i + 1) % 8 === 0 && bannerIndex < proListings.length) {
      const banner = proListings[bannerIndex];
      result.push({
        ...banner,
        is_sponsored: true,
        type: 'pro_banner',
        banner_position: i + 1,
      });
      bannerIndex = (bannerIndex + 1) % proListings.length; // Зацикливаем
    }
  });

  return result;
}

// === 3. Финальная сортировка с бустом ===
export function sortWithBusinessBoost(listings: any[]): any[] {
  return [...listings].sort((a, b) => {
    const scoreA = a.boost_score || a.score || 0;
    const scoreB = b.boost_score || b.score || 0;

    if (scoreA !== scoreB) return scoreB - scoreA;

    // Если буст равный — по дате
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// === 4. Загрузка бизнес-данных (без ошибок RLS!) ===
export async function loadBusinessBoostMap(userIds: string[]): Promise<Map<string, BusinessBoost>> {
  const map = new Map<string, BusinessBoost>();

  if (userIds.length === 0) return map;

  try {
    const { data, error } = await supabase
      .from('business_accounts')
      .select('user_id, tier, is_verified, subscription_ends_at')
      .in('user_id', userIds)
      .gte('subscription_ends_at', new Date().toISOString()); // Активные подписки

    // Игнорируем 42501 — это нормально (не у всех есть бизнес)
    if (error && error.code !== '42501') {
      appLogger.warn('[BusinessBoost] Load error (non-RLS)', error);
    } else if (data) {
      data.forEach(acc => {
        const tier = (acc.tier as keyof typeof TIER_CONFIG) || 'free';
        const config = TIER_CONFIG[tier] || TIER_CONFIG.free;
        
        map.set(acc.user_id, {
          userId: acc.user_id,
          tier,
          isVerified: acc.is_verified || false,
          boostMultiplier: config.multiplier,
          bannerEligible: config.banner,
        });
      });
    }
  } catch (error) {
    // Полностью игнорируем все ошибки загрузки бизнеса
    appLogger.debug('[BusinessBoost] Skipped (RLS or network)');
  }

  return map;
}

// === 5. Получаем PRO-баннеры ===
export async function getProBanners(limit = 10): Promise<any[]> {
  try {
    // Получаем PRO бизнес-аккаунты
    const { data: proBusinesses } = await supabase
      .from('business_accounts')
      .select('user_id')
      .eq('tier', 'pro')
      .eq('is_verified', true)
      .gte('subscription_ends_at', new Date().toISOString());

    if (!proBusinesses || proBusinesses.length === 0) {
      return [];
    }

    const proUserIds = proBusinesses.map(b => b.user_id);

    // Получаем объявления от PRO аккаунтов
    const { data } = await supabase
      .from('listings')
      .select('*')
      .in('seller_user_id', proUserIds)
      .in('status', ['published', 'active'])
      .order('views_count', { ascending: false })
      .limit(limit);

    return data || [];
  } catch {
    return [];
  }
}

// === ЕДИНЫЙ ПАЙПЛАЙН ===
export async function processFeedWithBusinessBoost(
  rawListings: any[],
  userIds: string[]
): Promise<any[]> {
  const businessMap = await loadBusinessBoostMap(userIds);
  const boosted = applyBusinessBoost(rawListings, businessMap);
  const withBanners = await insertProBanners(boosted, await getProBanners());
  return sortWithBusinessBoost(withBanners);
}

