// Webhook обработчики для платежных систем

import type { PaymentMethod } from '@/types/boost';
import { supabase } from '../supabase';
import { boostService } from './boost';

interface WebhookRequest {
  headers: Record<string, string>;
  body: any;
  ip?: string;
}

/**
 * Логирование webhook запроса
 */
async function logWebhook(
  source: PaymentMethod,
  event: string,
  paymentId: string | undefined,
  request: WebhookRequest,
  response: any,
  success: boolean,
  error?: string
) {
  try {
    await supabase.from('webhook_logs').insert({
      source,
      event,
      payment_id: paymentId,
      headers: request.headers,
      body: request.body,
      response,
      ip_address: request.ip,
      success,
      error,
    });
  } catch (err) {
    console.error('Error logging webhook:', err);
  }
}

/**
 * Обработчик webhook от Mbank
 */
export async function handleMbankWebhook(request: WebhookRequest) {
  try {
    const { payment_id, status, metadata } = request.body;

    const response = { received: true };

    if (status === 'success' || status === 'paid') {
      const transactionId = metadata?.transaction_id;

      if (transactionId) {
        // Активируем BOOST
        const activated = await boostService.activateBoost(transactionId);

        await logWebhook(
          'mbank',
          'payment.success',
          payment_id,
          request,
          response,
          activated,
          activated ? undefined : 'Failed to activate boost'
        );

        return { success: true, activated };
      }
    }

    await logWebhook('mbank', `payment.${status}`, payment_id, request, response, true);

    return { success: true };
  } catch (error) {
    await logWebhook(
      'mbank',
      'error',
      undefined,
      request,
      {},
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return { success: false, error };
  }
}

/**
 * Обработчик webhook от Bakai Bank
 */
export async function handleBakaiWebhook(request: WebhookRequest) {
  try {
    const { invoice_id, status, metadata } = request.body;

    const response = { received: true };

    if (status === 'paid') {
      const transactionId = metadata?.transaction_id;

      if (transactionId) {
        const activated = await boostService.activateBoost(transactionId);

        await logWebhook(
          'bakai',
          'invoice.paid',
          invoice_id,
          request,
          response,
          activated,
          activated ? undefined : 'Failed to activate boost'
        );

        return { success: true, activated };
      }
    }

    await logWebhook('bakai', `invoice.${status}`, invoice_id, request, response, true);

    return { success: true };
  } catch (error) {
    await logWebhook(
      'bakai',
      'error',
      undefined,
      request,
      {},
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return { success: false, error };
  }
}

/**
 * Обработчик webhook от O!Bank
 */
export async function handleOBankWebhook(request: WebhookRequest) {
  try {
    const { transaction_id, status, custom_data } = request.body;

    const response = { received: true };

    if (status === 'completed') {
      const transactionId = custom_data?.transaction_id;

      if (transactionId) {
        const activated = await boostService.activateBoost(transactionId);

        await logWebhook(
          'obank',
          'transaction.completed',
          transaction_id,
          request,
          response,
          activated,
          activated ? undefined : 'Failed to activate boost'
        );

        return { success: true, activated };
      }
    }

    await logWebhook('obank', `transaction.${status}`, transaction_id, request, response, true);

    return { success: true };
  } catch (error) {
    await logWebhook(
      'obank',
      'error',
      undefined,
      request,
      {},
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return { success: false, error };
  }
}

/**
 * Обработчик webhook от Optima Bank
 */
export async function handleOptimaWebhook(request: WebhookRequest) {
  try {
    const { payment_id, payment_status, extra_params } = request.body;

    const response = { received: true };

    if (payment_status === 'success') {
      const transactionId = extra_params?.transaction_id;

      if (transactionId) {
        const activated = await boostService.activateBoost(transactionId);

        await logWebhook(
          'optima',
          'payment.success',
          payment_id,
          request,
          response,
          activated,
          activated ? undefined : 'Failed to activate boost'
        );

        return { success: true, activated };
      }
    }

    await logWebhook('optima', `payment.${payment_status}`, payment_id, request, response, true);

    return { success: true };
  } catch (error) {
    await logWebhook(
      'optima',
      'error',
      undefined,
      request,
      {},
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return { success: false, error };
  }
}

/**
 * Роутер для всех webhook'ов
 */
export const webhookHandlers = {
  mbank: handleMbankWebhook,
  bakai: handleBakaiWebhook,
  obank: handleOBankWebhook,
  optima: handleOptimaWebhook,
};
