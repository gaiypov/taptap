// Проверка лимитов для бизнес-аккаунтов

import { supabase } from '@/services/supabase';
import { BusinessAccount, FREE_LIMITS, LimitCheck } from '@/types/business';

/**
 * Проверяет может ли пользователь создать объявление
 * с учетом лимитов FREE или бизнес-аккаунта
 */
export async function checkCreateListingLimit(
  userId: string,
  category: 'car' | 'horse' | 'realty'
): Promise<LimitCheck> {
  try {
    // Получаем бизнес-аккаунт пользователя
    const { data: business, error: businessError } = await supabase
      .from('business_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (businessError) {
      console.error('Error fetching business account:', businessError);
    }

    // Получаем активные объявления пользователя
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, category')
      .eq('seller_id', userId)
      .eq('status', 'active');

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      return {
        canCreate: false,
        currentCount: 0,
        maxCount: 0,
      };
    }

    const allListings = listings || [];
    const categoryListings = allListings.filter(l => l.category === category);
    const currentCount = categoryListings.length;

    // Если нет бизнес-аккаунта - проверяем FREE лимиты
    if (!business) {
      const maxCount = FREE_LIMITS[category];

      if (currentCount >= maxCount) {
        return {
          canCreate: false,
          reason: {
            type: `${category}_limit` as any,
            currentCount,
            maxCount,
            suggestedTier: 'lite',
          },
          currentCount,
          maxCount,
        };
      }

      return {
        canCreate: true,
        currentCount,
        maxCount,
      };
    }

    // Для бизнес-аккаунтов

    // PRO - безлимит
    if (business.tier === 'pro') {
      return {
        canCreate: true,
        currentCount,
        maxCount: 'unlimited',
      };
    }

    // Проверяем истекла ли подписка
    const now = new Date();
    const subscriptionEnds = business.subscription_ends_at ? new Date(business.subscription_ends_at) : null;
    const trialEnds = business.trial_ends_at ? new Date(business.trial_ends_at) : null;

    const isSubscriptionActive = subscriptionEnds && subscriptionEnds > now;
    const isTrialActive = trialEnds && trialEnds > now;

    if (!isSubscriptionActive && !isTrialActive) {
      return {
        canCreate: false,
        reason: {
          type: 'tier_limit',
          currentCount: allListings.length,
          maxCount: business.max_listings,
          suggestedTier: business.tier,
        },
        currentCount: allListings.length,
        maxCount: business.max_listings,
      };
    }

    // Проверяем лимит по тарифу
    const totalActive = allListings.length;

    if (totalActive >= business.max_listings) {
      const suggestedTier = business.tier === 'lite' ? 'business' : 'pro';

      return {
        canCreate: false,
        reason: {
          type: 'tier_limit',
          currentCount: totalActive,
          maxCount: business.max_listings,
          suggestedTier,
        },
        currentCount: totalActive,
        maxCount: business.max_listings,
      };
    }

    return {
      canCreate: true,
      currentCount: totalActive,
      maxCount: business.max_listings,
    };
  } catch (error) {
    console.error('Error in checkCreateListingLimit:', error);
    return {
      canCreate: false,
      currentCount: 0,
      maxCount: 0,
    };
  }
}

/**
 * Получает бизнес-аккаунт пользователя
 */
export async function getBusinessAccount(userId: string): Promise<BusinessAccount | null> {
  try {
    const { data, error } = await supabase
      .from('business_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching business account:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getBusinessAccount:', error);
    return null;
  }
}

/**
 * Проверяет может ли пользователь добавить члена команды
 */
export async function canAddTeamMember(userId: string): Promise<boolean> {
  try {
    const business = await getBusinessAccount(userId);

    if (!business) {
      return false; // FREE пользователи не могут иметь команду
    }

    if (business.tier === 'pro') {
      return true; // Безлимит для PRO
    }

    return business.team_members_count < business.max_team_members;
  } catch (error) {
    console.error('Error in canAddTeamMember:', error);
    return false;
  }
}

/**
 * Проверяет истек ли пробный период
 */
export async function isTrialExpired(userId: string): Promise<boolean> {
  try {
    const business = await getBusinessAccount(userId);

    if (!business || !business.trial_ends_at) {
      return false;
    }

    return new Date(business.trial_ends_at) < new Date();
  } catch (error) {
    console.error('Error in isTrialExpired:', error);
    return false;
  }
}

/**
 * Проверяет активна ли подписка
 */
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  try {
    const business = await getBusinessAccount(userId);

    if (!business) {
      return false;
    }

    const now = new Date();
    const subscriptionEnds = business.subscription_ends_at ? new Date(business.subscription_ends_at) : null;
    const trialEnds = business.trial_ends_at ? new Date(business.trial_ends_at) : null;

    const isSubscriptionValid = subscriptionEnds && subscriptionEnds > now;
    const isTrialValid = trialEnds && trialEnds > now;

    return !!(isSubscriptionValid || isTrialValid);
  } catch (error) {
    console.error('Error in isSubscriptionActive:', error);
    return false;
  }
}

/**
 * Получает оставшиеся дни подписки/пробного периода
 */
export async function getSubscriptionDaysLeft(userId: string): Promise<number | null> {
  try {
    const business = await getBusinessAccount(userId);

    if (!business) {
      return null;
    }

    const now = new Date();
    let endDate: Date | null = null;

    // Если активен пробный период
    if (business.trial_ends_at && new Date(business.trial_ends_at) > now) {
      endDate = new Date(business.trial_ends_at);
    }
    // Иначе смотрим на подписку
    else if (business.subscription_ends_at && new Date(business.subscription_ends_at) > now) {
      endDate = new Date(business.subscription_ends_at);
    }

    if (!endDate) {
      return 0;
    }

    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error('Error in getSubscriptionDaysLeft:', error);
    return null;
  }
}

