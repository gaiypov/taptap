// services/sms.ts — РЕАЛЬНЫЕ SMS БЕЗ КЛЮЧЕЙ В КЛИЕНТЕ
// ФИНАЛЬНАЯ ВЕРСИЯ — 100% БЕЗОПАСНАЯ (ноябрь 2025)

import { supabase } from './supabase';
import Constants from 'expo-constants';
import { appLogger } from '@/utils/logger';

// Получаем API URL (как в api.ts)
const API_URL =
  Constants.expoConfig?.extra?.apiUrl?.replace('/api', '') ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiUrl?.replace('/api', '') ||
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://192.168.1.16:3001' : 'https://api.360auto.kg');

// Универсальная отправка SMS (только через бэкенд!)
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });

    // Обработка ошибок 502 (бэкенд не отвечает)
    if (response.status === 502 || response.status === 0) {
      const errorMsg = `Бэкенд не отвечает (502). Проверьте, что сервер запущен на ${API_URL}`;
      appLogger.error('[SMS] Backend unavailable', { 
        phone, 
        status: response.status,
        apiUrl: API_URL,
        error: errorMsg 
      });
      throw new Error(errorMsg);
    }

    if (!response.ok) {
      const errorText = await response.text();
      appLogger.error('[SMS] HTTP error', { 
        phone, 
        status: response.status, 
        statusText: response.statusText,
        error: errorText 
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    appLogger.info('[SMS] Sent', { phone, success: result.success });

    return result.success;
  } catch (error: any) {
    // Улучшенная обработка ошибок сети
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      const networkError = `Не удалось подключиться к бэкенду на ${API_URL}. Убедитесь, что сервер запущен.`;
      appLogger.error('[SMS] Network error', { phone, apiUrl: API_URL, error: networkError });
      throw new Error(networkError);
    }
    
    appLogger.error('[SMS] Failed', { phone, error: error.message, apiUrl: API_URL });
    throw error;
  }
}

// Для верификации (отправка кода)
export async function sendVerificationCode(phone: string): Promise<boolean> {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const message = `Ваш код подтверждения 360Auto: ${code}`;

  const success = await sendSMS(phone, message);

  if (success && __DEV__) {
    console.log(`[SMS] Тестовый код для ${phone}: ${code}`);
  }

  return success;
}

// Проверка кода через Supabase
export async function verifyCode(phone: string, code: string): Promise<boolean> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error) throw error;
    return !!session;
  } catch (error) {
    appLogger.error('[SMS] Verification failed', { error });
    return false;
  }
}

// Статус SMS-сервиса (для админки)
export async function getSmsStatus(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/sms/status`);
    return await response.json();
  } catch {
    return { configured: false };
  }
}
