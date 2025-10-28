// Интеграция с Bakai Bank (Balance) для приема платежей

import type { PaymentRequest, PaymentResponse, PaymentStatus } from '@/types/boost';

const BAKAI_API_URL = process.env.BAKAI_API_URL || 'https://balance.kg/api';
const BAKAI_MERCHANT_ID = process.env.BAKAI_MERCHANT_ID || '';
const BAKAI_SECRET_KEY = process.env.BAKAI_SECRET_KEY || '';

export const bakaiBankPayment = {
  /**
   * Создание счета для оплаты через Balance
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Development mode
      if (!BAKAI_SECRET_KEY || BAKAI_SECRET_KEY === 'test_key') {
        return {
          success: true,
          payment_id: `bakai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payment_url: `https://balance.kg/pay?invoice=mock_${Date.now()}`,
          status: 'pending',
          message: 'Invoice created (DEV MODE)',
        };
      }

      const response = await fetch(`${BAKAI_API_URL}/v1/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': BAKAI_MERCHANT_ID,
          'X-Secret-Key': BAKAI_SECRET_KEY,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency || 'KGS',
          description: request.description,
          success_url: request.return_url,
          callback_url: request.webhook_url,
          metadata: request.metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          status: 'failed',
          error: error.message || 'Failed to create invoice',
        };
      }

      const data = await response.json();

      return {
        success: true,
        payment_id: data.invoice_id,
        payment_url: data.payment_url,
        status: 'pending',
      };
    } catch (error) {
      console.error('Bakai Bank payment creation error:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Проверка статуса счета
   */
  async checkStatus(invoiceId: string): Promise<PaymentStatus> {
    try {
      // Development mode
      if (!BAKAI_SECRET_KEY || BAKAI_SECRET_KEY === 'test_key') {
        return {
          payment_id: invoiceId,
          status: 'success',
          amount: 150,
          currency: 'KGS',
          paid_at: new Date().toISOString(),
        };
      }

      const response = await fetch(`${BAKAI_API_URL}/v1/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'X-Merchant-ID': BAKAI_MERCHANT_ID,
          'X-Secret-Key': BAKAI_SECRET_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check invoice status');
      }

      const data = await response.json();

      return {
        payment_id: invoiceId,
        status: data.status === 'paid' ? 'success' : data.status,
        amount: data.amount,
        currency: data.currency,
        paid_at: data.paid_at,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Bakai Bank status check error:', error);
      return {
        payment_id: invoiceId,
        status: 'failed',
      };
    }
  },
};
