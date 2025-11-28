// Test notification utility for Development Build
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { requestNotificationsPermissionsSafe, setupNotificationHandlerSafe } from '@/lib/notifications/request-notifications-safe';

// Configure notification handler (только если не Expo Go)
// Используем безопасную функцию с динамическим импортом
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
if (!isExpoGo) {
  setupNotificationHandlerSafe().catch(() => {
    // Ignore errors in test utility
  });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Используем безопасную обёртку для запроса разрешений
    const result = await requestNotificationsPermissionsSafe();
    
    if (result.expoGoWorkaround) {
      console.warn('Notifications не поддерживаются в Expo Go на Android. Используйте development build.');
      return false;
    }
    
    return result.canReceivePush && result.status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Send a test notification
 */
export async function sendTestNotification(): Promise<void> {
  try {
    // Request permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.error('Cannot send notification: no permission');
      return;
    }

    // Динамический импорт для безопасности
    const Notifications = await import('expo-notifications');

    // Schedule notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚀 Development Build работает!',
        body: 'Expo Development Build успешно настроен. Все нативные модули доступны.',
        data: { test: true, timestamp: Date.now() },
        sound: 'default',
      },
      trigger: null, // Send immediately
    });

    console.log('✅ Test notification sent successfully!');
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}

/**
 * Get device push token (for remote notifications)
 */
export async function getDevicePushToken(): Promise<string | null> {
  try {
    // Используем безопасную обёртку, которая уже получает токен
    const result = await requestNotificationsPermissionsSafe();
    
    if (!result.canReceivePush || !result.token) {
      if (result.expoGoWorkaround) {
        console.warn('Push token недоступен в Expo Go на Android');
      }
      return null;
    }

    console.log('Device Push Token:', result.token);
    return result.token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Setup notification listeners
 * Использует динамический импорт для безопасности
 */
export async function setupNotificationListeners(): Promise<() => void> {
  const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
  
  if (isExpoGo) {
    // В Expo Go возвращаем no-op cleanup
    return () => {};
  }

  try {
    const Notifications = await import('expo-notifications');
    
    // Listener for notifications received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received (foreground):', notification);
      }
    );

    // Listener for user tapping on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;
        if (data?.test) {
          console.log('Test notification was tapped!');
        }
      }
    );

    // Return cleanup function
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  } catch (error) {
    console.error('Error setting up notification listeners:', error);
    return () => {}; // Return no-op cleanup on error
  }
}

