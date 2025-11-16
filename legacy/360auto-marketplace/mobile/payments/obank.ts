// Интеграция с O!Bank для приема платежей

import type { PaymentRequest, PaymentResponse, PaymentStatus } from '@/types/boost';

const OBANK_API_URL = process.env.OBANK_API_URL || 'https://api.obank.kg';
const OBANK_API_KEY = process.env.OBANK_API_KEY || '';
const OBANK_MERCHANT_ID = process.env.OBANK_MERCHANT_ID || '';

export const obankPayment = {
  /**
   * Создание транзакции O!Bank
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Development mode
      if (!OBANK_API_KEY || OBANK_API_KEY === 'test_key') {
        return {
          success: true,
          payment_id: `obank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payment_url: `https://pay.obank.kg/transaction?id=mock_${Date.now()}`,
          status: 'pending',
          message: 'Transaction created (DEV MODE)',
        };
      }

      const response = await fetch(`${OBANK_API_URL}/v1/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${OBANK_API_KEY}`,
          'X-Merchant-ID': OBANK_MERCHANT_ID,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency || 'KGS',
          description: request.description,
          redirect_url: request.return_url,
          notification_url: request.webhook_url,
          custom_data: request.metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          status: 'failed',
          error: error.message || 'Failed to create transaction',
        };
      }

      const data = await response.json();

      return {
        success: true,
        payment_id: data.transaction_id,
        payment_url: data.payment_link,
        status: 'pending',
      };
    } catch (error) {
      console.error('O!Bank payment creation error:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Проверка статуса транзакции
   */
  async checkStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      // Development mode
      if (!OBANK_API_KEY || OBANK_API_KEY === 'test_key') {
        return {
          payment_id: transactionId,
          status: 'success',
          amount: 150,
          currency: 'KGS',
          paid_at: new Date().toISOString(),
        };
      }

      const response = await fetch(`${OBANK_API_URL}/v1/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `ApiKey ${OBANK_API_KEY}`,
          'X-Merchant-ID': OBANK_MERCHANT_ID,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check transaction status');
      }

      const data = await response.json();

      // O!Bank использует свои статусы
      const statusMap: Record<string, any> = {
        'completed': 'success',
        'pending': 'pending',
        'processing': 'processing',
        'failed': 'failed',
        'cancelled': 'cancelled',
      };

      return {
        payment_id: transactionId,
        status: statusMap[data.status] || 'pending',
        amount: data.amount,
        currency: data.currency,
        paid_at: data.completed_at,
        metadata: data.custom_data,
      };
    } catch (error) {
      console.error('O!Bank status check error:', error);
      return {
        payment_id: transactionId,
        status: 'failed',
      };
    }
  },
};
