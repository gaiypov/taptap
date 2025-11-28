// components/Upload/VideoTrimEditor.tsx
// Редактор обрезки видео

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';

interface VideoTrimEditorProps {
  videoUri: string;
  duration: number; // в миллисекундах
  onConfirm: (startTime: number, endTime: number) => void;
  onCancel: () => void;
}

export default function VideoTrimEditor({
  videoUri,
  duration,
  onConfirm,
  onCancel,
}: VideoTrimEditorProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(duration);
  const [currentPosition, setCurrentPosition] = useState(0);

  // expo-video player - use object format for Android compatibility
  const playerSource = useMemo(() => {
    if (!videoUri) return null;
    return { uri: videoUri };
  }, [videoUri]);
  
  const player = useVideoPlayer(playerSource, (p) => {
    p.loop = true;
    p.play();
  });

  // Обновление позиции воспроизведения
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      try {
        const pos = (player.currentTime || 0) * 1000;
        setCurrentPosition(pos);

        // Если вышли за пределы выбранного диапазона, перематываем
        if (pos >= endTime) {
          player.currentTime = startTime / 1000;
        }
      } catch (e) {
        // Ignore
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, startTime, endTime]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartChange = (value: number) => {
    const newStart = Math.floor(value);
    if (newStart < endTime - 3000) { // Минимум 3 секунды
      setStartTime(newStart);
      if (player) {
        player.currentTime = newStart / 1000;
      }
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleEndChange = (value: number) => {
    const newEnd = Math.floor(value);
    if (newEnd > startTime + 3000) { // Минимум 3 секунды
      setEndTime(newEnd);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleConfirm = () => {
    const trimDuration = (endTime - startTime) / 1000;

    if (trimDuration < 3) {
      Alert.alert('Ошибка', 'Минимальная длительность видео: 3 секунды');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onConfirm(startTime / 1000, endTime / 1000);
  };

  const trimmedDuration = endTime - startTime;

  return (
    <View style={styles.container}>
      {/* Video Preview */}
      <View style={styles.videoContainer}>
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
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 0}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={ultra.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Ionicons name="cut" size={20} color={ultra.accentSecondary} />
            <Text style={styles.headerText}>Обрезка видео</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Editor Panel */}
      <View style={styles.editorPanel}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 0}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.editorContent}>
          {/* Duration Info */}
          <View style={styles.durationInfo}>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={16} color={ultra.accentSecondary} />
              <Text style={styles.durationText}>
                Длительность: {formatTime(trimmedDuration)}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.timelineLabel}>Начало</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={startTime}
                onValueChange={handleStartChange}
                minimumTrackTintColor={ultra.accentSecondary}
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor={ultra.accentSecondary}
              />
            </View>

            <Text style={[styles.timelineLabel, { marginTop: 16 }]}>Конец</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={endTime}
                onValueChange={handleEndChange}
                minimumTrackTintColor={ultra.accentSecondary}
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor={ultra.accentSecondary}
              />
            </View>
          </View>

          {/* Hint */}
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={14} color={ultra.textSecondary} />
            <Text style={styles.hintText}>
              Выберите начало и конец видео (минимум 3 сек)
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <View style={styles.cancelButtonInner}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </View>
            </TouchableOpacity>

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
                <Ionicons name="checkmark-circle" size={20} color={ultra.background} />
                <Text style={styles.confirmButtonText}>Применить</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  videoContainer: {
    flex: 1,
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
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  headerSpacer: {
    width: 44,
  },
  editorPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  editorContent: {
    padding: 20,
  },
  durationInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  timelineSection: {
    marginBottom: 16,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textSecondary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: ultra.accentSecondary,
    fontFamily: 'monospace',
    width: 50,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-regular',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  cancelButtonInner: {
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
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
});
