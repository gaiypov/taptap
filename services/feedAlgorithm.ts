/**
 * Feed Algorithm Service
 * According to CURSOR AI RULES (Jan 30, 2025)
 * 
 * Priority Order:
 * 1. Boosted listings first
 * 2. User's city listings second
 * 3. Fresh listings (24h) third
 * 4. Engagement (likes_count) fourth
 * 5. Date (created_at) fifth
 */

import { Listing } from '@/types';

export interface FeedSortParams {
  userCity?: string;
  includeBoosted?: boolean;
}

/**
 * Sort listings according to feed algorithm priorities
 */
export function sortFeedListings(
  listings: Listing[],
  params: FeedSortParams = {}
): Listing[] {
  const { userCity } = params;
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return [...listings].sort((a, b) => {
      // 1. Boosted listings first
      const aBoosted = (a as any).is_boosted || (a as any).isBoosted || false;
      const bBoosted = (b as any).is_boosted || (b as any).isBoosted || false;
      if (aBoosted !== bBoosted) {
        return aBoosted ? -1 : 1;
      }

    // 2. User's city listings second
    if (userCity) {
      const aIsUserCity = a.location?.toLowerCase().includes(userCity.toLowerCase()) || 
                          a.city?.toLowerCase() === userCity.toLowerCase();
      const bIsUserCity = b.location?.toLowerCase().includes(userCity.toLowerCase()) || 
                          b.city?.toLowerCase() === userCity.toLowerCase();
      
      if (aIsUserCity !== bIsUserCity) {
        return aIsUserCity ? -1 : 1;
      }
    }

    // 3. Fresh listings (created in last 24h) third
    const aCreatedAt = new Date(a.created_at || 0).getTime();
    const bCreatedAt = new Date(b.created_at || 0).getTime();
    const aIsFresh = now - aCreatedAt < oneDayMs;
    const bIsFresh = now - bCreatedAt < oneDayMs;
    
    if (aIsFresh !== bIsFresh) {
      return aIsFresh ? -1 : 1;
    }

    // 4. Engagement (likes_count) fourth
    const aLikes = a.likes_count || 0;
    const bLikes = b.likes_count || 0;
    
    if (aLikes !== bLikes) {
      return bLikes - aLikes; // Higher likes first
    }

    // 5. Date (created_at) fifth - newest first
    return bCreatedAt - aCreatedAt;
  });
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

