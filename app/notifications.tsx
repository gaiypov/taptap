import NotificationItem from '@/components/Notifications/NotificationItem';
import { auth } from '@/services/auth';
import { notifications as notificationsService, supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LegendList } from '@legendapp/list';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  from_user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  car?: {
    id: string;
    brand: string;
    model: string;
    year: number;
  };
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Load user error:', error);
      setLoading(false);
    }
  };

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!currentUser) return;

      const { data, error } = await notificationsService.get(currentUser.id);

      if (error) throw error;

      if (data) {
        setNotifications(data as Notification[]);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Отметить как прочитанное
      if (!notification.is_read) {
        await notificationsService.markAsRead(notification.id);
        
        // Обновить UI
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      }

      // Перейти по ссылке если есть
      if (notification.action_url) {
        // Парсим URL и извлекаем путь и параметры
        try {
          const url = new URL(notification.action_url, 'app360://');
          const pathname = url.pathname;
          const params: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          
          router.push({
            pathname: pathname as any,
            params,
          });
        } catch (error) {
          console.error('Invalid notification URL:', notification.action_url);
        }
      }
    } catch (error) {
      console.error('Handle notification error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!currentUser) return;

      // Mark all notifications as read directly via supabase
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);

      // Обновить UI
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Уведомления</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Уведомления {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Ionicons name="checkmark-done" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List — LegendList */}
      <LegendList
        data={notifications}
        keyExtractor={(item: Notification) => item.id}
        renderItem={({ item }: { item: Notification }) => (
          <NotificationItem notification={item} onPress={handleNotificationPress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={80} color="#CCC" />
            <Text style={styles.emptyText}>Нет уведомлений</Text>
            <Text style={styles.emptySubtext}>
              Здесь будут отображаться уведомления о лайках, комментариях и сообщениях
            </Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        recycleItems={true}
        drawDistance={500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  markAllButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

