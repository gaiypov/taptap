import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';
import type { Listing } from '@/types';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// FeedListing - расширенная версия Listing для ленты
// Используем type вместо interface для более гибкого переопределения полей
export type FeedListing = Omit<Listing, 'category' | 'video_id' | 'video_url'> & {
  category?: string; // Переопределяем category как опциональный string вместо ListingCategory
  is_favorited?: boolean;
  is_saved?: boolean;
  is_liked?: boolean;
  likes_count?: number;
  comments_count?: number;
  video_id?: string | undefined; // Делаем опциональным (в отличие от обязательного в Listing)
  video_url?: string | undefined; // Делаем опциональным (в отличие от обязательного в Listing)
  thumbnail_url?: string;
};

// RTK Query API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: async (headers, { getState }) => {
      // Добавляем токен авторизации если есть
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Listings', 'Listing', 'User', 'Comments', 'Favorites'],
  endpoints: (builder) => ({
    // Получить ленту видео
    getFeed: builder.query<FeedListing[], { category?: string; page?: number; limit?: number }>({
      query: ({ category, page = 1, limit = 20 }) => ({
        url: '/listings/feed',
        params: { category, page, limit },
      }),
      providesTags: ['Listings'],
      // Кэшируем данные для оффлайн режима
      keepUnusedDataFor: 60, // секунд
    }),

    // Получить одно объявление
    getListing: builder.query<FeedListing, string>({
      query: (id) => `/listings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Listing', id }],
      keepUnusedDataFor: 300,
    }),

    // Лайкнуть объявление
    likeListing: builder.mutation<{ success: boolean; likes_count: number }, string>({
      query: (id) => ({
        url: `/listings/${id}/like`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Listing', id },
        { type: 'Listings' },
      ],
      // Оптимистичное обновление
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getListing', id, (draft) => {
            draft.likes_count = (draft.likes_count || 0) + 1;
            draft.is_liked = true;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Убрать лайк
    unlikeListing: builder.mutation<{ success: boolean; likes_count: number }, string>({
      query: (id) => ({
        url: `/listings/${id}/unlike`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Listing', id },
        { type: 'Listings' },
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getListing', id, (draft) => {
            draft.likes_count = Math.max((draft.likes_count || 1) - 1, 0);
            draft.is_liked = false;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Сохранить в избранное
    saveListing: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/listings/${id}/save`,
        method: 'POST',
      }),
      invalidatesTags: ['Listings'],
    }),

    // Убрать из избранного
    unsaveListing: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/listings/${id}/unsave`,
        method: 'POST',
      }),
      invalidatesTags: ['Listings'],
    }),

    // Поиск объявлений
    searchListings: builder.query<FeedListing[], { query: string; category?: string; filters?: any }>({
      query: ({ query, category, filters }) => ({
        url: '/listings/search',
        params: { q: query, category, ...filters },
      }),
      providesTags: ['Listings'],
    }),
  }),
});

export const {
  useGetFeedQuery,
  useGetListingQuery,
  useLikeListingMutation,
  useUnlikeListingMutation,
  useSaveListingMutation,
  useUnsaveListingMutation,
  useSearchListingsQuery,
  useLazyGetFeedQuery,
} = apiSlice;
