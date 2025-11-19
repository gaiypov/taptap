// app/camera/process.tsx — AI-ФАБРИКА ОБЪЯВЛЕНИЙ 2025

import { analyzeCarVideo } from '@/services/ai';
import { auth } from '@/services/auth';
import { db, storage } from '@/services/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import LottieView from 'lottie-react-native';
import { ultra } from '@/lib/theme/ultra';

const { width } = Dimensions.get('window');

export default function ProcessVideoScreen() {
  const { videoUri } = useLocalSearchParams<{ videoUri: string }>();
  const router = useRouter();

  const [stage, setStage] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [stepText, setStepText] = useState('Готовимся к анализу...');
  const [errorMsg, setErrorMsg] = useState('');
  const [carData, setCarData] = useState<any>(null);
  const [progressPercent, setProgressPercent] = useState(0);

  const progress = useSharedValue(0);
  const controllerRef = useRef<AbortController | null>(null);

  const animatedProgress = useAnimatedStyle(() => ({
    width: withTiming(`${progress.value}%`, { duration: 800, easing: Easing.out(Easing.exp) }),
  }));

  const startProcessing = async () => {
    setStage('processing');
    controllerRef.current = new AbortController();

    try {
      // Этап 1: Показываем видео
      setStepText('Загружаем ваше видео...');
      progress.value = 10;
      setProgressPercent(10);

      // Этап 2: AI анализ с коллбэком прогресса
      setStepText('ИИ смотрит ваш автомобиль... 🔥');
      progress.value = 20;
      setProgressPercent(20);

      const result = await analyzeCarVideo(
        videoUri,
        (step, subProgress) => {
          setStepText(step);
          const newProgress = 20 + subProgress * 60; // 20–80%
          progress.value = newProgress;
          setProgressPercent(Math.round(newProgress));
        }
      );

      // Этап 3: Загрузка в Supabase
      setStepText('Публикация объявления...');
      progress.value = 85;
      setProgressPercent(85);

      const user = await auth.getCurrentUser();
      if (!user) throw new Error('Требуется авторизация');

      const { url: videoUrl } = await storage.uploadVideo(videoUri, user.id);
      const thumbnailUrl = result.thumbnail_url || 'https://picsum.photos/800/600';

      const car = await db.createCar({
        seller_id: user.id,
        brand: result.brand || result.details?.brand || 'Неизвестно',
        model: result.model || result.details?.model || '',
        year: result.year || new Date().getFullYear(),
        price: result.aiAnalysis?.estimatedPrice?.avg || 2500000,
        mileage: result.mileage || 0,
        color: result.color || 'Не указан',
        transmission: result.transmission || 'automatic',
        location: 'Бишкек',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        ai_condition: result.aiAnalysis?.condition,
        ai_score: result.aiAnalysis?.conditionScore || 94,
        ai_estimated_price: result.aiAnalysis?.estimatedPrice,
        status: 'active',
      });

      progress.value = 100;
      setProgressPercent(100);
      setCarData(car);
      setStage('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('AI Processing failed:', err);
      setErrorMsg(err.message || 'Неизвестная ошибка');
      setStage('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Автозапуск
  useEffect(() => {
    if (videoUri) {
      setTimeout(startProcessing, 800);
    }
  }, [videoUri]);

  // Отмена при выходе
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  if (stage === 'idle' || stage === 'processing') {
    return (
      <View style={styles.container}>
        <Video
          source={{ uri: videoUri }}
          style={styles.videoPreview}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
        />

        <View style={styles.overlay}>
          <Text style={styles.title}>AI создаёт объявление...</Text>
          <Text style={styles.step}>{stepText}</Text>

          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressFill, animatedProgress]} />
          </View>

          <Text style={styles.percent}>{progressPercent}%</Text>
          <ActivityIndicator size="small" color="#FFF" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (stage === 'success' && carData) {
    return (
      <View style={styles.container}>
        {(() => {
          try {
            return (
              <LottieView
                source={require('@/assets/lottie/success.json')}
                autoPlay
                loop={false}
                style={{ width: 200, height: 200 }}
              />
            );
          } catch {
            return (
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
            );
          }
        })()}

        <Text style={styles.successTitle}>Объявление готово! 🎉</Text>
        <Text style={styles.successCar}>
          {carData.brand} {carData.model} {carData.year}
        </Text>
        <Text style={styles.successPrice}>
          ~{(carData.ai_estimated_price?.avg || carData.price || 0).toLocaleString()} сом
        </Text>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push(`/car/${carData.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewButtonText}>Посмотреть объявление</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.replace('/(tabs)/upload')}
          activeOpacity={0.7}
        >
          <Text style={styles.newButtonText}>Создать ещё одно</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Ошибка обработки</Text>
        <Text style={styles.errorMsg}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={startProcessing} activeOpacity={0.7}>
          <Text style={styles.retryText}>Попробовать снова</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  videoPreview: { width: width * 0.9, height: width * 1.6, borderRadius: 20, overflow: 'hidden' },
  overlay: { position: 'absolute', bottom: 80, left: 20, right: 20, alignItems: 'center' },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  step: { color: '#FFF', fontSize: 18, marginBottom: 20, opacity: 0.9 },
  progressContainer: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF3B30' },
  percent: { color: '#FF3B30', fontSize: 32, fontWeight: '900', marginTop: 16 },
  successTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 20 },
  successCar: { color: ultra.accentSecondary, fontSize: 24, fontWeight: '800', marginTop: 10 },
  successPrice: { color: '#34C759', fontSize: 22, marginTop: 8 },
  viewButton: { backgroundColor: '#FF3B30', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16, marginTop: 40 },
  viewButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  newButton: { marginTop: 16 },
  newButtonText: { color: ultra.accent, fontSize: 16, fontWeight: '600' },
  errorTitle: { color: '#FF3B30', fontSize: 24, fontWeight: 'bold' },
  errorMsg: { color: '#FFF', fontSize: 16, textAlign: 'center', marginHorizontal: 40, marginVertical: 20 },
  retryBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '600' },
  successIcon: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#34C759', justifyContent: 'center', alignItems: 'center' },
  successIconText: { fontSize: 120, color: '#FFF', fontWeight: '900' },
});
