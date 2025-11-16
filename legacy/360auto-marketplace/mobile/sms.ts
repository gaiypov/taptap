import { auth } from './auth';
import { api } from './api';

interface SmsStatus {
  configured: boolean;
  provider: string;
  sender: string | null;
  apiUrl: string | null;
  exposesTestCodes: boolean;
  codeLength?: number;
  hasLogin?: boolean;
  hasPassword?: boolean;
}

export const smsService = {
  async sendVerificationCode(phone: string) {
    return auth.sendVerificationCode(phone);
  },

  async verifyCode(phone: string, code: string) {
    const result = await auth.verifyCode(phone, code);
    return result.success;
  },

  async getStatus(): Promise<SmsStatus | null> {
    try {
      const response = await api.auth.getSmsStatus();
      const payload = response?.data ?? response;
      if (!payload?.status) {
        return null;
      }
      return {
        ...payload.status,
        codeLength: payload.codeLength,
      };
    } catch (error) {
      console.error('Failed to fetch SMS status:', error);
      return null;
    }
  },

  async sendSMS() {
    throw new Error('Отправка произвольных SMS недоступна из клиента. Используйте админ-интерфейс.');
  },
};
