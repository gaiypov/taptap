// services/rateLimiting.ts
import { supabase } from './supabase';

export type UserTier = 'new_user' | 'regular_user' | 'verified_user' | 'dealer' | 'premium_user';

export interface RateLimitConfig {
  maxUploadsPerDay: number;
  maxMessagesPerHour: number;
  maxLikesPerMinute: number;
}

const RATE_LIMITS: { [key in UserTier]: RateLimitConfig } = {
  new_user: {
    maxUploadsPerDay: 3,
    maxMessagesPerHour: 30,
    maxLikesPerMinute: 5,
  },
  regular_user: {
    maxUploadsPerDay: 5,
    maxMessagesPerHour: 50,
    maxLikesPerMinute: 10,
  },
  verified_user: {
    maxUploadsPerDay: 10,
    maxMessagesPerHour: 100,
    maxLikesPerMinute: 20,
  },
  dealer: {
    // Дилеры, перекупщики, автосалоны
    maxUploadsPerDay: 15,
    maxMessagesPerHour: 200,
    maxLikesPerMinute: 50,
  },
  premium_user: {
    maxUploadsPerDay: 50,
    maxMessagesPerHour: 500,
    maxLikesPerMinute: 100,
  },
};

/**
 * Определяет тип пользователя (tier) на основе его данных
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_verified, is_dealer, created_at, total_sales')
      .eq('id', userId)
      .single();

    if (!user) {
      return 'new_user';
    }

    // Проверяем, является ли дилером (автосалон, перекупщик)
    if (user.is_dealer) {
      return 'dealer';
    }

    // Возраст аккаунта
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Премиум пользователи (TODO: добавить проверку подписки)
    // if (user.has_premium_subscription) {
    //   return 'premium_user';
    // }

    // Верифицированные пользователи с опытом
    if (user.is_verified && accountAgeDays > 30) {
      return 'verified_user';
    }

    // Обычные пользователи (более 7 дней, есть продажи)
    if (accountAgeDays > 7 && (user.total_sales || 0) > 0) {
      return 'regular_user';
    }

    // Новые пользователи
    return 'new_user';
  } catch (error) {
    console.error('Error determining user tier:', error);
    return 'new_user';
  }
}

export async function checkUploadLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  tier: UserTier;
}> {
  try {
    const tier = await getUserTier(userId);
    const limits = RATE_LIMITS[tier];

    // Считаем загрузки за сегодня
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_user_id', userId)
      .gte('created_at', todayStart.toISOString());

    const uploadsToday = count || 0;
    const remaining = Math.max(0, limits.maxUploadsPerDay - uploadsToday);

    // Следующий reset в полночь
    const resetAt = new Date(todayStart);
    resetAt.setDate(resetAt.getDate() + 1);

    return {
      allowed: uploadsToday < limits.maxUploadsPerDay,
      remaining,
      limit: limits.maxUploadsPerDay,
      resetAt,
      tier,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // В случае ошибки - разрешаем (fail open)
    return {
      allowed: true,
      remaining: 3,
      limit: 3,
      resetAt: new Date(),
      tier: 'new_user',
    };
  }
}

export async function checkMessageLimit(userId: string): Promise<boolean> {
  try {
    const tier = await getUserTier(userId);
    const limits = RATE_LIMITS[tier];
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', userId)
      .gte('created_at', oneHourAgo.toISOString());

    return (count || 0) < limits.maxMessagesPerHour;
  } catch (error) {
    console.error('Message rate limit check error:', error);
    return true;
  }
}

export async function checkLikeLimit(userId: string): Promise<boolean> {
  try {
    const tier = await getUserTier(userId);
    const limits = RATE_LIMITS[tier];
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const { count } = await supabase
      .from('listing_likes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneMinuteAgo.toISOString());

    return (count || 0) < limits.maxLikesPerMinute;
  } catch (error) {
    console.error('Like rate limit check error:', error);
    return true;
  }
}

/**
 * Получить информацию о лимитах для пользователя
 */
export async function getUserLimits(userId: string): Promise<RateLimitConfig & { tier: UserTier }> {
  const tier = await getUserTier(userId);
  return {
    ...RATE_LIMITS[tier],
    tier,
  };
}

