// hooks/useUnreadMessages.ts
// Хук для отслеживания непрочитанных сообщений

import { useCallback, useEffect, useState } from 'react';
import { chatService } from '@/services/chat';
import { useAppSelector } from '@/lib/store/hooks';
import { supabase } from '@/services/supabase';

interface UseUnreadMessagesOptions {
  pollInterval?: number; // Интервал обновления в мс (0 = без polling)
}

export function useUnreadMessages(options: UseUnreadMessagesOptions = {}) {
  const { pollInterval = 0 } = options;
  const { user } = useAppSelector((state) => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Загрузка количества непрочитанных
  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const count = await chatService.getTotalUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('[useUnreadMessages] Error loading count:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Начальная загрузка
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Polling (опционально)
  useEffect(() => {
    if (pollInterval <= 0 || !user?.id) return;

    const interval = setInterval(loadUnreadCount, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, user?.id, loadUnreadCount]);

  // Real-time подписка на новые сообщения
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`unread_messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          // Если сообщение не от нас - увеличиваем счётчик
          if (payload.new.sender_id !== user.id) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          // Если сообщение помечено как прочитанное
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Принудительное обновление
  const refresh = useCallback(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Сбросить счётчик
  const markAllAsRead = useCallback(async () => {
    // TODO: Implement batch mark as read if needed
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    loading,
    refresh,
    markAllAsRead,
    hasUnread: unreadCount > 0,
  };
}

export default useUnreadMessages;

