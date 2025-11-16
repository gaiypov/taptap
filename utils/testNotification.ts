// Test notification utility for Development Build
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get notification permissions!');
      return false;
    }
    
    return true;
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
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get project ID from app.json extra.eas.projectId or use default
    const token = await Notifications.getExpoPushTokenAsync({
      // Project ID will be resolved from app.json or environment
    });

    console.log('Device Push Token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners() {
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
}

