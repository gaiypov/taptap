// services/authFinalizer.ts
// Unified Auth Finalization - гарантирует запись в AsyncStorage перед возвратом

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { appLogger } from '@/utils/logger';
import storageService from './storage';

const AUTH_USER_KEY = '@360auto:user';

/**
 * Finalizes auth session by writing both token and user_data to storage
 * Only returns after BOTH writes succeed
 * 
 * @param token - Auth token
 * @param user - User object
 * @returns Promise with { token, user } after successful storage
 */
export async function finalizeAuthSession(
  token: string,
  user: any
): Promise<{ token: string; user: any }> {
  try {
    // Validate inputs
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided to finalizeAuthSession');
    }
    if (!user || !user.id) {
      throw new Error('Invalid user provided to finalizeAuthSession');
    }

    appLogger.info('[AuthFinalizer] Starting finalization', {
      userId: user.id,
      tokenLength: token.length,
    });

    // Step 1: Write token via storageService
    try {
      await storageService.setAuthToken(token);
      appLogger.info('[AuthFinalizer] ✅ Token written to storage');
    } catch (tokenError: any) {
      appLogger.error('[AuthFinalizer] ❌ Failed to write token', {
        error: tokenError?.message,
        stack: tokenError?.stack,
      });
      throw new Error(`Failed to save token: ${tokenError?.message || 'Unknown error'}`);
    }

    // Step 2: Write user_data via storageService (primary)
    try {
      await storageService.setUserData(user);
      appLogger.info('[AuthFinalizer] ✅ User data written to storage (primary)');
    } catch (userError: any) {
      appLogger.error('[AuthFinalizer] ❌ Failed to write user_data (primary)', {
        error: userError?.message,
        stack: userError?.stack,
      });
      throw new Error(`Failed to save user data: ${userError?.message || 'Unknown error'}`);
    }

    // Step 3: Also write to legacy key for compatibility (web + old code)
    try {
      const userJson = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(AUTH_USER_KEY, userJson);
      } else {
        await AsyncStorage.setItem(AUTH_USER_KEY, userJson);
      }
      appLogger.info('[AuthFinalizer] ✅ User data written to storage (legacy key)');
    } catch (legacyError: any) {
      // Non-critical - log but don't fail
      appLogger.warn('[AuthFinalizer] ⚠️ Failed to write legacy key (non-critical)', {
        error: legacyError?.message,
      });
    }

    // Step 4: Verify both writes succeeded
    try {
      const savedToken = await storageService.getAuthToken();
      const savedUser = await storageService.getUserData();

      if (!savedToken || savedToken !== token) {
        throw new Error('Token verification failed - token not found or mismatch');
      }
      if (!savedUser || savedUser.id !== user.id) {
        throw new Error('User verification failed - user not found or mismatch');
      }

      appLogger.info('[AuthFinalizer] ✅✅✅ Verification passed - both token and user_data confirmed in storage', {
        userId: savedUser.id,
        tokenLength: savedToken.length,
      });
    } catch (verifyError: any) {
      appLogger.error('[AuthFinalizer] ❌ Verification failed', {
        error: verifyError?.message,
        stack: verifyError?.stack,
      });
      throw new Error(`Storage verification failed: ${verifyError?.message || 'Unknown error'}`);
    }

    // Step 5: Return guaranteed session object
    appLogger.info('[AuthFinalizer] ✅✅✅ Finalization complete - session ready', {
      userId: user.id,
      userPhone: user.phone,
      userName: user.name,
    });

    return { token, user };
  } catch (error: any) {
    appLogger.error('[AuthFinalizer] ❌ Finalization failed', {
      error: error?.message,
      stack: error?.stack,
      userId: user?.id,
    });
    throw error;
  }
}

