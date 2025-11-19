// Root Layout — 360° Marketplace Kyrgyzstan
// Production Ready • Expo 51+ • React Native • TypeScript

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import ConsentModal from '@/components/Legal/ConsentModal';
import { ReduxProviders } from '@/components/ReduxProviders';
import type { AppDispatch } from '@/lib/store';
import { store } from '@/lib/store';
import { setCurrentUserId } from '@/lib/store/slices/chatSlice';
import { setCurrentIndex } from '@/lib/store/slices/feedSlice';
import { ThemedBackground, useAppTheme, useThemeContext } from '@/lib/theme';
import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { subscribeToRealtime, unsubscribeFromRealtime } from '@/services/realtime';
import { consents } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import { testSupabaseConnection } from '@/utils/testSupabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider, useDispatch } from 'react-redux';

// Игнорируем известные неопасные варнинги (чисто, без спама в консоли)
if (__DEV__) {
  const ignoreWarns = [
    'Animated: `useNativeDriver`',
    'VirtualizedLists should never be nested',
    'Require cycle:',
    'Non-serializable values were found in the navigation state',
    'Sending `onAnimatedValueUpdate` with no listeners registered',
  ];
  
  const errorWarn = console.error;
  console.error = (...args: any) => {
    if (typeof args[0] === 'string' && ignoreWarns.some(w => args[0].includes(w))) return;
    errorWarn(...args);
  };
}

function LoadingScreen() {
  const theme = useAppTheme();
  return (
    <ThemedBackground style={styles.loading}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
        Загрузка приложения...
      </Text>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
});

// Внутренний компонент, который использует Redux (должен быть внутри Provider)
function AppContent() {
  const router = useRouter();
  const rootNavState = useRootNavigationState();
  const segments = useSegments();
  const { isDark } = useThemeContext();
  const dispatch = useDispatch<AppDispatch>();
  const [isReady, setIsReady] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const initDone = useRef(false);
  const navReady = useRef(false);
  
  // Останавливаем видео при навигации на другие экраны (не главный feed)
  // НО только если мы действительно ушли с главного экрана
  useEffect(() => {
    if (!rootNavState?.key || segments.length === 0) return;
    
    // Проверяем, находимся ли мы на главном экране feed
    // segments может быть ['(tabs)', 'index'] или просто ['index']
    const lastSegment = segments[segments.length - 1] as string;
    const isOnFeed = lastSegment === 'index' || 
                    (segments.length >= 2 && segments[0] === '(tabs)' && (segments[1] as string) === 'index');
    
    if (!isOnFeed) {
      // Если мы не на главном экране, останавливаем все видео
      dispatch(setCurrentIndex(-1));
    }
  }, [segments, rootNavState?.key, dispatch]);


  // === Инициализация приложения (один раз) ===
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    let mounted = true;

    const safeReplace = (path: string) => {
      if (navReady.current || !rootNavState?.key) return;
      try {
        navReady.current = true;
        router.replace(path as any);
      } catch (err) {
        appLogger.error('Safe navigation failed', { error: err, path });
        navReady.current = false;
      }
    };

    const init = async () => {
      // 1. Тест Supabase — не блокируем
      testSupabaseConnection().catch(() => {});

      // 2. Инициализируем Sentry/PostHog/etc
      try {
        errorTracking.init();
        errorTracking.addBreadcrumb('App started', 'lifecycle');
      } catch (e) {
        appLogger.error('Error tracking init failed', { error: e });
      }

      // 3. Сразу показываем UI — всё остальное в фоне
      if (mounted) setIsReady(true);

      // 4. Splash экран показывается автоматически как initialRouteName
      // Он сам решит, куда перейти после анимации
      // Здесь мы только проверяем онбординг для других случаев
      // (если пользователь уже прошел splash)

      // 5. Проверяем текущего пользователя и согласия (в фоне)
      try {
        const user = await auth.getCurrentUser();
        if (!user) return;

        setUserId(user.id);

        // Таймаут 3 сек — не вешаем приложение, если Supabase тормозит
        const hasConsent = await Promise.race([
          consents.hasUserConsents(user.id),
          new Promise<false>(resolve => setTimeout(() => resolve(false), 3000)),
        ]);

        if (mounted && !hasConsent) {
          setShowConsent(true);
        }
      } catch (e) {
        appLogger.error('Consent check failed', { error: e });
        // Не блокируем приложение никогда
      }
    };

    init();

    // Fallback — если что-то зависло (особенно на web)
    const fallback = setTimeout(() => {
      if (mounted) {
        console.warn('App init timeout — forcing render');
        setIsReady(true);
      }
    }, Platform.OS === 'web' ? 150 : 400);

    return () => {
      mounted = false;
      clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootNavState?.key]);

  // === Инициализация Redux-зависимых сервисов ===
  // Выполняется через ReduxProviders

  // === Realtime подписки (после успешного логина) ===
  useEffect(() => {
    if (userId) {
      // Устанавливаем currentUserId в chat slice
      dispatch(setCurrentUserId(userId));
      
      // Подписываемся на Realtime обновления
      subscribeToRealtime(userId).catch((error) => {
        appLogger.error('Failed to subscribe to realtime', { error, userId });
      });

      return () => {
        unsubscribeFromRealtime();
        dispatch(setCurrentUserId(null));
      };
    }
  }, [userId, dispatch]);

  // Обработчики согласий
  const handleAccept = () => {
    setShowConsent(false);
    errorTracking.addBreadcrumb('User accepted consents', 'user');
  };

  const handleDecline = async () => {
    try {
      await auth.signOut();
      setShowConsent(false);
      unsubscribeFromRealtime();
      dispatch(setCurrentUserId(null));
      errorTracking.addBreadcrumb('User declined consents', 'user');
    } catch (e) {
      appLogger.error('Sign out after consent decline failed', { error: e });
    }
  };

  // Пока приложение не готово — показываем красивый лоадер
  if (!isReady) return <LoadingScreen />;

  return (
    <ThemedBackground>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <Stack 
            screenOptions={{ headerShown: false }}
            initialRouteName="splash"
          >
            {/* Splash Screen — первый экран */}
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            
            {/* Onboarding */}
            <Stack.Screen name="(onboarding)/welcome" />
            <Stack.Screen name="(onboarding)/IntroCarousel" />
            <Stack.Screen name="(onboarding)/permissions" />

            {/* Auth */}
            <Stack.Screen name="(auth)/intro" />
            <Stack.Screen name="(auth)/phone" />
            <Stack.Screen name="(auth)/verify" />

            {/* Main app */}
            <Stack.Screen name="(tabs)" />

            {/* Modals & screens */}
            <Stack.Screen name="car/[id]" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="profile/[id]" />
            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="profile/my-listings" />
            <Stack.Screen name="chat/[conversationId]" />
            <Stack.Screen name="camera/process" options={{ title: 'Обработка видео' }} />
            <Stack.Screen name="notifications" />

            {/* Legal */}
            <Stack.Screen name="legal/terms" />
            <Stack.Screen name="legal/privacy" />
            <Stack.Screen name="legal/consent" />

            {/* Dev & test screens */}
            {__DEV__ && (
              <>
                <Stack.Screen name="test-supabase" />
                <Stack.Screen name="test-sms" />
                <Stack.Screen name="test-apivideo" />
                <Stack.Screen name="test-notifications" />
              </>
            )}

            <Stack.Screen name="+not-found" />
          </Stack>
          
          <StatusBar style={isDark ? 'light' : 'dark'} />

          {/* Consent Modal — поверх всего */}
          {userId && (
            <ConsentModal
              visible={showConsent}
              userId={userId}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          )}
        </ErrorBoundary>
      </GestureHandlerRootView>
    </ThemedBackground>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ReduxProviders>
        <AppContent />
      </ReduxProviders>
    </Provider>
  );
}
