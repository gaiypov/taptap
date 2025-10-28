import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import ConsentModal from '@/components/Legal/ConsentModal';
import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { consents } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6B00" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default function RootLayout() {
  const router = useRouter();
  
  const [isReady, setIsReady] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        // Инициализация отслеживания ошибок
        errorTracking.init();
        
        // Отслеживаем запуск приложения
        errorTracking.addBreadcrumb('App Launched', 'lifecycle');

        // Проверяем onboarding и согласия пользователя
        await checkOnboardingAndConsents();
        
        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        errorTracking.captureException(error as Error);
        
        // Показываем приложение даже при ошибке
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  const checkOnboardingAndConsents = async () => {
    try {
      // Проверяем, прошел ли пользователь onboarding
      let onboardingCompleted;
      try {
        onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      } catch (storageError) {
        console.error('AsyncStorage error:', storageError);
        errorTracking.captureException(storageError as Error);
        onboardingCompleted = null;
      }
      
      if (onboardingCompleted !== 'true') {
        // Не прошел onboarding - перенаправляем
        router.replace('/(onboarding)/welcome');
        return;
      }

      // Проверяем согласия пользователя
      await checkUserConsents();
    } catch (error) {
      console.error('Error checking onboarding/consents:', error);
      errorTracking.captureException(error as Error);
    }
  };

  const checkUserConsents = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      
      if (!currentUser) {
        // Пользователь не авторизован - не показываем модальное окно
        return;
      }

      setUserId(currentUser.id);

      // Проверяем, есть ли у пользователя согласия
      const hasConsents = await consents.hasUserConsents(currentUser.id);

      if (!hasConsents) {
        // Нет согласий - показываем модальное окно
        setShowConsentModal(true);
      }
    } catch (error) {
      console.error('Error checking consents:', error);
      errorTracking.captureException(error as Error);
    }
  };

  const handleAcceptConsents = () => {
    setShowConsentModal(false);
    errorTracking.addBreadcrumb('User accepted legal consents', 'user');
  };

  const handleDeclineConsents = async () => {
    // Пользователь отклонил согласия - выходим из аккаунта
    try {
      await auth.signOut();
      setShowConsentModal(false);
      errorTracking.addBreadcrumb('User declined legal consents', 'user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Показываем loading screen пока не готово
  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <Stack>
          <Stack.Screen name="(onboarding)/welcome" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/permissions" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="car/[id]" options={{ title: 'Car Details', headerShown: false }} />
          <Stack.Screen name="profile/[id]" options={{ title: 'Профиль продавца', headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ title: 'Редактировать профиль', headerShown: false }} />
          <Stack.Screen name="profile/my-listings" options={{ title: 'Мои объявления', headerShown: false }} />
          <Stack.Screen name="chat/[conversationId]" options={{ title: 'Чат', headerShown: false }} />
          <Stack.Screen name="camera/process" options={{ title: 'Обработка видео' }} />
          <Stack.Screen name="test-supabase" options={{ title: 'Supabase Test' }} />
          <Stack.Screen name="notifications" options={{ title: 'Уведомления', headerShown: false }} />
          <Stack.Screen name="test-sms" options={{ title: 'Тест SMS', headerShown: false }} />
          <Stack.Screen name="test-apivideo" options={{ title: 'Тест api.video', headerShown: false }} />
          <Stack.Screen name="legal/terms" options={{ title: 'Пользовательское соглашение', headerShown: false }} />
          <Stack.Screen name="legal/privacy" options={{ title: 'Политика конфиденциальности', headerShown: false }} />
          <Stack.Screen name="legal/consent" options={{ title: 'Согласие на обработку данных', headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
        
        {/* Модальное окно с согласиями при первом входе */}
        {userId && (
          <ConsentModal
            visible={showConsentModal}
            userId={userId}
            onAccept={handleAcceptConsents}
            onDecline={handleDeclineConsents}
          />
        )}
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}