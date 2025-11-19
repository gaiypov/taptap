// services/supabase.ts — SUPABASE СЕРВИС УРОВНЯ SUPABASE HQ 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К APP STORE И PLAY MARKET

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { appLogger } from '@/utils/logger';

// === КОНФИГУРАЦИЯ (БЕЗОПАСНО!) ===
const supabaseUrl =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] URL или ANON_KEY не заданы — некоторые функции отключены');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  db: { schema: 'public' },
  global: { headers: { 'x-client-info': '360auto-mobile-v1' } },
});

// === УНИВЕРСАЛЬНЫЙ ХЕЛПЕР ДЛЯ ЗАПРОСОВ ===
const handle = async <T>(
  promise: Promise<T>,
  operation: string
): Promise<{ data: T | null; error: any }> => {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error: any) {
    appLogger.error(`[Supabase] ${operation} failed`, { error: error.message });
    return { data: null, error };
  }
};

// === АУТЕНТИФИКАЦИЯ ===
export const auth = {
  getUser: () => handle(supabase.auth.getUser(), 'auth.getUser'),
  getSession: () => handle(supabase.auth.getSession(), 'auth.getSession'),
  signOut: () => handle(supabase.auth.signOut(), 'auth.signOut'),
  onAuthStateChange: supabase.auth.onAuthStateChange,
};

// === ПОЛЬЗОВАТЕЛИ ===
export const users = {
  getById: (id: string) => handle(supabase.from('users').select('*').eq('id', id).single(), 'users.getById'),
  update: (id: string, updates: any) =>
    handle(supabase.from('users').update(updates).eq('id', id).select().single(), 'users.update'),
};

// === ОБЪЯВЛЕНИЯ (listings) ===
export const listings = {
  get: (id: string) =>
    handle(
      supabase.from('listings').select('*, seller:users!seller_user_id(*)').eq('id', id).single(),
      'listings.get'
    ),
  getByCategory: (category: string, limit = 20) =>
    handle(
      supabase
        .from('listings')
        .select('*, seller:users!seller_user_id(*)')
        .eq('category', category)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit),
      'listings.getByCategory'
    ),
  create: (data: any) => handle(supabase.from('listings').insert(data).select().single(), 'listings.create'),
  update: (id: string, updates: any) =>
    handle(supabase.from('listings').update(updates).eq('id', id).select().single(), 'listings.update'),
};

// === ЛАЙКИ И СОХРАНЕНИЯ ===
export const interactions = {
  like: (userId: string, listingId: string) =>
    handle(supabase.from('listing_likes').insert({ user_id: userId, listing_id: listingId }), 'interactions.like'),
  unlike: (userId: string, listingId: string) =>
    handle(
      supabase.from('listing_likes').delete().match({ user_id: userId, listing_id: listingId }),
      'interactions.unlike'
    ),
  save: (userId: string, listingId: string) =>
    handle(supabase.from('listing_saves').insert({ user_id: userId, listing_id: listingId }), 'interactions.save'),
  unsave: (userId: string, listingId: string) =>
    handle(
      supabase.from('listing_saves').delete().match({ user_id: userId, listing_id: listingId }),
      'interactions.unsave'
    ),
  isLiked: (userId: string, listingId: string) =>
    handle(
      supabase.from('listing_likes').select('id').eq('user_id', userId).eq('listing_id', listingId).maybeSingle(),
      'interactions.isLiked'
    ),
  isSaved: (userId: string, listingId: string) =>
    handle(
      supabase.from('listing_saves').select('id').eq('user_id', userId).eq('listing_id', listingId).maybeSingle(),
      'interactions.isSaved'
    ),
};

// === ЧАТЫ ===
export const chat = {
  getThreads: (userId: string) =>
    handle(
      supabase
        .from('chat_threads')
        .select('*, listing:listings(*), buyer:users!buyer_id(*), seller:users!seller_id(*)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false }),
      'chat.getThreads'
    ),
  getMessages: (threadId: string) =>
    handle(
      supabase
        .from('chat_messages')
        .select('*, sender:users!sender_id(id, name, avatar_url)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true }),
      'chat.getMessages'
    ),
  sendMessage: (threadId: string, senderId: string, body: string) =>
    handle(
      supabase.from('chat_messages').insert({ thread_id: threadId, sender_id: senderId, body }).select().single(),
      'chat.sendMessage'
    ),
};

// === УВЕДОМЛЕНИЯ ===
export const notifications = {
  get: (userId: string, limit = 50) =>
    handle(
      supabase
        .from('notifications')
        .select('*, from_user:users!from_user_id(id, name, avatar_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      'notifications.get'
    ),
  markAsRead: (id: string) =>
    handle(supabase.from('notifications').update({ is_read: true }).eq('id', id), 'notifications.markAsRead'),
  create: (data: any) =>
    handle(supabase.from('notifications').insert(data).select().single(), 'notifications.create'),
};

// === ПИНГ ===
export const ping = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Алиас для совместимости
export const pingSupabase = ping;

// === DB (для совместимости) ===
export const db = {
  getUserById: (id: string) => users.getById(id),
  updateUser: (id: string, updates: any) => users.update(id, updates),
  getListing: (id: string) => listings.get(id),
  createListing: (data: any) => listings.create(data),
  updateListing: (id: string, updates: any) => listings.update(id, updates),
  getUserSaves: (userId: string) =>
    handle(
      supabase
        .from('listing_saves')
        .select('*, listing:listings(*, seller:users!seller_user_id(id, name, avatar_url, is_verified))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'db.getUserSaves'
    ),
  unsaveListing: (userId: string, listingId: string) => interactions.unsave(userId, listingId),
  getUserConversations: (userId: string) =>
    handle(
      supabase
        .from('chat_threads')
        .select(
          '*, listing:listings(id, title, thumbnail_url), buyer:users!buyer_id(id, name, avatar_url), seller:users!seller_id(id, name, avatar_url)'
        )
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false }),
      'db.getUserConversations'
    ),
};

// === STORAGE (для совместимости) ===
export const storage = {
  upload: async (bucket: string, path: string, file: File | Blob) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      appLogger.error('[Supabase] Storage upload failed', { error: error.message });
      return { data: null, error };
    }
  },
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};

// === REALTIME (для совместимости) ===
export const realtime = {
  subscribeToMessages: (threadId: string, callback: (message: any) => void) => {
    const channel = supabase.channel(`thread:${threadId}`);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};

// Инициализация при старте
supabase.auth.onAuthStateChange((event, session) => {
  appLogger.info('[Supabase] Auth state changed', { event, hasSession: !!session });
});

export default supabase;
