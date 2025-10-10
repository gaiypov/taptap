import axios from 'axios';
import { Car, User } from '../types';

const API_BASE_URL = 'https://api.360auto.com/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      // Redirect to login or refresh token
    }
    return Promise.reject(error);
  }
);

export const api = {
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
    getAll: () => apiClient.get<Car[]>('/cars'),
    getById: (id: string) => apiClient.get<Car>(`/cars/${id}`),
    search: (query: string) => apiClient.get<Car[]>(`/cars/search?q=${query}`),
    getByLocation: (lat: number, lng: number) => 
      apiClient.get<Car[]>(`/cars/location?lat=${lat}&lng=${lng}`),
    getBySeller: (sellerId: string) => 
      apiClient.get<Car[]>(`/cars/seller/${sellerId}`),
    save: (carId: string) => apiClient.post(`/cars/${carId}/save`),
    unsave: (carId: string) => apiClient.delete(`/cars/${carId}/save`),
  },

  // User endpoints
  users: {
    getProfile: () => apiClient.get<User>('/users/profile'),
    updateProfile: (data: Partial<User>) => apiClient.put<User>('/users/profile', data),
    getVideos: (userId: string) => apiClient.get(`/users/${userId}/videos`),
    getCars: (userId: string) => apiClient.get<Car[]>(`/users/${userId}/cars`),
  },

  // Auth endpoints
  auth: {
    login: (phone: string, password: string) => 
      apiClient.post('/auth/login', { phone, password }),
    register: (userData: {
      name: string;
      phone: string;
      password: string;
    }) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    refreshToken: () => apiClient.post('/auth/refresh'),
    verifyPhone: (phone: string, code: string) =>
      apiClient.post('/auth/verify-phone', { phone, code }),
    sendVerificationCode: (phone: string) =>
      apiClient.post('/auth/send-verification-code', { phone }),
  },

  // Comments endpoints
  comments: {
    getByVideo: (videoId: string) => apiClient.get(`/videos/${videoId}/comments`),
    create: (videoId: string, content: string) => 
      apiClient.post(`/videos/${videoId}/comments`, { content }),
    delete: (commentId: string) => apiClient.delete(`/comments/${commentId}`),
  },

  // AI Analysis endpoints
  ai: {
    analyzeCar: (videoUrl: string) => 
      apiClient.post('/ai/analyze-car', { videoUrl }),
    detectDamages: (imageUrl: string) =>
      apiClient.post('/ai/detect-damages', { imageUrl }),
    detectFeatures: (videoUrl: string) =>
      apiClient.post('/ai/detect-features', { videoUrl }),
    estimatePrice: (carData: Partial<Car>) =>
      apiClient.post('/ai/estimate-price', carData),
    generateDescription: (carData: any) =>
      apiClient.post('/ai/generate-description', carData),
    searchSimilarCars: (carData: any) =>
      apiClient.post('/ai/similar-cars', carData),
    moderateContent: (content: string) =>
      apiClient.post('/ai/moderate', { content }),
    analyzeCondition: (videoUrl: string) =>
      apiClient.post('/ai/analyze-condition', { videoUrl }),
  },
};

export default api;