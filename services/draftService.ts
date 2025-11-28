// services/draftService.ts
// Сервис для автоматического сохранения черновиков объявлений

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@360auto:listing-draft';
const DRAFT_EXPIRY_HOURS = 24;

export interface ListingDraft {
  // Основные данные
  category: 'car' | 'horse' | 'real_estate';
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  city?: string;
  location?: string;
  phone_for_listing?: string;

  // Видео
  videoUri?: string;
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;

  // Детали (категория-специфичные)
  details?: Record<string, any>;

  // Метаданные черновика
  savedAt: string;
  currentStep: number; // 1-5
  userId?: string;
}

class DraftService {
  private autosaveInterval: ReturnType<typeof setInterval> | null = null;
  private lastSavedData: string | null = null;

  /**
   * Сохранить черновик в локальное хранилище
   */
  async saveDraft(data: Partial<ListingDraft>): Promise<void> {
    try {
      const draft: ListingDraft = {
        ...data,
        savedAt: new Date().toISOString(),
        currentStep: data.currentStep || 1,
      } as ListingDraft;

      const serialized = JSON.stringify(draft);

      // Оптимизация: не сохраняем если данные не изменились
      if (serialized === this.lastSavedData) {
        return;
      }

      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, serialized);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, serialized);
      }

      this.lastSavedData = serialized;
      console.log('[DraftService] ✅ Draft saved', {
        step: draft.currentStep,
        hasTitle: !!draft.title,
        hasVideo: !!draft.videoUri
      });
    } catch (error) {
      console.error('[DraftService] ❌ Failed to save draft:', error);
    }
  }

  /**
   * Загрузить черновик из хранилища
   */
  async loadDraft(): Promise<ListingDraft | null> {
    try {
      let data: string | null;

      if (Platform.OS === 'web') {
        data = localStorage.getItem(STORAGE_KEY);
      } else {
        data = await AsyncStorage.getItem(STORAGE_KEY);
      }

      if (!data) {
        console.log('[DraftService] No draft found');
        return null;
      }

      const draft: ListingDraft = JSON.parse(data);

      // Проверка на устаревший черновик
      const savedAt = new Date(draft.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > DRAFT_EXPIRY_HOURS) {
        console.log('[DraftService] Draft expired, clearing');
        await this.clearDraft();
        return null;
      }

      console.log('[DraftService] ✅ Draft loaded', {
        age: `${Math.round(hoursDiff * 60)} minutes`,
        step: draft.currentStep,
        category: draft.category
      });

      return draft;
    } catch (error) {
      console.error('[DraftService] ❌ Failed to load draft:', error);
      return null;
    }
  }

  /**
   * Очистить черновик
   */
  async clearDraft(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }

      this.lastSavedData = null;
      console.log('[DraftService] ✅ Draft cleared');
    } catch (error) {
      console.error('[DraftService] ❌ Failed to clear draft:', error);
    }
  }

  /**
   * Проверить есть ли сохраненный черновик
   */
  async hasDraft(): Promise<boolean> {
    try {
      let data: string | null;

      if (Platform.OS === 'web') {
        data = localStorage.getItem(STORAGE_KEY);
      } else {
        data = await AsyncStorage.getItem(STORAGE_KEY);
      }

      if (!data) return false;

      // Проверяем что черновик не устарел
      const draft: ListingDraft = JSON.parse(data);
      const savedAt = new Date(draft.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

      return hoursDiff <= DRAFT_EXPIRY_HOURS;
    } catch {
      return false;
    }
  }

  /**
   * Начать автоматическое сохранение (каждые 10 секунд)
   */
  startAutosave(getData: () => Partial<ListingDraft>): void {
    // Очищаем предыдущий интервал если есть
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }

    // Сохраняем каждые 10 секунд
    this.autosaveInterval = setInterval(() => {
      const data = getData();
      if (data && (data.title || data.videoUri || data.price)) {
        // Сохраняем только если есть хоть какие-то данные
        this.saveDraft(data);
      }
    }, 10000); // 10 секунд

    console.log('[DraftService] ✅ Autosave started (every 10s)');
  }

  /**
   * Остановить автоматическое сохранение
   */
  stopAutosave(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
      console.log('[DraftService] ✅ Autosave stopped');
    }
  }

  /**
   * Получить время последнего сохранения
   */
  async getLastSavedTime(): Promise<Date | null> {
    try {
      const draft = await this.loadDraft();
      return draft ? new Date(draft.savedAt) : null;
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const draftService = new DraftService();

export default draftService;
