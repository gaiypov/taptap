// services/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type PostgrestError } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Получаем конфигурацию из app.json или env
const supabaseUrl = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  '';
const supabaseAnonKey = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('📋 Please set in app.json or .env file:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=https://ваш-проект-id.supabase.co');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  throw new Error('Missing Supabase credentials in app.json or .env');
}

console.log('✅ Supabase configured:', {
  url: supabaseUrl.substring(0, 30) + '...',
  hasKey: !!supabaseAnonKey
});

// Создаем клиент Supabase с поддержкой веб-версии
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: Platform.OS !== 'web',
    detectSessionInUrl: Platform.OS === 'web',
  },
});

type SupabaseError = PostgrestError | Error;

async function handleSupabase<R extends { data: any; error: PostgrestError | null }>(
  promise: PromiseLike<R>,
  operation: string
): Promise<Omit<R, 'error'> & { error: SupabaseError | null }> {
  try {
    const response = await promise;
    if (response.error) {
      console.error(`[Supabase] ${operation} error:`, response.error);
    }
    return {
      ...response,
      error: response.error ?? null,
    };
  } catch (error) {
    console.error(`[Supabase] ${operation} unexpected failure:`, error);
    return {
      data: null,
      error: error as Error,
    } as Omit<R, 'error'> & { error: SupabaseError | null };
  }
}

// Типы для базы данных
export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string;
          brand: string;
          model: string;
          year: number;
          mileage: number;
          location: string;
          video_url: string;
          thumbnail_url: string;
          views: number;
          likes: number;
          saves: number;
          created_at: string;
          is_verified: boolean;
          ai_analysis: any;
          user_id: string;
        };
        Insert: {
          id?: string;
          brand: string;
          model: string;
          year: number;
          mileage: number;
          location: string;
          video_url: string;
          thumbnail_url: string;
          views?: number;
          likes?: number;
          saves?: number;
          created_at?: string;
          is_verified?: boolean;
          ai_analysis?: any;
          user_id: string;
        };
        Update: {
          id?: string;
          brand?: string;
          model?: string;
          year?: number;
          mileage?: number;
          location?: string;
          video_url?: string;
          thumbnail_url?: string;
          views?: number;
          likes?: number;
          saves?: number;
          created_at?: string;
          is_verified?: boolean;
          ai_analysis?: any;
          user_id?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// ============================================
// DATABASE HELPERS
// ============================================

export const db = {
  // ========== USERS ==========
  
  async getUserByPhone(phone: string) {
    return handleSupabase(
      supabase.from('users').select('*').eq('phone', phone).single(),
      'getUserByPhone'
    );
  },
  
  async getUserById(userId: string) {
    return handleSupabase(
      supabase.from('users').select('*').eq('id', userId).single(),
      'getUserById'
    );
  },
  
  async createUser(userData: {
    phone: string;
    name: string;
    avatar_url?: string;
  }) {
    return handleSupabase(
      supabase.from('users').insert(userData).select().single(),
      'createUser'
    );
  },
  
  async updateUser(userId: string, updates: any) {
    return handleSupabase(
      supabase.from('users').update(updates).eq('id', userId).select().single(),
      'updateUser'
    );
  },
  
  // ========== CARS ==========
  
  async getCars(options: {
    limit?: number;
    offset?: number;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
  } = {}) {
    const {
      limit = 20,
      offset = 0,
      brand,
      minPrice,
      maxPrice,
      location,
    } = options;
    
    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:users!seller_id(
          id,
          name,
          avatar_url,
          is_verified,
          rating
        )
      `)
      .eq('category', 'car')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    // Фильтры
    if (brand) query = query.eq('details->brand', brand);
    if (minPrice != null && minPrice !== undefined) query = query.gte('price', minPrice);
    if (maxPrice != null && maxPrice !== undefined) query = query.lte('price', maxPrice);
    if (location) query = query.eq('city', location);
    
    const response = await handleSupabase(
      query.range(offset, offset + limit - 1),
      'getCars'
    );
    
    return response;
  },
  
  async getCarById(carId: string, userId?: string) {
    const response = await handleSupabase(
      supabase
        .from('listings')
        .select(`
        *,
        seller:users!seller_id(*),
        is_liked:likes!listing_id(user_id),
        is_saved:saves!listing_id(user_id)
      `)
        .eq('id', carId)
        .eq('category', 'car')
        .single(),
      'getCarById'
    );
    
    // Increment views
    if (response.data && !response.error) {
      await supabase.rpc('increment_views', { car_id: carId });
    }
    
    return response;
  },
  
  async createCar(carData: any) {
    // Преобразуем данные для новой схемы listings
    const listingData = {
      category: 'car',
      seller_id: carData.seller_id,
      video_id: carData.video_id,
      video_url: carData.video_url,
      thumbnail_url: carData.thumbnail_url,
      title: carData.title,
      description: carData.description,
      price: carData.price,
      city: carData.city,
      location: carData.location,
      status: carData.status || 'active',
      details: {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        mileage: carData.mileage,
        color: carData.color,
        transmission: carData.transmission,
        fuel_type: carData.fuel_type,
        body_type: carData.body_type,
        condition: carData.condition,
        additional_images: carData.additional_images,
        ai_damages: carData.ai_damages,
        ai_features: carData.ai_features
      }
    };
    
    return handleSupabase(
      supabase.from('listings').insert(listingData).select().single(),
      'createCar'
    );
  },
  
  async updateCar(carId: string, updates: any) {
    // Преобразуем обновления для новой схемы listings
    const listingUpdates: any = {};
    
    // Прямые поля
    if (updates.title) listingUpdates.title = updates.title;
    if (updates.description) listingUpdates.description = updates.description;
    if (updates.price) listingUpdates.price = updates.price;
    if (updates.city) listingUpdates.city = updates.city;
    if (updates.location) listingUpdates.location = updates.location;
    if (updates.status) listingUpdates.status = updates.status;
    if (updates.video_url) listingUpdates.video_url = updates.video_url;
    if (updates.thumbnail_url) listingUpdates.thumbnail_url = updates.thumbnail_url;
    
    // Поля из details
    if (updates.brand || updates.model || updates.year || updates.mileage || 
        updates.color || updates.transmission || updates.fuel_type || 
        updates.body_type || updates.condition) {
      listingUpdates.details = {};
      if (updates.brand) listingUpdates.details.brand = updates.brand;
      if (updates.model) listingUpdates.details.model = updates.model;
      if (updates.year) listingUpdates.details.year = updates.year;
      if (updates.mileage) listingUpdates.details.mileage = updates.mileage;
      if (updates.color) listingUpdates.details.color = updates.color;
      if (updates.transmission) listingUpdates.details.transmission = updates.transmission;
      if (updates.fuel_type) listingUpdates.details.fuel_type = updates.fuel_type;
      if (updates.body_type) listingUpdates.details.body_type = updates.body_type;
      if (updates.condition) listingUpdates.details.condition = updates.condition;
    }
    
    return handleSupabase(
      supabase.from('listings').update(listingUpdates).eq('id', carId).eq('category', 'car').select().single(),
      'updateCar'
    );
  },
  
  async deleteCar(carId: string) {
    return handleSupabase(
      supabase
        .from('listings')
        .update({ status: 'archived' })
        .eq('id', carId)
        .eq('category', 'car')
        .select()
        .single(),
      'deleteCar'
    );
  },
  
  async incrementViews(carId: string) {
    try {
      await supabase.rpc('increment_listing_views', { listing_uuid: carId });
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  },
  
  async getSellerCars(sellerId: string) {
    return handleSupabase(
      supabase
        .from('listings')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('category', 'car')
        .in('status', ['active', 'sold'])
        .order('created_at', { ascending: false }),
      'getSellerCars'
    );
  },

  async searchCars(options: {
    searchQuery?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    location?: string;
    transmission?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      searchQuery = '',
      brand,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      location,
      transmission,
      limit = 20,
      offset = 0,
    } = options;

    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:users!seller_id(id, name, avatar_url, is_verified)
      `)
      .eq('category', 'car')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Поиск по тексту (марка, модель)
    if (searchQuery) {
      query = query.or(`details->brand.ilike.%${searchQuery}%,details->model.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
    }

    // Фильтр по марке
    if (brand) {
      query = query.eq('details->brand', brand);
    }

    // Фильтр по цене
    if (minPrice != null && minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice != null && maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    // Фильтр по году
    if (minYear != null && minYear !== undefined) {
      query = query.gte('details->year', minYear);
    }
    if (maxYear != null && maxYear !== undefined) {
      query = query.lte('details->year', maxYear);
    }

    // Фильтр по городу
    if (location) {
      query = query.ilike('city', `%${location}%`);
    }

    // Фильтр по коробке передач
    if (transmission) {
      query = query.eq('details->transmission', transmission);
    }

    return handleSupabase(query, 'searchCars');
  },
  
  // ========== LIKES ==========
  
  async likeCar(userId: string, carId: string) {
    const { error: insertError } = await handleSupabase(
      supabase.from('likes').insert({ user_id: userId, car_id: carId }),
      'likeCar'
    );
    
    if (!insertError) {
      await supabase.rpc('increment_likes', { car_id: carId });
    }
    
    return { error: insertError };
  },
  
  async unlikeCar(userId: string, carId: string) {
    const { error: deleteError } = await handleSupabase(
      supabase.from('likes').delete().match({ user_id: userId, car_id: carId }),
      'unlikeCar'
    );
    
    if (!deleteError) {
      await supabase.rpc('decrement_likes', { car_id: carId });
    }
    
    return { error: deleteError };
  },
  
  async getUserLikes(userId: string) {
    return handleSupabase(
      supabase
        .from('likes')
        .select(`
        car_id,
        created_at,
        car:cars(*)
      `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'getUserLikes'
    );
  },
  
  // ========== SAVES ==========
  
  async saveCar(userId: string, carId: string) {
    const { error: insertError } = await handleSupabase(
      supabase.from('saves').insert({ user_id: userId, car_id: carId }),
      'saveCar'
    );
    
    if (!insertError) {
      await supabase.rpc('increment_saves', { car_id: carId });
    }
    
    return { error: insertError };
  },
  
  async unsaveCar(userId: string, carId: string) {
    const { error: deleteError } = await handleSupabase(
      supabase.from('saves').delete().match({ user_id: userId, car_id: carId }),
      'unsaveCar'
    );
    
    if (!deleteError) {
      await supabase.rpc('decrement_saves', { car_id: carId });
    }
    
    return { error: deleteError };
  },
  
  async getUserSaves(userId: string) {
    return handleSupabase(
      supabase
        .from('saves')
        .select(`
        car_id,
        created_at,
        car:cars(*)
      `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'getUserSaves'
    );
  },
  
  // ========== CONVERSATIONS ==========
  
  async getOrCreateConversation(
    carId: string,
    buyerId: string,
    sellerId: string
  ) {
    // Проверяем существующую
    let { data, error } = await handleSupabase(
      supabase
        .from('conversations')
        .select('*')
        .eq('car_id', carId)
        .eq('buyer_id', buyerId)
        .single(),
      'getOrCreateConversation.find'
    );
    
    // Если нет - создаем
    if (error && 'code' in error && (error as PostgrestError).code === 'PGRST116') {
      const result = await handleSupabase(
        supabase
          .from('conversations')
          .insert({
            car_id: carId,
            buyer_id: buyerId,
            seller_id: sellerId,
          })
          .select()
          .single(),
        'getOrCreateConversation.insert'
      );
      
      data = result.data;
      error = result.error;
    }
    
    return { data, error };
  },
  
  async getUserConversations(userId: string) {
    return handleSupabase(
      supabase
        .from('conversations')
        .select(`
        *,
        car:cars(id, brand, model, thumbnail_url, price),
        buyer:users!buyer_id(id, name, avatar_url),
        seller:users!seller_id(id, name, avatar_url)
      `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false }),
      'getUserConversations'
    );
  },
  
  // ========== MESSAGES ==========
  
  async sendMessage(
    conversationId: string,
    senderId: string,
    message: string
  ) {
    const { data, error } = await handleSupabase(
      supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          message,
        })
        .select()
        .single(),
      'sendMessage'
    );
    
    // Обновляем последнее сообщение в чате
    if (!error) {
      await supabase
        .from('conversations')
        .update({
          last_message: message,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    }
    
    return { data, error };
  },
  
  async getMessages(conversationId: string, limit = 50) {
    const response = await handleSupabase(
      supabase
        .from('messages')
        .select(`
        *,
        sender:users!sender_id(id, name, avatar_url)
      `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit),
      'getMessages'
    );
    
    return {
      ...response,
      data: response.data ? [...response.data].reverse() : response.data,
    };
  },
  
  async markMessagesAsRead(conversationId: string, userId: string) {
    const { error } = await handleSupabase(
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false),
      'markMessagesAsRead'
    );
    
    return { error };
  },

  // ========== COMMENTS ==========
  
  async getComments(carId: string) {
    return handleSupabase(
      supabase
        .from('comments')
        .select(`
          *,
          user:users!user_id(id, name, avatar_url)
        `)
        .eq('car_id', carId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false }),
      'getComments'
    );
  },

  async addComment(carId: string, userId: string, text: string, parentId?: string) {
    return handleSupabase(
      supabase
        .from('comments')
        .insert({
          car_id: carId,
          user_id: userId,
          text,
          parent_id: parentId || null,
        })
        .select()
        .single(),
      'addComment'
    );
  },

  async likeComment(userId: string, commentId: string) {
    const { error: insertError } = await handleSupabase(
      supabase.from('comment_likes').insert({ user_id: userId, comment_id: commentId }),
      'likeComment'
    );
    
    if (!insertError) {
      await supabase.rpc('increment_comment_likes', { comment_uuid: commentId });
    }
    
    return { error: insertError };
  },

  async unlikeComment(userId: string, commentId: string) {
    const { error: deleteError } = await handleSupabase(
      supabase.from('comment_likes').delete().match({ user_id: userId, comment_id: commentId }),
      'unlikeComment'
    );
    
    if (!deleteError) {
      await supabase.rpc('decrement_comment_likes', { comment_uuid: commentId });
    }
    
    return { error: deleteError };
  },

  // ========== NOTIFICATIONS ==========

  async getNotifications(userId: string, limit = 50) {
    return handleSupabase(
      supabase
        .from('notifications')
        .select(`
          *,
          from_user:users!from_user_id(id, name, avatar_url),
          car:cars!car_id(id, brand, model, year)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      'getNotifications'
    );
  },

  async getUnreadNotificationsCount(userId: string) {
    return handleSupabase(
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
      'getUnreadNotificationsCount'
    );
  },

  async markNotificationAsRead(notificationId: string) {
    return handleSupabase(
      supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single(),
      'markNotificationAsRead'
    );
  },

  async markAllNotificationsAsRead(userId: string) {
    return handleSupabase(
      supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false),
      'markAllNotificationsAsRead'
    );
  },

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    options?: {
      carId?: string;
      fromUserId?: string;
      actionUrl?: string;
    }
  ) {
    return handleSupabase(
      supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          car_id: options?.carId,
          from_user_id: options?.fromUserId,
          action_url: options?.actionUrl,
        })
        .select()
        .single(),
      'createNotification'
    );
  },

  // ========== COMMENT REACTIONS ==========

  async addReaction(commentId: string, userId: string, emoji: string) {
    return handleSupabase(
      supabase
        .from('comment_reactions')
        .insert({ comment_id: commentId, user_id: userId, emoji })
        .select()
        .single(),
      'addReaction'
    );
  },

  async removeReaction(commentId: string, userId: string, emoji: string) {
    return handleSupabase(
      supabase
        .from('comment_reactions')
        .delete()
        .match({ comment_id: commentId, user_id: userId, emoji }),
      'removeReaction'
    );
  },

  async getCommentReactions(commentId: string) {
    return handleSupabase(
      supabase
        .from('comment_reactions')
        .select('emoji, user_id')
        .eq('comment_id', commentId),
      'getCommentReactions'
    );
  },

  // ========== COMMENT THREADS ==========

  async getCommentReplies(parentId: string) {
    return handleSupabase(
      supabase
        .from('comments')
        .select(`
          *,
          user:users!user_id(id, name, avatar_url)
        `)
        .eq('parent_id', parentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }),
      'getCommentReplies'
    );
  },

  async getRepliesCount(commentId: string) {
    return handleSupabase(
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', commentId)
        .eq('is_deleted', false),
      'getRepliesCount'
    );
  },

  // ========== COMMENT EDIT/DELETE ==========

  async updateComment(commentId: string, text: string) {
    return handleSupabase(
      supabase
        .from('comments')
        .update({ text, edited_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single(),
      'updateComment'
    );
  },

  async deleteComment(commentId: string) {
    return handleSupabase(
      supabase
        .from('comments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single(),
      'deleteComment'
    );
  },

  async canDeleteComment(commentId: string, userId: string) {
    const { data } = await handleSupabase(
      supabase.rpc('can_delete_comment', { 
        comment_id_param: commentId, 
        user_id_param: userId 
      }),
      'canDeleteComment'
    );
    return data || false;
  },

  async canEditComment(commentId: string, userId: string) {
    const { data } = await handleSupabase(
      supabase.rpc('can_edit_comment', { 
        comment_id_param: commentId, 
        user_id_param: userId 
      }),
      'canEditComment'
    );
    return data || false;
  },

  // ========== COMMENT SEARCH ==========

  async searchComments(carId: string, searchQuery: string) {
    return handleSupabase(
      supabase
        .from('comments')
        .select(`
          *,
          user:users!user_id(id, name, avatar_url)
        `)
        .eq('car_id', carId)
        .eq('is_deleted', false)
        .textSearch('text', searchQuery, { type: 'websearch', config: 'russian' })
        .order('created_at', { ascending: false }),
      'searchComments'
    );
  },

  // ========== CAR MANAGEMENT ==========

  async canDeleteCar(carId: string, userId: string) {
    const { data } = await handleSupabase(
      supabase.rpc('can_delete_car', { 
        car_id_param: carId, 
        user_id_param: userId 
      }),
      'canDeleteCar'
    );
    return data || false;
  },
};

// ============================================
// STORAGE HELPERS
// ============================================

import { apiVideo } from './apiVideo';

export const storage = {
  /**
   * Загрузка видео с автоматическим выбором: api.video или Supabase Storage
   */
  async uploadVideoSmart(
    fileUri: string,
    userId: string,
    carData?: { brand: string; model: string; year: number }
  ): Promise<{ url: string; videoId: string; thumbnailUrl: string; error: any }> {
    try {
      // Проверяем настройки api.video
      if (apiVideo.isConfigured()) {
        console.log('📤 Используем api.video для загрузки...');
        
        // Создаем видео с метаданными
        const { videoId, uploadToken } = await apiVideo.createVideo(carData ? {
          title: `${carData.brand} ${carData.model} ${carData.year}`,
          description: `${carData.brand} ${carData.model} - 360Auto`,
          tags: [carData.brand, carData.model, carData.year.toString(), '360Auto'],
        } : {
          title: 'Car Video',
        });

        // Загружаем файл
        const result = await apiVideo.uploadWithToken(fileUri, uploadToken);

        if (result.videoId) {
          const hlsUrl = apiVideo.getHLSUrl(result.videoId);
          const thumbnailUrl = apiVideo.getThumbnailUrl(result.videoId);
          
          return {
            url: hlsUrl, // Используем HLS для адаптивного стриминга
            videoId: result.videoId,
            thumbnailUrl: thumbnailUrl,
            error: null,
          };
        }
        
        console.warn('⚠️ api.video загрузка не удалась, используем Supabase Storage');
      } else {
        console.log('⚠️ api.video не настроен, используем Supabase Storage');
      }

      // Fallback: используем Supabase Storage
      const uploadResult = await this.uploadVideo(fileUri, userId);
      return {
        ...uploadResult,
        videoId: '',
        thumbnailUrl: '',
      };
    } catch (error) {
      console.error('Video upload error:', error);
      return { url: '', videoId: '', thumbnailUrl: '', error };
    }
  },

  async uploadVideo(
    fileUri: string,
    userId: string
  ): Promise<{ url: string; error: any }> {
    try {
      const fileName = `${userId}/${Date.now()}.mp4`;
      const fileExt = fileUri.split('.').pop();
      
      // Читаем файл
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      // Загружаем
      const { data, error } = await supabase.storage
        .from('car-videos')
        .upload(fileName, blob, {
          contentType: 'video/mp4',
          upsert: false,
        });
      
      if (error) throw error;
      
      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-videos')
        .getPublicUrl(fileName);
      
      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Video upload error:', error);
      return { url: '', error };
    }
  },
  
  async uploadThumbnail(
    fileUri: string,
    userId: string
  ): Promise<{ url: string; error: any }> {
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from('car-thumbnails')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('car-thumbnails')
        .getPublicUrl(fileName);
      
      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      return { url: '', error };
    }
  },
  
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    return { error };
  },
};

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export const realtime = {
  subscribeToMessages(
    conversationId: string,
    callback: (message: any) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  },
  
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  },
};

// Утилиты для аутентификации (совместимость)
export const authService = {
  // Регистрация
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) throw error;
    return data;
  },

  // Вход
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Выход
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Получить текущего пользователя
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Подписаться на изменения аутентификации
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ============================================
// USER CONSENTS (Согласия пользователей)
// ============================================

export interface UserConsent {
  id: string;
  user_id: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  consent_accepted: boolean;
  terms_version?: string;
  privacy_version?: string;
  consent_version?: string;
  marketing_accepted: boolean;
  notifications_accepted: boolean;
  accepted_at: string;
  ip_address?: string;
  user_agent?: string;
  revoked: boolean;
  revoked_at?: string;
  revoke_reason?: string;
  created_at: string;
  updated_at: string;
}

export const consents = {
  /**
   * Проверить, есть ли у пользователя активные согласия
   */
  async hasUserConsents(userId: string): Promise<boolean> {
    try {
      void userId;
      const response = await api.consents.getStatus();
      return response?.data?.hasConsents ?? false;
    } catch (error) {
      console.error('Error checking user consents:', error);
      return false;
    }
  },

  /**
   * Получить согласия пользователя
   */
  async getUserConsents(userId: string): Promise<UserConsent | null> {
    try {
      void userId;
      const response = await api.consents.getDetails();
      return (response?.data?.consent as UserConsent) ?? null;
    } catch (error) {
      console.error('Error getting user consents:', error);
      return null;
    }
  },

  /**
   * Создать или обновить согласия пользователя
   */
  async upsertUserConsents(consent: Partial<UserConsent>): Promise<{ error: any }> {
    try {
      await api.consents.accept({
        terms_version: consent.terms_version ?? '1.0',
        privacy_version: consent.privacy_version ?? '1.0',
        consent_version: consent.consent_version ?? '1.0',
        ip_address: consent.ip_address,
        user_agent: consent.user_agent,
        marketing_accepted: consent.marketing_accepted,
        notifications_accepted: consent.notifications_accepted,
      });
      return { error: null };
    } catch (error) {
      console.error('Error upserting user consents:', error);
      return { error };
    }
  },

  /**
   * Отозвать согласия пользователя
   */
  async revokeUserConsents(userId: string, reason?: string): Promise<{ error: any }> {
    try {
      void userId;
      await api.consents.revoke({ reason });
      return { error: null };
    } catch (error) {
      console.error('Error revoking user consents:', error);
      return { error };
    }
  },

  /**
   * Создать новые согласия при регистрации
   */
  async createInitialConsents(userId: string, ipAddress?: string, userAgent?: string): Promise<{ error: any }> {
    try {
      void userId;
      await api.consents.initialize({
        ip_address: ipAddress,
        user_agent: userAgent,
      });
      return { error: null };
    } catch (error) {
      console.error('Error creating initial consents:', error);
      return { error };
    }
  },
};

// Экспорт по умолчанию
export default supabase;
