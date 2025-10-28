import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ApiResponse,
    CreateListingRequest,
    Listing,
    PaginatedResponse,
    UpdateListingRequest,
    User,
    isApiSuccess
} from '@shared/types';
import axios, { AxiosError, AxiosInstance } from 'axios';

// Base URL
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      AsyncStorage.removeItem('authToken').catch(console.error);
      // TODO: Redirect to login screen
    }
    return Promise.reject(error);
  }
);

// ============================================
// API Functions
// ============================================

export const api = {
  // ============================================
  // Listings
  // ============================================
  
  async getListing(id: string): Promise<Listing> {
    const response = await apiClient.get<ApiResponse<Listing>>(`/listings/${id}`);
    
    if (isApiSuccess(response.data)) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch listing');
  },

  async getFeed(category: string, filters?: any): Promise<PaginatedResponse<Listing>> {
    const response = await apiClient.get<PaginatedResponse<Listing>>(
      '/listings/feed',
      { params: { category, ...filters } }
    );
    
    return response.data;
  },

  async createListing(data: CreateListingRequest): Promise<Listing> {
    const response = await apiClient.post<ApiResponse<Listing>>('/listings', data);
    
    if (isApiSuccess(response.data)) {
      return response.data.data;
    }
    
    throw new Error('Failed to create listing');
  },

  async updateListing(id: string, data: UpdateListingRequest): Promise<Listing> {
    const response = await apiClient.put<ApiResponse<Listing>>(`/listings/${id}`, data);
    
    if (isApiSuccess(response.data)) {
      return response.data.data;
    }
    
    throw new Error('Failed to update listing');
  },

  async deleteListing(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/listings/${id}`);
    
    if (isApiSuccess(response.data)) {
      return;
    }
    
    throw new Error('Failed to delete listing');
  },

  // ============================================
  // Auth
  // ============================================
  
  async requestSmsCode(phone: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/request-code', { phone });
    
    if (isApiSuccess(response.data)) {
      return;
    }
    
    throw new Error('Failed to request SMS code');
  },

  async verifyCode(phone: string, code: string, userData: any): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/verify-code',
      { phone, code, ...userData }
    );
    
    if (isApiSuccess(response.data)) {
      return response.data.data;
    }
    
    throw new Error('Failed to verify code');
  },

  // ============================================
  // Favorites
  // ============================================
  
  async getFavorites(): Promise<Listing[]> {
    const response = await apiClient.get<ApiResponse<Listing[]>>('/favorites');
    
    if (isApiSuccess(response.data)) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch favorites');
  },

  async addFavorite(listingId: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(`/favorites/${listingId}`);
    
    if (isApiSuccess(response.data)) {
      return;
    }
    
    throw new Error('Failed to add favorite');
  },

  async removeFavorite(listingId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/favorites/${listingId}`);
    
    if (isApiSuccess(response.data)) {
      return;
    }
    
    throw new Error('Failed to remove favorite');
  },

  // ============================================
  // Chat
  // ============================================
  
  async createChatThread(listingId: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/chat/threads', { listing_id: listingId });
    
    if (isApiSuccess(response.data)) {
      return response.data.data;
    }
    
    throw new Error('Failed to create chat thread');
  },

  async sendMessage(threadId: string, body: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/chat/threads/${threadId}/messages`,
      { body }
    );
    
    if (isApiSuccess(response.data)) {
      return response.data.data;
    }
    
    throw new Error('Failed to send message');
  },
};

export default api;
