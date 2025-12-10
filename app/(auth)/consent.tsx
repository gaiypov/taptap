// app/(auth)/consent.tsx
// Экран сбора согласий после ввода имени
// По ТЗ: Phone → SMS → Verify → Name → Legal Consent → JWT

import { useAppDispatch } from '@/lib/store/hooks';
import { ultra } from '@/lib/theme/ultra';
import { api } from '@/services/api';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConsentScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [agreedToAge, setAgreedToAge] = useState(false);
  const [agreedToPersonalData, setAgreedToPersonalData] = useState(false);
  const [agreedToOffer, setAgreedToOffer] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const isNavigatingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const allRequiredAccepted = agreedToAge && agreedToPersonalData && agreedToOffer;

  const handleAccept = async () => {
    if (isNavigatingRef.current) return;
    if (!allRequiredAccepted) {
      Alert.alert('Внимание', 'Необходимо принять все обязательные условия');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    isNavigatingRef.current = true;

    try {
      appLogger.info('[AUTH] Accepting consents...');

      const result = await api.consents.accept({
        marketing_accepted: marketingAccepted,
        notifications_accepted: true, // По умолчанию включены
      });

      if (result.success) {
        appLogger.info('[AUTH] ✅ Consents accepted successfully');

        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Небольшая задержка для завершения операций
        await new Promise(resolve => setTimeout(resolve, 200));

        // Навигация на главный экран
        appLogger.info('[AUTH] 🚀 Navigating to main app...');
        try {
          router.replace('/(tabs)');
          appLogger.info('[AUTH] ✅ Navigation triggered');
        } catch (navError: any) {
          appLogger.error('[AUTH] ❌ Navigation error:', navError);
          try {
            router.push('/(tabs)');
            appLogger.info('[AUTH] ✅ Fallback navigation triggered');
          } catch (fallbackError) {
            appLogger.error('[AUTH] ❌ Fallback navigation failed:', fallbackError);
            Alert.alert(
              'Успешно',
              'Регистрация завершена. Перезапустите приложение.',
              [{ text: 'OK' }]
            );
          }
        }
      } else {
        const errorMessage = result.error || 'Не удалось сохранить согласия. Попробуйте еще раз.';
        appLogger.error('[AUTH] ❌ Failed to accept consents:', errorMessage);
        Alert.alert('Ошибка', errorMessage);
        if (isMountedRef.current) {
          setLoading(false);
        }
        isNavigatingRef.current = false;
      }
    } catch (error: any) {
      appLogger.error('[AUTH] ❌ Accept consents exception:', {
        message: error?.message,
        stack: error?.stack,
        error,
      });
      Alert.alert('Ошибка', error?.message || 'Произошла ошибка. Попробуйте позже.');
      if (isMountedRef.current) {
        setLoading(false);
      }
      isNavigatingRef.current = false;
    }
  };

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
            <Text style={styles.title}>Завершение регистрации</Text>
            <Text style={styles.subtitle}>
              Для использования приложения необходимо принять условия использования
            </Text>
          </View>

          {/* Checkboxes */}
          <View style={styles.checkboxGroup}>
            <CheckboxRow
              checked={agreedToAge}
              onPress={() => setAgreedToAge(!agreedToAge)}
              text="Мне есть 18 лет"
              required
            />
            <CheckboxRow
              checked={agreedToPersonalData}
              onPress={() => setAgreedToPersonalData(!agreedToPersonalData)}
              text="Я согласен на обработку персональных данных"
              isLink
              onLink={() => router.push('/legal/privacy' as any)}
              required
            />
            <CheckboxRow
              checked={agreedToOffer}
              onPress={() => setAgreedToOffer(!agreedToOffer)}
              text="Я согласен с офертой"
              isLink
              onLink={() => router.push('/legal/terms' as any)}
              required
            />
            <CheckboxRow
              checked={marketingAccepted}
              onPress={() => setMarketingAccepted(!marketingAccepted)}
              text="Я согласен получать маркетинговые рассылки"
              optional
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!allRequiredAccepted || loading) && styles.buttonDisabled,
            ]}
            onPress={handleAccept}
            disabled={!allRequiredAccepted || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[ultra.gradientStart, ultra.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {loading ? (
              <ActivityIndicator size="small" color={ultra.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>Принять и продолжить</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- COMPONENTS ---

interface CheckboxRowProps {
  checked: boolean;
  onPress: () => void;
  text: string;
  isLink?: boolean;
  onLink?: () => void;
  required?: boolean;
  optional?: boolean;
}

const CheckboxRow = ({ checked, onPress, text, isLink, onLink, required, optional }: CheckboxRowProps) => (
  <View style={styles.checkboxRow}>
    <Pressable onPress={onPress} style={styles.checkboxPressable}>
      <View style={[styles.checkboxBase, checked && styles.checkboxActive]}>
        {checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
      </View>
    </Pressable>

    {isLink && onLink ? (
      <Pressable onPress={onLink} style={styles.checkboxTextPressable}>
        <Text style={styles.checkboxLabel}>
          {text}
          {required && <Text style={styles.required}> *</Text>}
          {optional && <Text style={styles.optional}> (необязательно)</Text>}
        </Text>
      </Pressable>
    ) : (
      <Pressable onPress={onPress} style={styles.checkboxTextPressable}>
        <Text style={styles.checkboxLabel}>
          {text}
          {required && <Text style={styles.required}> *</Text>}
          {optional && <Text style={styles.optional}> (необязательно)</Text>}
        </Text>
      </Pressable>
    )}
  </View>
);

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: Platform.select({ ios: 32, android: 30, default: 32 }),
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-bold', default: 'System' }),
  },
  subtitle: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    color: ultra.textSecondary,
    textAlign: 'center',
    lineHeight: Platform.select({ ios: 22, android: 21, default: 22 }),
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  },
  checkboxGroup: {
    gap: 20,
    marginBottom: 32,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxPressable: {
    marginTop: 2,
  },
  checkboxTextPressable: {
    flex: 1,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 8,
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
  checkboxLabel: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '500',
    lineHeight: Platform.select({ ios: 22, android: 21, default: 22 }),
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  },
  required: {
    color: ultra.accent,
  },
  optional: {
    color: ultra.textMuted,
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
  },
  button: {
    height: Platform.select({ ios: 56, android: 52, default: 56 }),
    borderRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 8,
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
});

