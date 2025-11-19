'use client';

import { Ionicons } from '@expo/vector-icons';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CameraCaptureProps {
  category: 'car' | 'horse' | 'real_estate';
  onComplete: (videoUri: string) => void;
  onBack: () => void;
}

const MAX_DURATION = 120; // 120 секунд
const MIN_DURATION = 30; // 30 секунд минимум

const categoryConfig = {
  car: {
    icon: '🚗',
    name: 'Автомобиль',
    hints: [
      '📸 Покажите авто спереди',
      '🔄 Покажите авто сзади',
      '🚪 Откройте двери, салон',
      '🔊 Заведите двигатель',
      '🏁 Отлично! Завершайте',
    ],
  },
  horse: {
    icon: '🐴',
    name: 'Лошадь',
    hints: [
      '📸 Покажите лошадь целиком',
      '🏃 Покажите как двигается',
      '👀 Крупный план морды',
      '🦵 Покажите ноги',
      '🏁 Отлично! Завершайте',
    ],
  },
  real_estate: {
    icon: '🏠',
    name: 'Недвижимость',
    hints: [
      '🚶 Медленно пройдите по комнатам',
      '🪟 Покажите вид из окон',
      '🛋️ Покажите мебель и ремонт',
      '🏡 Двор и подъезд',
      '🏁 Отлично! Завершайте',
    ],
  },
};

export default function CameraCapture({ category, onComplete, onBack }: CameraCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<ExpoCameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const config = categoryConfig[category];

  const stopRecording = useCallback(() => {
    if (cameraRef.current && isRecording) {
      if (recordingTime < MIN_DURATION) {
        Alert.alert(
          'Слишком короткое видео',
          `Минимальная длительность видео: ${MIN_DURATION} секунд. Продолжите запись.`
        );
        return;
      }
      try {
        cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Stop recording error:', error);
        Alert.alert('Ошибка', 'Не удалось остановить запись');
      }
    }
  }, [isRecording, recordingTime]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= MAX_DURATION) {
            stopRecording();
            return t;
          }
          return t + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, stopRecording]);

  // Update hints
  useEffect(() => {
    if (isRecording) {
      const hintIndex = Math.floor(recordingTime / 20);
      setCurrentHintIndex(Math.min(hintIndex, config.hints.length - 1));
    }
  }, [recordingTime, isRecording, config.hints.length]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    if (!isCameraReady) {
      Alert.alert('Камера не готова', 'Подождите, пока камера инициализируется...');
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Ошибка', 'Камера не инициализирована');
      return;
    }

    try {
      setIsRecording(true);
      setRecordingTime(0);
      setCurrentHintIndex(0);
      
      // Небольшая задержка для стабилизации
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // recordAsync возвращает Promise, который резолвится когда запись завершена
      const recordingPromise = cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION,
        quality: '720p',
      });

      // Обрабатываем результат записи
      recordingPromise
        .then((video: { uri: string }) => {
          if (video?.uri) {
            setIsRecording(false);
            onComplete(video.uri);
          } else {
            setIsRecording(false);
            Alert.alert('Ошибка', 'Видео не было записано');
          }
        })
        .catch((error: any) => {
          console.error('Recording error:', error);
          setIsRecording(false);
          Alert.alert('Ошибка', error.message || 'Не удалось записать видео');
        });
    } catch (error: any) {
      console.error('Start recording error:', error);
      setIsRecording(false);
      Alert.alert('Ошибка', error.message || 'Не удалось начать запись');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Нужно разрешение для доступа к камере</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Разрешить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera preview */}
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="video"
        onCameraReady={() => {
          console.log('✅ Camera ready in CameraCapture');
          setIsCameraReady(true);
        }}
        onMountError={(error) => {
          console.error('❌ Camera mount error in CameraCapture:', error);
          setIsCameraReady(false);
          Alert.alert('Ошибка камеры', 'Не удалось инициализировать камеру. Попробуйте перезапустить приложение.');
        }}
      />

      {/* Overlay gradient */}
      <View style={styles.overlay} />

      {/* Close button */}
      <TouchableOpacity
        onPress={onBack}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Category indicator */}
      <View style={styles.categoryIndicator}>
        <Text style={styles.categoryEmoji}>{config.icon}</Text>
        <Text style={styles.categoryName}>{config.name}</Text>
      </View>

      {/* Recording hint */}
      {isRecording && (
        <Animated.View style={[styles.recordingHint, { opacity: pulseAnim }]}>
          <Text style={styles.hintText}>
            {config.hints[currentHintIndex]}
          </Text>
        </Animated.View>
      )}

      {/* Timer */}
      {isRecording && (
        <View style={styles.timer}>
          <Animated.View style={[styles.recordingDot, { opacity: pulseAnim }]} />
          <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
        </View>
      )}

      {/* Progress bar */}
      {isRecording && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(recordingTime / MAX_DURATION) * 100}%` }
              ]}
            />
          </View>
          <View style={styles.progressText}>
            <Text style={styles.progressTime}>{formatTime(recordingTime)}</Text>
            <Text style={styles.progressRemaining}>
              {formatTime(MAX_DURATION - recordingTime)} осталось
            </Text>
          </View>
        </View>
      )}

      {/* Record button */}
      <View style={styles.recordButtonContainer}>
        <TouchableOpacity
          onPress={toggleRecording}
          disabled={!isCameraReady && !isRecording}
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonRecording,
            (!isCameraReady && !isRecording) && styles.recordButtonDisabled
          ]}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <View style={styles.recordIcon} />
          )}
        </TouchableOpacity>
      </View>

      {/* Minimum duration warning */}
      {isRecording && recordingTime < MIN_DURATION && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Минимум {MIN_DURATION} секунд
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  categoryIndicator: {
    position: 'absolute',
    top: 50,
    left: '50%',
    transform: [{ translateX: -80 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  recordingHint: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -120 }],
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    zIndex: 20,
    maxWidth: 240,
  },
  hintText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  timer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'monospace',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressTime: {
    fontSize: 14,
    color: '#FFF',
  },
  progressRemaining: {
    fontSize: 14,
    color: '#FFF',
  },
  recordButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -40 }],
    zIndex: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonRecording: {
    transform: [{ scale: 0.9 }],
  },
  recordButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#666',
  },
  recordIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  warningContainer: {
    position: 'absolute',
    bottom: 160,
    left: '50%',
    transform: [{ translateX: -100 }],
    zIndex: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#FCD34D',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
