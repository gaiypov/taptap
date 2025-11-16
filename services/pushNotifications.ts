import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from './supabase';

// Настройка поведения уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotification {
  title: string;
  body: string;
  data?: any;
}

class PushNotificationService {
  private expoPushToken: string | null = null;

  // Регистрация устройства для push-уведомлений
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Web не поддерживает push-уведомления через expo-notifications
      if (Platform.OS === 'web') {
        if (__DEV__) {
          console.log('[PushNotifications] Web platform detected - skipping push token registration');
        }
        return null;
      }
      
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Замените на ваш projectId из app.json
      });

      this.expoPushToken = token.data;

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Отправка локального уведомления (для тестирования)
  async sendLocalNotification(notification: PushNotification) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      },
      trigger: null, // Отправить немедленно
    });
  }

  // Уведомление о новом лайке
  async notifyNewLike(toUserId: string, fromUserId: string, carId: string, carName: string) {
    try {
      // Получаем имя пользователя, который лайкнул
      const { data: fromUser } = await db.getUserById(fromUserId);
      
      if (!fromUser) return;

      await db.createNotification(
        toUserId,
        'like',
        'Новый лайк ❤️',
        `${fromUser.name} лайкнул ваше объявление ${carName}`,
        {
          carId,
          fromUserId,
          actionUrl: `/car/${carId}`,
        }
      );

      // Отправить push-уведомление
      // В production здесь будет отправка через Expo Push API
      console.log(`Push notification sent to user ${toUserId}`);
    } catch (error) {
      console.error('Error sending like notification:', error);
    }
  }

  // Уведомление о новом комментарии
  async notifyNewComment(
    toUserId: string,
    fromUserId: string,
    carId: string,
    carName: string,
    commentText: string
  ) {
    try {
      const { data: fromUser } = await db.getUserById(fromUserId);
      
      if (!fromUser) return;

      await db.createNotification(
        toUserId,
        'comment',
        'Новый комментарий 💬',
        `${fromUser.name} прокомментировал ваше объявление: "${commentText.substring(0, 50)}..."`,
        {
          carId,
          fromUserId,
          actionUrl: `/car/${carId}`,
        }
      );

      console.log(`Push notification sent to user ${toUserId}`);
    } catch (error) {
      console.error('Error sending comment notification:', error);
    }
  }

  // Уведомление об упоминании
  async notifyMention(
    toUserId: string,
    fromUserId: string,
    carId: string,
    commentText: string
  ) {
    try {
      const { data: fromUser } = await db.getUserById(fromUserId);
      
      if (!fromUser) return;

      await db.createNotification(
        toUserId,
        'mention',
        'Вас упомянули 📢',
        `${fromUser.name} упомянул вас в комментарии: "${commentText.substring(0, 50)}..."`,
        {
          carId,
          fromUserId,
          actionUrl: `/car/${carId}`,
        }
      );

      console.log(`Mention notification sent to user ${toUserId}`);
    } catch (error) {
      console.error('Error sending mention notification:', error);
    }
  }

  // Уведомление о реакции на комментарий
  async notifyCommentReaction(
    toUserId: string,
    fromUserId: string,
    carId: string,
    emoji: string
  ) {
    try {
      const { data: fromUser } = await db.getUserById(fromUserId);
      
      if (!fromUser) return;

      await db.createNotification(
        toUserId,
        'reaction',
        'Реакция на комментарий',
        `${fromUser.name} отреагировал ${emoji} на ваш комментарий`,
        {
          carId,
          fromUserId,
          actionUrl: `/car/${carId}`,
        }
      );

      console.log(`Reaction notification sent to user ${toUserId}`);
    } catch (error) {
      console.error('Error sending reaction notification:', error);
    }
  }

  // Слушатель уведомлений
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Слушатель нажатий на уведомления
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Получить текущий токен
  getToken(): string | null {
    return this.expoPushToken;
  }
}

export const pushNotifications = new PushNotificationService();
export default pushNotifications;

