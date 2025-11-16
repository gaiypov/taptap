// Приоритет в алгоритме ленты для бизнес-аккаунтов

import { BusinessAccount } from '@/types/business';
import { calculatePriorityScore } from '../business/tier-features';

/**
 * Применяет приоритет бизнес-аккаунтов к объявлениям
 */
export function applyBusinessPriority(
  listings: any[],
  businessAccounts: Map<string, BusinessAccount>
): any[] {
  return listings.map((listing) => {
    let score = listing.score || listing.boost_level || 0;

    const business = businessAccounts.get(listing.seller_id);

    if (business) {
      // Применяем boost тарифа
      score = calculatePriorityScore(score, business.tier);

      // Дополнительный приоритет для верифицированных PRO
      if (business.is_verified && business.tier === 'pro') {
        score *= 1.1; // +10% для верифицированных
      }
    }

    return {
      ...listing,
      score,
      business_tier: business?.tier || 'free',
    };
  });
}

/**
 * Вставляет PRO баннеры в ленту
 * Каждое 10-е видео - баннер от PRO аккаунта
 */
export function insertProBanners(
  listings: any[],
  proBanners: any[]
): any[] {
  if (proBanners.length === 0) {
    return listings;
  }

  const result: any[] = [];
  let bannerIndex = 0;

  listings.forEach((listing, index) => {
    result.push(listing);

    // Каждое 10-е позиция - вставляем баннер
    if ((index + 1) % 10 === 0 && bannerIndex < proBanners.length) {
      result.push({
        ...proBanners[bannerIndex],
        is_sponsored: true,
        type: 'banner',
        banner_position: index + 1,
      });
      bannerIndex++;

      // Зацикливаем баннеры если закончились
      if (bannerIndex >= proBanners.length) {
        bannerIndex = 0;
      }
    }
  });

  return result;
}

/**
 * Сортирует объявления с учетом score
 */
export function sortByScore(listings: any[]): any[] {
  return [...listings].sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  });
}

/**
 * Получает PRO объявления для баннеров
 */
export async function getProBanners(supabase: any, limit: number = 10): Promise<any[]> {
  try {
    const { data: businesses, error: businessError } = await supabase
      .from('business_accounts')
      .select('user_id')
      .eq('tier', 'pro')
      .eq('is_verified', true);

    if (businessError || !businesses || businesses.length === 0) {
      return [];
    }

    const proUserIds = businesses.map((b: any) => b.user_id);

    const { data: banners, error: bannersError } = await supabase
      .from('listings')
      .select('*')
      .in('seller_id', proUserIds)
      .eq('status', 'active')
      .order('views', { ascending: false })
      .limit(limit);

    if (bannersError) {
      console.error('Error fetching PRO banners:', bannersError);
      return [];
    }

    return banners || [];
  } catch (error) {
    console.error('Error in getProBanners:', error);
    return [];
  }
}

/**
 * Загружает бизнес-аккаунты для списка пользователей
 */
export async function loadBusinessAccounts(
  supabase: any,
  userIds: string[]
): Promise<Map<string, BusinessAccount>> {
  const map = new Map<string, BusinessAccount>();

  if (userIds.length === 0) {
    return map;
  }

  try {
    const { data, error } = await supabase
      .from('business_accounts')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      // Полностью игнорируем ошибки доступа (42501) - это нормально для обычных пользователей
      // НЕ показываем в консоли, чтобы не пугать
      if (error.code !== '42501') {
        console.error('Error loading business accounts:', error);
      }
      return map;
    }

    if (data) {
      data.forEach((account: BusinessAccount) => {
        map.set(account.user_id, account);
      });
    }

    return map;
  } catch (error: any) {
    // Полностью игнорируем permission denied (42501) - это ожидаемо
    // НЕ показываем в консоли
    if (error?.code !== '42501') {
      console.error('Error in loadBusinessAccounts:', error);
    }
    return map;
  }
}

