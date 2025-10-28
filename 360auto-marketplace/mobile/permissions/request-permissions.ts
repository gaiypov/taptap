import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

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
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      await AsyncStorage.setItem('notification_permission', 'granted');

      // Настройка обработчика уведомлений
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

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
