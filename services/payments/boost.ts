// Сервис для управления BOOST монетизацией

import type { ActiveBoost, BoostPlan, BoostTransaction, BoostType } from '../../types/boost';
import { supabase } from '../supabase';
import { createPayment, type PaymentMethod } from './index';

// Тарифные планы BOOST
// Updated according to CURSOR AI RULES (Jan 30, 2025): 50/200/700/1500 сом
import { BOOST_PRICES } from '../../constants/boostPricing';

export const BOOST_PLANS: BoostPlan[] = [
  {
    id: '3h',
    name: '3 часа',
    emoji: '⚡',
    price: BOOST_PRICES['3h'].price, // 50 сом
    duration: BOOST_PRICES['3h'].durationSeconds / 3600, // hours
    features: [
      'Выделение в ленте',
      'Приоритет в поиске',
      'На 3 часа',
      'Оранжевая рамка',
    ],
    multiplier: 2,
    color: '#FFA500',
    gradient: ['#FFA500', '#FF8C00'],
  },
  {
    id: '24h',
    name: '24 часа',
    emoji: '🔥',
    price: BOOST_PRICES['24h'].price, // 200 сом
    duration: BOOST_PRICES['24h'].durationSeconds / 3600, // hours
    features: [
      'Красная рамка',
      'ТОП позиция',
      'На 24 часа',
      '×3 просмотры',
      'Значок "Горячее"',
    ],
    multiplier: 3,
    color: '#FF3B30',
    gradient: ['#FF3B30', '#FF0000'],
  },
  {
    id: '7d',
    name: '7 дней',
    emoji: '💎',
    price: BOOST_PRICES['7d'].price, // 700 сом
    duration: BOOST_PRICES['7d'].durationSeconds / 3600, // hours (168 hours)
    features: [
      'Золотая рамка',
      'Закреплено вверху',
      'На 7 дней',
      '×5 просмотры',
      'Все значки',
      'Промо на главной',
    ],
    multiplier: 5,
    color: '#FFD700',
    gradient: ['#FFD700', '#FFA500'],
  },
  {
    id: '30d',
    name: '30 дней',
    emoji: '👑',
    price: BOOST_PRICES['30d'].price, // 1500 сом
    duration: BOOST_PRICES['30d'].durationSeconds / 3600, // hours (720 hours)
    features: [
      'Платиновая рамка',
      'Максимальный приоритет',
      'На 30 дней',
      '×10 просмотры',
      'Все значки',
      'Постоянная промо',
      'VIP статус',
    ],
    multiplier: 10,
    color: '#9D4EDD',
    gradient: ['#9D4EDD', '#7B2CBF'],
  },
];

export const boostService = {
  /**
   * Получить все доступные тарифы
   */
  getPlans: () => BOOST_PLANS,

  /**
   * Получить конкретный план
   */
  getPlan(boostType: BoostType): BoostPlan | undefined {
    return BOOST_PLANS.find((plan) => plan.id === boostType);
  },

  /**
   * Создать транзакцию BOOST
   */
  async createBoostTransaction(
    carId: string,
    userId: string,
    boostType: BoostType,
    amount: number,
    paymentMethod: PaymentMethod
  ): Promise<{ success: boolean; transaction?: BoostTransaction; error?: string }> {
    try {
      const plan = this.getPlan(boostType);
      if (!plan) {
        return { success: false, error: 'Invalid boost type' };
      }

      // Получаем текущие просмотры автомобиля
      const { data: car } = await supabase
        .from('listings')
        .select('views_count')
        .eq('id', carId)
        .eq('category', 'car')
        .single();

      const viewsBefore = car?.views_count || 0;

      // Создаем транзакцию в БД
      const { data: transaction, error } = await supabase
        .from('boost_transactions')
        .insert({
          car_id: carId,
          user_id: userId,
          boost_type: boostType,
          amount,
          currency: 'KGS',
          payment_method: paymentMethod,
          status: 'pending',
          duration_hours: plan.duration,
          views_before: viewsBefore,
          views_during: 0,
          views_after: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating boost transaction:', error);
        return { success: false, error: error.message };
      }

      // Создаем платеж
      const paymentResult = await createPayment(paymentMethod, {
        amount,
        currency: 'KGS',
        description: `BOOST ${plan.name} для автомобиля`,
        return_url: `360auto://car/${carId}?boost=success`,
        webhook_url: `https://api.360auto.kg/webhooks/${paymentMethod}`,
        metadata: {
          transaction_id: transaction.id,
          car_id: carId,
          user_id: userId,
          boost_type: boostType,
        },
      });

      if (!paymentResult.success) {
        // Обновляем статус транзакции
        await supabase
          .from('boost_transactions')
          .update({ status: 'failed' })
          .eq('id', transaction.id);

        return { success: false, error: paymentResult.error };
      }

      // Обновляем транзакцию с данными платежа
      const { data: updatedTransaction } = await supabase
        .from('boost_transactions')
        .update({
          payment_id: paymentResult.payment_id,
          payment_url: paymentResult.payment_url,
          status: 'processing',
        })
        .eq('id', transaction.id)
        .select()
        .single();

      return {
        success: true,
        transaction: updatedTransaction as BoostTransaction,
      };
    } catch (error) {
      console.error('Error in createBoostTransaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Активировать BOOST после успешной оплаты
   */
  async activateBoost(transactionId: string): Promise<boolean> {
    try {
      // Получаем транзакцию
      const { data: transaction, error } = await supabase
        .from('boost_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        console.error('Transaction not found:', transactionId);
        return false;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + transaction.duration_hours * 60 * 60 * 1000);

      // Активируем BOOST на автомобиле
      const { error: carError } = await supabase.rpc('update_car_boost', {
        car_uuid: transaction.car_id,
        new_boost_type: transaction.boost_type,
        new_expires_at: expiresAt.toISOString(),
        new_activated_at: now.toISOString(),
      });

      if (carError) {
        console.error('Error activating boost on car:', carError);
        return false;
      }

      // Обновляем статус транзакции
      const { error: updateError } = await supabase
        .from('boost_transactions')
        .update({
          status: 'success',
          activated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in activateBoost:', error);
      return false;
    }
  },

  /**
   * Получить активный BOOST для автомобиля
   */
  async getActiveBoost(carId: string): Promise<ActiveBoost | null> {
    try {
      const { data: car } = await supabase
        .from('listings')
        .select('boost_type, boost_activated_at, boost_expires_at, views_count')
        .eq('id', carId)
        .eq('category', 'car')
        .single();

      if (!car || !car.boost_type || !car.boost_expires_at) {
        return null;
      }

      const expiresAt = new Date(car.boost_expires_at);
      const now = new Date();

      // Проверяем, не истек ли BOOST
      if (expiresAt <= now) {
        return null;
      }

      const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      return {
        car_id: carId,
        type: car.boost_type as BoostType,
        activated_at: car.boost_activated_at || '',
        expires_at: car.boost_expires_at,
        hours_remaining: hoursRemaining,
        views_before: 0, // views_before_boost удалено, используем views_count
        current_views: car.views_count || 0,
      };
    } catch (error) {
      console.error('Error getting active boost:', error);
      return null;
    }
  },

  /**
   * Получить историю BOOST пользователя
   */
  async getBoostHistory(userId: string, limit = 10): Promise<BoostTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('boost_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting boost history:', error);
        return [];
      }

      return (data as BoostTransaction[]) || [];
    } catch (error) {
      console.error('Error in getBoostHistory:', error);
      return [];
    }
  },

  /**
   * Очистить истекшие BOOST (вызывается через cron)
   */
  async cleanupExpiredBoosts(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_boosts');

      if (error) {
        console.error('Error cleaning up expired boosts:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredBoosts:', error);
      return 0;
    }
  },
};

export default boostService;
export type { BoostPlan, BoostTransaction, BoostType };

