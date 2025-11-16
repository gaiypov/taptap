import { analyzeCarVideo } from '@/services/ai';
import { auth } from '@/services/auth';
import { db, storage } from '@/services/supabase';
import { Car } from '@/types';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ProcessVideoProps {
  videoUri: string;
}

export default function ProcessVideo({ videoUri }: ProcessVideoProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Partial<Car> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processVideo = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Этап 1: Извлечение кадров
      setCurrentStep('Извлечение кадров из видео...');
      setProgress(10);
      
      // Этап 2: AI анализ
      setCurrentStep('Анализ автомобиля с помощью ИИ...');
      setProgress(30);
      
      const analysisResult = await analyzeCarVideo(
        videoUri,
        (step: string, progressValue: number) => {
          setCurrentStep(step);
          setProgress(30 + (progressValue * 0.6)); // 30-90%
        }
      );
      
      // Финальный этап - загрузка в Supabase
      setCurrentStep('Загрузка на сервер...');
      setProgress(90);
      
      // Получаем временного пользователя
      const tempUser = await auth.getCurrentUser();
      if (!tempUser) {
        throw new Error('Не удалось получить данные пользователя');
      }
      const userId = tempUser.id;
      
      // 1. Загружаем видео
      const { url: videoUrl, error: videoError } = await storage.uploadVideo(
        videoUri,
        userId
      );
      
      if (videoError) throw videoError;
      
      // 2. Загружаем превью
      const thumbnailSource = analysisResult.thumbnailUrl || analysisResult.thumbnail_url || '';
      let thumbnailUrl = 'https://picsum.photos/800/600';
      
      if (thumbnailSource) {
        const { url, error: thumbError } = await storage.uploadThumbnail(
          thumbnailSource,
          userId
        );
        
        if (thumbError) throw thumbError;
        thumbnailUrl = url;
      } else {
        console.warn('Thumbnail source not found, using placeholder image');
      }
      
      // 3. Сохраняем в базу
      const { data: car, error: carError } = await db.createCar({
        seller_id: userId,
        brand: analysisResult.brand ?? 'Unknown',
        model: analysisResult.model ?? 'Unknown',
        year: analysisResult.year ?? new Date().getFullYear(),
        price: 2500000, // TODO: Получить от пользователя
        mileage: analysisResult.mileage ?? 0,
        color: analysisResult.color ?? 'Не указан',
        transmission: analysisResult.transmission ?? 'automatic',
        location: 'Бишкек',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        ai_condition: analysisResult.aiAnalysis?.condition,
        ai_score: analysisResult.aiAnalysis?.conditionScore,
        ai_damages: analysisResult.aiAnalysis?.damages,
        ai_features: analysisResult.aiAnalysis?.features,
        ai_estimated_price: analysisResult.aiAnalysis?.estimatedPrice,
        status: 'active',
      });
      
      if (carError) throw carError;
      
      setProgress(100);
      setResult(analysisResult);
      setIsProcessing(false);
      
      // Успех!
      Alert.alert(
        'Готово!',
        'Ваше объявление опубликовано',
        [
          {
            text: 'Посмотреть',
            onPress: () => router.push({ pathname: '/car/[id]', params: { id: car.id } }),
          },
        ]
      );
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Ошибка обработки видео');
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.stepText}>{currentStep}</Text>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Ошибка обработки</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={processVideo}
          >
            <Text style={styles.retryButtonText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Анализ завершен!</Text>
          <Text style={styles.carInfo}>
            {result.brand || 'Авто'} {result.model || ''} {result.year || 'N/A'}
          </Text>
          <Text style={styles.carDetails}>
            Пробег: {result.mileage?.toLocaleString('ru-RU') ?? '—'} км
          </Text>
          <Text style={styles.carDetails}>
            Цвет: {result.color ?? '—'}
          </Text>
          {result.aiAnalysis && (
            <View style={styles.aiInfo}>
              <Text style={styles.aiTitle}>AI Анализ:</Text>
              <Text style={styles.aiText}>
                Состояние: {result.aiAnalysis.condition}
              </Text>
              <Text style={styles.aiText}>
                Оценка: {result.aiAnalysis.conditionScore}%
              </Text>
              <Text style={styles.aiText}>
                Цена: {result.aiAnalysis.estimatedPrice?.min?.toLocaleString('ru-RU')} - {result.aiAnalysis.estimatedPrice?.max?.toLocaleString('ru-RU')} сом
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.startContainer}>
        <Text style={styles.title}>Обработка видео</Text>
        <Text style={styles.subtitle}>
          Нажмите кнопку для начала анализа автомобиля
        </Text>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={processVideo}
        >
          <Text style={styles.startButtonText}>Начать анализ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  progressText: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  errorContainer: {
    alignItems: 'center',
    width: '100%',
  },
  errorTitle: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
  },
  resultTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  carInfo: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  carDetails: {
    color: '#8E8E93',
    fontSize: 16,
    marginBottom: 4,
  },
  aiInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    width: '100%',
  },
  aiTitle: {
    color: '#0A84FF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  aiText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 4,
  },
  startContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
