import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import storageService from './storage';
import { db } from './supabase';

const AUTH_USER_KEY = '@360auto:user';

// Примечание: SMS отправка теперь выполняется через backend API
// SMSService больше не используется напрямую на клиенте

export const auth = {
  // ========== TOKEN MANAGEMENT ==========
  
  async loadToken(): Promise<string | null> {
    try {
      return await storageService.getAuthToken();
    } catch (error) {
      console.error('Load token error:', error);
      return null;
    }
  },
  
  async validateToken(token: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      // Уменьшен таймаут для web - быстрая валидация
      const timeout = setTimeout(() => controller.abort(), 2000);
      const url = `${Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.16:3001/api'}/auth/validate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const result = await response.json().catch(() => ({}));
      return result.success === true;
    } catch (error) {
      // Не логируем ошибки валидации на web - они не критичны
      if (Platform.OS !== 'web') {
        console.error('Validate token error:', error);
      }
      return false;
    }
  },
  
  // ========== SMS АВТОРИЗАЦИЯ ==========
  
  async sendVerificationCode(phone: string): Promise<{
    success: boolean;
    warning?: string;
    testCode?: string;
    codeLength?: number;
    error?: string;
  }> {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      if (!formattedPhone) {
        return { success: false, error: 'Неверный формат номера' };
      }
      
      // Отправляем запрос на backend для отправки SMS и сохранения кода
      console.log('🔑 Sending SMS request to backend...');
      
      // Добавляем таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут
      
      try {
        const response = await fetch(`${Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.16:3001/api'}/auth/request-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: formattedPhone,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

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
          codeLength: 4, // 4-значный код для nikita.kg
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      // Проверка на сетевые ошибки
      const isNetworkError = 
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('network') ||
        error?.name === 'AbortError' ||
        error?.name === 'TimeoutError' ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNREFUSED';

      if (isNetworkError) {
        console.warn('[Auth] Network error sending SMS:', error?.message || 'Network request failed');
        return {
          success: false,
          error: 'Проблема с подключением к сети. Проверьте интернет и попробуйте снова.',
        };
      }

      // Для других ошибок логируем как обычно
      console.error('[Auth] SMS sending error:', error);
      return {
        success: false,
        error: error?.message || 'Ошибка отправки SMS. Попробуйте позже.',
      };
    }
  },
  
  async verifyCode(phone: string, code: string): Promise<{ success: boolean; user?: any; codeLength?: number; error?: string }> {
    try {
      const formattedPhone = formatPhoneNumber(phone);
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

// Форматирование номера для разных стран
function formatPhoneNumber(phone: string): string | null {
  let cleaned = phone.replace(/\D/g, '');
  
  // Определяем страну по коду
  if (cleaned.startsWith('996') || cleaned.startsWith('0') || phone.startsWith('+996')) {
    // Кыргызстан: +996 9 цифр
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
  
  if (cleaned.startsWith('7') || cleaned.startsWith('8') || phone.startsWith('+7')) {
    // Казахстан/Россия: +7 10 цифр
    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('7')) {
      cleaned = '7' + cleaned;
    }
    if (cleaned.length !== 11) {
      return null;
    }
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('998') || phone.startsWith('+998')) {
    // Узбекистан: +998 9 цифр
    if (cleaned.length !== 12) {
      return null;
    }
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('992') || phone.startsWith('+992')) {
    // Таджикистан: +992 9 цифр
    if (cleaned.length !== 12) {
      return null;
    }
    return '+' + cleaned;
  }
  
  // Fallback на КР формат для совместимости
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

// Обратная совместимость
function formatKyrgyzPhone(phone: string): string | null {
  return formatPhoneNumber(phone);
}

export { formatKyrgyzPhone, formatPhoneNumber };
