import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import storageService from './storage';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

async function request<T = any>(
  method: HttpMethod,
  path: string,
  body?: any,
  customHeaders: Record<string, string> = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { ...customHeaders };
  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const token = await getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: requestBody,
  });

  if (response.status === 401) {
    await clearAuthToken();
  }

  let parsedData: any = null;
  const rawText = await response.text();
  if (rawText) {
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = rawText;
    }
  }

  if (!response.ok) {
    const error = new Error(`API error: ${response.status}`);
    (error as any).response = {
      status: response.status,
      data: parsedData,
    };
    throw error;
  }

  return {
    data: parsedData,
    status: response.status,
    headers: response.headers,
  };
}

const apiClient = {
  get: <T = any>(path: string) => request<T>('GET', path),
  post: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    request<T>('POST', path, body, headers),
  put: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    request<T>('PUT', path, body, headers),
  delete: <T = any>(path: string) => request<T>('DELETE', path),
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Auth token management
async function getAuthToken(): Promise<string | null> {
  try {
    return await storageService.getAuthToken();
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return null;
  }
}

async function clearAuthToken(): Promise<void> {
  try {
    await storageService.removeAuthToken();
  } catch (error) {
    console.warn('Failed to clear auth token:', error);
  }
}

// Извлечение кадров из видео
async function extractFramesFromVideo(videoUri: string): Promise<string[]> {
  try {
    // В реальном приложении используйте expo-video-thumbnails
    // Для демо возвращаем мок данные
    const frames: string[] = [];
    const timestamps = [1000, 5000, 10000, 20000, 30000];
    
    // Пример с expo-video-thumbnails:
    // import * as VideoThumbnails from 'expo-video-thumbnails';
    
    // for (const time of timestamps) {
    //   const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
    //     time,
    //     quality: 0.8,
    //   });
    //   const base64 = await FileSystem.readAsStringAsync(uri, {
    //     encoding: FileSystem.EncodingType.Base64,
    //   });
    //   frames.push(`data:image/jpeg;base64,${base64}`);
    // }
    
    // Мок для разработки
    return [
      'data:image/jpeg;base64,mock-frame-1',
      'data:image/jpeg;base64,mock-frame-2',
      'data:image/jpeg;base64,mock-frame-3',
    ];
  } catch (error) {
    console.error('Frame extraction error:', error);
    throw error;
  }
}

export const api = {
  // AI Analysis endpoints
  ai: {
    analyzeCar: async (videoUri: string, onProgress?: (step: string, progress: number) => void) => {
      try {
        const frames = await extractFramesFromVideo(videoUri);
        
        const response = await apiClient.post('/analyze-car', {
          videoFrames: frames,
          metadata: {
            videoUrl: videoUri,
            timestamp: new Date().toISOString(),
          }
        });
        
        return response.data.data;
      } catch (error) {
        console.error('AI analysis error:', error);
        throw error;
      }
    },
    
    quickIdentify: async (imageUri: string) => {
      try {
        // Конвертируем изображение в base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });
        
        const response = await apiClient.post('/quick-identify', {
          imageBase64: `data:image/jpeg;base64,${base64}`,
        });
        
        return response.data.data;
      } catch (error) {
        console.error('Quick identify error:', error);
        throw error;
      }
    },
    
    validateVideo: async (videoMetadata: any) => {
      try {
        const response = await apiClient.post('/validate-video', {
          videoMetadata,
        });
        
        return response.data.data;
      } catch (error) {
        console.error('Video validation error:', error);
        throw error;
      }
    },
    
    getAnalysisStatus: async (analysisId: string) => {
      try {
        const response = await apiClient.get(`/analysis-status/${analysisId}`);
        return response.data.data;
      } catch (error) {
        console.error('Get analysis status error:', error);
        throw error;
      }
    },
  },

  // Video endpoints
  videos: {
    getAll: () => apiClient.get('/videos'),
    getById: (id: string) => apiClient.get(`/videos/${id}`),
    upload: (videoData: FormData) => apiClient.post('/videos', videoData),
    delete: (id: string) => apiClient.delete(`/videos/${id}`),
    like: (id: string) => apiClient.post(`/videos/${id}/like`),
    unlike: (id: string) => apiClient.delete(`/videos/${id}/like`),
  },

  // Car endpoints
  cars: {
    getAll: () => apiClient.get('/cars'),
    getById: (id: string) => apiClient.get(`/cars/${id}`),
    search: (query: string) => apiClient.get(`/cars/search?q=${query}`),
    getByLocation: (lat: number, lng: number) => 
      apiClient.get(`/cars/location?lat=${lat}&lng=${lng}`),
  },

  // User endpoints
  users: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (data: any) => apiClient.put('/users/profile', data),
    getVideos: (userId: string) => apiClient.get(`/users/${userId}/videos`),
  },

  // Auth endpoints
  auth: {
    login: (email: string, password: string) => 
      apiClient.post('/auth/login', { email, password }),
    register: (userData: any) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    refreshToken: () => apiClient.post('/auth/refresh'),
    requestCode: async (payload: { phone: string }) => {
      const response = await apiClient.post('/auth/request-code', payload);
      return response.data;
    },
    verifyCode: async (payload: { phone: string; code: string }) => {
      const response = await apiClient.post('/auth/verify-code', payload);
      return response.data;
    },
    getSmsStatus: async () => {
      const response = await apiClient.get('/auth/sms-status');
      return response.data;
    },
  },

  // Comments endpoints
  comments: {
    getByVideo: (videoId: string) => apiClient.get(`/videos/${videoId}/comments`),
    create: (videoId: string, content: string) => 
      apiClient.post(`/videos/${videoId}/comments`, { content }),
    delete: (commentId: string) => apiClient.delete(`/comments/${commentId}`),
  },

  consents: {
    getStatus: async () => {
      const response = await apiClient.get('/consents/status');
      return response.data;
    },
    getDetails: async () => {
      const response = await apiClient.get('/consents/details');
      return response.data;
    },
    initialize: async (payload?: { ip_address?: string; user_agent?: string }) => {
      const response = await apiClient.post('/consents/initialize', payload ?? {});
      return response.data;
    },
    accept: async (payload: {
      terms_version: string;
      privacy_version: string;
      consent_version: string;
      ip_address?: string;
      user_agent?: string;
      marketing_accepted?: boolean;
      notifications_accepted?: boolean;
    }) => {
      const response = await apiClient.post('/consents/accept', payload);
      return response.data;
    },
    revoke: async (payload?: { reason?: string }) => {
      const response = await apiClient.post('/consents/revoke', payload ?? {});
      return response.data;
    },
  },
};

export default api;
