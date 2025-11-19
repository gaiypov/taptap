// app/(auth)/verify.tsx
// Экран ввода 4-значного кода подтверждения

import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { auth } from '@/services/auth';
import { ultra } from '@/lib/theme/ultra';
import { LinearGradient } from 'expo-linear-gradient';

const CODE_LENGTH = 4;

export default function VerifyCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone || '';

  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

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
    const codeString = codeToVerify || code.join('');
    
    if (codeString.length !== CODE_LENGTH) {
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      const result = await auth.verifyCode(phone, codeString);

      if (result.success) {
        // Успешная авторизация
        router.replace('/(tabs)');
      } else {
        Alert.alert('Ошибка', result.error || 'Неверный код');
        // Очищаем поля
        setCode(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify code error:', error);
      Alert.alert('Ошибка', 'Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);

    try {
      const result = await auth.sendVerificationCode(phone);

      if (result.success) {
        setResendTimer(60);
        setCode(['', '', '', '']);
        inputRefs.current[0]?.focus();
        Alert.alert('Успешно', 'Код отправлен повторно');
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось отправить код');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert('Ошибка', 'Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={ultra.textPrimary} />
            </TouchableOpacity>
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

          {/* Verify button — градиент металлик Revolut Ultra */}
          <TouchableOpacity
            style={[
              styles.button,
              (code.join('').length !== CODE_LENGTH || loading) && styles.buttonDisabled,
            ]}
            onPress={() => handleVerify()}
            disabled={code.join('').length !== CODE_LENGTH || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[ultra.gradientStart, ultra.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {loading ? (
              <Text style={styles.buttonText}>Проверка...</Text>
            ) : (
              <Text style={styles.buttonText}>Подтвердить</Text>
            )}
          </TouchableOpacity>

          {/* Resend code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Не получили код?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={resendTimer > 0 || loading}
              style={styles.resendButton}
            >
              <Text
                style={[
                  styles.resendButtonText,
                  (resendTimer > 0 || loading) && styles.resendButtonTextDisabled,
                ]}
              >
                {resendTimer > 0 ? `Отправить повторно (${resendTimer}с)` : 'Отправить повторно'}
              </Text>
            </TouchableOpacity>
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

