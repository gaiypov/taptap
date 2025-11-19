// types/supabase.ts
// Общие типы для данных из Supabase
// Используются во всех сервисах и компонентах для типобезопасности

import type { User } from './index';

// ============================================
// Базовые типы для Supabase таблиц
// ============================================

/**
 * Сырые данные пользователя из таблицы users
 */
export interface SupabaseUserRow {
  id: string;
  phone: string;
  name: string;
  avatar_url?: string | null;
  city?: string | null;
  bio?: string | null;
  is_verified?: boolean | null;
  rating?: number | null;
  total_sales?: number | null;
  total_purchases?: number | null;
  response_rate?: number | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/**
 * Сырые данные объявления из таблицы listings
 */
export interface SupabaseListingRow {
  id: string;
  seller_user_id: string;
  category: string;
  title: string;
  description?: string | null;
  price: number | string;
  currency?: string;
  video_id?: string | null;
  video_url?: string | null;
  videoUrl?: string | null;
  video_hls_url?: string | null;
  video_player_url?: string | null;
  video_thumbnail_url?: string | null;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  status?: string | null;
  views?: number | null;
  views_count?: number | null;
  likes?: number | null;
  likes_count?: number | null;
  saves?: number | null;
  saves_count?: number | null;
  comments_count?: number | null;
  comments?: number | null;
  is_favorited?: boolean | null;
  is_saved?: boolean | null;
  isSaved?: boolean | null;
  is_liked?: boolean | null;
  city?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  sold_at?: string | null;
  expires_at?: string | null;

  // Связанные данные (через joins)
  seller?: SupabaseUserRow | SupabaseUserRow[] | null;
  users?: SupabaseUserRow | SupabaseUserRow[] | null;

  // Детали категорий
  car_details?: Record<string, unknown>[] | null;
  horse_details?: Record<string, unknown>[] | null;
  real_estate_details?: Record<string, unknown>[] | null;
  details?: Record<string, unknown> | null;

  [key: string]: unknown;
}

/**
 * Данные сохранения (избранное) из таблицы listing_saves
 */
export interface SupabaseSaveRow {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: SupabaseListingRow | SupabaseListingRow[] | null;
  [key: string]: unknown;
}

/**
 * Данные лайка из таблицы listing_likes
 */
export interface SupabaseLikeRow {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  [key: string]: unknown;
}

/**
 * Данные сообщения из таблицы chat_messages
 */
export interface SupabaseMessageRow {
  id: string;
  thread_id?: string | null;
  conversation_id?: string | null;
  sender_id: string;
  receiver_id?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string | null;
  [key: string]: unknown;
}

/**
 * Данные чата/беседы из таблицы chat_threads
 */
export interface SupabaseConversationRow {
  id: string;
  buyer_id?: string | null;
  seller_id?: string | null;
  listing_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;

  // Связанные данные
  buyer?: SupabaseUserRow | SupabaseUserRow[] | null;
  seller?: SupabaseUserRow | SupabaseUserRow[] | null;
  listing?: SupabaseListingRow | SupabaseListingRow[] | null;
  car?: SupabaseListingRow | SupabaseListingRow[] | null;

  [key: string]: unknown;
}

// ============================================
// Типы для ошибок Supabase
// ============================================

/**
 * Типизированная ошибка Supabase
 */
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
}

/**
 * Проверяет, является ли ошибка сетевой
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as SupabaseError;
  return (
    err.message?.includes('Network request failed') ||
    err.message?.includes('Failed to fetch') ||
    err.message?.includes('network') ||
    err.code === 'PGRST301' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ETIMEDOUT'
  );
}

/**
 * Безопасно извлекает сообщение об ошибке
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

// ============================================
// Типы для результатов запросов
// ============================================

/**
 * Типизированный результат запроса Supabase
 */
export interface SupabaseResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

/**
 * Типизированный результат с массивом данных
 */
export interface SupabaseArrayResult<T> {
  data: T[] | null;
  error: SupabaseError | null;
}

// ============================================
// Утилиты для работы с данными Supabase
// ============================================

/**
 * Нормализует данные пользователя из Supabase (может быть массивом или объектом)
 */
export function normalizeSupabaseUser(
  user: SupabaseUserRow | SupabaseUserRow[] | null | undefined
): User | null {
  if (!user) return null;
  if (Array.isArray(user)) return user[0] as User;
  return user as User;
}

/**
 * Нормализует данные объявления из Supabase
 */
export function normalizeSupabaseListing(
  listing: SupabaseListingRow | SupabaseListingRow[] | null | undefined
): SupabaseListingRow | null {
  if (!listing) return null;
  if (Array.isArray(listing)) return listing[0];
  return listing;
}

/**
 * Нормализует seller из объявления
 */
export function normalizeSeller(
  seller: SupabaseUserRow | SupabaseUserRow[] | null | undefined
): User | null {
  return normalizeSupabaseUser(seller);
}

/**
 * Нормализует данные объявления из любого источника (включая объекты с listing)
 */
export function normalizeListingData(
  listing: SupabaseListingRow | SupabaseListingRow[] | { listing?: SupabaseListingRow | SupabaseListingRow[] } | null | undefined
): SupabaseListingRow | null {
  if (!listing) return null;
  if (typeof listing === 'object' && 'listing' in listing && listing.listing) {
    return normalizeSupabaseListing(listing.listing as SupabaseListingRow | SupabaseListingRow[]);
  }
  return normalizeSupabaseListing(listing as SupabaseListingRow | SupabaseListingRow[]);
}

