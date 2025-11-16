// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { auth } from '../services/auth';

export interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const tempUser = await auth.getCurrentUser();
      setAuthState({
        user: tempUser,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState({
        user: null,
        loading: false,
        error: error.message,
      });
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await auth.signOut();
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Создаем временного пользователя для демо
      const tempUser = {
        id: 'temp-user-' + Date.now(),
        email,
        name: email.split('@')[0],
        phone: '+996 555 123 456',
        is_verified: false,
        total_sales: 0,
        rating: 0.0,
        created_at: new Date().toISOString(),
      };
      
      // Сохраняем пользователя в AsyncStorage
      if (Platform.OS === 'web') {
        localStorage.setItem('@360auto:user', JSON.stringify(tempUser));
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('@360auto:user', JSON.stringify(tempUser));
      }
      
      setAuthState({
        user: tempUser,
        loading: false,
        error: null,
      });
      return tempUser;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Создаем временного пользователя для демо
      const tempUser = {
        id: 'temp-user-' + Date.now(),
        email,
        name: fullName || email.split('@')[0],
        phone: '+996 555 123 456',
        is_verified: false,
        total_sales: 0,
        rating: 0.0,
        created_at: new Date().toISOString(),
      };
      
      // Сохраняем пользователя в AsyncStorage
      if (Platform.OS === 'web') {
        localStorage.setItem('@360auto:user', JSON.stringify(tempUser));
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('@360auto:user', JSON.stringify(tempUser));
      }
      
      setAuthState({
        user: tempUser,
        loading: false,
        error: null,
      });
      return { user: tempUser };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  return {
    ...authState,
    signOut,
    signIn,
    signUp,
    refreshUser: loadUser,
  };
}
