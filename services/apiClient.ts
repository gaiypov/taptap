/**
 * Оптимизированный клиент для API запросов
 * Включает retry, timeout, кэширование и обработку ошибок
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Constants from 'expo-constants';

const API_BASE_URL = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://localhost:3000';

interface RequestConfig extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  useCache?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

// Простой in-memory кэш
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 60000; // 1 минута

/**
 * Очистка устаревших записей кэша
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiry) {
      cache.delete(key);
    }
  }
}

// Очистка кэша каждые 5 минут
setInterval(cleanCache, 5 * 60 * 1000);

/**
 * Генерация ключа кэша из URL и параметров
 */
function getCacheKey(url: string, params?: any): string {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${url}${paramsStr}`;
}

/**
 * Задержка
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Оптимизированный HTTP клиент с retry и кэшированием
 */
class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000, // 10 секунд по умолчанию
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Интерцептор для добавления токена авторизации
    this.client.interceptors.request.use(
      (config) => {
        // Добавляем токен если есть
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Интерцептор для обработки ответов
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Обработка 401 - Unauthorized
        if (error.response?.status === 401) {
          // Токен истек, можно обновить здесь
          console.warn('[ApiClient] Unauthorized - token may be expired');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Получить токен авторизации (нужно реализовать в вашем auth сервисе)
   */
  private getAuthToken(): string | null {
    // TODO: Интегрировать с вашим auth сервисом
    // Например: return auth.getToken();
    return null;
  }

  /**
   * Выполнить запрос с retry логикой
   */
  async request<T = any>(config: RequestConfig): Promise<AxiosResponse<T>> {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 10000,
      useCache = false,
      url,
      params,
      ...axiosConfig
    } = config;

    // Проверка кэша для GET запросов
    if (useCache && config.method === 'GET' && url) {
      const cacheKey = getCacheKey(url, params);
      const cached = cache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return {
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: axiosConfig as any,
        } as AxiosResponse<T>;
      }
    }

    let lastError: Error | AxiosError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await Promise.race([
          this.client.request<T>({
            ...axiosConfig,
            url,
            params,
            timeout,
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeout);
          }),
        ]);

        // Кэшируем успешный ответ для GET запросов
        if (useCache && config.method === 'GET' && url) {
          const cacheKey = getCacheKey(url, params);
          cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
            expiry: Date.now() + CACHE_DURATION,
          });
        }

        return response;
      } catch (error) {
        lastError = error as AxiosError;
        
        // Не retry для 4xx ошибок (кроме 429)
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw error;
          }
        }

        // Экспоненциальная задержка перед retry
        if (attempt < retries) {
          const delayMs = retryDelay * Math.pow(2, attempt);
          await delay(delayMs);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * GET запрос
   */
  async get<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url,
      useCache: config?.useCache ?? true, // По умолчанию кэш для GET
    });
  }

  /**
   * POST запрос
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data,
    });
  }

  /**
   * PUT запрос
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'PUT',
      url,
      data,
    });
  }

  /**
   * PATCH запрос
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'PATCH',
      url,
      data,
    });
  }

  /**
   * DELETE запрос
   */
  async delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'DELETE',
      url,
    });
  }

  /**
   * Очистить кэш
   */
  clearCache(): void {
    cache.clear();
  }

  /**
   * Очистить конкретную запись кэша
   */
  clearCacheEntry(url: string, params?: any): void {
    const cacheKey = getCacheKey(url, params);
    cache.delete(cacheKey);
  }
}

// Экспортируем singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Экспортируем класс для создания других инстансов
export { ApiClient };

// Утилиты для работы с ошибками
export function isNetworkError(error: any): boolean {
  return (
    axios.isAxiosError(error) &&
    (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')
  );
}

export function isTimeoutError(error: any): boolean {
  return (
    axios.isAxiosError(error) &&
    (error.code === 'ECONNABORTED' || error.message === 'Request timeout')
  );
}

export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return error.response.data?.message || error.response.statusText || 'Server error';
    }
    if (error.request) {
      return 'Network error - no response from server';
    }
  }
  return error.message || 'Unknown error';
}

