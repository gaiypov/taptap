// Главный модуль для работы с платежами

import type { PaymentRequest, PaymentResponse, PaymentStatus } from '@/types/boost';
import { bakaiBankPayment } from './bakaibank';
import { mbankPayment } from './mbank';
import { obankPayment } from './obank';
import { optimaBankPayment } from './optimabank';

export type PaymentMethod = 'mbank' | 'bakai' | 'obank' | 'optima';

// Унифицированный интерфейс для всех платежных систем
export const paymentGateways = {
  mbank: mbankPayment,
  bakai: bakaiBankPayment,
  obank: obankPayment,
  optima: optimaBankPayment,
};

/**
 * Создать платеж через выбранную систему
 */
export async function createPayment(
  method: PaymentMethod,
  request: PaymentRequest
): Promise<PaymentResponse> {
  const gateway = paymentGateways[method];
  if (!gateway) {
    return {
      success: false,
      status: 'failed',
      error: `Unknown payment method: ${method}`,
    };
  }

  return gateway.createPayment(request);
}

/**
 * Проверить статус платежа
 */
export async function checkPaymentStatus(
  method: PaymentMethod,
  paymentId: string
): Promise<PaymentStatus> {
  const gateway = paymentGateways[method];
  if (!gateway) {
    return {
      payment_id: paymentId,
      status: 'failed',
    };
  }

  if ('checkPaymentStatus' in gateway) {
    return gateway.checkPaymentStatus(paymentId);
  } else if ('checkStatus' in gateway) {
    return gateway.checkStatus(paymentId);
  }

  return {
    payment_id: paymentId,
    status: 'failed',
  };
}

/**
 * Получить список доступных методов оплаты
 */
export function getAvailablePaymentMethods() {
  return [
    {
      id: 'mbank' as PaymentMethod,
      name: 'Mbank',
      description: 'Банковские карты',
      icon: '💳',
      enabled: true,
    },
    {
      id: 'bakai' as PaymentMethod,
      name: 'Bakai Bank (Balance)',
      description: 'Электронный кошелек',
      icon: '💰',
      enabled: true,
    },
    {
      id: 'obank' as PaymentMethod,
      name: 'O!Bank',
      description: 'Онлайн банкинг',
      icon: '🏦',
      enabled: true,
    },
    {
      id: 'optima' as PaymentMethod,
      name: 'Optima Bank',
      description: 'Банковский перевод',
      icon: '🏛️',
      enabled: true,
    },
  ];
}

// Экспорт индивидуальных сервисов
export {
    bakaiBankPayment, mbankPayment, obankPayment,
    optimaBankPayment
};

// Экспорт типов
    export type { PaymentRequest, PaymentResponse, PaymentStatus };

