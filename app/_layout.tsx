// Root Layout — 360° Marketplace Kyrgyzstan
// Production Ready • Expo 51+ • React Native • TypeScript

// 🔍 Why Did You Render — ДОЛЖЕН быть первым импортом!
// import '../wdyr'; // DISABLED - causes performance issues

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
// import ConsentModal from '@/components/Legal/ConsentModal'; // Отключен - согласия собираются на экране регистрации
import { LoginRequiredSheet } from '@/components/Auth/LoginRequiredSheet';
import { ReduxProviders } from '@/components/ReduxProviders';
import type { AppDispatch } from '@/lib/store';
import { store } from '@/lib/store';
import { setCurrentUserId } from '@/lib/store/slices/chatSlice';
import { setCurrentIndex } from '@/lib/store/slices/feedSlice';
import { ThemedBackground, useThemeContext } from '@/lib/theme';
// import { api } from '@/services/api'; // Не используется после отключения проверки согласий
import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { subscribeToRealtime, unsubscribeFromRealtime } from '@/services/realtime';
import { appLogger } from '@/utils/logger';
import { testSupabaseConnection } from '@/utils/testSupabase';
import { ultra } from '@/lib/theme/ultra';
import { Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
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

const LoadingScreen = () => {
  // Используем fallback значения без хуков для максимальной надежности
  // useAppTheme может не работать на ранних этапах инициализации
  return (
    <View style={[styles.loading, { backgroundColor: '#000' }]}>
      <ActivityIndicator size="large" color="#FF3B30" />
      <Text style={[styles.loadingText, { color: '#808080' }]}>
        Загрузка приложения...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
});

// Внутренний компонент, который использует Redux (должен быть внутри Provider)
function AppContent() {
  const rootNavState = useRootNavigationState();
  const segments = useSegments() as string[];
  const { isDark } = useThemeContext();
  const dispatch = useDispatch<AppDispatch>();
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const initDone = useRef(false);
  const authHydrated = useRef(false);
  
  // Останавливаем видео при навигации на другие экраны (не главный feed)
  // КРИТИЧНО: Останавливаем видео на страницах регистрации, профиля и других
  useEffect(() => {
    if (!rootNavState?.key || !segments || segments.length < 1) return;
    
    // Проверяем, находимся ли мы на главном экране feed
    // segments может быть ['(tabs)', 'index'] или просто ['index']
    const lastSegment = segments[segments.length - 1] as string;
    const firstSegment = segments[0] as string;
    
    // Главный экран feed - это когда последний сегмент 'index' или мы в (tabs) и первый таб
    const isOnFeed = lastSegment === 'index' || 
                    (segments.length >= 2 && segments[0] === '(tabs)' && lastSegment === 'index');
    
    // Останавливаем видео если:
    // 1. Не на главном feed
    // 2. На страницах регистрации (auth)
    // 3. На страницах профиля, камеры и других
    const isOnAuth = firstSegment === '(auth)' || segments.some(s => s === 'intro' || s === 'phone' || s === 'verify');
    const isOnOtherScreen = !isOnFeed && (isOnAuth || firstSegment === 'profile' || firstSegment === 'camera' || firstSegment === 'chat');
    
    if (isOnOtherScreen || !isOnFeed) {
      // Останавливаем все видео при уходе с feed
      dispatch(setCurrentIndex(-1));
      
      // Также останавливаем видео через VideoEngine
      const stopVideos = async () => {
        try {
          const { getVideoEngine } = await import('@/lib/video/videoEngine');
          const engine = getVideoEngine();
          engine.pauseAll(); // Останавливаем воспроизведение, но сохраняем регистрации
          // clear() вызывать только при полном unmount feed компонента
        } catch {
          // Игнорируем ошибки, если engine не доступен
        }
      };

      stopVideos();
    }
  }, [segments, rootNavState?.key, dispatch]);


  // === Загрузка auth state из storage (оптимизированная) ===
  useEffect(() => {
    if (authHydrated.current) return;
    authHydrated.current = true;
    
    // Используем InteractionManager для запуска после первого рендера
    const loadAuthState = async () => {
      // Небольшая задержка чтобы не блокировать первый рендер
      await new Promise(resolve => setTimeout(resolve, 50));
      
      try {
        // Динамический импорт - не загружаем storage пока не нужен
        const { default: storageService } = await import('@/services/storage');
        
        // Параллельная загрузка token и user
        const [token, user] = await Promise.all([
          storageService.getAuthToken(),
          storageService.getUserData(),
        ]);
        
        if (token && user?.id) {
          const { hydrateAuth } = await import('@/lib/store/slices/authSlice');
          dispatch(hydrateAuth({ user, token }));
          setUserId(user.id);
        } else {
          const { setLoading } = await import('@/lib/store/slices/authSlice');
          dispatch(setLoading(false));
        }
      } catch (error: any) {
        appLogger.error('[App] Error loading auth state', { error: error?.message });
        const { setLoading } = await import('@/lib/store/slices/authSlice');
        dispatch(setLoading(false));
      }
    };
    
    loadAuthState();
  }, [dispatch]);

  // ✅ NO AUTH GUARD - Guests can view content immediately
  // Navigation happens in (protected) layouts and UI buttons

  // === КРИТИЧЕСКАЯ инициализация (минимум для первого рендера) ===
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    // Сразу показываем UI - это ЕДИНСТВЕННОЕ что делаем синхронно
    setIsReady(true);

    // Всё остальное - в фоне после первого рендера
    const runBackgroundInit = async () => {
      // Используем requestIdleCallback для некритичных операций
      // или setTimeout с небольшой задержкой для React Native
      await new Promise(resolve => setTimeout(resolve, 100));

      // 1. Error tracking - не критично для UI
      try {
        errorTracking.init();
        errorTracking.addBreadcrumb('App started', 'lifecycle');
      } catch (e) {
        appLogger.error('Error tracking init failed', { error: e });
      }

      // 2. Тест Supabase - полностью фоновая операция
      testSupabaseConnection().catch(() => {});

      // 2.5. Clear stuck upload queue (one-time cleanup)
      // Clear BOTH AsyncStorage queue AND SQLite pending_actions
      try {
        // Clear AsyncStorage queue
        const { backgroundUploadService } = await import('@/services/backgroundUploadService');
        await backgroundUploadService.clearAll();

        // Clear SQLite pending_actions (this is where the spam comes from)
        const { clearAllCache } = await import('@/services/offlineStorage.native');
        await clearAllCache();

        console.log('[App] All upload queues cleared (AsyncStorage + SQLite)');
      } catch (err) {
        console.warn('[App] Failed to clear upload queue:', err);
      }

      // 3. Проверка пользователя - отложенная
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const user = await auth.getCurrentUser();
        if (user?.id) {
          console.log('[App] User found:', user.id);
          setUserId(user.id);
        }
      } catch (e) {
        appLogger.error('User check failed', { error: e });
      }
    };

    // Запускаем фоновую инициализацию после первого рендера
    runBackgroundInit();
  }, []);

  // === Инициализация Redux-зависимых сервисов ===
  // Выполняется через ReduxProviders

  // === Проверка согласий ОТКЛЮЧЕНА ===
  // Согласия теперь собираются на экране регистрации (app/(auth)/intro.tsx)
  // ConsentModal больше не показывается, так как пользователь принимает согласия при регистрации
  // useEffect(() => {
  //   // ... старая логика проверки согласий закомментирована
  // }, [userId, isReady, authLoading, segments]);

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

  // Обработчики согласий ОТКЛЮЧЕНЫ — согласия собираются на экране регистрации
  // const handleAccept = () => { ... }
  // const handleDecline = async () => { ... }

  // Пока приложение не готово — показываем красивый лоадер
  if (!isReady) return <LoadingScreen />;

  return (
    <ThemedBackground>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              // Blur эффект на Header (iOS) - для экранов с headerShown: true
              headerTransparent: Platform.OS === 'ios',
              headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
              headerStyle: {
                backgroundColor: Platform.OS === 'ios' ? 'transparent' : ultra.background,
              },
              headerTintColor: ultra.textPrimary,
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 17,
              },
              headerShadowVisible: false,
              animation: 'slide_from_right',
            }}
            initialRouteName="splash"
          >
            {/* Splash Screen — первый экран */}
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            
            {/* Auth screens - явная регистрация для надежности */}
            <Stack.Screen name="(auth)/intro" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/phone" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/verify" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/name" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/consent" options={{ headerShown: false }} />
            
            {/* Onboarding screens */}
            <Stack.Screen name="(onboarding)/welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)/IntroCarousel" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)/permissions" options={{ headerShown: false }} />
            
            {/* Main app tabs - обрабатывается автоматически через layout.tsx в (tabs) */}
            {/* Не регистрируем здесь, чтобы избежать warning "Layout children must be of type Screen" */}

            {/* Protected screens - handled by (protected)/_layout.tsx with Slot */}
            {/* Routes: messages, favorites, my-listings, listing/[id]/edit, boost/history, billing/history */}
            <Stack.Screen name="(protected)" options={{ headerShown: false }} />
            
            {/* Modals & screens */}
            <Stack.Screen 
              name="car/[id]" 
              options={{ presentation: 'modal', headerShown: false }} 
            />
            <Stack.Screen 
              name="profile/[id]" 
              options={{ 
                headerShown: true,
                title: 'Профиль',
              }} 
            />
            <Stack.Screen 
              name="profile/edit" 
              options={{ 
                headerShown: true,
                title: 'Редактировать профиль',
              }} 
            />
            <Stack.Screen 
              name="chat/[conversationId]" 
              options={{ 
                headerShown: true,
                title: 'Чат',
              }} 
            />
            <Stack.Screen name="camera/guide" options={{ headerShown: false }} />
            <Stack.Screen name="camera/record" options={{ headerShown: false }} />
            <Stack.Screen name="camera/process" options={{ title: 'Обработка видео' }} />
            <Stack.Screen name="listing/new" options={{ headerShown: false }} />
            <Stack.Screen 
              name="notifications" 
              options={{ 
                headerShown: true,
                title: 'Уведомления',
              }} 
            />

            {/* Legal screens */}
            <Stack.Screen 
              name="legal/terms" 
              options={{ 
                headerShown: true,
                title: 'Пользовательское соглашение',
              }} 
            />
            <Stack.Screen 
              name="legal/privacy" 
              options={{ 
                headerShown: true,
                title: 'Политика конфиденциальности',
              }} 
            />
            <Stack.Screen 
              name="legal/consent" 
              options={{ 
                headerShown: true,
                title: 'Согласия',
              }} 
            />

            {/* Dev & test screens - регистрируем только если файлы существуют */}
            {/* Удалено: test-supabase, test-sms, test-apivideo, test-notifications - файлы не существуют */}

            <Stack.Screen name="+not-found" />
          </Stack>
        </ErrorBoundary>
        
        {/* StatusBar и ConsentModal должны быть вне ErrorBoundary и Stack */}
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Consent Modal ОТКЛЮЧЕН — согласия собираются на экране регистрации */}
        {/* {userId && (
          <ConsentModal
            visible={showConsent}
            userId={userId}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )} */}
        <LoginRequiredSheet />
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
