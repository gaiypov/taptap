// hooks/useAuth.ts
// Unified auth hook using Redux as single source of truth

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { logout as logoutAction, setCredentials, setLoading } from '@/lib/store/slices/authSlice';
import { auth } from '@/services/auth';
import storageService from '@/services/storage';
import { appLogger } from '@/utils/logger';

export interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * Unified auth hook - uses Redux as single source of truth
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, loading, signOut } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <LoginPrompt />;
 * }
 * ```
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Debug log on mount
  useEffect(() => {
    console.log('[useAuth] 🔍 Auth state from Redux:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      userId: user?.id,
      userPhone: user?.phone,
      userName: user?.name,
      hasToken: !!token,
    });
  }, [isAuthenticated, isLoading, user, token]);

  // Hydrate auth from storage on mount (if Redux is empty)
  useEffect(() => {
    const hydrateFromStorage = async () => {
      // Skip if already authenticated or loading
      if (isAuthenticated || !isLoading) return;

      try {
        console.log('[useAuth] 🔄 Hydrating auth from storage...');

        const [storedToken, storedUser] = await Promise.all([
          storageService.getAuthToken(),
          storageService.getUserData(),
        ]);

        console.log('[useAuth] Storage data:', {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
          userId: storedUser?.id,
        });

        if (storedToken && storedUser && storedUser.id) {
          console.log('[useAuth] ✅ Found valid session in storage, dispatching to Redux');
          dispatch(setCredentials({
            user: storedUser,
            token: storedToken,
          }));
        } else {
          console.log('[useAuth] ❌ No valid session in storage');
          dispatch(setLoading(false));
        }
      } catch (error: any) {
        appLogger.error('[useAuth] Error hydrating from storage', { error: error?.message });
        dispatch(setLoading(false));
      }
    };

    hydrateFromStorage();
  }, [dispatch, isAuthenticated, isLoading]);

  const signOut = useCallback(async () => {
    try {
      console.log('[useAuth] 🚪 Signing out...');

      // Clear storage
      await auth.signOut();

      // Clear Redux
      dispatch(logoutAction());

      console.log('[useAuth] ✅ Sign out complete');
    } catch (error: any) {
      appLogger.error('[useAuth] Sign out error', { error: error?.message });
      // Still clear Redux even if storage clear fails
      dispatch(logoutAction());
      throw error;
    }
  }, [dispatch]);

  const refreshUser = useCallback(async () => {
    try {
      console.log('[useAuth] 🔄 Refreshing user data...');

      const currentUser = await auth.getCurrentUser();
      const currentToken = await storageService.getAuthToken();

      if (currentUser && currentToken) {
        dispatch(setCredentials({
          user: currentUser,
          token: currentToken,
        }));
        console.log('[useAuth] ✅ User refreshed:', { userId: currentUser.id });
      } else {
        console.log('[useAuth] ❌ No user data found during refresh');
      }
    } catch (error: any) {
      appLogger.error('[useAuth] Refresh user error', { error: error?.message });
    }
  }, [dispatch]);

  return {
    // State from Redux
    user,
    loading: isLoading,
    isAuthenticated,
    error: null, // No longer tracking error in hook

    // Actions
    signOut,
    refreshUser,

    // Legacy compatibility - these are deprecated, use phone auth flow instead
    signIn: async () => {
      console.warn('[useAuth] signIn is deprecated. Use phone auth flow instead.');
      throw new Error('Use phone auth flow');
    },
    signUp: async () => {
      console.warn('[useAuth] signUp is deprecated. Use phone auth flow instead.');
      throw new Error('Use phone auth flow');
    },
  };
}

export default useAuth;
