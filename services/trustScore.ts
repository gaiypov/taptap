// services/trustScore.ts — TRUST SCORE УРОВНЯ AVITO + FACEBOOK MARKETPLACE 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К ЗАПУСКУ

import { supabase } from './supabase';
import { appLogger } from '@/utils/logger';

export interface TrustScoreFactors {
  phoneVerified: number;
  hasAvatar: number;
  accountAge: number;
  successfulSales: number;
  positiveFeedback: number;
  responseRate: number;
  verificationStatus: number;
  negativeReports: number;
  totalScore: number;
  tier: 'new' | 'trusted' | 'verified' | 'premium';
}

const MAX_SCORE = 100;

export async function calculateTrustScore(userId: string): Promise<TrustScoreFactors> {
  try {
    // Основные данные пользователя (используем users, так как profiles может не существовать)
    const { data: profile, error } = await supabase
      .from('users')
      .select(
        `
        phone,
        avatar_url,
        created_at,
        is_verified,
        is_dealer,
        subscription_tier,
        total_sales,
        avg_response_time,
        completed_transactions,
        positive_feedback,
        negative_feedback,
        rating
      `
      )
      .eq('id', userId)
      .single();

    // Fallback: если поля не существуют, используем базовые поля
    if (error || !profile) {
      const { data: user } = await supabase
        .from('users')
        .select('phone, avatar_url, created_at, is_verified, is_dealer, total_sales, rating')
        .eq('id', userId)
        .single();

      if (!user) {
        return getDefaultScore();
      }

      // Используем базовые поля для расчета
      return calculateFromBasicFields(user, userId);
    }

    let score = 0;
    const factors: TrustScoreFactors = {
      phoneVerified: 0,
      hasAvatar: 0,
      accountAge: 0,
      successfulSales: 0,
      positiveFeedback: 0,
      responseRate: 0,
      verificationStatus: 0,
      negativeReports: 0,
      totalScore: 0,
      tier: 'new',
    };

    // 1. Телефон (+20)
    if (profile.phone) {
      factors.phoneVerified = 20;
      score += 20;
    }

    // 2. Аватар (+10)
    if (profile.avatar_url) {
      factors.hasAvatar = 10;
      score += 10;
    }

    // 3. Возраст аккаунта (макс +15)
    const ageDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
    factors.accountAge = Math.min(15, Math.floor(ageDays / 30));
    score += factors.accountAge;

    // 4. Успешные продажи (макс +25)
    const sales = profile.total_sales || profile.completed_transactions || 0;
    factors.successfulSales = Math.min(25, sales * 2);
    score += factors.successfulSales;

    // 5. Положительные отзывы (макс +20)
    const positive = profile.positive_feedback || 0;
    const totalFeedback = positive + (profile.negative_feedback || 0);
    const positiveRate = totalFeedback > 0 ? positive / totalFeedback : (profile.rating ? profile.rating / 5 : 1);
    factors.positiveFeedback = Math.round(20 * positiveRate);
    score += factors.positiveFeedback;

    // 6. Скорость ответа (макс +10)
    const responseTime = profile.avg_response_time || 999;
    if (responseTime < 3600) factors.responseRate = 10; // < 1 час
    else if (responseTime < 86400) factors.responseRate = 5; // < 1 день
    score += factors.responseRate;

    // 7. Статус верификации (макс +15)
    if (profile.subscription_tier === 'premium') {
      factors.verificationStatus = 15;
    } else if (profile.is_dealer && profile.is_verified) {
      factors.verificationStatus = 12;
    } else if (profile.is_verified) {
      factors.verificationStatus = 8;
    }
    score += factors.verificationStatus;

    // 8. Жалобы (-30 макс)
    const reports = await countUserReports(userId);
    factors.negativeReports = -Math.min(30, reports * 10);
    score += factors.negativeReports;

    // Финальный скор
    factors.totalScore = Math.max(0, Math.min(MAX_SCORE, score));

    // Tier
    if (factors.totalScore >= 85) factors.tier = 'premium';
    else if (factors.totalScore >= 70) factors.tier = 'verified';
    else if (factors.totalScore >= 45) factors.tier = 'trusted';
    else factors.tier = 'new';

    // Сохраняем в базу (если поля существуют)
    try {
      await supabase
        .from('users')
        .update({ trust_score: factors.totalScore, trust_tier: factors.tier })
        .eq('id', userId);
    } catch (updateError) {
      // Игнорируем ошибку, если поля не существуют
      appLogger.warn('[TrustScore] Failed to update trust_score in DB', { userId });
    }

    return factors;
  } catch (error) {
    appLogger.error('[TrustScore] Calculation failed', { userId, error });
    return getDefaultScore();
  }
}

// Расчет из базовых полей (fallback)
async function calculateFromBasicFields(user: any, userId: string): Promise<TrustScoreFactors> {
  let score = 0;
  const factors: TrustScoreFactors = {
    phoneVerified: 0,
    hasAvatar: 0,
    accountAge: 0,
    successfulSales: 0,
    positiveFeedback: 0,
    responseRate: 0,
    verificationStatus: 0,
    negativeReports: 0,
    totalScore: 0,
    tier: 'new',
  };

  if (user.phone) {
    factors.phoneVerified = 20;
    score += 20;
  }

  if (user.avatar_url) {
    factors.hasAvatar = 10;
    score += 10;
  }

  const ageDays = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000);
  factors.accountAge = Math.min(15, Math.floor(ageDays / 30));
  score += factors.accountAge;

  factors.successfulSales = Math.min(25, (user.total_sales || 0) * 2);
  score += factors.successfulSales;

  // Используем rating для positiveFeedback
  if (user.rating) {
    factors.positiveFeedback = Math.round(20 * (user.rating / 5));
    score += factors.positiveFeedback;
  }

  if (user.is_dealer && user.is_verified) {
    factors.verificationStatus = 12;
  } else if (user.is_verified) {
    factors.verificationStatus = 8;
  }
  score += factors.verificationStatus;

  const reports = await countUserReports(userId);
  factors.negativeReports = -Math.min(30, reports * 10);
  score += factors.negativeReports;

  factors.totalScore = Math.max(0, Math.min(MAX_SCORE, score));

  if (factors.totalScore >= 85) factors.tier = 'premium';
  else if (factors.totalScore >= 70) factors.tier = 'verified';
  else if (factors.totalScore >= 45) factors.tier = 'trusted';
  else factors.tier = 'new';

  return factors;
}

async function countUserReports(userId: string): Promise<number> {
  try {
    // Пробуем разные названия таблиц
    const { count: count1 } = await supabase
      .from('user_reports')
      .select('id', { count: 'exact', head: true })
      .eq('reported_user_id', userId);

    if (count1 !== null) return count1 || 0;

    const { count: count2 } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reported_user_id', userId);

    return count2 || 0;
  } catch {
    return 0;
  }
}

function getDefaultScore(): TrustScoreFactors {
  return {
    phoneVerified: 0,
    hasAvatar: 0,
    accountAge: 0,
    successfulSales: 0,
    positiveFeedback: 0,
    responseRate: 0,
    verificationStatus: 0,
    negativeReports: 0,
    totalScore: 10,
    tier: 'new',
  };
}

// Правила модерации
export const moderationRules = {
  autoApprove: (score: number) => score >= 75,
  requireReview: (score: number) => score < 45,
  blockUploads: (score: number) => score < 20,
  showWarning: (score: number) => score < 40,
};

export const trustScoreService = {
  calculate: calculateTrustScore,
  rules: moderationRules,
};

// Алиасы для совместимости
export function getTrustLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function shouldAutoApproveListing(score: number): boolean {
  return moderationRules.autoApprove(score);
}

export function requireManualReview(score: number): boolean {
  return moderationRules.requireReview(score);
}

export async function updateUserTrustScore(userId: string): Promise<number> {
  const factors = await calculateTrustScore(userId);
  return factors.totalScore;
}
