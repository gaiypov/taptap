// app/(auth)/name.tsx
// Экран ввода имени после регистрации

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { logout, setCredentials } from '@/lib/store/slices/authSlice';
import { RevolutUltra } from '@/lib/theme/colors';
import { auth } from '@/services/auth';
import { appLogger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AUTH_USER_KEY = '@360auto:user';

export default function NameScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const isNavigatingRef = useRef(false);
  const isMountedRef = useRef(true);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
      isMountedRef.current = false; 
    };
  }, []);

  // Retry loader for user data
  const retryLoadUser = async () => {
    try {
      appLogger.info('[AUTH] Retrying user load from storage');
      const { default: storageService } = await import('@/services/storage');
      const stored = await storageService.getUserData();
      
      if (!stored) {
        // Try legacy key as fallback
        const legacyStored = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (legacyStored) {
          const parsed = JSON.parse(legacyStored);
          if (parsed && parsed.id && isMounted.current) {
            setHydrating(false);
            return;
          }
        }
        
        appLogger.error('[AUTH] Still no user_data, forcing logout fail-safe');
        if (isMounted.current) {
          dispatch(logout());
          router.replace('/(auth)/register');
        }
        return;
      }
      
      if (isMounted.current) {
        setHydrating(false);
        appLogger.info('[AUTH] User loaded from storage via retry', { userId: stored.id });
      }
    } catch (error: any) {
      appLogger.error('[AUTH] Retry load user failed', { error: error?.message });
      if (isMounted.current) {
        dispatch(logout());
        router.replace('/(auth)/register');
      }
    }
  };

  // Hydration on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try Redux first
        let currentUser = user;
        
        // If no user in Redux, try storage
        if (!currentUser) {
          currentUser = await auth.getCurrentUser();
        }
        
        // If still no user, try retry
        if (!currentUser) {
          appLogger.warn('[AUTH] user missing - retry hydration');
          await retryLoadUser();
          return;
        }
        
        if (isMounted.current) {
          // Pre-fill name if exists
          if (currentUser.name && currentUser.name.trim() && currentUser.name !== 'Пользователь') {
            setName(currentUser.name);
          }
          
          setHydrating(false);
          appLogger.info('[AUTH] User loaded successfully', { userId: currentUser.id });
        }
      } catch (error: any) {
        appLogger.error('[AUTH] Failed to load user on mount', { error: error?.message });
        if (isMounted.current) {
          await retryLoadUser();
        }
      }
    };
    
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Фокус на поле ввода после гидратации
    if (!hydrating) {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    }
  }, [hydrating]);

  const handleContinue = async () => {
    if (isNavigatingRef.current) return;
    
    const trimmedName = name.trim();
    setError('');
    
    if (!trimmedName || trimmedName.length < 2) {
      setError('Введите ваше имя (минимум 2 символа)');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    isNavigatingRef.current = true;

    try {
      console.log('[AUTH] 📝 Updating user name...');
      const result = await auth.updateCurrentUser({ name: trimmedName });
      
      if (result.success && result.user) {
        const updatedUser = result.user as any;
        
        // Проверяем наличие обязательных полей
        if (!updatedUser || !updatedUser.id || typeof updatedUser.id !== 'string') {
          appLogger.error('[AUTH] ❌ User data missing id or invalid', {
            hasUser: !!updatedUser,
            userId: updatedUser?.id,
            userType: typeof updatedUser,
          });
          Alert.alert('Ошибка', 'Не удалось получить данные пользователя. Попробуйте еще раз.');
          if (isMountedRef.current) {
            setLoading(false);
          }
          isNavigatingRef.current = false;
          return;
        }

        console.log('[AUTH] ✅ Name updated successfully');
        
        // КРИТИЧНО: Получаем storage service и токен
        const { default: storageService } = await import('@/services/storage');
        const token = await storageService.getAuthToken();
        
        if (!token) {
          console.error('[AUTH] ❌ Token not found after name update!');
          Alert.alert('Ошибка', 'Токен не найден. Попробуйте войти снова.');
          if (isMountedRef.current) {
            setLoading(false);
          }
          isNavigatingRef.current = false;
          return;
        }
        
        // КРИТИЧНО: Сохраняем обновленного пользователя в storage через storageService
        console.log('[AUTH] 💾 Saving updated user to storage...');
        await storageService.setUserData(updatedUser);
        console.log('[AUTH] ✅ User data saved to storage');
        
        // Обновляем Redux store с новым именем
        console.log('[AUTH] 🔄 Updating Redux store...');
        dispatch(setCredentials({
          user: updatedUser,
          token: token,
        }));
        console.log('[AUTH] ✅ Redux store updated');
        
        // Проверяем, что данные сохранились
        const savedUser = await storageService.getUserData();
        console.log('[AUTH] 🔍 Verification - User in storage:', savedUser ? 'YES' : 'NO');
        if (savedUser && savedUser.id) {
          console.log('[AUTH] Saved user:', {
            id: savedUser.id,
            name: savedUser.name,
            phone: savedUser.phone,
          });
        }
        
        // КРИТИЧНО: Дополнительная проверка - убеждаемся что все данные сохранены
        // Используем retry логику вместо строгой проверки
        let finalCheck = await storageService.getUserData();
        if (!finalCheck || !finalCheck.id) {
          // Retry once
          await new Promise(resolve => setTimeout(resolve, 100));
          finalCheck = await storageService.getUserData();
        }
        
        if (!finalCheck || !finalCheck.id) {
          appLogger.error('[AUTH] Final check failed - user data not in storage after retry');
          // Fail-safe: все равно продолжаем, так как данные уже в Redux
          appLogger.warn('[AUTH] Continuing despite storage check failure - data in Redux');
        } else {
          appLogger.info('[AUTH] ✅ Final check passed - user data is in storage');
        }
        
         // Задержка для завершения всех операций
         await new Promise(resolve => setTimeout(resolve, 200));
        
         // Небольшая задержка для завершения всех операций
         await new Promise(resolve => setTimeout(resolve, 150));
         
         // Переходим в основное приложение (по ТЗ: Name → Main App)
         appLogger.info('[AUTH] 🚀 Navigating to main app...');
        try {
           router.replace('/(tabs)');
           appLogger.info('[AUTH] ✅ Navigation to tabs triggered');
        } catch (navError: any) {
           appLogger.error('[AUTH] ❌ Navigation error:', navError);
          try {
             router.push('/(tabs)');
             appLogger.info('[AUTH] ✅ Fallback navigation (push) triggered');
           } catch (fallbackError) {
             appLogger.error('[AUTH] ❌ Fallback navigation also failed:', fallbackError);
            Alert.alert(
              'Успешно',
              'Имя обновлено. Перезапустите приложение.',
              [{ text: 'OK' }]
            );
           }
         }
      } else {
        console.error('[AUTH] ❌ Failed to update name:', result.error);
        const errorMessage = result.error || 'Не удалось сохранить имя. Попробуйте еще раз.';
        setError(errorMessage);
        appLogger.error('[AUTH] Name update failed', { error: errorMessage });
        if (isMountedRef.current) {
          setLoading(false);
        }
        isNavigatingRef.current = false;
      }
    } catch (error: any) {
      console.error('[AUTH] ❌ Update name exception:', {
        message: error?.message,
        stack: error?.stack,
        error,
      });
      
      const errorMessage = error?.message || 'Произошла ошибка. Попробуйте позже.';
      setError(errorMessage);
      appLogger.error('[AUTH] Name update exception', { error: errorMessage });
      if (isMountedRef.current) {
        setLoading(false);
      }
      isNavigatingRef.current = false;
    }
  };

  // Show loading state during hydration
  if (hydrating) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RevolutUltra.textPrimary} />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <Animated.View entering={FadeInDown} style={styles.header}>
            <Text style={styles.headerTitle}>Как вас зовут?</Text>
          </Animated.View>

          {/* Instructions */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={styles.instruction}>
              Введите ваше имя, чтобы другие пользователи могли вас найти
            </Text>
          </Animated.View>

          {/* Name input */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={[styles.input, error && styles.inputError]}
              placeholder="Введите имя"
              placeholderTextColor={RevolutUltra.textTertiary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInUp.delay(300)}>
            <TouchableOpacity
              style={[
                styles.button,
                (name.trim().length < 2 || loading) && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={name.trim().length < 2 || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={RevolutUltra.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color={RevolutUltra.textPrimary} />
                  <Text style={styles.buttonText}>Сохранение...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Продолжить</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RevolutUltra.bg,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: RevolutUltra.textSecondary,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 32, android: 30, default: 32 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-bold', default: 'System' }),
  },
  instruction: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    color: RevolutUltra.textSecondary,
    marginBottom: Platform.select({ ios: 48, android: 40, default: 48 }),
    lineHeight: Platform.select({ ios: 22, android: 21, default: 22 }),
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    height: Platform.select({ ios: 56, android: 52, default: 56 }),
    backgroundColor: RevolutUltra.card,
    borderRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
    borderWidth: 2,
    borderColor: RevolutUltra.border,
    paddingHorizontal: 16,
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputError: {
    borderColor: RevolutUltra.neutral.light,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  },
  button: {
    height: Platform.select({ ios: 56, android: 52, default: 56 }),
    borderRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: RevolutUltra.textPrimary,
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  },
});

