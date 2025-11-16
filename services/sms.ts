import Constants from 'expo-constants';
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

/**
 * Обертка для промпта: sendSMS(phone, message)
 * Согласно CursorAI-Prompt.md
 * 
 * Использует реальный SMS сервис (nikita.kg) или тестовый режим
 */
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    // Проверяем режим (тестовый или реальный)
    const useTestMode = process.env.EXPO_PUBLIC_SMS_TEST_MODE === 'true' || 
                       Constants.expoConfig?.extra?.EXPO_PUBLIC_USE_MOCK === 'true';
    
    if (useTestMode) {
      // Тестовый режим - только логируем
      console.log('🧪 Test SMS:', { phone, message });
      return true; // В тестовом режиме всегда успешно
    } else {
      // Реальный режим - используем SMSService из smsReal
      const { SMSService } = await import('./smsReal');
      
      const config = {
        login: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_LOGIN || '',
        password: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_PASSWORD || '',
        sender: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_SENDER || '360Auto',
        apiUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_API_URL || 'https://smspro.nikita.kg/api/message',
      };
      
      if (!config.login || !config.password) {
        console.warn('⚠️ SMS credentials not configured, using test mode');
        return true; // Fallback на тестовый режим
      }
      
      const smsService = new SMSService(config);
      const result = await smsService.sendSMS(phone, message);
      
      return result.success;
    }
  } catch (error) {
    console.error('sendSMS error:', error);
    // Fallback - в случае ошибки возвращаем false
    return false;
  }
}
