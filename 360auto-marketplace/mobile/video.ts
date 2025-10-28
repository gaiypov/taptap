// services/video.ts
import { AI_CONFIG } from './ai/config';

/**
 * Сервис для работы с видео и извлечения кадров
 */

export interface VideoFrame {
  uri: string;
  timestamp: number;
  base64: string;
  width: number;
  height: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
  fps: number;
}

/**
 * Извлечение кадров из видео
 */
export async function extractFramesFromVideo(
  videoUri: string,
  maxFrames: number = AI_CONFIG.MAX_IMAGES_PER_ANALYSIS,
  quality: number = AI_CONFIG.IMAGE_QUALITY
): Promise<VideoFrame[]> {
  try {
    console.log('🎬 Extracting frames from video:', videoUri);
    
    // Получаем метаданные видео
    const metadata = await getVideoMetadata(videoUri);
    console.log('📊 Video metadata:', metadata);
    
    // Вычисляем временные точки для извлечения кадров
    const timestamps = calculateFrameTimestamps(metadata.duration, maxFrames);
    console.log('⏰ Frame timestamps:', timestamps);
    
    // Извлекаем кадры
    const frames: VideoFrame[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const frame = await extractFrameAtTimestamp(videoUri, timestamp, quality);
      
      if (frame) {
        frames.push(frame);
        console.log(`✅ Extracted frame ${i + 1}/${timestamps.length} at ${timestamp}s`);
      }
    }
    
    console.log(`🎉 Successfully extracted ${frames.length} frames`);
    return frames;
    
  } catch (error) {
    console.error('❌ Error extracting frames:', error);
    throw new Error('Не удалось извлечь кадры из видео');
  }
}

/**
 * Получение метаданных видео
 */
export async function getVideoMetadata(videoUri: string): Promise<VideoMetadata> {
  try {
    // В реальном приложении используйте expo-video-thumbnails или expo-av
    // Для демо возвращаем mock данные
    const mockMetadata: VideoMetadata = {
      duration: 30, // секунды
      width: 1920,
      height: 1080,
      size: 10 * 1024 * 1024, // 10MB
      format: 'mp4',
      fps: 30,
    };
    
    console.log('📊 Video metadata:', mockMetadata);
    return mockMetadata;
    
  } catch (error) {
    console.error('❌ Error getting video metadata:', error);
    throw new Error('Не удалось получить метаданные видео');
  }
}

/**
 * Вычисление временных точек для извлечения кадров
 */
function calculateFrameTimestamps(duration: number, maxFrames: number): number[] {
  const timestamps: number[] = [];
  
  if (duration <= 0 || maxFrames <= 0) {
    return [0]; // Fallback на первый кадр
  }
  
  // Равномерно распределяем кадры по времени
  const interval = duration / (maxFrames + 1);
  
  for (let i = 1; i <= maxFrames; i++) {
    const timestamp = interval * i;
    timestamps.push(Math.min(timestamp, duration - 0.1)); // Не берем последний кадр
  }
  
  return timestamps;
}

/**
 * Извлечение кадра в определенный момент времени
 */
async function extractFrameAtTimestamp(
  videoUri: string,
  timestamp: number,
  quality: number
): Promise<VideoFrame | null> {
  try {
    // В реальном приложении используйте expo-video-thumbnails
    // Для демо создаем mock кадр
    const mockFrame: VideoFrame = {
      uri: `mock-frame-${timestamp}`,
      timestamp,
      base64: await generateMockFrameBase64(timestamp),
      width: 1920,
      height: 1080,
    };
    
    return mockFrame;
    
  } catch (error) {
    console.error(`❌ Error extracting frame at ${timestamp}s:`, error);
    return null;
  }
}

/**
 * Генерация mock base64 кадра
 */
async function generateMockFrameBase64(timestamp: number): Promise<string> {
  // В реальном приложении здесь будет извлечение реального кадра
  // Для демо возвращаем mock base64
  const mockImageData = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=`;
  
  return mockImageData;
}

/**
 * Конвертация изображения в base64
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  try {
    console.log('🖼️ Converting image to base64:', uri);
    
    // В реальном приложении используйте FileSystem.readAsStringAsync
    // Для демо возвращаем mock base64
    const mockBase64 = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=`;
    
    console.log('✅ Image converted to base64');
    return mockBase64;
    
  } catch (error) {
    console.error('❌ Error converting image to base64:', error);
    throw new Error('Не удалось конвертировать изображение в base64');
  }
}

/**
 * Оптимизация изображения для AI
 */
export async function optimizeImageForAI(
  imageBase64: string,
  quality: number = AI_CONFIG.IMAGE_QUALITY,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<string> {
  try {
    console.log('🔧 Optimizing image for AI:', { quality, maxWidth, maxHeight });
    
    // В реальном приложении здесь будет сжатие и ресайз изображения
    // Для демо возвращаем оригинал
    const optimizedImage = imageBase64;
    
    console.log('✅ Image optimized for AI');
    return optimizedImage;
    
  } catch (error) {
    console.error('❌ Error optimizing image:', error);
    return imageBase64; // Fallback на оригинал
  }
}

/**
 * Валидация качества видео
 */
export async function validateVideoQuality(videoUri: string): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  score: number;
}> {
  try {
    console.log('📊 Validating video quality:', videoUri);
    
    const metadata = await getVideoMetadata(videoUri);
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;
    
    // Проверка разрешения
    if (metadata.width < 720 || metadata.height < 480) {
      issues.push('Низкое разрешение видео');
      suggestions.push('Используйте видео с разрешением минимум 720p');
      score -= 30;
    }
    
    // Проверка длительности
    if (metadata.duration < 5) {
      issues.push('Слишком короткое видео');
      suggestions.push('Рекомендуется видео длительностью от 5 секунд');
      score -= 20;
    } else if (metadata.duration > 60) {
      issues.push('Слишком длинное видео');
      suggestions.push('Рекомендуется видео длительностью до 60 секунд');
      score -= 10;
    }
    
    // Проверка размера файла
    if (metadata.size > AI_CONFIG.MAX_IMAGES_PER_ANALYSIS * 5 * 1024 * 1024) {
      issues.push('Большой размер файла');
      suggestions.push('Сожмите видео для лучшей производительности');
      score -= 15;
    }
    
    // Проверка FPS
    if (metadata.fps < 15) {
      issues.push('Низкий FPS');
      suggestions.push('Используйте видео с FPS минимум 15');
      score -= 10;
    }
    
    const result = {
      isValid: issues.length === 0,
      issues,
      suggestions,
      score: Math.max(score, 0),
    };
    
    console.log('📊 Video quality validation:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error validating video quality:', error);
    return {
      isValid: false,
      issues: ['Ошибка валидации видео'],
      suggestions: ['Проверьте формат и доступность файла'],
      score: 0,
    };
  }
}

/**
 * Получение превью видео
 */
export async function getVideoThumbnail(
  videoUri: string,
  timestamp: number = 0
): Promise<string> {
  try {
    console.log('🖼️ Getting video thumbnail:', { videoUri, timestamp });
    
    // В реальном приложении используйте expo-video-thumbnails
    // Для демо возвращаем mock thumbnail
    const thumbnail = await generateMockFrameBase64(timestamp);
    
    console.log('✅ Video thumbnail generated');
    return thumbnail;
    
  } catch (error) {
    console.error('❌ Error getting video thumbnail:', error);
    throw new Error('Не удалось получить превью видео');
  }
}

/**
 * Утилиты для работы с видео
 */
export const videoUtils = {
  extractFramesFromVideo,
  getVideoMetadata,
  imageUriToBase64,
  optimizeImageForAI,
  validateVideoQuality,
  getVideoThumbnail,
};
