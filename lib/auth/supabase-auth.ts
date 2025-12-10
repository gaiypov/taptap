import { supabase } from '@/services/supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizePhoneNumber, validateE164 } from '@/utils/phoneNormalizer';

export async function sendSMSCode(phone: string) {
  try {
    // Нормализуем номер телефона
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Неверный формат номера телефона',
      };
    }

    // Валидация E.164 формата
    if (!validateE164(normalizedPhone)) {
      return {
        success: false,
        error: 'Номер телефона должен быть в формате E.164 (+996XXXXXXXXX)',
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        channel: 'sms',
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[Supabase Auth] Send SMS error:', error);
    return {
      success: false,
      error: error.message || 'Не удалось отправить SMS',
    };
  }
}

export async function verifySMSCode(phone: string, code: string) {
  try {
    // Нормализуем номер телефона
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Неверный формат номера телефона',
      };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: code.trim(),
      type: 'sms',
    });

    if (error) throw error;

    // Сохранить телефон для автологина (используем правильное хранилище для платформы)
    if (data.session) {
      if (Platform.OS === 'web') {
        // На web используем localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('auth_phone', normalizedPhone);
        }
      } else {
        // На мобильных используем AsyncStorage
        await AsyncStorage.setItem('auth_phone', normalizedPhone);
      }
    }

    return { success: true, session: data.session };
  } catch (error: any) {
    console.error('[Supabase Auth] Verify SMS error:', error);
    return {
      success: false,
      error: error.message || 'Неверный код',
    };
  }
}

export async function checkAutoLogin() {
  try {
    // Проверить текущую сессию
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      return { success: true, session: data.session };
    }

    return { success: false };
  } catch (error) {
    console.error('Auto-login error:', error);
    return { success: false };
  }
}

export async function logout() {
  try {
    await supabase.auth.signOut();
    // Удаляем сохраненный телефон (используем правильное хранилище для платформы)
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auth_phone');
      }
    } else {
      await AsyncStorage.removeItem('auth_phone');
    }
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

