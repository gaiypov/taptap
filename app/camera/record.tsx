// app/camera/record.tsx — REVOLUT ULTRA PLATINUM 2025-2026
// Камера с пошаговыми этапами съемки в стиле Revolut Ultra

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Category = 'car' | 'horse' | 'real_estate';

interface Stage {
  duration: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const GUIDES: Record<Category, Stage[]> = {
  car: [
    { duration: 8, title: 'Передняя часть', description: 'Снимите перед', icon: 'arrow-forward' },
    { duration: 8, title: 'Правый бок', description: 'Обойдите справа', icon: 'arrow-forward' },
    { duration: 8, title: 'Задняя часть', description: 'Снимите сзади', icon: 'arrow-back' },
    { duration: 8, title: 'Левый бок', description: 'Завершите круг', icon: 'arrow-back' },
    { duration: 8, title: 'Крыша и капот', description: 'Покажите верх', icon: 'arrow-up' },
    { duration: 10, title: 'Салон передний', description: 'Панель и сиденья', icon: 'car-sport' },
    { duration: 10, title: 'Салон задний', description: 'Задние сиденья', icon: 'car-sport' },
    { duration: 10, title: 'Одометр', description: 'КРУПНО пробег!', icon: 'speedometer' },
    { duration: 10, title: 'Багажник', description: 'Откройте багажник', icon: 'briefcase' },
    { duration: 15, title: 'Двигатель', description: 'Откройте капот', icon: 'construct' },
    { duration: 15, title: 'Документы', description: 'Покажите техпаспорт', icon: 'document-text' },
    { duration: 10, title: 'Финал', description: 'Общий план', icon: 'checkmark-circle' },
  ],
  horse: [
    { duration: 10, title: 'Спереди', description: 'Полный рост', icon: 'arrow-forward' },
    { duration: 10, title: 'Правый бок', description: 'Профиль справа', icon: 'arrow-forward' },
    { duration: 10, title: 'Сзади', description: 'Задняя часть', icon: 'arrow-back' },
    { duration: 10, title: 'Левый бок', description: 'Профиль слева', icon: 'arrow-back' },
    { duration: 10, title: 'Голова', description: 'Крупно морду', icon: 'eye' },
    { duration: 10, title: 'Ноги', description: 'Копыта крупно', icon: 'walk' },
    { duration: 10, title: 'Движение', description: 'Шаг / рысь', icon: 'flash' },
    { duration: 10, title: 'Документы', description: 'Родословная', icon: 'document-text' },
  ],
  real_estate: [
    { duration: 12, title: 'Внешний вид', description: 'Фасад здания', icon: 'business' },
    { duration: 12, title: 'Вход', description: 'Подъезд и входная дверь', icon: 'enter' },
    { duration: 15, title: 'Гостиная', description: 'Основная комната полностью', icon: 'home' },
    { duration: 12, title: 'Кухня', description: 'Вся кухня и техника', icon: 'restaurant' },
    { duration: 12, title: 'Спальня', description: 'Спальная комната', icon: 'bed' },
    { duration: 10, title: 'Доп. комнаты', description: 'Другие комнаты', icon: 'grid' },
    { duration: 12, title: 'Санузел', description: 'Ванная и туалет', icon: 'water' },
    { duration: 10, title: 'Балкон/лоджия', description: 'Балкон полностью', icon: 'square-outline' },
    { duration: 12, title: 'Окна', description: 'Вид из окон крупно', icon: 'eye' },
    { duration: 10, title: 'Двор/парковка', description: 'Территория вокруг', icon: 'car' },
    { duration: 15, title: 'Документы', description: 'Покажите документы', icon: 'document-text' },
    { duration: 10, title: 'Финал', description: 'Общий план квартиры', icon: 'checkmark-circle' },
  ],
};

export default function RecordScreen() {
  const { category = 'car' } = useLocalSearchParams<{ category: Category }>();
  
  // Fallback для неизвестных категорий
  const validCategory = ['car', 'horse', 'real_estate'].includes(category) ? category : 'car';
  const router = useRouter();
  const guide = GUIDES[validCategory];
  const totalDuration = guide.reduce((s, i) => s + i.duration, 0);

  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const progress = useSharedValue(0);
  const stageIndex = useSharedValue(0);

  // Вычисляем текущий этап безопасно
  const getCurrentStageIndex = useCallback((elapsedTime: number): number => {
    let accumulated = 0;
    for (let i = 0; i < guide.length; i++) {
      accumulated += guide[i].duration;
      if (elapsedTime < accumulated) {
        return i;
      }
    }
    return guide.length - 1; // Последний этап если время истекло
  }, [guide]);

  const currentStageIndex = getCurrentStageIndex(elapsed);
  const safeStageIndex = Math.max(0, Math.min(currentStageIndex, guide.length - 1));
  const currentStage = guide[safeStageIndex] || guide[0]; // Fallback на первый этап
  const stageStartTime = guide.slice(0, safeStageIndex).reduce((s, i) => s + i.duration, 0);
  const stageProgress = Math.max(0, Math.min(elapsed - stageStartTime, currentStage?.duration || 0));

  // Отладка: логируем состояние инструкции
  useEffect(() => {
    if (isRecording && __DEV__) {
      console.log('[Camera] Guide state:', {
        isRecording,
        elapsed,
        currentStageIndex,
        safeStageIndex,
        currentStage: currentStage?.title,
        stageProgress,
      });
    }
  }, [isRecording, elapsed, currentStageIndex, safeStageIndex, currentStage, stageProgress]);

  // Анимированный прогресс
  useEffect(() => {
    const progressPercent = Math.min((elapsed / totalDuration) * 100, 100);
    progress.value = withTiming(progressPercent, { duration: 800 });
    
    const calculatedStageIndex = getCurrentStageIndex(elapsed);
    stageIndex.value = withTiming(calculatedStageIndex, { duration: 300 });
  }, [elapsed, totalDuration, progress, stageIndex, getCurrentStageIndex]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const animatedGuideStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      stageIndex.value,
      [0, guide.length - 1],
      ['#FF3B30', '#34C759']
    ),
  }));

  // Очистка при выходе
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        if (isRecording) cameraRef.current?.stopRecording();
      }
    });
    return () => subscription?.remove();
  }, [isRecording]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string }> | null>(null);
  const isStoppingRef = useRef(false); // Защита от повторных вызовов stopRecording

  // Cleanup при размонтировании
  useEffect(() => {
    // Сохраняем текущие значения refs для cleanup
    const currentInterval = intervalRef.current;
    const currentCamera = cameraRef.current;
    const currentIsRecording = isRecording;
    
    return () => {
      // Очищаем таймер
      if (currentInterval) {
        clearInterval(currentInterval);
        intervalRef.current = null;
      }
      // Останавливаем запись если активна
      if (currentIsRecording && currentCamera) {
        try {
          currentCamera.stopRecording();
        } catch {
          // Игнорируем ошибки при cleanup
        }
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (!isCameraReady || isRecording) {
      if (!isCameraReady) {
        Alert.alert('Камера не готова', 'Подождите, пока камера инициализируется...');
      }
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Ошибка', 'Камера не инициализирована');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      setIsRecording(true);
      setElapsed(0);

      // Очищаем предыдущий интервал если есть
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Небольшая задержка для стабилизации
      await new Promise(resolve => setTimeout(resolve, 300));

      const recording = cameraRef.current.recordAsync({
        maxDuration: totalDuration,
        quality: '720p',
        mute: !audioEnabled, // Включаем звук если audioEnabled = true
      });

      recordingPromiseRef.current = recording;

      // Таймер запускаем сразу после начала записи
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - startTime) / 1000);
        setElapsed(delta);

        if (delta >= totalDuration) {
          const currentInterval = intervalRef.current;
          if (currentInterval) {
            clearInterval(currentInterval);
            intervalRef.current = null;
          }
          setIsRecording(false);
          // Автоматически останавливаем запись при достижении лимита
          if (cameraRef.current && recordingPromiseRef.current) {
            try {
              cameraRef.current.stopRecording();
            } catch (err) {
              console.warn('[Camera] Auto-stop error:', err);
            }
          }
        }
      }, 200) as unknown as ReturnType<typeof setInterval>;

      recording.then((video: { uri: string }) => {
        // Проверяем, что запись не была остановлена вручную
        if (isStoppingRef.current) {
          return; // Обработка уже идет в stopRecording
        }
        
        // Очищаем таймер
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        recordingPromiseRef.current = null;
        setIsRecording(false);
        
        if (video?.uri) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.push({ pathname: '/camera/process', params: { videoUri: video.uri } });
        }
      }).catch((err: any) => {
        // Проверяем, что запись не была остановлена вручную
        if (isStoppingRef.current) {
          return; // Обработка уже идет в stopRecording
        }
        
        // Очищаем таймер
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        recordingPromiseRef.current = null;
        setIsRecording(false);
        isStoppingRef.current = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Ошибка записи', err.message || 'Попробуйте снова');
      });

    } catch (err: any) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      recordingPromiseRef.current = null;
      setIsRecording(false);
      Alert.alert('Ошибка', err.message || 'Не удалось начать запись');
    }
  };

  const stopRecording = useCallback(() => {
    // Защита от повторных вызовов
    if (!isRecording || isStoppingRef.current) {
      return;
    }
    
    isStoppingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Очищаем таймер
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Устанавливаем флаг остановки сразу, чтобы предотвратить повторные вызовы
    setIsRecording(false);
    
    // Останавливаем запись безопасно
    try {
      if (cameraRef.current && recordingPromiseRef.current) {
        // Останавливаем запись
        cameraRef.current.stopRecording();
        
        // Обрабатываем Promise правильно с таймаутом
        const timeoutPromise = new Promise<{ uri: string }>((_, reject) => {
          setTimeout(() => reject(new Error('Recording stop timeout')), 5000);
        });
        
        Promise.race([recordingPromiseRef.current, timeoutPromise])
          .then((video: { uri: string }) => {
            // Запись успешно завершена
            if (video?.uri) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.push({ pathname: '/camera/process', params: { videoUri: video.uri } });
            } else {
              // Видео не было записано
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert('Внимание', 'Видео не было записано');
            }
          })
          .catch((err: any) => {
            // Ошибка при завершении записи - не критично, пользователь уже остановил
            if (err?.message !== 'Recording stop timeout') {
              console.warn('[Camera] Recording stop error (non-critical):', err);
            }
            // Не показываем Alert, так как пользователь сам остановил запись
          })
          .finally(() => {
            recordingPromiseRef.current = null;
            isStoppingRef.current = false;
          });
      } else {
        // Если нет активной записи, просто очищаем
        recordingPromiseRef.current = null;
        isStoppingRef.current = false;
      }
    } catch (error: any) {
      // Критическая ошибка при остановке
      console.error('[Camera] Stop recording error:', error);
      recordingPromiseRef.current = null;
      isStoppingRef.current = false;
      
      // Показываем предупреждение только если это не ожидаемая ошибка
      if (error?.message && !error.message.includes('already stopped')) {
        Alert.alert('Ошибка', 'Не удалось остановить запись. Попробуйте снова.');
      }
    }
  }, [isRecording, router]);

  if (!permission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          {!permission?.granted ? 'Нужен доступ к камере' : 'Нужен доступ к микрофону'}
        </Text>
        <Text style={styles.permissionSubtext}>
          Для записи видео с голосом нужны разрешения камеры и микрофона
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={() => {
            if (!permission?.granted) {
              requestPermission();
            } else if (!micPermission?.granted) {
              requestMicPermission();
            }
          }}
        >
          <Text style={styles.permissionBtnText}>Разрешить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => {
          setIsCameraReady(true);
          setCameraError(null);
        }}
        onMountError={(error) => {
          setCameraError('Ошибка инициализации камеры');
          setIsCameraReady(false);
        }}
      >
        {/* Top Bar — Revolut Ultra Glassmorphism */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 40 : 0}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.iconBtnInner}>
              <Ionicons name="close" size={22} color={ultra.textPrimary} />
            </View>
          </TouchableOpacity>

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
              <View style={styles.recordingDotContainer}>
                <Animated.View style={[styles.recordingDot, { opacity: isRecording ? 1 : 0 }]} />
              </View>
            <Text style={styles.timerText}>
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
              {String(elapsed % 60).padStart(2, '0')}
            </Text>
            </LinearGradient>
          </View>

          <View style={styles.topRightButtons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                setAudioEnabled(!audioEnabled);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.iconBtnInner}>
                <Ionicons
                  name={audioEnabled ? "mic" : "mic-off"}
                  size={22}
                  color={audioEnabled ? ultra.accent : ultra.textMuted}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.iconBtnInner}>
                <Ionicons name="camera-reverse" size={22} color={ultra.textPrimary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress — Revolut Ultra Glassmorphism */}
        <View style={styles.progressContainer}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>
        </View>

        {/* Camera Error */}
        {cameraError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{cameraError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setCameraError(null);
              setIsCameraReady(false);
            }}>
              <Text style={styles.retryText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Guide Card — Revolut Ultra Glassmorphism */}
        {isRecording && currentStage && (
          <Animated.View style={[styles.guideCard, animatedGuideStyle]}>
            {Platform.OS === 'ios' && (
              <BlurView
                intensity={50}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.guideGradient}
            >
              <View style={styles.guideIconContainer}>
                {Platform.OS === 'ios' && (
                  <BlurView
                    intensity={30}
                    tint="dark"
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <Ionicons
                  name={currentStage?.icon || 'camera'}
                  size={Platform.select({ ios: 36, android: 32, default: 36 })}
                  color={ultra.textPrimary}
                />
              </View>
              <Text style={styles.guideTitle}>{currentStage?.title || 'Снимайте'}</Text>
              <Text style={styles.guideDesc}>{currentStage?.description || 'Следуйте инструкциям'}</Text>

              {/* Audio indicator */}
              {audioEnabled && (
                <View style={styles.audioIndicator}>
                  <Ionicons name="mic" size={14} color={ultra.textPrimary} />
                  <Text style={styles.audioIndicatorText}>Запись звука</Text>
                </View>
              )}

              <View style={styles.guideTimerContainer}>
                <Text style={styles.guideTimer}>
                  {Math.max(0, Math.ceil((currentStage?.duration || 0) - stageProgress))}
                </Text>
                <Text style={styles.guideTimerLabel}>сек</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Bottom — Revolut Ultra Glassmorphism */}
        <View style={styles.bottom}>
          {isRecording ? (
            <TouchableOpacity 
              style={styles.stopBtn} 
              onPress={stopRecording}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.stopInnerContainer}>
              <View style={styles.stopInner} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.recordBtn, !isCameraReady && styles.disabled]}
              onPress={startRecording}
              disabled={!isCameraReady}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 30 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recordInner}
              />
              {!isCameraReady && (
                <View style={styles.waitingContainer}>
                  <Text style={styles.waiting}>Готовлю камеру...</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Stages indicator — Revolut Ultra */}
          <View style={styles.stages}>
            {guide.map((_, i) => {
              const isCompleted = i < Math.floor(stageIndex.value);
              const isActive = i === Math.floor(stageIndex.value);
              
              return (
              <View
                key={i}
                style={[
                  styles.stageDot,
                    isCompleted && styles.completed,
                    isActive && styles.active,
                ]}
                >
                  {isActive && (
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
              />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: ultra.background 
  },
  camera: { 
    flex: 1 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: ultra.background 
  },
  permissionText: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionSubtext: {
    color: ultra.textSecondary,
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  permissionBtn: { 
    backgroundColor: '#EF4444', 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    borderRadius: Platform.select({ ios: 16, android: 12, default: 16 }),
    overflow: 'hidden',
  },
  permissionBtnText: { 
    color: ultra.textPrimary, 
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    zIndex: 200, // Выше progressContainer, но ниже guideCard
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconBtn: { 
    width: Platform.select({ ios: 50, android: 48, default: 50 }), 
    height: Platform.select({ ios: 50, android: 48, default: 50 }), 
    borderRadius: Platform.select({ ios: 25, android: 24, default: 25 }), 
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
  iconBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(23, 23, 23, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Platform.select({ ios: 25, android: 24, default: 25 }),
  },
  timer: { 
    borderRadius: Platform.select({ ios: 24, android: 20, default: 24 }),
    overflow: 'hidden',
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
  recordingDotContainer: {
    width: Platform.select({ ios: 10, android: 9, default: 10 }),
    height: Platform.select({ ios: 10, android: 9, default: 10 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: Platform.select({ ios: 8, android: 7, default: 8 }),
    height: Platform.select({ ios: 8, android: 7, default: 8 }),
    borderRadius: Platform.select({ ios: 4, android: 3.5, default: 4 }),
    backgroundColor: ultra.textPrimary,
  },
  timerText: { 
    color: ultra.textPrimary, 
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }), 
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  progressContainer: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 130 : 120, 
    left: 0, 
    right: 0, 
    zIndex: 100, // Ниже guideCard
    height: Platform.select({ ios: 6, android: 5, default: 6 }),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressFill: { 
    height: '100%',
  },
  guideCard: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 170 : 160, 
    left: 30, 
    right: 30, 
    zIndex: 1000, // Убеждаемся, что карточка поверх всего
    borderRadius: Platform.select({ ios: 28, android: 24, default: 28 }),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
  guideGradient: {
    padding: Platform.select({ ios: 28, android: 24, default: 28 }),
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? 'rgba(239, 68, 68, 0.95)' : '#EF4444', // Более непрозрачный на Android для лучшей видимости
  },
  guideIconContainer: {
    width: Platform.select({ ios: 72, android: 64, default: 72 }),
    height: Platform.select({ ios: 72, android: 64, default: 72 }),
    borderRadius: Platform.select({ ios: 36, android: 32, default: 36 }),
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  guideTitle: { 
    color: ultra.textPrimary, 
    fontSize: Platform.select({ ios: 26, android: 24, default: 26 }), 
    fontWeight: '900', 
    marginTop: Platform.select({ ios: 12, android: 10, default: 12 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
    letterSpacing: 0.5,
  },
  guideDesc: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    textAlign: 'center',
    marginTop: Platform.select({ ios: 8, android: 6, default: 8 }),
    opacity: 0.95,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  audioIndicatorText: {
    color: ultra.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  guideTimerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Platform.select({ ios: 4, android: 3, default: 4 }),
    marginTop: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  guideTimer: { 
    color: ultra.textPrimary, 
    fontSize: Platform.select({ ios: 40, android: 36, default: 40 }), 
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  guideTimerLabel: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 18, android: 16, default: 18 }),
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
    opacity: 0.9,
  },
  bottom: { 
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 50 : 40, 
    left: 0, 
    right: 0, 
    alignItems: 'center' 
  },
  recordBtn: { 
    width: Platform.select({ ios: 88, android: 84, default: 88 }), 
    height: Platform.select({ ios: 88, android: 84, default: 88 }), 
    borderRadius: Platform.select({ ios: 44, android: 42, default: 44 }), 
    overflow: 'hidden',
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: Platform.select({ ios: 4, android: 3, default: 4 }),
    borderColor: ultra.textPrimary,
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
  recordInner: { 
    width: Platform.select({ ios: 72, android: 68, default: 72 }), 
    height: Platform.select({ ios: 72, android: 68, default: 72 }), 
    borderRadius: Platform.select({ ios: 36, android: 34, default: 36 }),
  },
  stopBtn: { 
    width: Platform.select({ ios: 88, android: 84, default: 88 }), 
    height: Platform.select({ ios: 88, android: 84, default: 88 }), 
    borderRadius: Platform.select({ ios: 44, android: 42, default: 44 }), 
    overflow: 'hidden',
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: Platform.select({ ios: 4, android: 3, default: 4 }),
    borderColor: ultra.textPrimary,
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
  stopInnerContainer: {
    width: Platform.select({ ios: 40, android: 38, default: 40 }),
    height: Platform.select({ ios: 40, android: 38, default: 40 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopInner: { 
    width: Platform.select({ ios: 24, android: 22, default: 24 }), 
    height: Platform.select({ ios: 24, android: 22, default: 24 }), 
    borderRadius: Platform.select({ ios: 6, android: 5, default: 6 }), 
    backgroundColor: ultra.textPrimary,
  },
  disabled: { 
    opacity: 0.5,
    backgroundColor: ultra.textMuted,
  },
  waitingContainer: {
    position: 'absolute',
    bottom: Platform.select({ ios: -40, android: -36, default: -40 }),
  },
  waiting: { 
    color: ultra.textPrimary, 
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  stages: { 
    flexDirection: 'row', 
    gap: Platform.select({ ios: 8, android: 6, default: 8 }), 
    marginTop: Platform.select({ ios: 32, android: 28, default: 32 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  stageDot: { 
    flex: 1, 
    height: Platform.select({ ios: 4, android: 3, default: 4 }), 
    borderRadius: Platform.select({ ios: 2, android: 1.5, default: 2 }), 
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  completed: { 
    backgroundColor: ultra.textPrimary,
  },
  active: { 
    backgroundColor: '#EF4444',
  },
  errorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 170 : 160,
    left: 30,
    right: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: Platform.select({ ios: 20, android: 18, default: 20 }),
    borderRadius: Platform.select({ ios: 20, android: 16, default: 20 }),
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  errorText: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  retryText: {
    color: ultra.textPrimary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
});
