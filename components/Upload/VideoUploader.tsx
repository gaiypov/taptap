// Компонент загрузки видео с api.video для React Native

import { isRealVideo, normalizeVideoUrl } from '@/lib/video/videoSource';
import { db } from '@/services/supabase';
import { uploadVideoWithOfflineSupport } from '@/services/videoUploader';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from '@expo/video';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface VideoUploaderProps {
  onUploadComplete?: (videoId: string, videoUrl: string) => void;
  onUploadError?: (error: Error) => void;
  carId?: string; // Если загружается для конкретного авто
}

// Component for video preview
function VideoPreviewComponent({ videoUri }: { videoUri: string | null }) {
  // КРИТИЧНО: Нормализуем videoUri ПЕРЕД использованием
  // Для локальных файлов (file://) normalizeVideoUrl тоже работает
  const finalUrl = useMemo(() => {
    const normalized = normalizeVideoUrl(videoUri);
    
    // DEBUG лог для поиска источника Optional
    if (__DEV__) {
      appLogger.debug('DEBUG videoUrl source', {
        original: videoUri,
        normalized: normalized,
        component: 'VideoUploader.VideoPreviewComponent',
      });
    }
    
    return normalized;
  }, [videoUri]);

  // Проверяем, является ли это реальным видео (не placeholder)
  // Для локальных файлов (file://) считаем реальным видео
  const hasRealVideo = useMemo(() => {
    if (!finalUrl) return false;
    // Локальные файлы (file://) - это реальное видео
    if (finalUrl.startsWith('file://')) return true;
    return isRealVideo(finalUrl);
  }, [finalUrl]);

  // Create player source - ALWAYS use { uri: string } format for both iOS and Android
  const playerSource = useMemo(() => {
    if (!finalUrl || finalUrl.length === 0) return null;
    return { uri: finalUrl };
  }, [finalUrl]);

  const player = useVideoPlayer(playerSource as any);

  // Если нет реального видео - показываем сообщение
  if (!hasRealVideo) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Предпросмотр недоступно</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.previewContainer}>
      <Text style={styles.previewTitle}>Предпросмотр</Text>
      <VideoView
        player={player}
        style={styles.videoPreview}
        nativeControls
        contentFit="contain"
        allowsFullscreen
        showsTimecodes={false}
        requiresLinearPlayback={false}
        contentPosition={{ dx: 0, dy: 0 }}
      />
    </View>
  );
}

export default function VideoUploader({
  onUploadComplete,
  onUploadError,
  carId,
}: VideoUploaderProps) {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);

  /**
   * Выбор видео из галереи
   */
  const pickVideo = async () => {
    try {
      // Запрос разрешений
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Разрешение требуется',
          'Пожалуйста, разрешите доступ к галерее для выбора видео'
        );
        return;
      }

      // Открыть галерею
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 120, // 2 минуты максимум
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      appLogger.error('Error picking video', { error });
      Alert.alert('Ошибка', 'Не удалось выбрать видео');
    }
  };

  /**
   * Запись нового видео
   */
  const recordVideo = async () => {
    try {
      // Запрос разрешений
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Разрешение требуется',
          'Пожалуйста, разрешите доступ к камере для записи видео'
        );
        return;
      }

      // Открыть камеру
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 120, // 2 минуты максимум
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      appLogger.error('Error recording video', { error });
      Alert.alert('Ошибка', 'Не удалось записать видео');
    }
  };

  /**
   * Загрузить видео на api.video
   */
  const uploadVideo = async () => {
    if (!videoUri) {
      Alert.alert('Ошибка', 'Сначала выберите или запишите видео');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Загрузка на api.video с поддержкой прогресса
      const result = await uploadVideoWithOfflineSupport(
        videoUri,
        'car', // категория по умолчанию
        (progress) => {
          setUploadProgress(progress);
        },
        {
          title: '360Auto Video',
        }
      );

      setVideoId(result.videoId);

      // Если есть carId, обновляем запись в БД (используем updateListing для listings)
      if (carId) {
        await db.updateListing(carId, {
          video_url: result.hlsUrl,
          thumbnail_url: result.thumbnailUrl,
          video_id: result.videoId,
        });
      }

      Alert.alert('Успешно!', 'Видео загружено');
      
      if (onUploadComplete) {
        onUploadComplete(result.videoId, result.hlsUrl);
      }

      // Сброс состояния
      setVideoUri(null);
      setUploadProgress(0);
    } catch (error) {
      appLogger.error('Upload error', { error });
      Alert.alert('Ошибка', 'Не удалось загрузить видео');
      
      if (onUploadError) {
        onUploadError(error as Error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Отмена и сброс
   */
  const resetUpload = () => {
    setVideoUri(null);
    setUploadProgress(0);
    setVideoId(null);
  };

  return (
    <View style={styles.container}>
      {/* Если видео не выбрано - показываем кнопки выбора */}
      {!videoUri && !videoId && (
        <View style={styles.actionsContainer}>
          <Text style={styles.title}>📹 Загрузите видео автомобиля</Text>
          <Text style={styles.subtitle}>
            Покажите автомобиль со всех сторон (до 2 минут)
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={recordVideo}
            disabled={isUploading}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF1744']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Ionicons name="videocam" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Снять видео</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={pickVideo}
            disabled={isUploading}
          >
            <Ionicons name="images" size={24} color="#FF3B30" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Выбрать из галереи
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Предпросмотр выбранного видео */}
      {videoUri && !videoId && (
        <>
          <VideoPreviewComponent videoUri={videoUri} />
          
          {/* Прогресс загрузки */}
          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}% загружено</Text>
              <ActivityIndicator size="large" color="#FF3B30" style={styles.loader} />
            </View>
          )}

          {/* Кнопки действий */}
          {!isUploading && (
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={resetUpload}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Отмена
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { flex: 1 }]}
                onPress={uploadVideo}
              >
                <LinearGradient
                  colors={['#FF3B30', '#FF1744']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradient}
                >
                  <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Загрузить</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Успешная загрузка */}
      {videoId && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          <Text style={styles.successTitle}>Видео загружено!</Text>
          <Text style={styles.successSubtitle}>ID: {videoId.slice(0, 8)}...</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={resetUpload}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Загрузить еще
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  button: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF3B30',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FF3B30',
  },
  previewContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  videoPreview: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 16,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  loader: {
    marginTop: 8,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
});

