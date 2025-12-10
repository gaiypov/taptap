import { auth } from '@/services/auth';
import { db } from '@/services/supabase';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NotificationBadgeProps {
  size?: number;
  fontSize?: number;
}

export default function NotificationBadge({ size = 18, fontSize = 11 }: NotificationBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) return;

      // TODO: Implement getUnreadNotificationsCount in db service
      // const { count: unreadCount } = await db.getUnreadNotificationsCount(user.id);
      // setCount(unreadCount || 0);
      setCount(0); // Placeholder
    } catch (error) {
      console.error('Load unread count error:', error);
    }
  };

  if (count === 0) return null;

  return (
    <View style={[styles.badge, { width: size, height: size, minWidth: size }]}>
      <Text style={[styles.badgeText, { fontSize }]}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -6,
    right: -6,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});

