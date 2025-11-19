// app/camera/record.tsx — КАМЕРА УРОВНЯ TESLA + БИШКЕК 2025

import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
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
    { duration: 15, title: 'Вход', description: 'Подъезд и дверь', icon: 'enter' },
    { duration: 15, title: 'Гостиная', description: 'Основная комната', icon: 'home' },
    { duration: 10, title: 'Кухня', description: 'Покажите кухню', icon: 'restaurant' },
    { duration: 10, title: 'Спальня', description: 'Спальная комната', icon: 'bed' },
    { duration: 10, title: 'Санузел', description: 'Ванная и туалет', icon: 'water' },
    { duration: 10, title: 'Окна', description: 'Вид из окон', icon: 'eye' },
    { duration: 10, title: 'Балкон', description: 'Если есть', icon: 'square-outline' },
    { duration: 10, title: 'Двор', description: 'Парковка и двор', icon: 'car' },
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
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const progress = useSharedValue(0);
  const stageIndex = useSharedValue(0);

  const currentStage = guide[Math.min(Math.floor(stageIndex.value), guide.length - 1)];
  const stageProgress = elapsed - guide.slice(0, Math.floor(stageIndex.value)).reduce((s, i) => s + i.duration, 0);

  // Анимированный прогресс
  useEffect(() => {
    progress.value = withTiming((elapsed / totalDuration) * 100, { duration: 800 });
    stageIndex.value = withTiming(guide.findIndex((_, i, arr) => {
      const acc = arr.slice(0, i + 1).reduce((s, st) => s + st.duration, 0);
      return elapsed < acc;
    }), { duration: 300 });
  }, [elapsed, guide, totalDuration, progress, stageIndex]);

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

      // Небольшая задержка для стабилизации
      await new Promise(resolve => setTimeout(resolve, 300));

      const recording = await cameraRef.current.recordAsync({
        maxDuration: totalDuration,
        quality: '720p',
      });

      // Таймер запускаем сразу после начала записи
      const startTime = Date.now();
      const interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - startTime) / 1000);
        setElapsed(delta);

        if (delta >= totalDuration) {
          clearInterval(interval);
          setIsRecording(false);
        }
      }, 200);

      recording.then((video: { uri: string }) => {
        clearInterval(interval);
        setIsRecording(false);
        if (video?.uri) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.push({ pathname: '/camera/process', params: { videoUri: video.uri } });
        }
      }).catch((err: any) => {
        clearInterval(interval);
        setIsRecording(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Ошибка записи', err.message || 'Попробуйте снова');
      });

    } catch (err: any) {
      setIsRecording(false);
      Alert.alert('Ошибка', err.message || 'Не удалось начать запись');
    }
  };

  const stopRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cameraRef.current?.stopRecording();
    setIsRecording(false);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Нужен доступ к камере</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
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
          console.log('✅ Camera ready callback fired');
          setIsCameraReady(true);
          setCameraError(null);
        }}
        onMountError={(error) => {
          console.error('❌ Camera mount error:', error);
          setCameraError('Ошибка инициализации камеры');
          setIsCameraReady(false);
        }}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.timer}>
            <Text style={styles.timerText}>
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
              {String(elapsed % 60).padStart(2, '0')}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
            <Ionicons name="camera-reverse" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
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

        {/* Guide Card */}
        {isRecording && (
          <Animated.View style={[styles.guideCard, animatedGuideStyle]}>
            <Ionicons name={currentStage.icon} size={40} color="#FFF" />
            <Text style={styles.guideTitle}>{currentStage.title}</Text>
            <Text style={styles.guideDesc}>{currentStage.description}</Text>
            <Text style={styles.guideTimer}>{currentStage.duration - stageProgress} сек</Text>
          </Animated.View>
        )}

        {/* Bottom */}
        <View style={styles.bottom}>
          {isRecording ? (
            <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
              <View style={styles.stopInner} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.recordBtn, !isCameraReady && styles.disabled]}
              onPress={startRecording}
              disabled={!isCameraReady}
            >
              <View style={styles.recordInner} />
              {!isCameraReady && <Text style={styles.waiting}>Готовлю камеру...</Text>}
            </TouchableOpacity>
          )}

          <View style={styles.stages}>
            {guide.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stageDot,
                  i < stageIndex.value && styles.completed,
                  i === Math.floor(stageIndex.value) && styles.active,
                ]}
              />
            ))}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionText: { color: '#FFF', fontSize: 18, marginBottom: 20 },
  permissionBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  permissionBtnText: { color: '#FFF', fontWeight: '600' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  iconBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  timer: { backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  timerText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  progressContainer: { position: 'absolute', top: 120, left: 0, right: 0, height: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: '100%', backgroundColor: '#FF3B30' },
  guideCard: { position: 'absolute', top: 160, left: 30, right: 30, padding: 24, borderRadius: 20, alignItems: 'center' },
  guideTitle: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 12 },
  guideDesc: { color: '#FFF', fontSize: 16, textAlign: 'center', marginTop: 8, opacity: 0.9 },
  guideTimer: { color: '#FFF', fontSize: 36, fontWeight: '900', marginTop: 16 },
  bottom: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
  recordBtn: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  recordInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FF3B30' },
  stopBtn: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  stopInner: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FF3B30' },
  disabled: { opacity: 0.5 },
  waiting: { position: 'absolute', bottom: -40, color: '#FFF', fontSize: 14 },
  stages: { flexDirection: 'row', gap: 6, marginTop: 30 },
  stageDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  completed: { backgroundColor: '#FFF' },
  active: { backgroundColor: '#FF3B30' },
  errorContainer: {
    position: 'absolute',
    top: 160,
    left: 30,
    right: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
