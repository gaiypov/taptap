// services/backgroundUploadService.ts
// Фоновая загрузка видео с прогресс-баром и возможностью возобновления

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const UPLOAD_QUEUE_KEY = '@360auto:upload-queue';
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks для стабильности

export interface UploadTask {
  id: string;
  listingId?: string;
  videoUri: string;
  category?: 'car' | 'horse' | 'real_estate';
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number; // 0-100
  uploadedBytes: number;
  totalBytes: number;
  uploadUrl?: string; // Финальный URL загруженного видео
  videoId?: string;   // ID видео в api.video или другом сервисе
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type UploadProgressCallback = (progress: number, task: UploadTask) => void;
export type UploadCompletedCallback = (task: UploadTask) => void;
export type UploadErrorCallback = (error: string, task: UploadTask) => void;

class BackgroundUploadService {
  private uploadQueue: Map<string, UploadTask> = new Map();
  private activeUploads: Set<string> = new Set();
  private progressCallbacks: Map<string, UploadProgressCallback> = new Map();
  private completedCallbacks: Map<string, UploadCompletedCallback> = new Map();
  private errorCallbacks: Map<string, UploadErrorCallback> = new Map();
  private maxConcurrentUploads = 2;

  constructor() {
    this.loadQueue();
  }

  /**
   * Добавить видео в очередь загрузки
   */
  async queueVideoUpload(
    videoUri: string,
    listingId?: string,
    category?: 'car' | 'horse' | 'real_estate'
  ): Promise<string> {
    const taskId = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Получаем размер файла
    let totalBytes = 0;
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalBytes = fileInfo.size;
      }
    } catch (error) {
      console.error('[BackgroundUpload] Failed to get file size:', error);
      totalBytes = 50 * 1024 * 1024; // Предполагаем 50MB
    }

    const task: UploadTask = {
      id: taskId,
      listingId,
      videoUri,
      category: category || 'car',
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
      totalBytes,
      createdAt: new Date().toISOString(),
    };

    this.uploadQueue.set(taskId, task);
    await this.saveQueue();

    console.log('[BackgroundUpload] ✅ Task queued', {
      taskId,
      size: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
    });

    // DISABLED: Auto-process causes spam when backend is not running
    // this.processQueue();

    return taskId;
  }

  /**
   * Обработать очередь загрузки
   */
  private async processQueue() {
    // Проверяем сколько загрузок уже идёт
    if (this.activeUploads.size >= this.maxConcurrentUploads) {
      console.log('[BackgroundUpload] Max concurrent uploads reached, waiting...');
      return;
    }

    // Находим следующую задачу для загрузки
    const pendingTasks = Array.from(this.uploadQueue.values())
      .filter(task => task.status === 'pending' || task.status === 'paused')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (pendingTasks.length === 0) {
      console.log('[BackgroundUpload] No pending tasks');
      return;
    }

    const task = pendingTasks[0];
    this.activeUploads.add(task.id);

    console.log('[BackgroundUpload] 🚀 Starting upload', {
      taskId: task.id,
      size: `${(task.totalBytes / 1024 / 1024).toFixed(2)} MB`
    });

    try {
      await this.uploadTask(task);
    } catch (error: any) {
      console.error('[BackgroundUpload] ❌ Upload failed:', error);
      task.status = 'failed';
      task.error = error.message;
      await this.saveQueue();

      // Вызываем callback ошибки
      const errorCallback = this.errorCallbacks.get(task.id);
      if (errorCallback) {
        errorCallback(error.message, task);
      }
    } finally {
      this.activeUploads.delete(task.id);
      // DISABLED: Auto-retry causes spam when backend is not running
      // setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * Загрузить одну задачу
   */
  private async uploadTask(task: UploadTask) {
    task.status = 'uploading';
    task.startedAt = new Date().toISOString();
    await this.saveQueue();

    // Используем uploadVideoWithOfflineSupport из videoUploader
    const { uploadVideoWithOfflineSupport } = await import('./videoUploader');

    // Callback для прогресса
    const onProgress = (progress: number) => {
      task.progress = progress;
      task.uploadedBytes = Math.round((task.totalBytes * progress) / 100);
      this.uploadQueue.set(task.id, task);

      // Сохраняем прогресс в storage (но не слишком часто)
      if (progress % 10 === 0) {
        this.saveQueue();
      }

      // Вызываем callback
      const progressCallback = this.progressCallbacks.get(task.id);
      if (progressCallback) {
        progressCallback(progress, task);
      }
    };

    try {
      // Загружаем через uploadVideoWithOfflineSupport
      const result = await uploadVideoWithOfflineSupport(
        task.videoUri,
        task.category || 'car',
        onProgress,
        {
          title: `Upload ${task.id}`,
        }
      );

      task.status = 'completed';
      task.progress = 100;
      task.uploadedBytes = task.totalBytes;
      task.uploadUrl = result.hlsUrl;
      task.videoId = result.videoId;
      task.completedAt = new Date().toISOString();

      console.log('[BackgroundUpload] ✅ Upload completed', {
        taskId: task.id,
        videoId: result.videoId,
        url: result.hlsUrl
      });

      // Вызываем callback успеха
      const completedCallback = this.completedCallbacks.get(task.id);
      if (completedCallback) {
        completedCallback(task);
      }
    } catch (error: any) {
      console.error('[BackgroundUpload] Upload error:', error);
      throw error;
    } finally {
      await this.saveQueue();
    }
  }

  /**
   * Подписаться на прогресс загрузки
   */
  onProgress(taskId: string, callback: UploadProgressCallback) {
    this.progressCallbacks.set(taskId, callback);
  }

  /**
   * Подписаться на завершение загрузки
   */
  onCompleted(taskId: string, callback: UploadCompletedCallback) {
    this.completedCallbacks.set(taskId, callback);
  }

  /**
   * Подписаться на ошибку загрузки
   */
  onError(taskId: string, callback: UploadErrorCallback) {
    this.errorCallbacks.set(taskId, callback);
  }

  /**
   * Отписаться от всех событий задачи
   */
  unsubscribe(taskId: string) {
    this.progressCallbacks.delete(taskId);
    this.completedCallbacks.delete(taskId);
    this.errorCallbacks.delete(taskId);
  }

  /**
   * Получить задачу по ID
   */
  getTask(taskId: string): UploadTask | undefined {
    return this.uploadQueue.get(taskId);
  }

  /**
   * Получить все задачи
   */
  getAllTasks(): UploadTask[] {
    return Array.from(this.uploadQueue.values());
  }

  /**
   * Получить активные загрузки
   */
  getActiveUploads(): UploadTask[] {
    return this.getAllTasks().filter(task => task.status === 'uploading');
  }

  /**
   * Получить завершенные загрузки
   */
  getCompletedUploads(): UploadTask[] {
    return this.getAllTasks().filter(task => task.status === 'completed');
  }

  /**
   * Приостановить загрузку
   */
  pauseUpload(taskId: string) {
    const task = this.uploadQueue.get(taskId);
    if (task && task.status === 'uploading') {
      task.status = 'paused';
      this.activeUploads.delete(taskId);
      this.saveQueue();
      console.log('[BackgroundUpload] ⏸️ Upload paused:', taskId);
    }
  }

  /**
   * Возобновить загрузку
   */
  resumeUpload(taskId: string) {
    const task = this.uploadQueue.get(taskId);
    if (task && task.status === 'paused') {
      task.status = 'pending';
      this.saveQueue();
      // DISABLED: Auto-process causes spam when backend is not running
      // this.processQueue();
      console.log('[BackgroundUpload] ▶️ Upload resumed:', taskId);
    }
  }

  /**
   * Отменить загрузку
   */
  cancelUpload(taskId: string) {
    const task = this.uploadQueue.get(taskId);
    if (task) {
      this.uploadQueue.delete(taskId);
      this.activeUploads.delete(taskId);
      this.unsubscribe(taskId);
      this.saveQueue();
      console.log('[BackgroundUpload] ❌ Upload cancelled:', taskId);
    }
  }

  /**
   * Очистить завершенные загрузки
   */
  clearCompleted() {
    const completed = this.getCompletedUploads();
    completed.forEach(task => {
      this.uploadQueue.delete(task.id);
      this.unsubscribe(task.id);
    });
    this.saveQueue();
    console.log('[BackgroundUpload] 🧹 Cleared completed uploads:', completed.length);
  }

  /**
   * Очистить ВСЮ очередь загрузок (включая pending и failed)
   */
  async clearAll() {
    const count = this.uploadQueue.size;
    this.uploadQueue.clear();
    this.activeUploads.clear();
    this.progressCallbacks.clear();
    this.completedCallbacks.clear();
    this.errorCallbacks.clear();
    await AsyncStorage.removeItem(UPLOAD_QUEUE_KEY);
    console.log('[BackgroundUpload] 🧹 Cleared ALL uploads:', count);
  }

  /**
   * Возобновить все незавершенные загрузки при запуске приложения
   */
  async resumeAll() {
    const pendingTasks = this.getAllTasks().filter(
      task => task.status === 'uploading' || task.status === 'paused'
    );

    console.log('[BackgroundUpload] 🔄 Resuming uploads:', pendingTasks.length);

    // Сбрасываем статус uploading → pending (так как приложение перезапустилось)
    pendingTasks.forEach(task => {
      if (task.status === 'uploading') {
        task.status = 'pending';
      }
    });

    await this.saveQueue();
    // DISABLED: Auto-process causes spam when backend is not running
    // this.processQueue();
  }

  /**
   * Сохранить очередь в AsyncStorage
   */
  private async saveQueue() {
    try {
      const tasks = Array.from(this.uploadQueue.values());
      const serialized = JSON.stringify(tasks);

      if (Platform.OS === 'web') {
        // Check if we're in browser environment
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(UPLOAD_QUEUE_KEY, serialized);
        } else {
          // SSR or Node.js environment - skip
          return;
        }
      } else {
        await AsyncStorage.setItem(UPLOAD_QUEUE_KEY, serialized);
      }
    } catch (error) {
      console.error('[BackgroundUpload] Failed to save queue:', error);
    }
  }

  /**
   * Загрузить очередь из AsyncStorage
   */
  private async loadQueue() {
    try {
      let data: string | null;

      if (Platform.OS === 'web') {
        // Check if we're in browser environment
        if (typeof window !== 'undefined' && window.localStorage) {
          data = window.localStorage.getItem(UPLOAD_QUEUE_KEY);
        } else {
          // SSR or Node.js environment - skip
          return;
        }
      } else {
        data = await AsyncStorage.getItem(UPLOAD_QUEUE_KEY);
      }

      if (data) {
        const tasks: UploadTask[] = JSON.parse(data);
        tasks.forEach(task => {
          this.uploadQueue.set(task.id, task);
        });

        console.log('[BackgroundUpload] ✅ Queue loaded:', tasks.length);
      }
    } catch (error) {
      console.error('[BackgroundUpload] Failed to load queue:', error);
    }
  }
}

// Singleton instance
export const backgroundUploadService = new BackgroundUploadService();

export default backgroundUploadService;
