// Интеграция с Mbank для приема платежей

import type { PaymentRequest, PaymentResponse, PaymentStatus } from '@/types/boost';

const MBANK_API_URL = process.env.MBANK_API_URL || 'https://api.mbank.kg';
const MBANK_API_KEY = process.env.MBANK_API_KEY || '';
const MBANK_MERCHANT_ID = process.env.MBANK_MERCHANT_ID || '';

export const mbankPayment = {
  /**
   * Создание нового платежа
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // В production это будет реальный API запрос
      if (!MBANK_API_KEY || MBANK_API_KEY === 'test_key') {
        // Development mode - возвращаем mock данные
        return {
          success: true,
          payment_id: `mbank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payment_url: `https://pay.mbank.kg/checkout?id=mock_${Date.now()}`,
          status: 'pending',
          message: 'Payment created (DEV MODE)',
        };
      }

      const response = await fetch(`${MBANK_API_URL}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MBANK_API_KEY}`,
          'X-Merchant-ID': MBANK_MERCHANT_ID,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency || 'KGS',
          description: request.description,
          return_url: request.return_url,
          webhook_url: request.webhook_url,
          metadata: request.metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          status: 'failed',
          error: error.message || 'Failed to create payment',
        };
      }

      const data = await response.json();

      return {
        success: true,
        payment_id: data.id,
        payment_url: data.payment_url,
        status: 'pending',
      };
    } catch (error) {
      console.error('Mbank payment creation error:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Проверка статуса платежа
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // Development mode
      if (!MBANK_API_KEY || MBANK_API_KEY === 'test_key') {
        return {
          payment_id: paymentId,
          status: 'success',
          amount: 150,
          currency: 'KGS',
          paid_at: new Date().toISOString(),
        };
      }

      const response = await fetch(`${MBANK_API_URL}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MBANK_API_KEY}`,
          'X-Merchant-ID': MBANK_MERCHANT_ID,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();

      return {
        payment_id: paymentId,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        paid_at: data.paid_at,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Mbank status check error:', error);
      return {
        payment_id: paymentId,
        status: 'failed',
      };
    }
  },

  /**
   * Отмена платежа
   */
  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      // Development mode
      if (!MBANK_API_KEY || MBANK_API_KEY === 'test_key') {
        return true;
      }

      const response = await fetch(`${MBANK_API_URL}/v1/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MBANK_API_KEY}`,
          'X-Merchant-ID': MBANK_MERCHANT_ID,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Mbank payment cancellation error:', error);
      return false;
    }
  },
};

export type { PaymentRequest, PaymentResponse, PaymentStatus };
