// services/trustScore.ts
import { supabase } from './supabase';

export interface TrustScoreFactors {
  phoneVerified: number;
  hasAvatar: number;
  accountAge: number;
  successfulSales: number;
  positiveReviews: number;
  negativeReports: number;
  isDealer: number;
  totalScore: number;
}

export async function calculateTrustScore(userId: string): Promise<TrustScoreFactors> {
  try {
    // Получаем данные пользователя
    const { data: user } = await supabase
      .from('users')
      .select(`
        phone,
        avatar_url,
        is_verified,
        is_dealer,
        created_at,
        total_sales,
        rating
      `)
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Подсчет репортов
    const { count: reportCount } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reported_user_id', userId)
      // Status field doesn't exist in schema

    let score = 0;
    const factors: TrustScoreFactors = {
      phoneVerified: 0,
      hasAvatar: 0,
      accountAge: 0,
      successfulSales: 0,
      positiveReviews: 0,
      negativeReports: 0,
      isDealer: 0,
      totalScore: 0,
    };

    // Телефон верифицирован (+15 баллов)
    if (user.phone) {
      factors.phoneVerified = 15;
      score += 15;
    }

    // Есть аватар (+5 баллов)
    if (user.avatar_url) {
      factors.hasAvatar = 5;
      score += 5;
    }

    // Дилер/автосалон (+10 баллов за верификацию)
    if (user.is_dealer && user.is_verified) {
      factors.isDealer = 10;
      score += 10;
    }

    // Возраст аккаунта (макс +20 баллов, +1 за каждые 15 дней)
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    factors.accountAge = Math.min(20, Math.floor(accountAgeDays / 15));
    score += factors.accountAge;

    // Успешные продажи (макс +30 баллов, +3 за каждую)
    factors.successfulSales = Math.min(30, (user.total_sales || 0) * 3);
    score += factors.successfulSales;

    // Положительные отзывы (макс +20 баллов, на основе рейтинга)
    if (user.rating >= 4.5) {
      factors.positiveReviews = 20;
    } else if (user.rating >= 4.0) {
      factors.positiveReviews = 15;
    } else if (user.rating >= 3.5) {
      factors.positiveReviews = 10;
    } else if (user.rating >= 3.0) {
      factors.positiveReviews = 5;
    }
    score += factors.positiveReviews;

    // Жалобы (-10 за каждую, макс -50)
    factors.negativeReports = -Math.min(50, (reportCount || 0) * 10);
    score += factors.negativeReports;

    // Финальный счет (0-100)
    factors.totalScore = Math.max(0, Math.min(100, score));

    return factors;
  } catch (error) {
    console.error('Trust score calculation error:', error);
    return {
      phoneVerified: 0,
      hasAvatar: 0,
      accountAge: 0,
      successfulSales: 0,
      positiveReviews: 0,
      negativeReports: 0,
      isDealer: 0,
      totalScore: 0,
    };
  }
}

export function getTrustLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function shouldAutoApproveListing(score: number): boolean {
  return score >= 60; // Автоодобрение для пользователей с высоким Trust Score
}

export function requireManualReview(score: number): boolean {
  return score < 30; // Обязательная модерация для низкого Trust Score
}

/**
 * Обновить Trust Score в БД
 */
export async function updateUserTrustScore(userId: string): Promise<number> {
  const factors = await calculateTrustScore(userId);
  
  // Обновляем в базе (если есть поле trust_score)
  await supabase
    .from('users')
    .update({ trust_score: factors.totalScore })
    .eq('id', userId);
  
  return factors.totalScore;
}

