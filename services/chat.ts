// services/chat.ts
// Полный сервис для работы с чатом

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ==============================================
// TYPES
// ==============================================

export interface ChatThread {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  buyer?: ChatUser;
  seller?: ChatUser;
  listing?: ChatListing;
  unread_count?: number;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface ChatListing {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  thumbnail_url?: string;
  category?: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  sender?: ChatUser;
}

export interface FormattedConversation {
  id: string;
  other_user: ChatUser;
  last_message: {
    text: string;
    created_at: string;
  };
  unread_count: number;
  listing?: ChatListing;
}

// ==============================================
// CHAT SERVICE
// ==============================================

class ChatService {
  private threadsChannel: RealtimeChannel | null = null;
  private messagesChannel: RealtimeChannel | null = null;

  // ==========================================
  // GET THREADS (LIST OF CONVERSATIONS)
  // ==========================================

  async getThreads(userId: string): Promise<ChatThread[]> {
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select(`
          *,
          listing:listings(id, title, price, currency, thumbnail_url, category),
          buyer:users!buyer_id(id, name, avatar_url),
          seller:users!seller_id(id, name, avatar_url)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Add unread count for each thread
      const threadsWithUnread = await Promise.all(
        (data || []).map(async (thread: any) => {
          const unreadCount = await this.getUnreadCount(thread.id, userId);
          return { ...thread, unread_count: unreadCount };
        })
      );

      return threadsWithUnread as ChatThread[];
    } catch (error) {
      console.error('[ChatService] getThreads error:', error);
      throw error;
    }
  }

  // Format threads for UI
  formatConversations(threads: ChatThread[], currentUserId: string): FormattedConversation[] {
    return threads
      .filter((t) => t && t.id)
      .map((thread) => {
        const isBuyer = thread.buyer?.id === currentUserId;
        const otherUser = isBuyer ? thread.seller : thread.buyer;

        return {
          id: thread.id,
          other_user: {
            id: otherUser?.id || 'unknown',
            name: otherUser?.name || 'Пользователь',
            avatar_url: otherUser?.avatar_url,
          },
          last_message: {
            text: thread.last_message || 'Начните общение',
            created_at: thread.last_message_at || thread.created_at,
          },
          unread_count: thread.unread_count || 0,
          listing: thread.listing,
        };
      });
  }

  // ==========================================
  // GET MESSAGES
  // ==========================================

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!sender_id(id, name, avatar_url)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []) as ChatMessage[];
    } catch (error) {
      console.error('[ChatService] getMessages error:', error);
      throw error;
    }
  }

  // ==========================================
  // GET THREAD BY ID
  // ==========================================

  async getThread(threadId: string): Promise<ChatThread | null> {
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select(`
          *,
          listing:listings(id, title, price, currency, thumbnail_url, category),
          buyer:users!buyer_id(id, name, avatar_url),
          seller:users!seller_id(id, name, avatar_url)
        `)
        .eq('id', threadId)
        .single();

      if (error) throw error;

      return data as ChatThread;
    } catch (error) {
      console.error('[ChatService] getThread error:', error);
      return null;
    }
  }

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  async sendMessage(threadId: string, senderId: string, body: string): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          sender_id: senderId,
          body: body.trim(),
        })
        .select(`
          *,
          sender:users!sender_id(id, name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update thread's last_message
      await supabase
        .from('chat_threads')
        .update({
          last_message: body.trim().substring(0, 100),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', threadId);

      return data as ChatMessage;
    } catch (error) {
      console.error('[ChatService] sendMessage error:', error);
      throw error;
    }
  }

  // ==========================================
  // MARK AS READ
  // ==========================================

  async markAsRead(threadId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('[ChatService] markAsRead error:', error);
    }
  }

  // ==========================================
  // GET UNREAD COUNT
  // ==========================================

  async getUnreadCount(threadId: string, userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('[ChatService] getUnreadCount error:', error);
      return 0;
    }
  }

  // Total unread across all threads
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      // Get all threads where user is buyer or seller
      const { data: threads, error: threadsError } = await supabase
        .from('chat_threads')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (threadsError) throw threadsError;

      if (!threads || threads.length === 0) return 0;

      const threadIds = threads.map((t) => t.id);

      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('thread_id', threadIds)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('[ChatService] getTotalUnreadCount error:', error);
      return 0;
    }
  }

  // ==========================================
  // GET OR CREATE THREAD
  // ==========================================

  async getOrCreateThread(
    buyerId: string,
    sellerId: string,
    listingId: string
  ): Promise<ChatThread> {
    try {
      // Check if thread exists
      const { data: existing, error: checkError } = await supabase
        .from('chat_threads')
        .select(`
          *,
          listing:listings(id, title, price, currency, thumbnail_url, category),
          buyer:users!buyer_id(id, name, avatar_url),
          seller:users!seller_id(id, name, avatar_url)
        `)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .eq('listing_id', listingId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        return existing as ChatThread;
      }

      // Create new thread
      const { data: newThread, error: createError } = await supabase
        .from('chat_threads')
        .insert({
          buyer_id: buyerId,
          seller_id: sellerId,
          listing_id: listingId,
        })
        .select(`
          *,
          listing:listings(id, title, price, currency, thumbnail_url, category),
          buyer:users!buyer_id(id, name, avatar_url),
          seller:users!seller_id(id, name, avatar_url)
        `)
        .single();

      if (createError) throw createError;

      return newThread as ChatThread;
    } catch (error) {
      console.error('[ChatService] getOrCreateThread error:', error);
      throw error;
    }
  }

  // ==========================================
  // REALTIME SUBSCRIPTIONS
  // ==========================================

  // Subscribe to messages in a thread
  subscribeToMessages(
    threadId: string,
    callbacks: {
      onMessage?: (message: ChatMessage) => void;
      onRead?: (messageId: string) => void;
    }
  ): () => void {
    this.unsubscribeFromMessages();

    this.messagesChannel = supabase
      .channel(`chat_messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          // Fetch full message with sender
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:users!sender_id(id, name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callbacks.onMessage?.(data as ChatMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          if (payload.new.is_read && !payload.old.is_read) {
            callbacks.onRead?.(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => this.unsubscribeFromMessages();
  }

  unsubscribeFromMessages(): void {
    if (this.messagesChannel) {
      supabase.removeChannel(this.messagesChannel);
      this.messagesChannel = null;
    }
  }

  // Subscribe to thread updates (for messages list)
  subscribeToThreads(
    userId: string,
    callbacks: {
      onUpdate?: (thread: ChatThread) => void;
      onNewMessage?: (threadId: string) => void;
    }
  ): () => void {
    this.unsubscribeFromThreads();

    this.threadsChannel = supabase
      .channel(`chat_threads:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_threads',
        },
        async (payload) => {
          // Check if this thread belongs to user
          const thread = payload.new as any;
          if (thread.buyer_id === userId || thread.seller_id === userId) {
            // Fetch full thread with joins
            const fullThread = await this.getThread(thread.id);
            if (fullThread) {
              callbacks.onUpdate?.(fullThread);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const message = payload.new as any;
          // Notify about new message in thread
          callbacks.onNewMessage?.(message.thread_id);
        }
      )
      .subscribe();

    return () => this.unsubscribeFromThreads();
  }

  unsubscribeFromThreads(): void {
    if (this.threadsChannel) {
      supabase.removeChannel(this.threadsChannel);
      this.threadsChannel = null;
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'сейчас';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} д`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
}

// Export singleton
export const chatService = new ChatService();
export default chatService;

