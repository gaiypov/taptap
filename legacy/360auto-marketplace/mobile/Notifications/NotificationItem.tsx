import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export default function NotificationItem({ notification, onPress }: NotificationItemProps) {

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return { name: 'heart', color: '#FF3B30' };
      case 'comment':
        return { name: 'chatbubble', color: '#007AFF' };
      case 'message':
        return { name: 'mail', color: '#34C759' };
      case 'save':
        return { name: 'bookmark', color: '#FFD60A' };
      case 'follow':
        return { name: 'person-add', color: '#5856D6' };
      case 'car_sold':
        return { name: 'checkmark-circle', color: '#34C759' };
      case 'price_drop':
        return { name: 'trending-down', color: '#FF9500' };
      default:
        return { name: 'notifications', color: '#999' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} д назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const icon = getIcon();
  const userName = notification.from_user?.name || 'Пользователь';
  const avatarUrl =
    notification.from_user?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=007AFF&color=fff`;

  return (
    <TouchableOpacity
      style={[styles.container, !notification.is_read && styles.containerUnread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      {/* Icon or Avatar */}
      {notification.from_user ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>{getTimeAgo(notification.created_at)}</Text>
      </View>

      {/* Unread Indicator */}
      {!notification.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  containerUnread: {
    backgroundColor: '#F7F9FC',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    marginTop: 4,
  },
});

