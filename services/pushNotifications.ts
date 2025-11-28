// services/pushNotifications.ts — PUSH УРОВНЯ TIKTOK + WHATSAPP + APPLE 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К 1 МЛН ПОЛЬЗОВАТЕЛЕЙ

import { appLogger } from '@/utils/logger';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { requestNotificationsPermissionsSafe, setupNotificationHandlerSafe } from '@/lib/notifications/request-notifications-safe';

// Глобальная настройка (в корне приложения!)
// КРИТИЧНО: expo-notifications не поддерживается в Expo Go на Android (SDK 53+)
// Используем безопасную функцию для настройки handler
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

// Настраиваем handler асинхронно, не блокируя инициализацию
if (!isExpoGo) {
  setupNotificationHandlerSafe().catch((error) => {
    if (__DEV__) {
      appLogger.warn('[Push] Failed to setup notification handler', { error });
    }
  });
}

class PushNotificationService {
  private token: string | null = null;

  /** Регистрация токена — вызывать один раз после логина */
  async registerAsync(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    if (!Device.isDevice) return null;

    // Используем безопасную обёртку для запроса разрешений
    const result = await requestNotificationsPermissionsSafe();

    if (!result.canReceivePush || !result.token) {
      if (result.expoGoWorkaround) {
        appLogger.warn('[Push] Notifications не поддерживаются в Expo Go на Android. Используйте development build.');
      }
      return null;
    }

    this.token = result.token;

    // Сохраняем в профиль (используем users, так как profiles может не существовать)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && result.token) {
      try {
        await supabase.from('users').update({ expo_push_token: result.token }).eq('id', user.id);
      } catch (updateError) {
        // Fallback: если поле не существует, просто логируем
        appLogger.warn('[Push] Failed to save token to users table', { error: updateError });
      }
    }

    appLogger.info('[Push] Token registered', { token: result.token });
    return result.token;
  }

  /** Универсальная отправка (база + push) */
  private async send(
    toUserId: string,
    type: 'like' | 'comment' | 'mention' | 'reaction' | 'message',
    title: string,
    body: string,
    data: Record<string, any> = {}
  ) {
    try {
      // 1. Сохраняем в базу
      await supabase.from('notifications').insert({
        user_id: toUserId,
        type,
        title,
        message: body,
        data,
      });

      // 2. Отправляем push через бэкенд (безопасно!)
      const apiUrl =
        Constants.expoConfig?.extra?.apiUrl ||
        Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
        (__DEV__ ? 'http://192.168.1.16:3001/api' : 'https://api.360auto.kg/api');

      await fetch(`${apiUrl}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: toUserId, title, body, data }),
      });
    } catch (error) {
      appLogger.error('[Push] Send failed', { toUserId, error });
    }
  }

  // Специфичные методы
  notifyLike = (toUserId: string, fromUserName: string, listingId: string, listingTitle: string) =>
    this.send(toUserId, 'like', 'Новый лайк ❤️', `${fromUserName} лайкнул "${listingTitle}"`, {
      listingId,
      action: 'open_listing',
    });

  notifyComment = (toUserId: string, fromUserName: string, listingId: string, comment: string) =>
    this.send(
      toUserId,
      'comment',
      'Новый комментарий 💬',
      `${fromUserName}: "${comment.substring(0, 50)}..."`,
      {
        listingId,
        action: 'open_listing',
      }
    );

  notifyMention = (toUserId: string, fromUserName: string, listingId: string) =>
    this.send(toUserId, 'mention', 'Вас упомянули 📢', `${fromUserName} упомянул вас в комментарии`, {
      listingId,
      action: 'open_listing',
    });

  notifyMessage = (toUserId: string, fromUserName: string, threadId: string) =>
    this.send(toUserId, 'message', 'Новое сообщение', `${fromUserName} написал вам`, {
      threadId,
      action: 'open_chat',
    });

  getToken = () => this.token;
}

export const pushNotifications = new PushNotificationService();

// Авторегистрация при старте (в _layout.tsx)
export const initPushNotifications = () => pushNotifications.registerAsync();

// Алиасы для совместимости
export default pushNotifications;
