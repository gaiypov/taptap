'use client';

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView as ExpoCameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ShootingGuide from './ShootingGuide';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 667;

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
      '📸 Спереди',
      '🔄 Сзади',
      '🚪 Салон',
      '🔊 Двигатель',
      '🏁 Завершайте',
    ],
  },
  horse: {
    icon: '🐴',
    name: 'Лошадь',
    hints: [
      '📸 Целиком',
      '🏃 В движении',
      '👀 Крупно',
      '🦵 Ноги',
      '🏁 Завершайте',
    ],
  },
  real_estate: {
    icon: '🏠',
    name: 'Недвижимость',
    hints: [
      '🚶 Обход комнат',
      '🪟 Вид',
      '🛋️ Ремонт',
      '🏡 Двор',
      '🏁 Завершайте',
    ],
  },
};

export default function CameraCapture({ category, onComplete, onBack }: CameraCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [audioEnabled, setAudioEnabled] = useState(true);
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
      });

      // Обрабатываем результат записи
      recordingPromise
        .then((video: { uri: string } | undefined) => {
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

  if (!permission || !micPermission) {
    return <View />;
  }

  if (!permission.granted || !micPermission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons
            name={!permission.granted ? "camera" : "mic"}
            size={64}
            color={ultra.accent}
            style={{ marginBottom: 20 }}
          />
          <Text style={styles.message}>
            {!permission.granted ? 'Нужен доступ к камере' : 'Нужен доступ к микрофону'}
          </Text>
          <Text style={styles.submessage}>
            Для записи видео с голосом нужны разрешения камеры и микрофона
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!permission.granted) {
                requestPermission();
              } else if (!micPermission.granted) {
                requestMicPermission();
              }
            }}
          >
            <Text style={styles.buttonText}>Разрешить</Text>
          </TouchableOpacity>
        </View>
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
        mute={!audioEnabled}
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

      {/* Top left buttons */}
      <View style={styles.topLeftButtons}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.closeButtonInner}>
            <Ionicons name="close" size={22} color={ultra.textPrimary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setAudioEnabled(!audioEnabled)}
          style={styles.audioButton}
          activeOpacity={0.7}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.audioButtonInner}>
            <Ionicons
              name={audioEnabled ? "mic" : "mic-off"}
              size={22}
              color={audioEnabled ? ultra.accent : ultra.textMuted}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Category indicator — Revolut Ultra Glassmorphism */}
      <View style={styles.categoryIndicator}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 30 : 0}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.categoryContent}>
          <View style={styles.categoryIconContainer}>
        <Text style={styles.categoryEmoji}>{config.icon}</Text>
          </View>
        <Text style={styles.categoryName}>{config.name}</Text>
        </View>
      </View>

      {/* Shooting Guide - показывается ДО начала записи */}
      <ShootingGuide category={category} visible={!isRecording && isCameraReady} />

      {/* Recording hint — Revolut Ultra Glassmorphism */}
      {isRecording && (
        <Animated.View style={[styles.recordingHint, { opacity: pulseAnim }]}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={[ultra.gradientStart, ultra.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hintGradient}
          >
            <View style={styles.hintIconContainer}>
              <Ionicons name="bulb" size={16} color={ultra.accentSecondary} />
            </View>
          <Text style={styles.hintText}>
            {config.hints[currentHintIndex]}
          </Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Timer — Revolut Ultra Glassmorphism */}
      {isRecording && (
        <View style={styles.timer}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.timerGradient}
          >
          <Animated.View style={[styles.recordingDot, { opacity: pulseAnim }]} />
          <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Progress bar — Revolut Ultra Glassmorphism */}
      {isRecording && (
        <View style={styles.progressContainer}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.progressContent}>
          <View style={styles.progressBar}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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
        </View>
      )}

      {/* Record button — Revolut Ultra Glassmorphism */}
      <View style={styles.recordButtonContainer}>
        <TouchableOpacity
          onPress={toggleRecording}
          disabled={!isCameraReady && !isRecording}
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonRecording,
            (!isCameraReady && !isRecording) && styles.recordButtonDisabled
          ]}
          activeOpacity={0.8}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 30 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          {isRecording ? (
            <View style={styles.stopIconContainer}>
            <View style={styles.stopIcon} />
            </View>
          ) : (
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recordIcon}
            />
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
    backgroundColor: ultra.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  topLeftButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 20,
  },
  closeButton: {
    width: Platform.select({ ios: 44, android: 40, default: 44 }),
    height: Platform.select({ ios: 44, android: 40, default: 44 }),
    borderRadius: Platform.select({ ios: 22, android: 20, default: 22 }),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  audioButton: {
    width: Platform.select({ ios: 44, android: 40, default: 44 }),
    height: Platform.select({ ios: 44, android: 40, default: 44 }),
    borderRadius: Platform.select({ ios: 22, android: 20, default: 22 }),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  audioButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(23, 23, 23, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Platform.select({ ios: 22, android: 20, default: 22 }),
  },
  closeButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(23, 23, 23, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Platform.select({ ios: 22, android: 20, default: 22 }),
  },
  categoryIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: '50%',
    transform: [{ translateX: -90 }],
    borderRadius: Platform.select({ ios: 24, android: 20, default: 24 }),
    overflow: 'hidden',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.select({ ios: 10, android: 8, default: 10 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    backgroundColor: Platform.OS === 'ios' ? 'rgba(23, 23, 23, 0.6)' : 'rgba(0, 0, 0, 0.5)',
  },
  categoryIconContainer: {
    width: Platform.select({ ios: 32, android: 28, default: 32 }),
    height: Platform.select({ ios: 32, android: 28, default: 32 }),
    borderRadius: Platform.select({ ios: 16, android: 14, default: 16 }),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: Platform.select({ ios: 20, android: 18, default: 20 }),
  },
  categoryName: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '700',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  recordingHint: {
    position: 'absolute',
    top: IS_SMALL_SCREEN ? 80 : (Platform.OS === 'ios' ? 110 : 100),
    left: '50%',
    transform: [{ translateX: -100 }],
    borderRadius: Platform.select({ ios: 20, android: 18, default: 20 }),
    overflow: 'hidden',
    zIndex: 20,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  hintGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.select({ ios: 8, android: 6, default: 8 }),
    paddingHorizontal: IS_SMALL_SCREEN ? 10 : (Platform.select({ ios: 12, android: 10, default: 12 })),
    paddingVertical: IS_SMALL_SCREEN ? 6 : (Platform.select({ ios: 8, android: 6, default: 8 })),
    backgroundColor: Platform.OS === 'ios' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.9)',
  },
  hintIconContainer: {
    width: IS_SMALL_SCREEN ? 18 : (Platform.select({ ios: 20, android: 18, default: 20 })),
    height: IS_SMALL_SCREEN ? 18 : (Platform.select({ ios: 20, android: 18, default: 20 })),
    borderRadius: IS_SMALL_SCREEN ? 9 : (Platform.select({ ios: 10, android: 9, default: 10 })),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: IS_SMALL_SCREEN ? 12 : (Platform.select({ ios: 13, android: 12, default: 13 })),
    fontWeight: '700',
    color: ultra.textPrimary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  timer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 20,
    borderRadius: Platform.select({ ios: 24, android: 20, default: 24 }),
    overflow: 'hidden',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  timerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.select({ ios: 10, android: 8, default: 10 }),
    paddingHorizontal: Platform.select({ ios: 18, android: 16, default: 18 }),
    paddingVertical: Platform.select({ ios: 10, android: 8, default: 10 }),
    backgroundColor: '#EF4444',
  },
  recordingDot: {
    width: Platform.select({ ios: 10, android: 9, default: 10 }),
    height: Platform.select({ ios: 10, android: 9, default: 10 }),
    borderRadius: Platform.select({ ios: 5, android: 4.5, default: 5 }),
    backgroundColor: ultra.textPrimary,
  },
  timerText: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    fontWeight: '900',
    color: ultra.textPrimary,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  progressContainer: {
    position: 'absolute',
    bottom: IS_SMALL_SCREEN ? 90 : (Platform.OS === 'ios' ? 110 : 100),
    left: 16,
    right: 16,
    borderRadius: Platform.select({ ios: 14, android: 12, default: 14 }),
    overflow: 'hidden',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(23, 23, 23, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    padding: IS_SMALL_SCREEN ? 8 : (Platform.select({ ios: 10, android: 8, default: 10 })),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  progressContent: {
    gap: Platform.select({ ios: 10, android: 8, default: 10 }),
  },
  progressBar: {
    height: Platform.select({ ios: 6, android: 5, default: 6 }),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Platform.select({ ios: 3, android: 2.5, default: 3 }),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Platform.select({ ios: 3, android: 2.5, default: 3 }),
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTime: {
    fontSize: Platform.select({ ios: 13, android: 12, default: 13 }),
    color: ultra.textPrimary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  progressRemaining: {
    fontSize: Platform.select({ ios: 13, android: 12, default: 13 }),
    color: ultra.textSecondary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  recordButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 40,
    left: '50%',
    transform: [{ translateX: -40 }],
    zIndex: 20,
  },
  recordButton: {
    width: Platform.select({ ios: 80, android: 76, default: 80 }),
    height: Platform.select({ ios: 80, android: 76, default: 80 }),
    borderRadius: Platform.select({ ios: 40, android: 38, default: 40 }),
    borderWidth: Platform.select({ ios: 4, android: 3, default: 4 }),
    borderColor: ultra.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  recordButtonRecording: {
    transform: [{ scale: 0.9 }],
  },
  recordButtonDisabled: {
    opacity: 0.5,
    backgroundColor: ultra.textMuted,
  },
  recordIcon: {
    width: Platform.select({ ios: 64, android: 60, default: 64 }),
    height: Platform.select({ ios: 64, android: 60, default: 64 }),
    borderRadius: Platform.select({ ios: 32, android: 30, default: 32 }),
  },
  stopIconContainer: {
    width: Platform.select({ ios: 28, android: 26, default: 28 }),
    height: Platform.select({ ios: 28, android: 26, default: 28 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: Platform.select({ ios: 20, android: 18, default: 20 }),
    height: Platform.select({ ios: 20, android: 18, default: 20 }),
    backgroundColor: ultra.textPrimary,
    borderRadius: Platform.select({ ios: 4, android: 3, default: 4 }),
  },
  warningContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 180 : 160,
    left: '50%',
    transform: [{ translateX: -100 }],
    zIndex: 20,
  },
  warningText: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: '#FCD34D',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 8,
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontWeight: '700',
  },
  submessage: {
    textAlign: 'center',
    paddingBottom: 20,
    color: ultra.textSecondary,
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    lineHeight: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: 'bold',
    color: ultra.textPrimary,
  },
});
