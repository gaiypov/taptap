import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FeedListing } from '../api/apiSlice';

interface OfflineState {
  isOnline: boolean;
  cachedListings: FeedListing[]; // Кэшированные объявления для оффлайн режима
  pendingActions: Array<{ type: string; payload: any; timestamp: number }>; // Действия для синхронизации
  lastSyncTime: number | null;
}

const initialState: OfflineState = {
  isOnline: true,
  cachedListings: [],
  pendingActions: [],
  lastSyncTime: null,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    cacheListings(state, action: PayloadAction<FeedListing[]>) {
      state.cachedListings = action.payload;
    },
    addPendingAction(state, action: PayloadAction<{ type: string; payload: any }>) {
      state.pendingActions.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    clearPendingActions(state) {
      state.pendingActions = [];
    },
    setLastSyncTime(state, action: PayloadAction<number>) {
      state.lastSyncTime = action.payload;
    },
    removePendingAction(state, action: PayloadAction<number>) {
      state.pendingActions = state.pendingActions.filter(
        (_, index) => index !== action.payload
      );
    },
  },
});

export const {
  setOnlineStatus,
  cacheListings,
  addPendingAction,
  clearPendingActions,
  setLastSyncTime,
  removePendingAction,
} = offlineSlice.actions;

export default offlineSlice.reducer;
