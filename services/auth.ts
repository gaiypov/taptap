import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { SMSService } from './smsReal';
import storageService from './storage';
import { db } from './supabase';

const AUTH_USER_KEY = '@360auto:user';

// Реальный SMS сервис
const smsService = new SMSService({
  login: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_LOGIN || 'superapp',
  password: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_PASSWORD || '83fb772ee0799a422cce18ffd5f497b9',
  sender: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_SENDER || 'bat-bat.kg',
  apiUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_API_URL || 'https://smspro.nikita.kg/api/message'
});

export const auth = {
  // ========== SMS АВТОРИЗАЦИЯ ==========
  
  async sendVerificationCode(phone: string): Promise<{
    success: boolean;
    warning?: string;
    testCode?: string;
    codeLength?: number;
    error?: string;
  }> {
    try {
      const formattedPhone = formatKyrgyzPhone(phone);
      if (!formattedPhone) {
        return { success: false, error: 'Неверный формат номера' };
      }
      
      // Отправляем запрос на backend для отправки SMS и сохранения кода
      console.log('🔑 Sending SMS request to backend...');
      const response = await fetch(`${Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.16:3001/api'}/auth/request-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Backend SMS failed:', errorData);
        return {
          success: false,
          error: errorData.message || 'Не удалось отправить SMS',
        };
      }

      const result = await response.json();
      console.log('✅ SMS sent successfully via backend');
      
      return {
        success: true,
        warning: 'SMS отправлено на ваш номер',
        codeLength: 6,
      };
    } catch (error: any) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message || 'Ошибка отправки SMS',
      };
    }
  },
  
  async verifyCode(phone: string, code: string): Promise<{ success: boolean; user?: any; codeLength?: number; error?: string }> {
    try {
      const formattedPhone = formatKyrgyzPhone(phone);
      if (!formattedPhone) {
        return { success: false, error: 'Неверный формат номера' };
      }
      
      const response = await api.auth.verifyCode({ phone: formattedPhone, code });

      if (!response?.success || !response.data?.user || !response.data?.token) {
        return { success: false, error: response?.error || 'Неверный код или код истек' };
      }

      const { user, token, codeLength } = response.data;

      await storageService.setAuthToken(token);

      if (Platform.OS === 'web') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      }

      return { success: true, user, codeLength };
    } catch (error: any) {
      console.error('Verify code error:', error);
      const apiError = error?.response?.data;
      return {
        success: false,
        error: apiError?.error || error.message,
        codeLength: apiError?.codeLength,
      };
    }
  },
  
  async getCurrentUser() {
    try {
      let userData;
      if (Platform.OS === 'web') {
        userData = localStorage.getItem(AUTH_USER_KEY);
      } else {
        userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      }
      
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
  
  async updateCurrentUser(updates: any) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return { success: false, error: 'Не авторизован' };
      
      const { data, error } = await db.updateUser(user.id, updates);
      
      if (error) throw error;
      
      if (Platform.OS === 'web') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
      } else {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
      }
      
      return { success: true, user: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  
  async signOut() {
    if (Platform.OS === 'web') {
      localStorage.removeItem(AUTH_USER_KEY);
    } else {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    }
    await storageService.removeAuthToken();
  },
  
  // ========== ВРЕМЕННАЯ АВТОРИЗАЦИЯ (для разработки) ==========
  
  async getTempUser() {
    return this.getCurrentUser();
  },
  
  async clearTempUser() {
    if (Platform.OS === 'web') {
      localStorage.removeItem(AUTH_USER_KEY);
    } else {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    }
  },
  
  // ========== СОВМЕСТИМОСТЬ С СТАРЫМ API ==========
  
  async signInWithPhone(phone: string, code: string) {
    const result = await this.verifyCode(phone, code);
    return { data: result.user, error: result.error ? new Error(result.error) : null };
  },
  
  async verifyOtp(phone: string, token: string) {
    return this.verifyCode(phone, token);
  },
};

// Форматирование номера КР
function formatKyrgyzPhone(phone: string): string | null {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '996' + cleaned.slice(1);
  }
  
  if (!cleaned.startsWith('996')) {
    cleaned = '996' + cleaned;
  }
  
  if (cleaned.length !== 12) {
    return null;
  }
  
  return '+' + cleaned;
}

export { formatKyrgyzPhone };
