import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { storageService } from '../services/storage';
import { User } from '../types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (phone: string, password: string) => Promise<boolean>;
  register: (userData: {
    name: string;
    phone: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await storageService.getAuthToken();
      if (token) {
        const userData = await storageService.getUserData();
        if (userData) {
          setAuthState({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // Token exists but no user data, try to refresh
          await refreshUser();
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication check failed',
      });
    }
  };

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await api.auth.login(phone, password);
      const { token, user } = response.data;

      await storageService.setAuthToken(token);
      await storageService.setUserData(user);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed. Please check your credentials.',
      }));
      return false;
    }
  };

  const register = async (userData: {
    name: string;
    phone: string;
    password: string;
  }): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await api.auth.register(userData);
      const { token, user } = response.data;

      await storageService.setAuthToken(token);
      await storageService.setUserData(user);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Registration failed. Please try again.',
      }));
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await storageService.removeAuthToken();
      await storageService.setUserData(null);
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await api.users.updateProfile(data);
      const updatedUser = response.data;

      await storageService.setUserData(updatedUser);
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to update profile',
      }));
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await api.users.getProfile();
      const userData = response.data;

      await storageService.setUserData(userData);
      setAuthState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('User refresh failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh user data',
      }));
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };
}