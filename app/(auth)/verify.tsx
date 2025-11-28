// app/(auth)/verify.tsx
// Экран ввода 4-значного кода подтверждения

import { useAppDispatch } from '@/lib/store/hooks';
import { setCredentials } from '@/lib/store/slices/authSlice';
import { ultra } from '@/lib/theme/ultra';
import { api } from '@/services/api';
import { auth } from '@/services/auth';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton } from '@/components/ui/PremiumButton';

const CODE_LENGTH = 4;

// Helper function for delays
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function VerifyCodeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone || '';

  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const isNavigatingRef = useRef(false); // Защита от двойной навигации
  const navigationSucceededRef = useRef(false); // Отслеживание успешной навигации
  const isMountedRef = useRef(true);
  // Track mount status to avoid state updates after unmount
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Таймер для повторной отправки
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (value: string, index: number) => {
    // Разрешаем только цифры
    const digit = value.replace(/[^0-9]/g, '');

    if (digit.length > 1) {
      // Если вставлен код целиком
      const digits = digit.split('').slice(0, CODE_LENGTH);
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = d;
        }
      });
      setCode(newCode);

      // Фокус на последнем поле
      const lastIndex = Math.min(index + digits.length - 1, CODE_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      // Автоматически переходим к следующему полю
      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    // Автоматическая проверка при заполнении всех полей
    const newCodeString = digit.length > 1
      ? digit.slice(0, CODE_LENGTH)
      : [...code.slice(0, index), digit, ...code.slice(index + 1)].join('').slice(0, CODE_LENGTH);

    if (newCodeString.length === CODE_LENGTH) {
      setTimeout(() => handleVerify(newCodeString), 100);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    // Guard: block double navigation
    if (isNavigatingRef.current) return;
    if (loading) {
      console.warn('[AUTH] ⚠️ Verification already in progress, ignoring duplicate call');
      return;
    }

    const codeString = codeToVerify || code.join('');
    
    console.log('[AUTH] 🔐 Verifying code:', {
      code: codeString,
      codeLength: codeString.length,
      phone,
      expectedLength: CODE_LENGTH,
    });
    
    if (codeString.length !== CODE_LENGTH) {
      console.warn('[AUTH] ❌ Code length mismatch:', codeString.length, 'expected:', CODE_LENGTH);
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    isNavigatingRef.current = true;
    navigationSucceededRef.current = false; // Сбрасываем флаг успешной навигации

    try {
      console.log('[AUTH] 🔄 Calling auth.verifyCode...');
      const result = await auth.verifyCode(phone, codeString);
      
      console.log('[AUTH] Verify response:', {
        success: result.success,
        hasUser: !!result.user,
        userId: result.user?.id,
        userPhone: result.user?.phone,
        error: result.error,
      });

      if (result.success && result.user && 'token' in result && result.token) {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║       🎉 OTP VERIFICATION SUCCESSFUL - DEBUG TRACE 🎉       ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log('║ STEP 1: API Response Received                                ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('[DEBUG] User from API:', JSON.stringify({
          id: result.user.id,
          phone: result.user.phone,
          name: result.user.name,
          avatar_url: result.user.avatar_url,
        }, null, 2));
        console.log('[DEBUG] Token length:', result.token.length);
        console.log('[DEBUG] Token preview:', result.token.substring(0, 40) + '...');

        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║ STEP 2: Dispatching to Redux                                 ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('[DEBUG] About to dispatch setCredentials with:');
        console.log('[DEBUG]   user.id:', result.user.id);
        console.log('[DEBUG]   user.phone:', result.user.phone);
        console.log('[DEBUG]   user.name:', result.user.name);

        // Dispatch Redux только после успешной финализации
        dispatch(setCredentials({
          user: result.user,
          token: result.token,
        }));

        console.log('[DEBUG] ✅ Redux dispatch COMPLETED');
        console.log('[DEBUG] User should now be in Redux state');
        
        // Небольшая задержка для завершения всех операций
        await wait(150);
        
        // Инициализируем push-уведомления после успешного входа (безопасно)
        try {
          const { initPushNotifications } = await import('@/services/pushNotifications');
          initPushNotifications().catch((err) => {
            console.warn('[AUTH] Push notifications init failed (non-critical):', err);
          });
        } catch (err) {
          console.warn('[AUTH] Failed to load push notifications module (non-critical):', err);
        }
        
        // Проверяем, есть ли имя у пользователя
        const userName = result.user.name || '';
        const hasName = userName.trim().length > 0 && userName !== 'Пользователь';
        
        console.log('[AUTH] 🔍 Name check:', {
          name: userName,
          hasName,
          nameLength: userName.trim().length,
        });
        
        // Если имени нет - переходим на экран ввода имени
        if (!hasName) {
          console.log('[AUTH] 📝 No name found, navigating to name screen...');
          router.replace('/(auth)/name');
          navigationSucceededRef.current = true;
          return;
        }
        
        // Проверяем согласия (только если есть имя)
        try {
          const consentStatus = await api.consents.getStatus();
          const hasConsents = consentStatus?.data?.hasConsents ?? false;
          
          console.log('[AUTH] 🔍 Consent check:', {
            hasConsents,
            requiresReconsent: consentStatus?.data?.requiresReconsent,
          });
          
          // Если согласий нет - переходим на экран согласий
          if (!hasConsents) {
            console.log('[AUTH] 📋 No consents found, navigating to consent screen...');
            router.replace('/(auth)/consent');
            navigationSucceededRef.current = true;
            return;
          }
        } catch (consentError: any) {
          // Если проверка согласий не удалась, продолжаем на главный экран
          // (согласия можно будет принять позже)
          console.warn('[AUTH] ⚠️ Consent check failed, continuing to main app:', consentError?.message);
        }
        
        // Навигация на главный экран (если есть имя и согласия)
        console.log('[VerifyScreen] 🚀 Navigating to tabs...');
        router.replace('/(tabs)');
        navigationSucceededRef.current = true;
      } else {
        // Ошибка верификации - показываем понятное сообщение
        console.error('[AUTH] ❌ Verification failed:', result.error);
        const errorMessage = result.error || 'Неверный код или код истек. Попробуйте запросить новый код.';
        // НЕ сбрасываем isNavigatingRef здесь - будет сброшен в finally
        Alert.alert('Ошибка', errorMessage, [
          {
            text: 'OK',
            onPress: () => {
              // Очищаем поля после закрытия Alert
              if (isMountedRef.current) {
                setCode(['', '', '', '']);
              }
              inputRefs.current[0]?.focus();
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('[AUTH] ❌ Verify code exception:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data,
        status: error?.response?.status,
        error,
      });
      
      // Детальная обработка ошибок
      let errorMessage = 'Произошла ошибка. Попробуйте позже.';
      
      if (error?.response?.status === 400) {
        const errorData = error?.response?.data || error?.data || {};
        errorMessage = errorData.error || errorData.message || 'Неверный код или код истек';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      // НЕ сбрасываем isNavigatingRef здесь - будет сброшен в finally
      Alert.alert('Ошибка', errorMessage, [
        {
          text: 'OK',
          onPress: () => {
            if (isMountedRef.current) {
              setCode(['', '', '', '']);
            }
            inputRefs.current[0]?.focus();
          },
        },
      ]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      // КРИТИЧНО: Сбрасываем флаг только если навигация НЕ произошла
      // Если навигация успешна, мы уходим с экрана и флаг не нужен
      if (!navigationSucceededRef.current) {
        isNavigatingRef.current = false;
      }
    }
  };

  const handleResendCode = async () => {
    if (loading) return;
    if (resendTimer > 0) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);

    try {
      const result = await auth.sendVerificationCode(phone);

      if (result.success) {
        setResendTimer(60);
        if (isMountedRef.current) {
          setCode(['', '', '', '']);
        }
        inputRefs.current[0]?.focus();
        Alert.alert('Успешно', 'Код отправлен повторно');
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось отправить код');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert('Ошибка', 'Произошла ошибка. Попробуйте позже.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Фокус на первое поле при монтировании
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <PremiumButton
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              style={styles.backButton}
              haptic="light"
            >
              <Ionicons name="arrow-back" size={24} color={ultra.textPrimary} />
            </PremiumButton>
            <Text style={styles.headerTitle}>Подтверждение</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          {/* Instructions */}
          <Text style={styles.instruction}>
            Введите код из SMS, отправленный на{'\n'}
            <Text style={styles.phoneNumber}>{phone}</Text>
          </Text>

          {/* Code inputs */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {/* Verify button — Premium */}
          <PremiumButton
            variant="primary"
            size="xl"
            fullWidth
            onPress={() => handleVerify()}
            disabled={code.join('').length !== CODE_LENGTH || loading}
            loading={loading}
            haptic="success"
            style={styles.button}
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </PremiumButton>

          {/* Resend code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Не получили код?</Text>
            <PremiumButton
              variant="ghost"
              size="sm"
              onPress={handleResendCode}
              disabled={resendTimer > 0 || loading}
              haptic="light"
            >
              <Text
                style={[
                  styles.resendButtonText,
                  (resendTimer > 0 || loading) && styles.resendButtonTextDisabled,
                ]}
              >
                {resendTimer > 0 ? `Отправить повторно (${resendTimer}с)` : 'Отправить повторно'}
              </Text>
            </PremiumButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }),
    fontWeight: '700',
    color: ultra.textPrimary,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-bold', default: 'System' }),
  },
  instruction: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    color: ultra.textSecondary,
    textAlign: 'center',
    marginBottom: Platform.select({ ios: 48, android: 40, default: 48 }),
    lineHeight: Platform.select({ ios: 22, android: 21, default: 22 }),
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  },
  phoneNumber: {
    color: ultra.textPrimary,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  codeInput: {
    flex: 1,
    height: Platform.select({ ios: 64, android: 60, default: 64 }),
    backgroundColor: ultra.card,
    borderRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
    borderWidth: 2,
    borderColor: ultra.border,
    textAlign: 'center',
    fontSize: Platform.select({ ios: 24, android: 22, default: 24 }),
    fontWeight: '700',
    color: ultra.textPrimary,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-bold', default: 'System' }),
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
  codeInputFilled: {
    borderColor: ultra.accent,
    backgroundColor: ultra.card,
  },
  button: {
    height: Platform.select({ ios: 56, android: 52, default: 56 }),
    borderRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.select({ ios: 24, android: 20, default: 24 }),
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
  buttonText: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: ultra.textSecondary,
    marginBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    color: ultra.accent,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  },
  resendButtonTextDisabled: {
    color: ultra.textMuted,
  },
});

