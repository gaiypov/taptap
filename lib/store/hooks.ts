// lib/store/hooks.ts — REDUX ХУКИ УРОВНЯ STRIPE + OPENAI 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К МИЛЛИАРДУ ЗАПРОСОВ

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

// Типизированные хуки — используем везде вместо обычных useDispatch/useSelector
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Дополнительные хуки для удобства (по желанию, но рекомендуется)
export const useAuth = () => useAppSelector((state) => state.auth);
export const useFeed = () => useAppSelector((state) => state.feed);
export const useVideo = () => useAppSelector((state) => state.video);
export const useOffline = () => useAppSelector((state) => state.offline);
export const useChat = () => useAppSelector((state) => state.chat);
export const useListings = () => useAppSelector((state) => state.listings);

// Хук для логирования действий (dev mode)
export const useLoggedDispatch = () => {
  const dispatch = useAppDispatch();

  return (action: any) => {
    if (__DEV__) {
      console.log('[Redux Dispatch]', action.type, action.payload);
    }
    return dispatch(action);
  };
};
