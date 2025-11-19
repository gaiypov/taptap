// lib/store/api/apiSlice.ts — RTK QUERY УРОВНЯ AVITO + TIKTOK 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ ЗАПРОСОВ

import { Listing } from '@/types';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
  (__DEV__ ? 'http://192.168.1.16:3001/api' : 'https://api.360auto.kg/api');

export type FeedListing = Listing & {
  is_liked?: boolean;
  is_saved?: boolean;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  is_boosted?: boolean;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      headers.set('x-client-info', '360auto-mobile-v1');
      return headers;
    },
  }),
  tagTypes: ['Feed', 'Listing', 'Favorites', 'User'],
  endpoints: (builder) => ({
    // Лента
    getFeed: builder.query<FeedListing[], { category?: string; page?: number }>({
      query: ({ category = 'all', page = 1 }) => ({
        url: '/listings/feed',
        params: { category, page, limit: 20 },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Listing' as const, id })),
              { type: 'Feed', id: 'LIST' },
            ]
          : [{ type: 'Feed', id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // Объявление
    getListing: builder.query<FeedListing, string>({
      query: (id) => `/listings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Listing', id }],
    }),

    // Лайк
    likeListing: builder.mutation<void, string>({
      query: (id) => ({
        url: `/listings/${id}/like`,
        method: 'POST',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          apiSlice.util.updateQueryData('getListing', id, (draft) => {
            draft.is_liked = true;
            draft.likes_count = (draft.likes_count || 0) + 1;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (result, error, id) => [{ type: 'Listing', id }, 'Feed'],
    }),

    unlikeListing: builder.mutation<void, string>({
      query: (id) => ({
        url: `/listings/${id}/unlike`,
        method: 'POST',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          apiSlice.util.updateQueryData('getListing', id, (draft) => {
            draft.is_liked = false;
            draft.likes_count = Math.max((draft.likes_count || 1) - 1, 0);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (result, error, id) => [{ type: 'Listing', id }, 'Feed'],
    }),

    // Избранное
    toggleSave: builder.mutation<void, string>({
      query: (id) => ({
        url: `/listings/${id}/save`,
        method: 'POST',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const state = getState() as any;
        const current = state.api.queries[`getListing("${id}")`]?.data as FeedListing | undefined;
        const isSaved = current?.is_saved;

        const patch = dispatch(
          apiSlice.util.updateQueryData('getListing', id, (draft) => {
            draft.is_saved = !isSaved;
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: ['Favorites', 'Feed'],
    }),

    // Поиск
    search: builder.query<FeedListing[], string>({
      query: (query) => ({
        url: '/listings/search',
        params: { q: query, limit: 50 },
      }),
      providesTags: ['Feed'],
    }),
  }),
});

export const {
  useGetFeedQuery,
  useGetListingQuery,
  useLikeListingMutation,
  useUnlikeListingMutation,
  useToggleSaveMutation,
  useSearchQuery,
  useLazyGetFeedQuery,
} = apiSlice;
