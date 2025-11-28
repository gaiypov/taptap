import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { appLogger } from '@/utils/logger';

export interface NotificationPermissionResult {
  status: 'granted' | 'denied' | 'undetermined';
  canReceivePush: boolean;
  token?: string;
  expoGoWorkaround?: boolean;
}

/**
 * Безопасный запрос разрешений на уведомления
 * Работает в Expo Go на Android (возвращает undetermined без краша)
 * В dev-build / продакшене работает полноценно
 * 
 * КРИТИЧНО: Использует динамический импорт expo-notifications внутри функции,
 * чтобы избежать красного экрана в Expo Go на Android
 */
export async function requestNotificationsPermissionsSafe(): Promise<NotificationPermissionResult> {
  // Expo Go на Android — пуши недоступны
  // Проверяем через executionEnvironment для более точного определения
  const isExpoGo = Constants.executionEnvironment === 'storeClient' || 
                   (Platform.OS === 'android' && Constants.appOwnership === 'expo');

  if (Platform.OS === 'android' && isExpoGo) {
    if (__DEV__) {
      appLogger.warn('[Notifications] Disabled on Android Expo Go');
    }
    return {
      status: 'undetermined' as const,
      canReceivePush: false,
      expoGoWorkaround: true,
    };
  }

  // Dev-build / продакшен - используем динамический импорт
  try {
    // Динамический импорт внутри функции - не вызывает краш в Expo Go
    const Notifications = await import('expo-notifications');
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { status: finalStatus, canReceivePush: false };
    }

    // Получаем токен только если разрешение получено
    if (Platform.OS !== 'web') {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data ?? tokenData;

      return {
        status: finalStatus,
        canReceivePush: true,
        token,
      };
    }

    return {
      status: finalStatus,
      canReceivePush: true,
    };
  } catch (error) {
    if (__DEV__) {
      appLogger.error('[Notifications] Error requesting permissions', { error });
    }
    return {
      status: 'denied' as const,
      canReceivePush: false,
    };
  }
}

/**
 * Безопасная настройка обработчика уведомлений
 * Использует динамический импорт для Expo Go совместимости
 */
export async function setupNotificationHandlerSafe(): Promise<void> {
  const isExpoGo = Constants.executionEnvironment === 'storeClient' || 
                   (Platform.OS === 'android' && Constants.appOwnership === 'expo');

  if (isExpoGo) {
    return; // Не настраиваем в Expo Go
  }

  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    if (__DEV__) {
      appLogger.warn('[Notifications] Failed to setup handler', { error });
    }
  }
}

