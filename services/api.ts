import axios from 'axios';

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
  },

  // Comments endpoints
  comments: {
    getByVideo: (videoId: string) => apiClient.get(`/videos/${videoId}/comments`),
    create: (videoId: string, content: string) => 
      apiClient.post(`/videos/${videoId}/comments`, { content }),
    delete: (commentId: string) => apiClient.delete(`/comments/${commentId}`),
  },
};

export default api;
