import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { appLogger } from '@/utils/logger';
import { api } from './api';
import storageService from './storage';
import { db } from './supabase';
import { finalizeAuthSession } from './authFinalizer';

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
      // Используем localhost для web, IP для мобильных устройств
      // Используем Platform.OS вместо typeof window для лучшей совместимости
      const isWeb = Platform.OS === 'web';
      const apiUrl = 
        Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
        process.env.EXPO_PUBLIC_API_URL ||
        Constants.expoConfig?.extra?.apiUrl || 
        Constants.manifest2?.extra?.expoClient?.extra?.apiUrl || 
        (isWeb ? 'http://localhost:3001/api' : 'http://192.168.1.16:3001/api');
      console.log('🔑 Sending SMS request to backend...', { apiUrl, phone: formattedPhone });
      
      // Добавляем таймаут для запроса (увеличено до 45 секунд для SMS API)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 секунд таймаут (SMS API может быть медленным)
      
      try {
        const response = await fetch(`${apiUrl}/auth/request-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            phone: formattedPhone,
          }),
        });
        
        clearTimeout(timeoutId);

        // Обработка ошибок 502 (бэкенд не отвечает)
        if (response.status === 502 || response.status === 0) {
          const errorMsg = `Бэкенд не отвечает (502). Проверьте, что сервер запущен на ${apiUrl}`;
          console.error('❌ Backend unavailable:', { 
            status: response.status,
            apiUrl,
            error: errorMsg 
          });
          return {
            success: false,
            error: errorMsg,
          };
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Backend SMS failed:', { 
            status: response.status, 
            statusText: response.statusText,
            error: errorData,
            apiUrl 
          });
          return {
            success: false,
            error: errorData.error || errorData.message || `Ошибка сервера: ${response.status}`,
          };
        }

        const result = await response.json();
        console.log('✅ SMS sent successfully via backend', result);
        
        // Извлекаем testCode из data, если есть (только в development)
        const testCode = result.data?.testCode;
        
        return {
          success: true,
          warning: result.data?.warning || 'SMS отправлено на ваш номер',
          codeLength: 4, // 4-значный код для nikita.kg
          ...(testCode ? { testCode } : {}), // Возвращаем testCode только если есть
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // AbortError - это нормальный таймаут
        if (fetchError?.name === 'AbortError' || fetchError?.message?.includes('Aborted')) {
          console.warn('⏱️ SMS request timeout (45s) - возможно, SMS API медленно отвечает');
          // Возвращаем ошибку, но не бросаем исключение - пусть внешний catch обработает
          return {
            success: false,
            error: 'Сервер не ответил вовремя. SMS может быть отправлено, но ответ задержался. Попробуйте запросить код снова или проверьте SMS на телефоне.',
          };
        }
        
        // Для других ошибок логируем детально
        console.error('❌ SMS request fetch error:', fetchError);
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
        const apiUrl = 
          Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
          process.env.EXPO_PUBLIC_API_URL ||
          Constants.expoConfig?.extra?.apiUrl || 
          Constants.manifest2?.extra?.expoClient?.extra?.apiUrl || 
          (Platform.OS === 'web' ? 'http://localhost:3001/api' : 'http://192.168.1.16:3001/api');
        
        console.warn('[Auth] Network error sending SMS:', { 
          error: error?.message || 'Network request failed',
          apiUrl 
        });
        
        const errorMsg = error?.code === 'ECONNREFUSED' || error?.message?.includes('502')
          ? `Бэкенд не отвечает на ${apiUrl}. Запустите сервер: cd backend && npm run dev`
          : 'Проблема с подключением к сети. Проверьте интернет и попробуйте снова.';
        
        return {
          success: false,
          error: errorMsg,
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
  
  async verifyCode(phone: string, code: string): Promise<{ success: boolean; user?: any; token?: string; codeLength?: number; error?: string }> {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      if (!formattedPhone) {
        console.error('[Auth] ❌ Invalid phone format:', phone);
        return { success: false, error: 'Неверный формат номера' };
      }
      
      console.log('[AuthService] 🔑 Verifying SMS code...', { 
        phone: formattedPhone, 
        codeLength: code.length,
        code: code.substring(0, 2) + '**', // Показываем только первые 2 цифры для безопасности
      });
      
      let response;
      try {
        console.log('[AuthService] 🔄 Calling API...');
        response = await api.auth.verifyCode({ phone: formattedPhone, code });
        console.log('[AuthService] ✅ API response received:', {
          success: response?.success,
          hasData: !!response?.data,
          hasUser: !!response?.data?.user,
          hasToken: !!response?.data?.token,
        });
      } catch (apiError: any) {
        // Обработка ошибок axios
        const isNetworkError = 
          !apiError?.response && 
          (apiError?.code === 'ECONNREFUSED' || 
           apiError?.code === 'ETIMEDOUT' || 
           apiError?.code === 'ENOTFOUND' ||
           apiError?.message === 'Network Error' ||
           apiError?.message?.includes('Network request failed') ||
           apiError?.isNetworkError);

        console.error('[Auth] ❌ API verify code error:', {
          message: apiError?.message,
          status: apiError?.response?.status,
          statusText: apiError?.response?.statusText,
          data: apiError?.response?.data,
          isNetworkError,
          code: apiError?.code,
          error: apiError,
        });

        const errorData = apiError?.response?.data || apiError?.data || {};
        
        // Более понятное сообщение для network errors
        let errorMessage = errorData.error || errorData.message || apiError?.message || 'Ошибка проверки кода';
        if (isNetworkError) {
          errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету и что бекенд запущен.';
        }

        return {
          success: false,
          error: errorMessage,
          codeLength: errorData.codeLength,
        };
      }
      
      console.log('[Auth] 📦 Verify code response structure:', { 
        success: response?.success, 
        hasUser: !!response?.data?.user, 
        hasToken: !!response?.data?.token,
        userKeys: response?.data?.user ? Object.keys(response.data.user) : [],
      });

      if (!response?.success || !response.data?.user || !response.data?.token) {
        console.error('[Auth] ❌ Verify code failed - missing data:', { 
          success: response?.success, 
          error: response?.error,
          hasUser: !!response?.data?.user,
          hasToken: !!response?.data?.token,
          responseData: response?.data,
        });
        return { success: false, error: response?.error || 'Неверный код или код истек' };
      }

      const { user, token, codeLength } = response.data;
      
      console.log('[Auth] ✅ Verification successful, finalizing session...', {
        userId: user.id,
        userPhone: user.phone,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...',
      });

      // КРИТИЧНО: Используем authFinalizer для гарантированной записи в storage
      try {
        console.log('[AuthService] 🔄 Finalizing auth session...');
        const session = await finalizeAuthSession(token, user);

        appLogger.info('User authenticated successfully', { 
          userId: session.user.id, 
          phone: session.user.phone 
        });
        
        console.log('[AuthService] ✅✅✅ Session finalized - storage guaranteed');
        console.log('[AuthService] Returning session to React component for Redux dispatch and navigation');
        
        // Возвращаем финализированную сессию
        return { 
          success: true, 
          user: session.user, 
          token: session.token, 
          codeLength 
        };
      } catch (finalizeError: any) {
        // Если финализация не удалась, логируем и возвращаем ошибку
        console.error('[Auth] ❌ Failed to finalize auth session:', {
          message: finalizeError?.message,
          stack: finalizeError?.stack,
          details: finalizeError,
        });
        appLogger.error('Failed to finalize auth session', { 
          error: finalizeError, 
          userId: user.id 
        });
        
        // Возвращаем ошибку - компонент должен обработать
        return { 
          success: false, 
          error: finalizeError?.message || 'Не удалось сохранить данные авторизации. Попробуйте еще раз.',
          codeLength 
        };
      }
    } catch (error: any) {
      appLogger.error('Verify code error', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        code: error?.code,
      });
      
      // Обработка сетевых ошибок
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
        return {
          success: false,
          error: 'Проблема с подключением к сети. Проверьте интернет и попробуйте снова.',
        };
      }

      const apiError = error?.response?.data || error?.data;
      return {
        success: false,
        error: apiError?.error || error?.message || 'Ошибка проверки кода',
        codeLength: apiError?.codeLength,
      };
    }
  },
  
  async getCurrentUser() {
    try {
      // Try storageService first (primary)
      const { default: storageService } = await import('./storage');
      const userData = await storageService.getUserData();
      
      if (userData && userData.id) {
        return userData;
      }
      
      // Fallback to legacy key for compatibility
      let legacyData;
      if (Platform.OS === 'web') {
        legacyData = localStorage.getItem(AUTH_USER_KEY);
      } else {
        legacyData = await AsyncStorage.getItem(AUTH_USER_KEY);
      }
      
      if (legacyData) {
        try {
          const parsed = JSON.parse(legacyData);
          if (parsed && parsed.id) {
            // Migrate to storageService
            await storageService.setUserData(parsed).catch(() => {
              // Non-critical - log but don't fail
            });
            return parsed;
          }
        } catch (parseError) {
          appLogger.warn('[Auth] Failed to parse legacy user data', { error: parseError });
        }
      }
      
      // No user data found - return null (DO NOT throw)
      return null;
    } catch (error: any) {
      // Log warning only once, don't throw
      appLogger.warn('[Auth] getCurrentUser error (non-critical)', { 
        error: error?.message 
      });
      return null;
    }
  },
  
  async updateCurrentUser(updates: any) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return { success: false, error: 'Не авторизован' };
      
      console.log('[Auth] 🔄 Updating user:', { userId: user.id, updates });
      const { data, error } = await db.updateUser(user.id, updates);
      
      if (error) {
        console.error('[Auth] ❌ Failed to update user in DB:', error);
        throw error;
      }
      
      if (!data) {
        console.error('[Auth] ❌ No data returned from updateUser');
        return { success: false, error: 'Не удалось обновить пользователя' };
      }
      
      const userData = data as { id: string; name?: string; [key: string]: any };
      console.log('[Auth] ✅ User updated in DB:', { userId: userData.id, name: userData.name });
      
      // КРИТИЧНО: Сохраняем через storageService для консистентности
      const { default: storageService } = await import('./storage');
      await storageService.setUserData(data);
      console.log('[Auth] ✅ User data saved to storage');
      
      // Также сохраняем в старом формате для совместимости
      if (Platform.OS === 'web') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
      } else {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
      }
      
      return { success: true, user: data };
    } catch (error: any) {
      console.error('[Auth] ❌ updateCurrentUser error:', error);
      return { success: false, error: error.message || 'Ошибка обновления пользователя' };
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
