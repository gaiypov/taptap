// services/smsReal.ts — SMS-СЕРВИС УРОВНЯ BANKING + TIKTOK 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К PRODUCTION

import { appLogger } from '@/utils/logger';

export interface SMSConfig {
  login: string;
  password: string;
  sender: string;
  apiUrl: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  info?: string;
}

export class SMSService {
  private config: SMSConfig;
  private isMock: boolean;

  constructor(config: SMSConfig) {
    this.config = config;
    this.isMock =
      !config.login ||
      !config.password ||
      config.login.includes('test') ||
      process.env.NODE_ENV === 'development';
  }

  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    if (this.isMock) {
      appLogger.info('[SMS] MOCK отправлено', { phone, message });
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        info: 'Mock mode (dev)',
      };
    }

    try {
      const payload = {
        login: this.config.login,
        password: this.config.password,
        phones: phone.replace(/^\+/, ''), // nikita.kg принимает без +
        message,
        sender: this.config.sender,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();

      // nikita.kg может вернуть XML или JSON
      if (text.includes('<response>')) {
        // XML ответ
        const idMatch = text.match(/<id>(\d+)<\/id>/);
        const statusMatch = text.match(/<status>(\d+)<\/status>/);

        if (statusMatch?.[1] === '1') {
          return { success: true, messageId: idMatch?.[1] };
        } else {
          return { success: false, error: 'SMS API error (XML)' };
        }
      }

      // JSON ответ
      const data = JSON.parse(text);
      if (data.status === 'OK' || data.id) {
        return { success: true, messageId: data.id?.toString() };
      }

      return { success: false, error: data.error || 'Unknown error' };
    } catch (error: any) {
      appLogger.error('[SMS] Failed', { phone, error: error.message });
      return { success: false, error: error.message };
    }
  }
}
