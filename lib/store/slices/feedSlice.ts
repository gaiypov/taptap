import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FeedListing } from '../api/apiSlice';

interface FeedState {
  currentIndex: number;
  activeCategory: string;
  preloadedIndexes: number[]; // Массив вместо Set для сериализации
  viewedListings: string[]; // Массив вместо Set для сериализации
  lastViewedTime: Record<string, number>; // ID -> timestamp последнего просмотра
}

const initialState: FeedState = {
  currentIndex: 0,
  activeCategory: 'cars',
  preloadedIndexes: [],
  viewedListings: [],
  lastViewedTime: {},
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setCurrentIndex(state, action: PayloadAction<number>) {
      state.currentIndex = action.payload;
    },
    setActiveCategory(state, action: PayloadAction<string>) {
      state.activeCategory = action.payload;
      state.currentIndex = 0; // Сброс индекса при смене категории
    },
    addPreloadedIndex(state, action: PayloadAction<number>) {
      if (!state.preloadedIndexes.includes(action.payload)) {
        state.preloadedIndexes.push(action.payload);
      }
    },
    removePreloadedIndex(state, action: PayloadAction<number>) {
      state.preloadedIndexes = state.preloadedIndexes.filter((idx) => idx !== action.payload);
    },
    clearPreloadedIndexes(state) {
      state.preloadedIndexes = [];
    },
    markListingAsViewed(state, action: PayloadAction<string>) {
      if (!state.viewedListings.includes(action.payload)) {
        state.viewedListings.push(action.payload);
      }
      state.lastViewedTime[action.payload] = Date.now();
    },
    resetFeed(state) {
      state.currentIndex = 0;
      state.preloadedIndexes = [];
      state.viewedListings = [];
      state.lastViewedTime = {};
    },
  },
});

export const {
  setCurrentIndex,
  setActiveCategory,
  addPreloadedIndex,
  removePreloadedIndex,
  clearPreloadedIndexes,
  markListingAsViewed,
  resetFeed,
} = feedSlice.actions;

export default feedSlice.reducer;
