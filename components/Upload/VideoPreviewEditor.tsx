// components/Upload/VideoPreviewEditor.tsx
// Предпросмотр и редактирование видео после съемки

import { ultra } from '@/lib/theme/ultra';
import { VideoTrimData } from '@/types/video.types';
import { calculateTrimmedDuration, formatDuration, validateTrim } from '@/utils/videoUtils';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import VideoTrimEditor from './VideoTrimEditor';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPreviewEditorProps {
  videoUri: string;
  category: 'car' | 'horse' | 'real_estate';
  onConfirm: (videoUri: string, trimData?: VideoTrimData) => void;
  onRetake: () => void;
  onCancel: () => void;
}

export default function VideoPreviewEditor({
  videoUri,
  category,
  onConfirm,
  onRetake,
  onCancel,
}: VideoPreviewEditorProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [showTrimEditor, setShowTrimEditor] = useState(false);
  const [trimData, setTrimData] = useState<VideoTrimData | null>(null);

  // expo-video player - use object format for Android compatibility
  const playerSource = useMemo(() => {
    if (!videoUri) return null;
    return { uri: videoUri };
  }, [videoUri]);
  
  const player = useVideoPlayer(playerSource, (p) => {
    if (videoUri) {
      p.loop = false;
      p.play();
      setIsReady(true);
    }
  });

  const categoryIcons = {
    car: '🚗',
    horse: '🐴',
    real_estate: '🏠',
  };

  // Обновление статуса воспроизведения
  useEffect(() => {
    if (!player || !videoUri) return;
    
    const interval = setInterval(() => {
      try {
        setPosition((player.currentTime || 0) * 1000);
        setDuration((player.duration || 0) * 1000);
        setIsPlaying(player.playing || false);
      } catch (e) {
        // Ignore errors during playback status update
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, videoUri]);

  // Форматирование времени из миллисекунд
  const formatTime = (millis: number) => {
    return formatDuration(Math.floor(millis / 1000));
  };

  const handlePlayPause = () => {
    if (!player) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Video control error:', e);
    }
  };

  const handleReplay = () => {
    if (!player) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      player.currentTime = 0;
      player.play();
      setIsPlaying(true);
    } catch (e) {
      console.warn('Video replay error:', e);
    }
  };

  const handleConfirm = () => {
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Валидация trim данных перед отправкой
    if (trimData) {
      const validation = validateTrim(trimData);
      if (!validation.valid) {
        Alert.alert('Ошибка обрезки', validation.error || 'Неверные параметры обрезки');
        return;
      }
    }

    onConfirm(videoUri, trimData || undefined);
  };

  const handleRetake = () => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Переснять видео?',
      'Текущее видео будет удалено. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Переснять',
          style: 'destructive',
          onPress: onRetake,
        },
      ]
    );
  };

  const handleEdit = () => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTrimEditor(true);
  };

  const handleTrimConfirm = (startTime: number, endTime: number) => {
    // Создаем объект VideoTrimData
    const originalDuration = duration / 1000; // duration в миллисекундах, нужно в секундах
    const trimmedDuration = calculateTrimmedDuration({
      startTime,
      endTime,
      originalDuration,
    });

    const newTrimData: VideoTrimData = {
      startTime,
      endTime,
      originalDuration,
      trimmedDuration,
    };

    // Валидация
    const validation = validateTrim(newTrimData);
    if (!validation.valid) {
      Alert.alert('Ошибка обрезки', validation.error || 'Неверные параметры обрезки');
      return;
    }

    setTrimData(newTrimData);
    setShowTrimEditor(false);

    // Показать уведомление что обрезка применена
    Alert.alert(
      'Обрезка применена',
      `Видео обрезано: ${formatDuration(startTime)} - ${formatDuration(endTime)}\nДлительность: ${formatDuration(trimmedDuration)}`,
      [{ text: 'OK' }]
    );
  };

  // Показать Trim Editor если активирован
  if (showTrimEditor && duration > 0) {
    return (
      <VideoTrimEditor
        videoUri={videoUri}
        duration={duration}
        onConfirm={handleTrimConfirm}
        onCancel={() => setShowTrimEditor(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />

      {/* Overlay gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 0}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={ultra.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.headerEmoji}>{categoryIcons[category]}</Text>
            <Text style={styles.headerText}>Предпросмотр</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Controls Overlay */}
      {showControls && (
        <TouchableOpacity
          style={styles.controlsOverlay}
          activeOpacity={1}
          onPress={() => setShowControls(false)}
        >
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 40 : 0}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={48}
              color={ultra.textPrimary}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomPanel}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 0}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {/* Replay Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReplay}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonInner}>
              <Ionicons name="refresh" size={24} color={ultra.textSecondary} />
              <Text style={styles.actionButtonText}>Повтор</Text>
            </View>
          </TouchableOpacity>

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonInner}>
              <Ionicons name="cut" size={24} color={ultra.accentSecondary} />
              <Text style={[styles.actionButtonText, { color: ultra.accentSecondary }]}>
                Обрезать
              </Text>
            </View>
          </TouchableOpacity>

          {/* Retake Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRetake}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonInner}>
              <Ionicons name="videocam" size={24} color={ultra.textSecondary} />
              <Text style={styles.actionButtonText}>Переснять</Text>
            </View>
          </TouchableOpacity>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[ultra.accentSecondary, ultra.accent]}
              style={styles.confirmButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark-circle" size={24} color={ultra.background} />
              <Text style={styles.confirmButtonText}>Продолжить</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Trim Info (если обрезка применена) */}
        {trimData && (
          <View style={styles.trimInfo}>
            <Ionicons name="cut" size={14} color={ultra.accentSecondary} />
            <Text style={styles.trimInfoText}>
              Обрезка: {formatDuration(trimData.startTime)} - {formatDuration(trimData.endTime)} ({formatDuration(trimData.trimmedDuration)})
            </Text>
          </View>
        )}

        {/* Hint */}
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={14} color={ultra.textSecondary} />
          <Text style={styles.hintText}>
            {trimData ? 'Обрезка применена. ' : ''}Проверьте видео перед созданием объявления
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  video: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  headerSpacer: {
    width: 44,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ultra.accentSecondary,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: ultra.textSecondary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonInner: {
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: ultra.textSecondary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  confirmButtonGradient: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: ultra.background,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  hintText: {
    fontSize: 12,
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-regular',
  },
  trimInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: 8,
    alignSelf: 'center',
  },
  trimInfoText: {
    fontSize: 12,
    color: ultra.accentSecondary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
});
