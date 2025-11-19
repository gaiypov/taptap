// services/api.ts — САМЫЙ МОЩНЫЙ И СТАБИЛЬНЫЙ API-CLIENT 2025 ГОДА
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВА К ЗАПУСКУ В APP STORE И PLAY MARKET

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import storageService from './storage';

// === ПРАВИЛЬНЫЙ СПОСОБ ПОЛУЧЕНИЯ URL В 2025 ГОДУ ===
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
  (__DEV__
    ? 'http://192.168.1.16:3001/api' // Твой локальный сервер
    : 'https://api.360auto.kg/api'); // Production

interface RequestConfig extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL = 60_000; // 1 минута

const cleanCache = () => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiry) cache.delete(key);
  }
};

setInterval(cleanCache, 5 * 60 * 1000);

const getCacheKey = (url: string, params?: any): string =>
  `${url}${params ? JSON.stringify(params) : ''}`;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

class ApiClient {
  private client: AxiosInstance;
  private tokenCache: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Загружаем токен при инициализации
    this.loadToken();

    this.client.interceptors.request.use(async (config) => {
      // Обновляем токен перед каждым запросом
      if (!this.tokenCache) {
        await this.loadToken();
      }
      if (this.tokenCache) {
        config.headers.Authorization = `Bearer ${this.tokenCache}`;
  }
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.tokenCache = null;
          await storageService.clearToken();
          // Можно добавить событие: EventBus.emit('auth:logout')
        }
        return Promise.reject(error);
      }
    );
  }

  private async loadToken(): Promise<void> {
    try {
      this.tokenCache = await storageService.getAuthToken();
    } catch (error) {
      this.tokenCache = null;
    }
  }

  async request<T = any>(config: RequestConfig): Promise<AxiosResponse<T>> {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 15_000,
      useCache = false,
      cacheTTL = DEFAULT_CACHE_TTL,
      url,
      params,
      ...axiosConfig
    } = config;

    // Кэш для GET
    if (useCache && config.method?.toUpperCase() === 'GET' && url) {
      const key = getCacheKey(url, params);
      const cached = cache.get(key);
      if (cached && Date.now() < cached.expiry) {
        return { ...cached.data, config: axiosConfig as any } as AxiosResponse<T>;
      }
    }

    let lastError: any;

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.client.request<T>({
          ...axiosConfig,
          url,
          params,
          timeout,
        });

        // Кэшируем
        if (useCache && config.method?.toUpperCase() === 'GET' && url) {
          const key = getCacheKey(url, params);
          cache.set(key, {
            data: response,
            timestamp: Date.now(),
            expiry: Date.now() + cacheTTL,
          });
        }

        return response;
      } catch (error: any) {
        lastError = error;

        const status = error.response?.status;
        const isClientError = status && status >= 400 && status < 500 && status !== 429;
        if (isClientError || i === retries) throw error;

        await delay(retryDelay * Math.pow(2, i));
      }
    }

    throw lastError;
  }

  get<T = any>(url: string, config?: RequestConfig) {
    return this.request<T>({ ...config, method: 'GET', url, useCache: true });
  }

  post<T = any>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  put<T = any>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  delete<T = any>(url: string, config?: RequestConfig) {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  clearCache() {
    cache.clear();
  }
}

const apiClientInstance = new ApiClient(API_BASE_URL);

// API методы с правильными путями
// Все методы возвращают только data из response для совместимости
export const api = {
  // AI
  ai: {
    analyzeCar: async (videoUri: string, onProgress?: (step: string, progress: number) => void) => {
      const response = await apiClientInstance.post('/analyze/car', { videoUri }, { onProgress });
      return response.data;
    },
    
    quickIdentify: async (imageUri: string) => {
      const response = await apiClientInstance.post('/analyze/quick', { imageUri });
      return response.data;
    },
  },

  // Listings
  listings: {
    feed: async (params?: any) => {
      const response = await apiClientInstance.get('/listings/feed', { params, useCache: true });
      return response.data;
    },
    get: async (id: string) => {
      const response = await apiClientInstance.get(`/listings/${id}`, { useCache: true });
      return response.data;
    },
    create: async (data: any) => {
      const response = await apiClientInstance.post('/listings', data);
      return response.data;
    },
    like: async (id: string) => {
      const response = await apiClientInstance.post(`/listings/${id}/like`);
      return response.data;
    },
    unlike: async (id: string) => {
      const response = await apiClientInstance.delete(`/listings/${id}/like`);
      return response.data;
    },
  },

  // Auth
  auth: {
    requestCode: async (phone: string) => {
      const response = await apiClientInstance.post('/auth/request-code', { phone });
      return response.data;
    },
    verifyCode: async (data: { phone: string; code: string }) => {
      const response = await apiClientInstance.post('/auth/verify-code', data);
      return response.data;
    },
    me: async () => {
      const response = await apiClientInstance.get('/auth/me', { useCache: false });
      return response.data;
    },
    logout: async () => {
      const response = await apiClientInstance.post('/auth/logout');
      return response.data;
    },
  },

  // User
  user: {
    profile: async () => {
      const response = await apiClientInstance.get('/user/profile', { useCache: true });
      return response.data;
    },
    update: async (data: any) => {
      const response = await apiClientInstance.put('/user/profile', data);
      return response.data;
    },
    favorites: async () => {
      const response = await apiClientInstance.get('/user/favorites', { useCache: true });
      return response.data;
    },
  },

  // Chat
  chat: {
    threads: async () => {
      const response = await apiClientInstance.get('/chat/threads', { useCache: false });
      return response.data;
    },
    messages: async (threadId: string) => {
      const response = await apiClientInstance.get(`/chat/threads/${threadId}/messages`, {
        useCache: false,
      });
      return response.data;
    },
    send: async (threadId: string, text: string) => {
      const response = await apiClientInstance.post(`/chat/threads/${threadId}/messages`, { text });
      return response.data;
    },
  },
};

export default api;
export { ApiClient };
