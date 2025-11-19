// services/feedAlgorithm.ts — АЛГОРИТМ ЛЕНТЫ 360AutoMVP 2025 (НЕПОБЕДИМЫЙ)
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИОНУ ПОЛЬЗОВАТЕЛЕЙ

import { Listing } from '@/types';

interface FeedSortParams {
  userCity?: string;
  userId?: string; // Для персонализации в будущем
}

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;

export function sortFeedListings(
  listings: Listing[],
  params: FeedSortParams = {}
): Listing[] {
  const { userCity } = params;
  const now = Date.now();

  return [...listings].sort((a, b) => {
    // === 1. BOOSTED — ВСЕГДА СВЕРХУ ===
    const aBoosted = !!(a as any).is_boosted || !!(a as any).boost_until;
    const bBoosted = !!(b as any).is_boosted || !!(b as any).boost_until;

    if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;

    // === 2. ГОРОД ПОЛЬЗОВАТЕЛЯ ===
    if (userCity) {
      const aInCity = isInUserCity(a, userCity);
      const bInCity = isInUserCity(b, userCity);
      
      if (aInCity !== bInCity) return aInCity ? -1 : 1;
    }

    // === 3. СВЕЖЕСТЬ (HOT SCORE) ===
    const aAge = now - new Date(a.created_at || 0).getTime();
    const bAge = now - new Date(b.created_at || 0).getTime();

    const aFreshScore = getFreshnessScore(aAge);
    const bFreshScore = getFreshnessScore(bAge);
    
    if (aFreshScore !== bFreshScore) return bFreshScore - aFreshScore; // выше = свежее

    // === 4. ВОВЛЕЧЁННОСТЬ (ENGAGEMENT) ===
    const aEngagement = getEngagementScore(a);
    const bEngagement = getEngagementScore(b);

    if (aEngagement !== bEngagement) return bEngagement - aEngagement;

    // === 5. ДАТА (новые сверху) ===
    return b.created_at!.localeCompare(a.created_at!);
  });
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function isInUserCity(listing: Listing, userCity: string): boolean {
  const city = (listing.city || (listing as any).location || '').toLowerCase();
  return city.includes(userCity.toLowerCase());
}

function getFreshnessScore(ageMs: number): number {
  if (ageMs < ONE_HOUR) return 100; // < 1 час
  if (ageMs < 6 * ONE_HOUR) return 90; // < 6 часов
  if (ageMs < ONE_DAY) return 70; // < 1 день
  if (ageMs < 3 * ONE_DAY) return 50; // < 3 дней
  if (ageMs < ONE_WEEK) return 30; // < недели
  return 10; // старше недели
}

function getEngagementScore(listing: Listing): number {
  // Используем основные поля или их алиасы для совместимости
  const likes = listing.likes_count ?? listing.likes ?? 0;
  const views = listing.views_count ?? listing.views ?? 0;
  const comments = listing.comments_count ?? 0;

  // Формула вовлечённости (как в TikTok)
  return likes * 10 + views * 0.5 + comments * 15;
}

/**
 * Get user's city from user profile or listing history
 */
export async function getUserCity(userId?: string): Promise<string | undefined> {
  if (!userId) return undefined;
  
  try {
    // Try to get from user profile
    const { supabase } = await import('./supabase');
    const { data: user } = await supabase
      .from('users')
      .select('city')
      .eq('id', userId)
      .single();
    
    return user?.city || undefined;
  } catch (error) {
    console.error('Error getting user city:', error);
    return undefined;
  }
}

