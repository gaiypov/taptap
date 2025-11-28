/**
 * Listing Pricing Service
 * According to CURSOR AI RULES (Jan 30, 2025)
 * 
 * Pricing Rules:
 * - First listing: FREE (always)
 * - After 45 days from launch:
 *   - Regular users: 100 сом (for listings 2-5)
 *   - Business users: 200 сом (for listings 6+)
 * - Free period: first 45 days after launch (all listings free)
 */

const LAUNCH_DATE = new Date('2025-02-01'); // SET ACTUAL LAUNCH DATE
const FREE_PERIOD_DAYS = 45;
const REGULAR_PRICE = 100; // сом
const BUSINESS_PRICE = 200; // сом
const REGULAR_FREE_LIMIT = 5; // First 5 listings free for regular users

export interface PricingInfo {
  price: number; // 0 = free
  isFree: boolean;
  reason: string;
}

/**
 * Check if we're in the free period (first 45 days)
 */
export function isInFreePeriod(): boolean {
  const now = new Date();
  const daysSinceLaunch = (now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLaunch < FREE_PERIOD_DAYS;
}

/**
 * Get active listings count for a user
 */
export async function getActiveListingsCount(userId: string): Promise<number> {
  try {
    if (!userId) {
      console.warn('[listingPricing] No userId provided');
      return 0;
    }

    const { supabase } = await import('./supabase');
    const { count, error } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_user_id', userId)
      .eq('status', 'active');
    
    if (error) {
      // Properly serialize error for logging
      const errorMessage = error.message || 'Unknown error';
      const errorDetails = error.details || error.hint || '';
      console.error('[listingPricing] Error getting listings count:', {
        message: errorMessage,
        details: errorDetails,
        code: error.code,
        userId,
      });
      return 0;
    }
    
    return count || 0;
  } catch (error: any) {
    // Handle non-Supabase errors
    const errorMessage = error?.message || String(error) || 'Unknown error';
    console.error('[listingPricing] Exception getting listings count:', {
      message: errorMessage,
      stack: error?.stack,
      userId,
    });
    return 0;
  }
}

/**
 * Get user account type
 */
export async function getUserAccountType(userId: string): Promise<'regular' | 'business'> {
  try {
    if (!userId) {
      return 'regular';
    }

    const { supabase } = await import('./supabase');
    
    // Check if user has active business membership
    const { data: business, error } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      // Log error but don't throw - default to regular
      const errorMessage = error.message || 'Unknown error';
      console.warn('[listingPricing] Error checking business membership:', {
        message: errorMessage,
        code: error.code,
        userId,
      });
      return 'regular';
    }
    
    if (business) {
      return 'business';
    }
    
    return 'regular';
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || 'Unknown error';
    console.warn('[listingPricing] Exception checking account type:', {
      message: errorMessage,
      userId,
    });
    return 'regular';
  }
}

/**
 * Calculate listing price for a user
 */
export async function getListingPrice(userId: string): Promise<PricingInfo> {
  // First listing always free
  const activeCount = await getActiveListingsCount(userId);
  
  if (activeCount === 0) {
    return {
      price: 0,
      isFree: true,
      reason: 'Первое объявление бесплатно',
    };
  }

  // Check if in free period
  if (isInFreePeriod()) {
    return {
      price: 0,
      isFree: true,
      reason: `Бесплатный период (осталось ${Math.ceil(FREE_PERIOD_DAYS - (Date.now() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24))} дней)`,
    };
  }

  // Get account type
  const accountType = await getUserAccountType(userId);

  // Regular users: 100 сом for listings 2-5
  if (accountType === 'regular') {
    if (activeCount < REGULAR_FREE_LIMIT) {
      return {
        price: 0,
        isFree: true,
        reason: `Бесплатно (${activeCount + 1}/${REGULAR_FREE_LIMIT} объявлений)`,
      };
    }

    // After 5 listings, they need to upgrade to business
    return {
      price: Infinity, // Block creation, need to upgrade
      isFree: false,
      reason: 'Достигнут лимит бесплатных объявлений. Перейдите на бизнес-аккаунт.',
    };
  }

  // Business users: 200 сом after 3 free listings
  const BUSINESS_FREE_LIMIT = 3;
  if (activeCount < BUSINESS_FREE_LIMIT) {
    return {
      price: 0,
      isFree: true,
      reason: `Бесплатно для бизнеса (${activeCount + 1}/${BUSINESS_FREE_LIMIT} объявлений)`,
    };
  }

  return {
    price: BUSINESS_PRICE,
    isFree: false,
    reason: 'Стоимость размещения объявления',
  };
}

/**
 * Check if user can create listing (not blocked by pricing)
 */
export async function canCreateListing(userId: string): Promise<{
  allowed: boolean;
  reason: string;
  price?: number;
}> {
  const pricing = await getListingPrice(userId);

  if (pricing.price === Infinity) {
    return {
      allowed: false,
      reason: pricing.reason,
    };
  }

  return {
    allowed: true,
    reason: pricing.reason,
    price: pricing.price,
  };
}

