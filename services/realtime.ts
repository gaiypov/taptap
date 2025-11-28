// services/realtime.ts
// Realtime subscriptions для мгновенных обновлений
// Production Ready — Kyrgyzstan 2025

import { store } from '@/lib/store';
import { AppState } from 'react-native';
import { supabase } from '@/services/supabase';
import { addMessage, markThreadRead, updateThread } from '@/lib/store/slices/chatSlice';
import { updateListingInCache } from '@/lib/store/slices/listingsSlice';

let channels: any[] = [];

export const subscribeToRealtime = async (userId: string) => {
  // Отписываемся от старого (на всякий)
  channels.forEach(ch => {
    try {
      supabase.removeChannel(ch);
    } catch (e) {
      console.warn('Error removing channel:', e);
    }
  });
  channels = [];

  // 1. Чат — новые сообщения
  // Подписываемся на все сообщения, фильтрация по thread_id будет через RLS
  const chatChannel = supabase
    .channel(`chat:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      },
      async (payload) => {
        const msg = payload.new;
        
        // Проверяем доступ к треду через RLS (делаем запрос для проверки)
        const { data: thread } = await supabase
          .from('chat_threads')
          .select('id, buyer_id, seller_id')
          .eq('id', msg.thread_id)
          .single();
        
        // Если тред существует и пользователь имеет доступ
        const threadData = thread as { buyer_id: string; seller_id: string } | null;
        if (threadData && (threadData.buyer_id === userId || threadData.seller_id === userId)) {
          store.dispatch(addMessage({ threadId: msg.thread_id, message: msg as any }));

          // Авто-помечаем как прочитанное, если приложение открыто
          if (AppState.currentState === 'active') {
            store.dispatch(markThreadRead(msg.thread_id));
          }
        }
      }
    )
    .subscribe();

  // 2. Обновления тредов (last_message_at, unread_count)
  // Подписываемся на все треды, RLS отфильтрует доступные
  const threadsChannel = supabase
    .channel(`threads:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_threads',
      },
      (payload) => {
        const thread = payload.new as { id: string; buyer_id?: string; seller_id?: string } | null;
        // RLS уже проверил доступ, обновляем если это наш тред
        if (thread && (thread.buyer_id === userId || thread.seller_id === userId)) {
          store.dispatch(updateThread(thread as any));
        }
      }
    )
    .subscribe();

  // 3. Лайки и сохранения
  // Используем правильные названия таблиц: likes и saves (не listing_likes и listing_saves)
  const interactionsChannel = supabase
    .channel(`interactions:user:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'likes' },
      (payload) => {
        if (payload.new.user_id !== userId) {
          store.dispatch(updateListingInCache({
            id: payload.new.listing_id,
            changes: { likes_count: (payload.new.likes_count || 0) + 1 },
          }));
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'saves' },
      (payload) => {
        if (payload.new.user_id !== userId) {
          store.dispatch(updateListingInCache({
            id: payload.new.listing_id,
            changes: { saves_count: (payload.new.saves_count || 0) + 1 },
          }));
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'likes' },
      (payload) => {
        store.dispatch(updateListingInCache({
          id: payload.old.listing_id,
          changes: { likes_count: Math.max(0, (payload.old.likes_count || 1) - 1) },
        }));
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'saves' },
      (payload) => {
        store.dispatch(updateListingInCache({
          id: payload.old.listing_id,
          changes: { saves_count: Math.max(0, (payload.old.saves_count || 1) - 1) },
        }));
      }
    )
    .subscribe();

  // 4. Статус объявлений (продано, удалено, модерация)
  const listingsChannel = supabase
    .channel('public:listings')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'listings' },
      (payload) => {
        const listing = payload.new;
        if (
          listing.status === 'sold' ||
          listing.status === 'deleted' ||
          listing.moderation_status === 'rejected'
        ) {
          store.dispatch(updateListingInCache({
            id: listing.id,
            changes: listing,
          }));
        }
      }
    )
    .subscribe();

  channels = [chatChannel, threadsChannel, interactionsChannel, listingsChannel];
};

export const unsubscribeFromRealtime = () => {
  channels.forEach(ch => {
    try {
      supabase.removeChannel(ch);
    } catch (e) {
      console.warn('Error removing channel:', e);
    }
  });
  channels = [];
};

