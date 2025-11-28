import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { requestNotificationsPermissionsSafe, setupNotificationHandlerSafe } from '@/lib/notifications/request-notifications-safe';

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      // Получить текущую локацию
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Сохранить координаты
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      await AsyncStorage.setItem('user_location', JSON.stringify(locationData));
      await AsyncStorage.setItem('location_permission', 'granted');

      return true;
    }

    await AsyncStorage.setItem('location_permission', 'denied');
    return false;
  } catch (error) {
    console.error('Location permission error:', error);
    await AsyncStorage.setItem('location_permission', 'denied');
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // Используем безопасную обёртку для запроса разрешений
    const result = await requestNotificationsPermissionsSafe();

    if (result.expoGoWorkaround) {
      console.warn('[requestNotificationPermission] Notifications не поддерживаются в Expo Go на Android. Используйте development build.');
      await AsyncStorage.setItem('notification_permission', 'denied');
      return false;
    }

    if (result.status === 'granted' && result.canReceivePush) {
      await AsyncStorage.setItem('notification_permission', 'granted');

      // Настройка обработчика уведомлений (только если не Expo Go)
      // Используем безопасную функцию с динамическим импортом
      await setupNotificationHandlerSafe();

      return true;
    }

    await AsyncStorage.setItem('notification_permission', 'denied');
    return false;
  } catch (error) {
    console.error('Notification permission error:', error);
    await AsyncStorage.setItem('notification_permission', 'denied');
    return false;
  }
}

export async function hasLocationPermission(): Promise<boolean> {
  try {
    const permission = await AsyncStorage.getItem('location_permission');
    return permission === 'granted';
  } catch {
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const permission = await AsyncStorage.getItem('notification_permission');
    return permission === 'granted';
  } catch {
    return false;
  }
}

export async function getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const locationStr = await AsyncStorage.getItem('user_location');
    if (!locationStr) return null;
    
    return JSON.parse(locationStr);
  } catch {
    return null;
  }
}
