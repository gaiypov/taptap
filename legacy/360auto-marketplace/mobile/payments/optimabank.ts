// Интеграция с Optima Bank для приема платежей

import type { PaymentRequest, PaymentResponse, PaymentStatus } from '@/types/boost';

const OPTIMA_API_URL = process.env.OPTIMA_API_URL || 'https://api.optimabank.kg';
const OPTIMA_MERCHANT_ID = process.env.OPTIMA_MERCHANT_ID || '';
const OPTIMA_SECRET_KEY = process.env.OPTIMA_SECRET_KEY || '';

export const optimaBankPayment = {
  /**
   * Создание платежа через Optima Bank
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Development mode
      if (!OPTIMA_SECRET_KEY || OPTIMA_SECRET_KEY === 'test_key') {
        return {
          success: true,
          payment_id: `optima_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payment_url: `https://pay.optimabank.kg/payment?id=mock_${Date.now()}`,
          status: 'pending',
          message: 'Payment created (DEV MODE)',
        };
      }

      const response = await fetch(`${OPTIMA_API_URL}/v1/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': OPTIMA_MERCHANT_ID,
          'X-Secret-Key': OPTIMA_SECRET_KEY,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency || 'KGS',
          description: request.description,
          success_redirect: request.return_url,
          webhook_endpoint: request.webhook_url,
          extra_params: request.metadata,
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
        payment_id: data.payment_id,
        payment_url: data.checkout_url,
        status: 'pending',
      };
    } catch (error) {
      console.error('Optima Bank payment creation error:', error);
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
  async checkStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // Development mode
      if (!OPTIMA_SECRET_KEY || OPTIMA_SECRET_KEY === 'test_key') {
        return {
          payment_id: paymentId,
          status: 'success',
          amount: 150,
          currency: 'KGS',
          paid_at: new Date().toISOString(),
        };
      }

      const response = await fetch(`${OPTIMA_API_URL}/v1/payments/${paymentId}/status`, {
        method: 'GET',
        headers: {
          'X-Merchant-ID': OPTIMA_MERCHANT_ID,
          'X-Secret-Key': OPTIMA_SECRET_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();

      return {
        payment_id: paymentId,
        status: data.payment_status,
        amount: data.amount,
        currency: data.currency,
        paid_at: data.payment_date,
        metadata: data.extra_params,
      };
    } catch (error) {
      console.error('Optima Bank status check error:', error);
      return {
        payment_id: paymentId,
        status: 'failed',
      };
    }
  },
};
