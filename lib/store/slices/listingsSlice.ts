// lib/store/slices/listingsSlice.ts
// Listings state management with Realtime support

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Listing {
  id: string;
  seller_id: string;
  business_id?: string | null;
  category: 'car' | 'horse' | 'real_estate';
  title: string;
  description: string;
  price: number;
  currency: string;
  status: 'active' | 'sold' | 'deleted' | 'pending_review';
  moderation_status?: 'pending' | 'approved' | 'rejected';
  location_text?: string;
  thumbnail_url?: string | null;
  views_count?: number;
  likes_count?: number;
  saves_count?: number;
  is_promoted?: boolean;
  is_boosted?: boolean;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  is_saved?: boolean;
  seller?: {
    id: string;
    name: string;
    avatar_url?: string | null;
    is_verified?: boolean;
  };
  business?: {
    id: string;
    company_name: string;
    company_logo_url?: string | null;
    tier?: string;
  };
}

interface ListingsState {
  listings: Listing[];
  currentListing: Listing | null;
  isLoading: boolean;
  error: string | null;
  cache: Record<string, Listing>; // Кэш для быстрого доступа
}

const initialState: ListingsState = {
  listings: [],
  currentListing: null,
  isLoading: false,
  error: null,
  cache: {},
};

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListings(state, action: PayloadAction<Listing[]>) {
      state.listings = action.payload;
      // Обновляем кэш
      action.payload.forEach(listing => {
        state.cache[listing.id] = listing;
      });
    },
    addListing(state, action: PayloadAction<Listing>) {
      const existing = state.listings.find(l => l.id === action.payload.id);
      if (!existing) {
        state.listings.push(action.payload);
      }
      state.cache[action.payload.id] = action.payload;
    },
    updateListingInCache(state, action: PayloadAction<{ id: string; changes: Partial<Listing> }>) {
      const { id, changes } = action.payload;
      
      // Обновляем в списке
      const listing = state.listings.find(l => l.id === id);
      if (listing) {
        Object.assign(listing, changes);
      }
      
      // Обновляем в кэше
      if (state.cache[id]) {
        Object.assign(state.cache[id], changes);
      }
      
      // Обновляем текущее объявление, если это оно
      if (state.currentListing?.id === id) {
        Object.assign(state.currentListing, changes);
      }
    },
    removeListing(state, action: PayloadAction<string>) {
      state.listings = state.listings.filter(l => l.id !== action.payload);
      delete state.cache[action.payload];
      if (state.currentListing?.id === action.payload) {
        state.currentListing = null;
      }
    },
    setCurrentListing(state, action: PayloadAction<Listing | null>) {
      state.currentListing = action.payload;
      if (action.payload) {
        state.cache[action.payload.id] = action.payload;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    toggleLike(state, action: PayloadAction<string>) {
      const listing = state.listings.find(l => l.id === action.payload);
      if (listing) {
        listing.is_liked = !listing.is_liked;
        listing.likes_count = (listing.likes_count || 0) + (listing.is_liked ? 1 : -1);
      }
      if (state.cache[action.payload]) {
        state.cache[action.payload].is_liked = !state.cache[action.payload].is_liked;
        state.cache[action.payload].likes_count = (state.cache[action.payload].likes_count || 0) + (state.cache[action.payload].is_liked ? 1 : -1);
      }
    },
    toggleSave(state, action: PayloadAction<string>) {
      const listing = state.listings.find(l => l.id === action.payload);
      if (listing) {
        listing.is_saved = !listing.is_saved;
        listing.saves_count = (listing.saves_count || 0) + (listing.is_saved ? 1 : -1);
      }
      if (state.cache[action.payload]) {
        state.cache[action.payload].is_saved = !state.cache[action.payload].is_saved;
        state.cache[action.payload].saves_count = (state.cache[action.payload].saves_count || 0) + (state.cache[action.payload].is_saved ? 1 : -1);
      }
    },
  },
});

export const {
  setListings,
  addListing,
  updateListingInCache,
  removeListing,
  setCurrentListing,
  setLoading,
  setError,
  toggleLike,
  toggleSave,
} = listingsSlice.actions;

export default listingsSlice.reducer;

