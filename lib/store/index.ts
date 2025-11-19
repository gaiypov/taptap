import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './api/apiSlice';
import feedReducer from './slices/feedSlice';
import authReducer from './slices/authSlice';
import videoReducer from './slices/videoSlice';
import offlineReducer from './slices/offlineSlice';
import chatReducer from './slices/chatSlice';
import listingsReducer from './slices/listingsSlice';

export const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
    feed: feedReducer,
    auth: authReducer,
    video: videoReducer,
    offline: offlineReducer,
    chat: chatReducer,
    listings: listingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем действия RTK Query и некоторые поля
        ignoredActions: ['api/executeQuery'],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['api.queries', 'api.mutations'],
      },
    }).concat(apiSlice.middleware),
});

// Настраиваем listeners для refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Экспортируем типизированные хуки
export * from './hooks';
