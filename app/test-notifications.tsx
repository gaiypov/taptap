// Test screen for Development Build notifications
import { sendTestNotification, setupNotificationListeners } from '@/utils/testNotification';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TestNotificationsScreen() {
  const router = useRouter();

  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  const handleSendTest = async () => {
    try {
      await sendTestNotification();
      Alert.alert('✅ Успех', 'Тестовое уведомление отправлено!');
    } catch (error) {
      Alert.alert('❌ Ошибка', `Не удалось отправить уведомление: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Тест уведомлений</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="notifications" size={48} color="#E31E24" />
          <Text style={styles.cardTitle}>Development Build</Text>
          <Text style={styles.cardSubtitle}>
            Этот экран проверяет работу expo-notifications в Development Build
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSendTest}>
          <LinearGradient
            colors={['#E31E24', '#C91E27']}
            style={styles.buttonGradient}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Отправить тестовое уведомление</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📱 Что проверить:</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>
              Уведомление должно появиться сразу после нажатия кнопки
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>
              Приложение запросит разрешение на уведомления (если еще не запрашивало)
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>
              Если уведомление работает - Development Build настроен правильно!
            </Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={24} color="#FF9500" />
          <Text style={styles.warningText}>
            ⚠️ Этот функционал работает только в Development Build, не в Expo Go!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 16,
    color: '#E31E24',
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2000',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    flex: 1,
    lineHeight: 20,
  },
});

