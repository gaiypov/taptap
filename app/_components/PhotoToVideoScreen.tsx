/**
 * =====================================================
 * PHOTO TO VIDEO SLIDESHOW - FRONTEND (React Native)
 * =====================================================
 * 
 * Features:
 * - Upload 7-8 photos
 * - Preview before processing
 * - Customize settings (duration, transition, music)
 * - Real-time progress tracking
 * - Error handling
 * 
 * Dependencies:
 * expo-image-picker, expo-video, react-native-reanimated
 */

import { Ionicons } from '@expo/vector-icons';
// import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import type { Listing } from '@/types';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { SCREEN_WIDTH } from '@/utils/constants';

// ============================================
// TYPES
// ============================================

interface PhotoAsset {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
}

interface SlideshowSettings {
  duration_per_photo: 3 | 4 | 5;
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  music: 'upbeat' | 'calm' | 'none';
  total_duration: number;
}

interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

interface PhotoToVideoScreenProps {
  navigation: {
    navigate: (routeName: string, params?: any) => void;
    goBack: () => void;
  };
  route: {
    params?: {
      listingData?: Listing;
    };
  };
}

interface PhotoCardProps {
  photo: PhotoAsset;
  index: number;
  onRemove: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const MIN_PHOTOS = 2; // Changed from 7 to 2
const MAX_PHOTOS = 6; // Changed from 8 to 6
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per photo

const MUSIC_OPTIONS = [
  { value: 'upbeat', label: 'Энергичная', icon: '⚡️' },
  { value: 'calm', label: 'Спокойная', icon: '🌊' },
  { value: 'none', label: 'Без музыки', icon: '🔇' },
 ] as const;

const TRANSITION_OPTIONS = [
  { value: 'fade', label: 'Плавное', preview: '◐' },
  { value: 'slide', label: 'Скольжение', preview: '→' },
  { value: 'zoom', label: 'Увеличение', preview: '⊕' },
  { value: 'none', label: 'Без перехода', preview: '▯' },
 ] as const;

const DURATION_OPTIONS = [
  { value: 3, label: '3 сек' },
  { value: 4, label: '4 сек' },
  { value: 5, label: '5 сек' },
 ] as const;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Неизвестная ошибка';

// ============================================
// MAIN COMPONENT
// ============================================

export default function PhotoToVideoScreen({ navigation, route }: PhotoToVideoScreenProps) {
  const { listingData } = route.params || {};
  
  // State
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [settings, setSettings] = useState<SlideshowSettings>({
    duration_per_photo: 4,
    transition: 'fade',
    music: 'upbeat',
    total_duration: 32, // 8 photos * 4 seconds
  });
  const [processing, setProcessing] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  
  // const videoRef = useRef<Video>(null);
  
  // ============================================
  // PHOTO PICKER
  // ============================================
  
  const pickPhotos = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Доступ запрещен',
          'Для загрузки фото нужно разрешение на доступ к галерее',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Настройки', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS,
        quality: 0.9,
        aspect: [9, 16], // Vertical for TikTok style
      });
      
      if (result.canceled) {
        return;
      }
      
      // Validate
      if (result.assets.length < MIN_PHOTOS) {
        Alert.alert(
          'Недостаточно фото',
          `Пожалуйста, выберите минимум ${MIN_PHOTOS} фото`
        );
        return;
      }
      
      // Check file sizes
      const validPhotos: PhotoAsset[] = [];
      for (const asset of result.assets) {
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            'Файл слишком большой',
            `Фото ${asset.fileName || ''} превышает 10MB`
          );
          continue;
        }
        validPhotos.push({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
        });
      }
      
      if (validPhotos.length < MIN_PHOTOS) {
        Alert.alert('Ошибка', 'Недостаточно валидных фото');
        return;
      }
      
      setPhotos(validPhotos);
      
      // Update total duration
      setSettings(prev => ({
        ...prev,
        total_duration: validPhotos.length * prev.duration_per_photo,
      }));
      
    } catch (error: unknown) {
      console.error('Error picking photos:', error);
      Alert.alert('Ошибка', getErrorMessage(error));
    }
  };
  
  // ============================================
  // REMOVE PHOTO
  // ============================================
  
  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    
    if (newPhotos.length < MIN_PHOTOS) {
      Alert.alert(
        'Внимание',
        `Нужно минимум ${MIN_PHOTOS} фото для создания видео`
      );
    }
    
    // Update duration
    setSettings(prev => ({
      ...prev,
      total_duration: newPhotos.length * prev.duration_per_photo,
    }));
  };
  
  // ============================================
  // REORDER PHOTOS (Drag & Drop)
  // ============================================
  
  // Future feature: drag & drop
  // const reorderPhotos = (fromIndex: number, toIndex: number) => {
  //   const newPhotos = [...photos];
  //   const [movedPhoto] = newPhotos.splice(fromIndex, 1);
  //   newPhotos.splice(toIndex, 0, movedPhoto);
  //   setPhotos(newPhotos);
  // };
  
  // ============================================
  // CREATE VIDEO
  // ============================================
  
  const createVideo = async () => {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert('Ошибка', `Нужно минимум ${MIN_PHOTOS} фото`);
      return;
    }
    
    try {
      setProcessing({
        status: 'uploading',
        progress: 0,
        message: 'Загрузка фото...',
      });
      
      // Create FormData
      const formData = new FormData();
      
      // Add photos
      photos.forEach((photo, index) => {
        const filename = `photo_${index}.jpg`;
        const match = /\.(\w+)$/.exec(photo.uri);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('photos', {
          uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
          name: filename,
          type,
        } as any);
      });
      
      // Add settings
      formData.append('settings', JSON.stringify(settings));
      
      // Add listing data if exists
      if (listingData) {
        formData.append('listing_data', JSON.stringify(listingData));
      }
      
      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = (event.loaded / event.total) * 50; // Upload is 50% of total
          setProcessing(prev => ({
            ...prev,
            progress: uploadProgress,
            message: `Загружено ${Math.round(uploadProgress)}%`,
          }));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          
          if (response.success) {
            // Start polling for processing status
            pollProcessingStatus(response.job_id);
          } else {
            setProcessing({
              status: 'error',
              progress: 0,
              message: response.error || 'Ошибка при создании видео',
              error: response.error,
            });
          }
        } else {
          setProcessing({
            status: 'error',
            progress: 0,
            message: 'Ошибка сервера',
            error: `HTTP ${xhr.status}`,
          });
        }
      });
      
      xhr.addEventListener('error', () => {
        setProcessing({
          status: 'error',
          progress: 0,
          message: 'Ошибка сети',
          error: 'Network error',
        });
      });
      
      // Send request
      xhr.open('POST', `${process.env.EXPO_PUBLIC_API_URL}/api/v1/listings/create-from-photos`);
      xhr.setRequestHeader('Authorization', `Bearer ${await getAuthToken()}`);
      xhr.send(formData);
      
    } catch (error: unknown) {
      console.error('Error creating video:', error);
      const errorMessage = getErrorMessage(error);
      setProcessing({
        status: 'error',
        progress: 0,
        message: 'Не удалось создать видео',
        error: errorMessage,
      });
    }
  };
  
  // ============================================
  // POLL PROCESSING STATUS
  // ============================================
  
  const pollProcessingStatus = async (jobId: string) => {
    const pollInterval = 2000; // 2 seconds
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max
    
    const poll = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/v1/listings/video-status/${jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${await getAuthToken()}`,
            },
          }
        );
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          setProcessing({
            status: 'completed',
            progress: 100,
            message: 'Видео готово!',
            video_url: data.video_url,
            thumbnail_url: data.thumbnail_url,
          });
          
          // Navigate to next screen
          setTimeout(() => {
            navigation.navigate('CreateDetails', {
              video_url: data.video_url,
              thumbnail_url: data.thumbnail_url,
              ...listingData,
            });
          }, 1000);
          
        } else if (data.status === 'failed') {
          setProcessing({
            status: 'error',
            progress: 0,
            message: 'Ошибка при обработке видео',
            error: data.error,
          });
          
        } else {
          // Still processing
          const processingProgress = 50 + (data.progress || 0) / 2; // 50-100%
          setProcessing({
            status: 'processing',
            progress: processingProgress,
            message: data.message || 'Создание видео...',
          });
          
          // Continue polling
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            setProcessing({
              status: 'error',
              progress: 0,
              message: 'Превышено время ожидания',
              error: 'Timeout',
            });
          }
        }
      } catch (error: unknown) {
        console.error('Error polling status:', error);
        const errorMessage = getErrorMessage(error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setProcessing({
            status: 'error',
            progress: 0,
            message: 'Ошибка проверки статуса',
            error: errorMessage,
          });
        }
      }
    };
    
    poll();
  };
  
  // ============================================
  // RENDER
  // ============================================
  
  if (processing.status === 'uploading' || processing.status === 'processing') {
    return (
      <View style={styles.processingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.processingGradient}
        >
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.processingTitle}>{processing.message}</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${processing.progress}%` }
                ]}
              />
            </View>
            
            <Text style={styles.processingPercent}>
              {Math.round(processing.progress)}%
            </Text>
            
            <Text style={styles.processingSubtext}>
              {processing.status === 'uploading' 
                ? 'Загружаем ваши фото на сервер...'
                : 'Создаём красивое видео из фото...'}
            </Text>
            
            <Text style={styles.processingTip}>
              💡 Это займёт ~30 секунд
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Создать из фото</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Empty State */}
      {photos.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="images-outline" size={80} color="#E0E0E0" />
          </View>
          <Text style={styles.emptyTitle}>Загрузите фото</Text>
          <Text style={styles.emptySubtext}>
            Выберите {MIN_PHOTOS}-{MAX_PHOTOS} фото, мы создадим{'\n'}
            красивое видео автоматически
          </Text>
          
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickPhotos}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.uploadButtonGradient}
            >
              <Ionicons name="cloud-upload" size={24} color="#ffffff" />
              <Text style={styles.uploadButtonText}>Выбрать фото</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Photos Grid */}
      {photos.length > 0 && (
        <>
          <View style={styles.photosSection}>
            <View style={styles.photosSectionHeader}>
              <Text style={styles.sectionTitle}>
                Фото ({photos.length}/{MAX_PHOTOS})
              </Text>
              <TouchableOpacity onPress={pickPhotos}>
                <Text style={styles.addMoreButton}>+ Добавить</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <PhotoCard
                  key={index}
                  photo={photo}
                  index={index}
                  onRemove={() => removePhoto(index)}
                />
              ))}
            </View>
            
            <Text style={styles.photosHint}>
              💡 Первое фото будет обложкой объявления
            </Text>
          </View>
          
          {/* Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Настройки видео</Text>
            
            {/* Duration */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Длительность каждого фото</Text>
              <View style={styles.optionsRow}>
                {DURATION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      settings.duration_per_photo === option.value && styles.optionButtonActive
                    ]}
                    onPress={() => {
                      setSettings(prev => ({
                        ...prev,
                        duration_per_photo: option.value as SlideshowSettings['duration_per_photo'],
                        total_duration: photos.length * option.value,
                      }));
                    }}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      settings.duration_per_photo === option.value && styles.optionButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Transition */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Переходы</Text>
              <View style={styles.optionsRow}>
                {TRANSITION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      settings.transition === option.value && styles.optionButtonActive
                    ]}
                    onPress={() => {
                      setSettings(prev => ({
                        ...prev,
                        transition: option.value as SlideshowSettings['transition'],
                      }));
                    }}
                  >
                    <Text style={styles.optionPreview}>{option.preview}</Text>
                    <Text style={[
                      styles.optionButtonText,
                      settings.transition === option.value && styles.optionButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Music */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Фоновая музыка</Text>
              <View style={styles.optionsRow}>
                {MUSIC_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      settings.music === option.value && styles.optionButtonActive
                    ]}
                    onPress={() => {
                      setSettings(prev => ({
                        ...prev,
                        music: option.value as SlideshowSettings['music'],
                      }));
                    }}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.optionButtonText,
                      settings.music === option.value && styles.optionButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Total Duration */}
            <View style={styles.durationSummary}>
              <Text style={styles.durationLabel}>Итоговая длительность:</Text>
              <Text style={styles.durationValue}>{settings.total_duration} сек</Text>
            </View>
          </View>
          
          {/* Create Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={createVideo}
              disabled={photos.length < MIN_PHOTOS}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButtonGradient}
              >
                <Ionicons name="videocam" size={24} color="#ffffff" />
                <Text style={styles.createButtonText}>Создать видео</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ============================================
// PHOTO CARD COMPONENT
// ============================================

function PhotoCard({ photo, index, onRemove }: PhotoCardProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View style={[styles.photoCard, animatedStyle]}>
      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
      
      {/* Index Badge */}
      <View style={styles.photoIndex}>
        <Text style={styles.photoIndexText}>{index + 1}</Text>
      </View>
      
      {/* First Photo Badge */}
      {index === 0 && (
        <View style={styles.coverBadge}>
          <Text style={styles.coverBadgeText}>Обложка</Text>
        </View>
      )}
      
      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <Ionicons name="close-circle" size={24} color="#ef4444" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  uploadButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Photos Section
  photosSection: {
    padding: 20,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addMoreButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  photoCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    aspectRatio: 9 / 16,
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoIndex: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#667eea',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  coverBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  photosHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  
  // Settings Section
  settingsSection: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  settingGroup: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    borderColor: '#667eea',
    backgroundColor: '#F0F2FF',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  optionButtonTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  optionPreview: {
    fontSize: 20,
    marginBottom: 4,
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  durationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  durationValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
  },
  
  // Footer
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Processing Screen
  processingContainer: {
    flex: 1,
  },
  processingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 32,
  },
  progressBarContainer: {
    width: SCREEN_WIDTH - 80,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  processingPercent: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  processingSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  processingTip: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getAuthToken(): Promise<string> {
  const { auth } = require('@/services/auth');
  try {
    const user = await auth.getCurrentUser();
    return user?.token || '';
  } catch (error: unknown) {
    console.error('Error getting auth token:', error);
    return '';
  }
}
