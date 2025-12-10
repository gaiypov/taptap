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
  const errorMsg = '[Supabase] ❌ CRITICAL: URL или ANON_KEY не заданы — некоторые функции отключены';
  console.error(errorMsg, {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlSource: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ? 'expoConfig' : 
               process.env.EXPO_PUBLIC_SUPABASE_URL ? 'process.env' : 'none',
    keySource: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'expoConfig' : 
               process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'process.env' : 'none',
  });
  if (__DEV__) {
    // В dev режиме показываем предупреждение более явно
    console.warn('⚠️ Проверьте настройки в app.json или .env файле');
  }
}

// ВАЖНО: На web Supabase использует localStorage автоматически, на мобильных - AsyncStorage
// Не передаем storage на web, чтобы Supabase использовал встроенный localStorage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // На web не передаем storage (Supabase использует localStorage автоматически)
    // На мобильных платформах используем AsyncStorage
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // detectSessionInUrl только на web (для OAuth редиректов)
    detectSessionInUrl: Platform.OS === 'web',
  },
  db: { schema: 'public' },
  global: { headers: { 'x-client-info': '360auto-mobile-v1' } },
});

// === УНИВЕРСАЛЬНЫЙ ХЕЛПЕР ДЛЯ ЗАПРОСОВ ===
// FIXED: Supabase query builder returns { data, error }, not just data
const handle = async <T>(
  promise: PromiseLike<{ data: T; error: any }> | Promise<{ data: T; error: any }>,
  operation: string
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await promise;

    // Supabase returns { data, error } - extract and return properly
    if (result.error) {
      appLogger.error(`[Supabase] ${operation} failed`, { error: result.error.message });
      return { data: null, error: result.error };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    appLogger.error(`[Supabase] ${operation} exception`, { error: error.message });
    return { data: null, error };
  }
};

// === АУТЕНТИФИКАЦИЯ ===
export const auth = {
  getUser: () => supabase.auth.getUser(),
  getSession: () => supabase.auth.getSession(),
  signOut: () => supabase.auth.signOut(),
  onAuthStateChange: supabase.auth.onAuthStateChange.bind(supabase.auth),
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
  // Используем upsert с ignoreDuplicates чтобы избежать ошибки duplicate key
  like: (userId: string, listingId: string) =>
    handle(
      supabase.from('listing_likes').upsert(
        { user_id: userId, listing_id: listingId },
        { onConflict: 'user_id,listing_id', ignoreDuplicates: true }
      ),
      'interactions.like'
    ),
  unlike: (userId: string, listingId: string) =>
    handle(
      supabase.from('listing_likes').delete().match({ user_id: userId, listing_id: listingId }),
      'interactions.unlike'
    ),
  // Используем upsert с ignoreDuplicates чтобы избежать ошибки duplicate key
  save: (userId: string, listingId: string) =>
    handle(
      supabase.from('listing_saves').upsert(
        { user_id: userId, listing_id: listingId },
        { onConflict: 'user_id,listing_id', ignoreDuplicates: true }
      ),
      'interactions.save'
    ),
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
  markAsRead: (threadId: string, userId: string) =>
    handle(
      supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .neq('sender_id', userId),
      'chat.markAsRead'
    ),
  getOrCreateThread: async (buyerId: string, sellerId: string, listingId: string) => {
    // Сначала проверяем, есть ли уже тред
    const existing = await handle(
      supabase
        .from('chat_threads')
        .select('*')
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .eq('listing_id', listingId)
        .maybeSingle(),
      'chat.getOrCreateThread.check'
    );
    
    if (existing.data) {
      return existing;
    }
    
    // Создаем новый тред
    return handle(
      supabase
        .from('chat_threads')
        .insert({ buyer_id: buyerId, seller_id: sellerId, listing_id: listingId })
        .select()
        .single(),
      'chat.getOrCreateThread.create'
    );
  },
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
        .select('*, listing:listings!listing_saves_listing_id_fkey(*, seller:users!seller_user_id(id, name, avatar_url, is_verified))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'db.getUserSaves'
    ),
  unsaveListing: (userId: string, listingId: string) => interactions.unsave(userId, listingId),
  saveListing: (userId: string, listingId: string) => interactions.save(userId, listingId),
  likeListing: (userId: string, listingId: string) => interactions.like(userId, listingId),
  unlikeListing: (userId: string, listingId: string) => interactions.unlike(userId, listingId),
  checkUserLiked: (userId: string, listingId: string) => interactions.isLiked(userId, listingId),
  checkUserSaved: (userId: string, listingId: string) => interactions.isSaved(userId, listingId),
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
  getChatMessages: (threadId: string) => chat.getMessages(threadId),
  markChatMessagesAsRead: (threadId: string, userId: string) => chat.markAsRead(threadId, userId),
  getOrCreateConversation: (buyerId: string, sellerId: string, listingId: string) => 
    chat.getOrCreateThread(buyerId, sellerId, listingId),
  getSellerListings: (sellerId: string) =>
    handle(
      supabase
        .from('listings')
        .select('*')
        .eq('seller_user_id', sellerId)
        .order('created_at', { ascending: false }),
      'db.getSellerListings'
    ),
  countUserListings: async (userId: string) => {
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_user_id', userId)
      .in('status', ['active', 'published']);
    
    if (error) {
      return { data: null, error };
    }
    
    return { data: count ?? 0, error: null };
  },
  incrementPaidSlots: async (userId: string) => {
    // Try RPC first, fallback to manual increment
    const rpcResult = await handle(
      supabase.rpc('increment_paid_slots', { user_id: userId }),
      'db.incrementPaidSlots'
    );
    
    if (!rpcResult.error) return rpcResult;
    
    // Fallback: get current value and increment
    const { data: user } = await supabase
      .from('users')
      .select('paid_slots')
      .eq('id', userId)
      .single();
    
    const currentSlots = (user?.paid_slots as number) || 0;
    return handle(
      supabase
        .from('users')
        .update({ paid_slots: currentSlots + 1 })
        .eq('id', userId),
      'db.incrementPaidSlots.fallback'
    );
  },
  getUserPayments: (userId: string) =>
    handle(
      supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'db.getUserPayments'
    ),
  // === SELLER INFO ===
  getSellerInfo: (userId: string) =>
    handle(
      supabase.from('seller_info').select('*').eq('user_id', userId).maybeSingle(),
      'db.getSellerInfo'
    ),
  createSellerInfo: (userId: string, data: any = {}) =>
    handle(
      supabase.from('seller_info').insert({ user_id: userId, ...data }).select().single(),
      'db.createSellerInfo'
    ),
  updateSellerInfo: (userId: string, updates: any) =>
    handle(
      supabase.from('seller_info').update(updates).eq('user_id', userId).select().single(),
      'db.updateSellerInfo'
    ),
  getOrCreateSellerInfo: async (userId: string) => {
    // Try to get existing
    const existing = await handle(
      supabase.from('seller_info').select('*').eq('user_id', userId).maybeSingle(),
      'db.getOrCreateSellerInfo.check'
    );
    if (existing.data) {
      return existing;
    }
    // Create if not exists
    return handle(
      supabase.from('seller_info').insert({ user_id: userId }).select().single(),
      'db.getOrCreateSellerInfo.create'
    );
  },

  // === PROFILE WITH STATS (VIEW) ===
  getProfileWithStats: (userId: string) =>
    handle(
      supabase.from('user_profile_with_stats').select('*').eq('id', userId).single(),
      'db.getProfileWithStats'
    ),

  // === LISTING STATS ===
  getListingStats: (listingId: string) =>
    handle(
      supabase.from('listing_stats').select('*').eq('listing_id', listingId).maybeSingle(),
      'db.getListingStats'
    ),
  incrementListingCalls: (listingId: string) =>
    handle(
      supabase.rpc('increment_listing_calls', { p_listing_id: listingId }),
      'db.incrementListingCalls'
    ),
  incrementListingMessages: (listingId: string) =>
    handle(
      supabase.rpc('increment_listing_messages', { p_listing_id: listingId }),
      'db.incrementListingMessages'
    ),

  // === USER LISTINGS WITH STATS ===
  getUserListingsWithStats: (userId: string, status?: string) =>
    handle(
      status
        ? supabase
            .from('listings')
            .select('*, stats:listing_stats(*)')
            .eq('seller_user_id', userId)
            .eq('status', status)
            .order('created_at', { ascending: false })
        : supabase
            .from('listings')
            .select('*, stats:listing_stats(*)')
            .eq('seller_user_id', userId)
            .order('created_at', { ascending: false }),
      'db.getUserListingsWithStats'
    ),

  getUserBoosts: async (userId: string) => {
    try {
      // Получаем boost транзакции
      const { data: transactions, error: txError } = await supabase
        .from('boost_transactions')
        .select('*, listing:listings(id, title, category, price, seller_user_id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (txError) {
        appLogger.warn('[getUserBoosts] Error loading boost_transactions', { error: txError });
        // Fallback: попробуем через promotions таблицу
        const { data: promotions, error: promoError } = await supabase
          .from('promotions')
          .select('*, listing:listings(id, title, category, price, seller_user_id)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (promoError) {
          return { data: [], error: promoError };
        }

        return { data: promotions || [], error: null };
      }

      return { data: transactions || [], error: null };
    } catch (error: any) {
      appLogger.error('[getUserBoosts] Error', { error });
      return { data: [], error };
    }
  },
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
  appLogger.info('[Supabase] Auth state changed', { 
    event, 
    hasSession: !!session,
    userId: session?.user?.id,
  });
  
  // Логируем важные события
  if (event === 'SIGNED_IN' && session) {
    console.log('[Supabase] ✅ User signed in:', session.user.id);
  } else if (event === 'SIGNED_OUT') {
    console.log('[Supabase] 👋 User signed out');
  } else if (event === 'TOKEN_REFRESHED' && session) {
    console.log('[Supabase] 🔄 Token refreshed for user:', session.user.id);
  }
});

// ============================================================================
// Consents Service (согласия пользователя)
// ============================================================================

export const consents = {
  async upsertUserConsents(data: Record<string, any>) {
    const { error } = await supabase
      .from('user_consents')
      .upsert({
        ...data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    
    return { error };
  },

  async getUserConsents(userId: string) {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return { data, error };
  },
};

export default supabase;
