// ==============================================
// VIDEO TYPES
// ==============================================

export interface VideoTrimData {
  startTime: number;        // Начало обрезки (секунды)
  endTime: number;          // Конец обрезки (секунды)
  originalDuration: number; // Оригинальная длительность
  trimmedDuration: number;  // Длительность после обрезки
}

export interface VideoMetadata {
  // Базовые данные
  videoId: string;          // api.video ID
  originalUri?: string;     // Локальный URI (если есть)

  // Размеры
  width: number;
  height: number;
  duration: number;         // Оригинальная длительность

  // Обрезка
  trim?: VideoTrimData;

  // Редактирование
  filters?: VideoFilters;

  // Статус
  uploadStatus: 'pending' | 'uploading' | 'processing' | 'ready' | 'failed';
  uploadProgress: number;
}

export interface VideoFilters {
  brightness?: number;      // -1 to 1
  contrast?: number;        // -1 to 1
  saturation?: number;      // -1 to 1
}

export interface VideoPlaybackConfig {
  videoId: string;
  startTime?: number;       // Начало воспроизведения
  endTime?: number;         // Конец воспроизведения
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
}
