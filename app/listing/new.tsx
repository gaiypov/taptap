'use client';

import ListingForm from '@/components/Listing/ListingForm';
import ProgressIndicator from '@/components/Listing/ProgressIndicator';
import CameraCapture from '@/components/Upload/CameraCapture';
import RecordingGuide from '@/components/Upload/RecordingGuide';
import VideoPreviewEditor from '@/components/Upload/VideoPreviewEditor';
import { RootState } from '@/lib/store';
import { ultra } from '@/lib/theme/ultra';
import { draftService } from '@/services/draftService';
import { VideoTrimData } from '@/types/video.types';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

type Step = 'guide' | 'camera' | 'preview' | 'form';

// Маппинг шагов на номера для прогресс-бара
const STEP_NUMBERS: Record<Step, number> = {
  guide: 2,    // Шаг 2/6 (1 - выбор категории был на upload экране)
  camera: 3,   // Шаг 3/6
  preview: 4,  // Шаг 4/6 - Предпросмотр
  form: 5,     // Шаг 5-6/6 (форма разбита на основное + детали)
};

const STEP_NAMES = [
  'Категория',      // 1
  'Инструкция',     // 2
  'Съемка',         // 3
  'Предпросмотр',   // 4
  'Основное',       // 5
  'Детали'          // 6
];

export default function NewListingPage() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);

  const [step, setStep] = useState<Step>('guide');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoTrimData, setVideoTrimData] = useState<VideoTrimData | undefined>(undefined);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const autosaveStarted = useRef(false);

  // Load draft on mount
  useEffect(() => {
    const loadDraftOnMount = async () => {
      if (draftLoaded) return;

      const draft = await draftService.loadDraft();
      if (draft && draft.category === category) {
        Alert.alert(
          'Продолжить создание?',
          `У вас есть незавершенное объявление (сохранено ${getTimeAgo(draft.savedAt)})`,
          [
            {
              text: 'Начать заново',
              style: 'destructive',
              onPress: () => {
                draftService.clearDraft();
                setDraftLoaded(true);
              }
            },
            {
              text: 'Продолжить',
              style: 'default',
              onPress: () => {
                // Восстанавливаем состояние из черновика
                if (draft.videoUri) {
                  setVideoUri(draft.videoUri);
                }
                // Определяем шаг на основе заполненности
                if (draft.currentStep === 3) {
                  setStep('camera');
                } else if (draft.currentStep === 4 && draft.videoUri) {
                  setStep('preview');
                } else if (draft.currentStep >= 5 || draft.title || draft.price) {
                  setStep('form');
                }
                setDraftLoaded(true);
              }
            }
          ]
        );
      } else {
        setDraftLoaded(true);
      }
    };

    loadDraftOnMount();
  }, [category, draftLoaded]);

  // Start autosave when entering form step
  useEffect(() => {
    if (step === 'form' && !autosaveStarted.current) {
      // Autosave будет запущен в ListingForm компоненте
      autosaveStarted.current = true;
    }

    return () => {
      // Cleanup autosave on unmount
      draftService.stopAutosave();
    };
  }, [step]);

  // Auth guard - redirect to register if not authenticated
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ultra.accent} />
        <Text style={styles.loadingText}>Проверка авторизации...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log('[NewListing] User not authenticated, redirecting to register');
    return <Redirect href="/(auth)/register" />;
  }

  // Если нет категории, редирект на главную
  if (!category || !['car', 'horse', 'real_estate'].includes(category)) {
    router.push('/(tabs)');
    return null;
  }

  // Нормализуем категорию: 'car' -> 'auto' для RecordingGuide
  const normalizedCategory = category === 'car' ? 'auto' : category;
  const categoryType = normalizedCategory as 'auto' | 'horse' | 'real_estate';
  const cameraCategory = category as 'car' | 'horse' | 'real_estate';

  const currentStepNumber = STEP_NUMBERS[step];

  return (
    <View style={styles.container}>
      {/* Progress Indicator - показываем везде кроме guide (т.к. guide это step 2) */}
      {step !== 'guide' && (
        <View style={styles.progressContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.progressScroll}
          >
            <ProgressIndicator
              currentStep={currentStepNumber}
              totalSteps={6}
              stepNames={STEP_NAMES}
            />
          </ScrollView>
        </View>
      )}

      {step === 'guide' && (
        <RecordingGuide
          category={categoryType}
          onStart={() => {
            setStep('camera');
            // Save draft when moving to next step
            draftService.saveDraft({
              category: cameraCategory,
              currentStep: 3,
              userId: user?.id
            });
          }}
          onBack={() => {
            // Clear draft if going back to category selection
            draftService.clearDraft();
            router.back();
          }}
        />
      )}

      {step === 'camera' && (
        <CameraCapture
          category={cameraCategory}
          onComplete={(uri) => {
            setVideoUri(uri);
            setStep('preview');
            // Save draft with video
            draftService.saveDraft({
              category: cameraCategory,
              videoUri: uri,
              currentStep: 4,
              userId: user?.id
            });
          }}
          onBack={() => {
            setStep('guide');
            // Update draft step
            draftService.saveDraft({
              category: cameraCategory,
              currentStep: 2,
              userId: user?.id
            });
          }}
        />
      )}

      {step === 'preview' && videoUri && (
        <VideoPreviewEditor
          videoUri={videoUri}
          category={cameraCategory}
          onConfirm={(uri, trimData) => {
            setVideoUri(uri);
            setVideoTrimData(trimData);
            setStep('form');
            // Save draft with confirmed video and trim data
            draftService.saveDraft({
              category: cameraCategory,
              videoUri: uri,
              currentStep: 5,
              userId: user?.id
            });
          }}
          onRetake={() => {
            setVideoUri(null);
            setVideoTrimData(undefined);
            setStep('camera');
            // Clear video from draft
            draftService.saveDraft({
              category: cameraCategory,
              currentStep: 3,
              userId: user?.id
            });
          }}
          onCancel={() => {
            setStep('camera');
            // Go back to camera
            draftService.saveDraft({
              category: cameraCategory,
              videoUri: videoUri,
              currentStep: 3,
              userId: user?.id
            });
          }}
        />
      )}

      {step === 'form' && videoUri && cameraCategory !== 'real_estate' && (
        <ListingForm
          category={cameraCategory as 'car' | 'horse'}
          videoUri={videoUri}
          videoTrimData={videoTrimData}
          onBack={() => {
            setStep('preview');
            draftService.saveDraft({
              category: cameraCategory,
              videoUri: videoUri,
              currentStep: 4,
              userId: user?.id
            });
          }}
        />
      )}

      {step === 'form' && videoUri && cameraCategory === 'real_estate' && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Форма для недвижимости в разработке
          </Text>
        </View>
      )}
    </View>
  );
}

// Утилита для отображения времени
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} д назад`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ultra.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: ultra.textSecondary,
  },
  progressContainer: {
    backgroundColor: ultra.background,
    paddingTop: 60,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  progressScroll: {
    paddingHorizontal: 16,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    fontSize: 18,
    color: ultra.textSecondary,
    textAlign: 'center',
  },
});
