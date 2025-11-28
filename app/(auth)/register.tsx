// app/(auth)/register.tsx
// UNIFIED Registration Screen - ONE screen, ONE flow
// Phone + Name + Consents + OTP all visible on same screen
// Revolut Ultra Platinum Style
// React Hook Form + Zod validation

import { registerSchema, type RegisterFormData } from '@/lib/validation/schemas';
import { useAppDispatch } from '@/lib/store/hooks';
import { setCredentials, setHasSeenOnboarding } from '@/lib/store/slices/authSlice';
import { ultra } from '@/lib/theme/ultra';
import { api } from '@/services/api';
import { auth } from '@/services/auth';
import { CountryCodeSelector, COUNTRIES, type Country } from '@/components/Auth/CountryCodeSelector';
import { appLogger } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton } from '@/components/ui/PremiumButton';

const CODE_LENGTH = 4;

export default function UnifiedRegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // React Hook Form для валидации
  const {
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      phone: '',
      name: '',
      agreedToTerms: false as boolean,
      agreedToPrivacy: false as boolean,
    } as any,
  });

  // Watch form values
  const watchedValues = watch();

  // Input fields (synced with form)
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');

  // Consent checkboxes (synced with form)
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  // Sync state changes to form for validation
  useEffect(() => {
    setValue('name', name.trim(), { shouldValidate: name.length > 0 });
  }, [name, setValue]);

  useEffect(() => {
    const formatted = formatPhone(selectedCountry, phoneNumber);
    setValue('phone', formatted, { shouldValidate: phoneNumber.length > 0 });
  }, [phoneNumber, selectedCountry, setValue]);

  useEffect(() => {
    setValue('agreedToTerms', agreedToTerms as true, { shouldValidate: true });
  }, [agreedToTerms, setValue]);

  useEffect(() => {
    setValue('agreedToPrivacy', agreedToPrivacy as true, { shouldValidate: true });
  }, [agreedToPrivacy, setValue]);

  // OTP state
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Loading states
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Refs for safety
  const isNavigatingRef = useRef(false);
  const isMountedRef = useRef(true);
  const formattedPhoneRef = useRef('');

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Format phone number for E.164
  const formatPhone = (country: Country, phoneDigits: string): string => {
    const digits = phoneDigits.replace(/\D/g, '');

    if (country.code === 'KG') {
      if (digits.startsWith('996')) return '+' + digits.substring(0, 12);
      if (digits.startsWith('0')) return '+996' + digits.substring(1, 10);
      return country.dialCode + digits.substring(0, 9);
    }

    if (country.code === 'KZ' || country.code === 'RU') {
      if (digits.startsWith('7')) return '+' + digits.substring(0, 11);
      if (digits.startsWith('8')) return '+7' + digits.substring(1, 11);
      return country.dialCode + digits.substring(0, 10);
    }

    if (country.code === 'UZ' || country.code === 'TJ') {
      if (digits.startsWith('998') || digits.startsWith('992')) {
        return '+' + digits.substring(0, 12);
      }
      return country.dialCode + digits.substring(0, 9);
    }

    return country.dialCode + digits;
  };

  // Validation
  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 2;
  const formattedPhone = formatPhone(selectedCountry, phoneNumber);
  const e164Pattern = /^\+[1-9]\d{9,14}$/;
  const isPhoneValid = phoneNumber.trim().length > 0 && e164Pattern.test(formattedPhone);
  const canSendCode = isPhoneValid && isNameValid && agreedToTerms && agreedToPrivacy && !codeSent;
  const canResendCode = isPhoneValid && isNameValid && agreedToTerms && agreedToPrivacy && codeSent && resendTimer === 0;

  // Handle Send Code
  const handleSendCode = async () => {
    if ((!canSendCode && !canResendCode) || sendingCode) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    formattedPhoneRef.current = formattedPhone;
    setSendingCode(true);

    try {
      appLogger.info('[Register] Sending verification code...', { phone: formattedPhone });
      const result = await auth.sendVerificationCode(formattedPhone);

      if (result.success) {
        appLogger.info('[Register] Code sent successfully');
        setCodeSent(true);
        setResendTimer(60);
        setCode(['', '', '', '']);
        // Focus first OTP input
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось отправить код');
      }
    } catch (error: any) {
      appLogger.error('[Register] Send code error:', error);
      Alert.alert('Ошибка', 'Произошла ошибка. Попробуйте позже.');
    } finally {
      if (isMountedRef.current) {
        setSendingCode(false);
      }
    }
  };

  // Handle OTP input change
  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '');

    if (digit.length > 1) {
      // Pasted code
      const digits = digit.split('').slice(0, CODE_LENGTH);
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = d;
        }
      });
      setCode(newCode);
      const lastIndex = Math.min(index + digits.length - 1, CODE_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();

      // Auto-verify if complete
      const codeString = newCode.join('');
      if (codeString.length === CODE_LENGTH) {
        setTimeout(() => handleVerify(codeString), 100);
      }
    } else {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-verify when complete
      const newCodeString = newCode.join('');
      if (newCodeString.length === CODE_LENGTH) {
        setTimeout(() => handleVerify(newCodeString), 100);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Verify OTP
  const handleVerify = async (codeToVerify?: string) => {
    if (isNavigatingRef.current || verifying) return;

    const codeString = codeToVerify || code.join('');
    if (codeString.length !== CODE_LENGTH) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setVerifying(true);
    isNavigatingRef.current = true;

    try {
      appLogger.info('[Register] Verifying code...');
      const result = await auth.verifyCode(formattedPhoneRef.current, codeString);

      if (result.success && result.user && result.token) {
        appLogger.info('[Register] Verification successful!');

        // Update user name if different
        const currentName = result.user.name || '';
        if (currentName !== trimmedName && trimmedName.length >= 2) {
          appLogger.info('[Register] Updating user name...');
          const updateResult = await auth.updateCurrentUser({ name: trimmedName });
          if (updateResult.success && updateResult.user) {
            result.user = updateResult.user;
          }
        }

        // Accept consents
        try {
          await api.consents.accept({
            marketing_accepted: false,
            notifications_accepted: true,
          });
          appLogger.info('[Register] Consents accepted');
        } catch (consentError) {
          appLogger.warn('[Register] Consent acceptance failed (non-critical):', consentError);
        }

        // Mark onboarding as completed
        await AsyncStorage.setItem('onboarding_completed', 'true');
        dispatch(setHasSeenOnboarding(true));

        // Dispatch credentials to Redux
        dispatch(setCredentials({
          user: result.user,
          token: result.token,
        }));

        // Small delay for state to settle
        await new Promise(resolve => setTimeout(resolve, 200));

        // Initialize push notifications (non-blocking)
        try {
          const { initPushNotifications } = await import('@/services/pushNotifications');
          initPushNotifications().catch(() => {});
        } catch {}

        // SUCCESS! Show success state with haptic feedback
        // Cross-platform haptic feedback
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}

        // Show success screen briefly
        if (isMountedRef.current) {
          setShowSuccess(true);
        }

        appLogger.info('[Register] Registration successful! Showing success screen...');

        // Wait for user to see success message, then navigate
        await new Promise(resolve => setTimeout(resolve, 1500));

        appLogger.info('[Register] Navigating to main app...');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Ошибка', result.error || 'Неверный код', [
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
        isNavigatingRef.current = false;
      }
    } catch (error: any) {
      appLogger.error('[Register] Verify error:', error);
      Alert.alert('Ошибка', error?.message || 'Произошла ошибка', [
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
      isNavigatingRef.current = false;
    } finally {
      if (isMountedRef.current) {
        setVerifying(false);
      }
    }
  };

  // Reset to edit phone/name
  const handleEditInfo = () => {
    setCodeSent(false);
    setCode(['', '', '', '']);
    setResendTimer(0);
  };

  // SUCCESS SCREEN
  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <View style={styles.successContainer}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.successContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Добро пожаловать!</Text>
            <Text style={styles.successSubtitle}>{name || 'Вы успешно зарегистрированы'}</Text>
            <Text style={styles.successHint}>Переход в приложение...</Text>
            <ActivityIndicator size="small" color={ultra.textSecondary} style={{ marginTop: 20 }} />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            <Text style={styles.headerTitle}>Регистрация</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <Text style={styles.subtitle}>
            Введите данные для создания аккаунта
          </Text>

          {/* Phone Input */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={[styles.fieldLabel, errors.phone && styles.fieldLabelError]}>
              Номер телефона
            </Text>
            <View style={[
              styles.phoneInputContainer,
              errors.phone && styles.inputError
            ]}>
              <CountryCodeSelector
                selectedCountry={selectedCountry}
                onSelect={setSelectedCountry}
              />
              <TextInput
                style={[styles.phoneInput, codeSent && styles.inputDisabled]}
                placeholder="555 123 456"
                placeholderTextColor={ultra.textMuted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!codeSent && !sendingCode}
              />
            </View>
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Text style={[styles.fieldLabel, errors.name && styles.fieldLabelError]}>
              Ваше имя
            </Text>
            <TextInput
              style={[
                styles.textInput, 
                codeSent && styles.inputDisabled,
                errors.name && styles.inputError
              ]}
              placeholder="Как вас зовут?"
              placeholderTextColor={ultra.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={50}
              editable={!codeSent && !sendingCode}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </Animated.View>

          {/* Consent Checkboxes */}
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.consentSection}>
            <Text style={styles.consentTitle}>Согласия</Text>

            {/* Terms of Service */}
            <View style={styles.checkboxRow}>
              <Pressable
                onPress={() => !codeSent && setAgreedToTerms(!agreedToTerms)}
                style={styles.checkboxPressable}
                disabled={codeSent}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive, codeSent && styles.checkboxDisabled]}>
                  {agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </Pressable>
              <Pressable
                onPress={() => router.push('/legal/terms')}
                style={styles.checkboxTextPressable}
              >
                <Text style={styles.checkboxLabel}>
                  Я принимаю{' '}
                  <Text style={styles.linkText}>Пользовательское соглашение</Text>
                  <Text style={styles.required}> *</Text>
                </Text>
              </Pressable>
            </View>

            {/* Privacy Policy */}
            <View style={styles.checkboxRow}>
              <Pressable
                onPress={() => !codeSent && setAgreedToPrivacy(!agreedToPrivacy)}
                style={styles.checkboxPressable}
                disabled={codeSent}
              >
                <View style={[styles.checkbox, agreedToPrivacy && styles.checkboxActive, codeSent && styles.checkboxDisabled]}>
                  {agreedToPrivacy && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </Pressable>
              <Pressable
                onPress={() => router.push('/legal/privacy')}
                style={styles.checkboxTextPressable}
              >
                <Text style={styles.checkboxLabel}>
                  Я согласен с{' '}
                  <Text style={styles.linkText}>Политикой конфиденциальности</Text>
                  <Text style={styles.required}> *</Text>
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Send Code Button */}
          {!codeSent && (
            <Animated.View entering={FadeInDown.delay(400).duration(300)}>
              <PremiumButton
                variant="primary"
                size="xl"
                fullWidth
                onPress={handleSendCode}
                disabled={!canSendCode || sendingCode}
                loading={sendingCode}
                haptic="medium"
                style={styles.button}
              >
                {sendingCode ? 'Отправка...' : 'Отправить код'}
              </PremiumButton>
            </Animated.View>
          )}

          {/* OTP Verification Section - Shows after code sent */}
          {codeSent && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.otpSection}>
              <View style={styles.otpDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Введите код</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.otpSubtitle}>
                Код отправлен на <Text style={styles.phoneHighlight}>{formattedPhoneRef.current}</Text>
              </Text>

              {/* OTP Inputs */}
              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[styles.codeInput, digit && styles.codeInputFilled]}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!verifying}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <PremiumButton
                variant="primary"
                size="xl"
                fullWidth
                onPress={() => handleVerify()}
                disabled={code.join('').length !== CODE_LENGTH || verifying}
                loading={verifying}
                haptic="success"
                style={styles.button}
              >
                {verifying ? 'Проверка...' : 'Подтвердить'}
              </PremiumButton>

              {/* Resend / Edit Links */}
              <View style={styles.otpActions}>
                <PremiumButton
                  variant="ghost"
                  size="sm"
                  onPress={handleSendCode}
                  disabled={resendTimer > 0 || sendingCode}
                  haptic="light"
                >
                  <Text style={[styles.actionLinkText, (resendTimer > 0 || sendingCode) && styles.actionLinkDisabled]}>
                    {resendTimer > 0 ? `Отправить повторно (${resendTimer}с)` : 'Отправить повторно'}
                  </Text>
                </PremiumButton>

                <PremiumButton variant="ghost" size="sm" onPress={handleEditInfo} haptic="light">
                  <View style={styles.actionLinkContent}>
                    <Ionicons name="pencil-outline" size={14} color={ultra.textSecondary} />
                    <Text style={styles.actionLinkText}>Изменить данные</Text>
                  </View>
                </PremiumButton>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: ultra.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successHint: {
    fontSize: 14,
    color: ultra.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  },
  subtitle: {
    fontSize: Platform.select({ ios: 15, android: 14, default: 15 }),
    color: ultra.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: ultra.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    backgroundColor: ultra.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: ultra.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  textInput: {
    height: 52,
    backgroundColor: ultra.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: ultra.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: ultra.border,
    marginBottom: 4,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  fieldLabelError: {
    color: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 4,
  },
  consentSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  consentTitle: {
    fontSize: 14,
    color: ultra.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  checkboxPressable: {
    marginTop: 2,
  },
  checkboxTextPressable: {
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ultra.border,
    backgroundColor: ultra.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: ultra.accent,
    backgroundColor: ultra.accent,
  },
  checkboxDisabled: {
    opacity: 0.6,
  },
  checkboxLabel: {
    color: ultra.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: ultra.accent,
    textDecorationLine: 'underline',
  },
  required: {
    color: ultra.accent,
  },
  button: {
    height: 52,
    borderRadius: 12,
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
  buttonText: {
    color: ultra.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  // OTP Section
  otpSection: {
    marginTop: 8,
  },
  otpDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ultra.border,
  },
  dividerText: {
    color: ultra.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  otpSubtitle: {
    fontSize: 14,
    color: ultra.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  phoneHighlight: {
    color: ultra.textPrimary,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  codeInput: {
    width: 56,
    height: 60,
    backgroundColor: ultra.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ultra.border,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  codeInputFilled: {
    borderColor: ultra.accent,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLinkText: {
    fontSize: 14,
    color: ultra.textSecondary,
  },
  actionLinkDisabled: {
    color: ultra.textMuted,
  },
});
