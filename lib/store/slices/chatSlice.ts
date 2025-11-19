// lib/store/slices/chatSlice.ts
// Chat state management with Realtime support

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message: string;
  attachment_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

interface ChatThread {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  business_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count_buyer?: number;
  unread_count_seller?: number;
  created_at: string;
  updated_at: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    thumbnail_url?: string | null;
  };
  buyer?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  seller?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  business?: {
    id: string;
    company_name: string;
    company_logo_url?: string | null;
  };
  messages?: ChatMessage[];
}

interface ChatState {
  threads: ChatThread[];
  currentThreadId: string | null;
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  threads: [],
  currentThreadId: null,
  currentUserId: null,
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setThreads(state, action: PayloadAction<ChatThread[]>) {
      state.threads = action.payload;
    },
    addThread(state, action: PayloadAction<ChatThread>) {
      const existing = state.threads.find(t => t.id === action.payload.id);
      if (!existing) {
        state.threads.push(action.payload);
      }
    },
    updateThread(state, action: PayloadAction<Partial<ChatThread> & { id: string }>) {
      const thread = state.threads.find(t => t.id === action.payload.id);
      if (thread) {
        Object.assign(thread, action.payload);
      }
    },
    addMessage(state, action: PayloadAction<{ threadId: string; message: ChatMessage }>) {
      const { threadId, message } = action.payload;
      const thread = state.threads.find(t => t.id === threadId);
      if (thread) {
        if (!thread.messages) {
          thread.messages = [];
        }
        // Добавляем в начало (новые сообщения сверху)
        thread.messages.unshift(message);
        thread.last_message = message.message;
        thread.last_message_at = message.created_at;
        
        // Увеличиваем счетчик непрочитанных, если сообщение не от текущего пользователя
        if (message.sender_id !== state.currentUserId) {
          if (state.currentUserId === thread.buyer_id) {
            thread.unread_count_buyer = (thread.unread_count_buyer || 0) + 1;
          } else if (state.currentUserId === thread.seller_id) {
            thread.unread_count_seller = (thread.unread_count_seller || 0) + 1;
          }
        }
      }
    },
    markThreadRead(state, action: PayloadAction<string>) {
      const threadId = action.payload;
      const thread = state.threads.find(t => t.id === threadId);
      if (thread) {
        if (state.currentUserId === thread.buyer_id) {
          thread.unread_count_buyer = 0;
        } else if (state.currentUserId === thread.seller_id) {
          thread.unread_count_seller = 0;
        }
      }
    },
    setCurrentThread(state, action: PayloadAction<string | null>) {
      state.currentThreadId = action.payload;
    },
    setCurrentUserId(state, action: PayloadAction<string | null>) {
      state.currentUserId = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setThreads,
  addThread,
  updateThread,
  addMessage,
  markThreadRead,
  setCurrentThread,
  setCurrentUserId,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;

