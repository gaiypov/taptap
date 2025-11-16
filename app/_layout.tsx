import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import ConsentModal from '@/components/Legal/ConsentModal';
import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { consents } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import { testSupabaseConnection } from '@/utils/testSupabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, Text, LogBox, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppTheme, ThemedBackground } from '@/lib/theme';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { ReduxProviders } from '@/app/_components/ReduxProviders';

// Подавляем несущественные предупреждения LogBox
LogBox.ignoreLogs([
  'Animated: `useNativeDriver`',
  'expo-notifications',
  'componentWillReceiveProps',
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'pointerEvents is deprecated',
  'shadow* style props are deprecated',
  'Performance optimizations: OFF',
  'VirtualizedLists should never be nested',
  'Warning: Can\'t perform a React state update',
  'Require cycle:',
]);

function LoadingScreen() {
  const theme = useAppTheme();
  return (
    <ThemedBackground style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Загрузка приложения...</Text>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default function RootLayout() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  
  const [isReady, setIsReady] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const navigationInitializedRef = useRef(false);
  const initAttemptedRef = useRef(false);
  const breadcrumbLoggedRef = useRef(false);

  // Функция безопасной навигации - используется только для onboarding
  const safeNavigate = (path: string) => {
    // Проверяем, что навигация готова
    if (!rootNavigationState?.key || navigationInitializedRef.current) {
      return;
    }
    try {
      navigationInitializedRef.current = true;
      router.replace(path as any);
    } catch (error) {
      appLogger.error('Navigation error:', { error, path });
      navigationInitializedRef.current = false;
    }
  };

  const checkUserConsents = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      
      if (!currentUser) {
        return;
      }

      setUserId(currentUser.id);

      // Проверяем согласия с таймаутом, чтобы не блокировать приложение
      const hasConsents = await Promise.race([
        consents.hasUserConsents(currentUser.id),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 3000))
      ]);

      if (!hasConsents) {
        setShowConsentModal(true);
      }
    } catch (error) {
      appLogger.error('Error checking consents:', { error });
      // Не блокируем приложение из-за ошибки проверки согласий
    }
  };

  const checkOnboardingAndConsents = async () => {
    try {
      let onboardingCompleted;
      try {
        onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      } catch (storageError) {
        appLogger.error('AsyncStorage error:', { error: storageError });
        onboardingCompleted = null;
      }
      
      // Проверяем готовность навигации перед переходом
      if (onboardingCompleted !== 'true' && rootNavigationState?.key) {
        safeNavigate('/(onboarding)/welcome');
        return;
      }

      // Проверяем согласия асинхронно, не блокируя
      checkUserConsents().catch((error) => {
        appLogger.error('Consents check failed:', { error });
      });
    } catch (error) {
      appLogger.error('Error checking onboarding/consents:', { error });
    }
  };

  const handleAcceptConsents = () => {
    setShowConsentModal(false);
    try {
      errorTracking.addBreadcrumb('User accepted legal consents', 'user');
    } catch (error) {
      appLogger.error('Error tracking consent:', { error });
    }
  };

  const handleDeclineConsents = async () => {
    try {
      await auth.signOut();
      setShowConsentModal(false);
      try {
        errorTracking.addBreadcrumb('User declined legal consents', 'user');
      } catch (error) {
        appLogger.error('Error tracking decline:', { error });
      }
    } catch (error) {
      appLogger.error('Error signing out:', { error });
    }
  };

  // Инициализация приложения
  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    // Тест подключения к Supabase при старте приложения (один раз)
    testSupabaseConnection().catch(() => {
      // Silent fail - connection will be retried on actual requests
    });

    let isMounted = true;

    const initializeApp = async () => {
      try {
        // Инициализация отслеживания ошибок (не блокируем)
        try {
          errorTracking.init();
          // Логируем breadcrumb только один раз
          if (!breadcrumbLoggedRef.current) {
            breadcrumbLoggedRef.current = true;
            errorTracking.addBreadcrumb('App Launched', 'lifecycle', { 
              timestamp: new Date().toISOString() 
            });
          }
        } catch (trackingError) {
          appLogger.error('Error tracking init failed:', { error: trackingError });
        }

        // КРИТИЧНО: Устанавливаем isReady сразу, чтобы не блокировать UI
        // Вся дальнейшая инициализация происходит в фоне
        if (isMounted) {
          setIsReady(true);
          if (__DEV__) {
            console.log('🚀 App ready');
          }
        }

        // НЕ БЛОКИРУЕМ ожиданием навигации - все в фоне
        // Навигация происходит автоматически через Expo Router на основе файловой структуры
        
        // Проверяем токен в фоне (не блокируем UI) - с коротким таймаутом
        Promise.resolve().then(async () => {
          try {
            const token = await Promise.race([
              auth.loadToken(),
              new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 300))
            ]).catch(() => null);

            if (token) {
              // Валидация в фоне, не блокируем - с коротким таймаутом
              Promise.race([
                auth.validateToken(token),
                new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000))
              ]).catch(() => {
                // Игнорируем ошибки валидации - они не критичны для показа UI
              });
            }
          } catch (tokenError) {
            appLogger.error('Token check failed:', { error: tokenError });
          }
        }).catch((error) => {
          appLogger.error('Auth check error:', { error });
        });

        // Проверяем onboarding и согласия (не блокируем запуск) в фоне
        setTimeout(() => {
          if (isMounted) {
            checkOnboardingAndConsents().catch((error) => {
              appLogger.error('Onboarding check failed:', { error });
            });
          }
        }, 500);
      } catch (error) {
        appLogger.error('Error initializing app:', { error });
        // ВСЕГДА показываем приложение, даже при ошибках
        // Expo Router автоматически покажет правильный экран на основе файловой структуры
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    // Запускаем инициализацию
    initializeApp();

    // КРИТИЧНО: Fallback таймаут - для web еще быстрее
    const timeout = Platform.OS === 'web' ? 100 : 300;
    const fallbackTimer = setTimeout(() => {
      if (isMounted && !isReady) {
        if (__DEV__) {
          console.warn('⚠️ App initialization timeout - showing app anyway');
        }
        setIsReady(true);
        // Навигация произойдет автоматически через Expo Router
      }
    }, timeout);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []); // Убрали зависимость от rootNavigationState?.key чтобы не перезапускался

  // Показываем loading screen пока не готово
  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <ReduxProviders>
        <ThemedBackground>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ErrorBoundary>
              <Stack>
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)/welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)/IntroCarousel" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)/permissions" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/intro" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/phone" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/verify" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="car/[id]" options={{ title: 'Car Details', headerShown: false }} />
            <Stack.Screen name="profile/[id]" options={{ title: 'Профиль продавца', headerShown: false }} />
            <Stack.Screen name="profile/edit" options={{ title: 'Редактировать профиль', headerShown: false }} />
            <Stack.Screen name="profile/my-listings" options={{ title: 'Мои объявления', headerShown: false }} />
            <Stack.Screen name="(business)/setup" options={{ title: 'Настройка бизнеса', headerShown: false }} />
            <Stack.Screen name="chat/[conversationId]" options={{ title: 'Чат', headerShown: false }} />
            <Stack.Screen name="camera/process" options={{ title: 'Обработка видео' }} />
            <Stack.Screen name="test-supabase" options={{ title: 'Supabase Test' }} />
            <Stack.Screen name="notifications" options={{ title: 'Уведомления', headerShown: false }} />
            <Stack.Screen name="test-sms" options={{ title: 'Тест SMS', headerShown: false }} />
            <Stack.Screen name="test-apivideo" options={{ title: 'Тест api.video', headerShown: false }} />
            <Stack.Screen name="test-notifications" options={{ title: 'Тест уведомлений', headerShown: false }} />
            <Stack.Screen name="legal/terms" options={{ title: 'Пользовательское соглашение', headerShown: false }} />
            <Stack.Screen name="legal/privacy" options={{ title: 'Политика конфиденциальности', headerShown: false }} />
            <Stack.Screen name="legal/consent" options={{ title: 'Согласие на обработку данных', headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          
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
    </ThemedBackground>
      </ReduxProviders>
    </Provider>
  );
}
