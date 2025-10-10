import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface StoredVideo {
  id: string;
  uri: string;
  thumbnailUri?: string;
  title: string;
  description?: string;
  uploadedAt: string;
  carInfo?: {
    make: string;
    model: string;
    year: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    likes: boolean;
    comments: boolean;
    newVideos: boolean;
  };
  videoQuality: 'low' | 'medium' | 'high';
  autoPlay: boolean;
}

class StorageService {
  private readonly KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    USER_PREFERENCES: 'user_preferences',
    OFFLINE_VIDEOS: 'offline_videos',
    CACHED_DATA: 'cached_data',
  };

  // Auth token management
  async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  }

  // User data management
  async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // User preferences
  async setUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  // Offline videos
  async saveOfflineVideo(video: StoredVideo): Promise<void> {
    try {
      const existingVideos = await this.getOfflineVideos();
      const updatedVideos = [...existingVideos, video];
      await AsyncStorage.setItem(this.KEYS.OFFLINE_VIDEOS, JSON.stringify(updatedVideos));
    } catch (error) {
      console.error('Failed to save offline video:', error);
    }
  }

  async getOfflineVideos(): Promise<StoredVideo[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.OFFLINE_VIDEOS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get offline videos:', error);
      return [];
    }
  }

  async removeOfflineVideo(videoId: string): Promise<void> {
    try {
      const videos = await this.getOfflineVideos();
      const updatedVideos = videos.filter(video => video.id !== videoId);
      await AsyncStorage.setItem(this.KEYS.OFFLINE_VIDEOS, JSON.stringify(updatedVideos));
    } catch (error) {
      console.error('Failed to remove offline video:', error);
    }
  }

  // File system operations
  async saveVideoFile(uri: string, filename: string): Promise<string> {
    try {
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });
      return fileUri;
    } catch (error) {
      console.error('Failed to save video file:', error);
      throw error;
    }
  }

  async deleteVideoFile(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri);
    } catch (error) {
      console.error('Failed to delete video file:', error);
    }
  }

  async getFileInfo(uri: string): Promise<FileSystem.FileInfo | null> {
    try {
      return await FileSystem.getInfoAsync(uri);
    } catch (error) {
      console.error('Failed to get file info:', error);
      return null;
    }
  }

  // Cache management
  async setCachedData(key: string, data: any, expiryMinutes: number = 60): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + (expiryMinutes * 60 * 1000),
      };
      await AsyncStorage.setItem(`${this.KEYS.CACHED_DATA}_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.KEYS.CACHED_DATA}_${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      if (Date.now() > cacheData.expiry) {
        await AsyncStorage.removeItem(`${this.KEYS.CACHED_DATA}_${key}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.KEYS.AUTH_TOKEN,
        this.KEYS.USER_DATA,
        this.KEYS.USER_PREFERENCES,
        this.KEYS.OFFLINE_VIDEOS,
      ]);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }
}

export const storageService = new StorageService();
export default storageService;
