// components/Auth/SMSAuthScreen.tsx
// Улучшенная страница регистрации с выбором страны, галочками и экраном приветствия

import { useAppTheme } from '@/lib/theme';
import { auth } from '@/services/auth';
import { SCREEN_HEIGHT } from '@/utils/constants';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COUNTRIES, CountryCodeSelector, type Country } from './CountryCodeSelector';

interface SMSAuthScreenProps {
  onAuthSuccess?: () => void;
}

type Step = 'phone' | 'code' | 'welcome' | 'name';

export function SMSAuthScreen({ onAuthSuccess }: SMSAuthScreenProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // КГ по умолчанию
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  
  // Галочки
  const [agreedToAge, setAgreedToAge] = useState(false);
  const [agreedToPersonalData, setAgreedToPersonalData] = useState(false);
  const [agreedToOffer, setAgreedToOffer] = useState(false);

  const formatPhone = (country: Country, phoneDigits: string): string => {
    const digits = phoneDigits.replace(/\D/g, '');
    
    if (country.code === 'KG') {
      // Кыргызстан: +996 XXX XXX XXX
      if (digits.startsWith('996')) {
        return '+' + digits.substring(0, 12);
      }
      if (digits.startsWith('0')) {
        return '+996' + digits.substring(1, 10);
      }
      return country.dialCode + digits.substring(0, 9);
    }
    
    if (country.code === 'KZ' || country.code === 'RU') {
      // Казахстан и Россия: +7 XXX XXX XX XX
      if (digits.startsWith('7')) {
        return '+' + digits.substring(0, 11);
      }
      if (digits.startsWith('8')) {
        return '+7' + digits.substring(1, 11);
      }
      return country.dialCode + digits.substring(0, 10);
    }
    
    if (country.code === 'UZ') {
      // Узбекистан: +998 XX XXX XX XX
      if (digits.startsWith('998')) {
        return '+' + digits.substring(0, 12);
      }
      return country.dialCode + digits.substring(0, 9);
    }
    
    if (country.code === 'TJ') {
      // Таджикистан: +992 XX XXX XXXX
      if (digits.startsWith('992')) {
        return '+' + digits.substring(0, 12);
      }
      return country.dialCode + digits.substring(0, 9);
    }
    
    return country.dialCode + digits;
  };

  const handleSendCode = async () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const formattedPhone = formatPhone(selectedCountry, phoneNumber);
    
    // Валидация номера
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 7) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    // Проверка галочек
    if (!agreedToAge) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Alert.alert('Требуется подтверждение', 'Необходимо подтвердить, что вам есть 18 лет');
      return;
    }

    if (!agreedToPersonalData) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Alert.alert('Требуется согласие', 'Необходимо согласиться на обработку персональных данных');
      return;
    }

    if (!agreedToOffer) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Alert.alert('Требуется согласие', 'Необходимо согласиться с оффертой');
      return;
    }

    try {
      setLoading(true);
      setPhone(formattedPhone);
      const result = await auth.sendVerificationCode(formattedPhone);

      if (result.success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setStep('code');
        setCode('');
        setInfoMessage(result.warning || 'Код отправлен на ваш номер телефона');
        Alert.alert('Код отправлен', 'Проверьте SMS на вашем телефоне и введите 4-значный код');
      } else {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert('Ошибка', result.error || 'Не удалось отправить код');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 4) {
      Alert.alert('Ошибка', 'Введите 4-значный код');
      return;
    }

    try {
      setLoading(true);
      const result = await auth.verifyCode(phone, code);

      if (result.success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        // Переходим на экран приветствия
        setStep('welcome');
      } else {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert('Ошибка', result.error || 'Неверный код');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Ошибка проверки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterWelcome = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setStep('name');
  };

  const handleCompleteRegistration = async () => {
    if (!name || name.trim().length < 2) {
      Alert.alert('Ошибка', 'Введите ваше имя (минимум 2 символа)');
      return;
    }

    try {
      setLoading(true);
      // Обновляем имя пользователя
      const result = await auth.updateCurrentUser({ name: name.trim() });
      
      if (result.success || result.user) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert('Успех', 'Регистрация завершена!');
        if (onAuthSuccess) {
          onAuthSuccess();
        } else {
          router.replace('/(tabs)');
        }
      } else {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert('Ошибка', result.error || 'Не удалось завершить регистрацию');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setCode('');
    await handleSendCode();
  };

  const renderPhoneStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>360°</Text>
        </View>
        <Text style={[styles.slogan, { color: theme.textSecondary }]}>
          Добро пожаловать в 360°{'\n'}
          {'\n'}
          Мир, где авто, дома и лошади соединены в единую экосистему.{'\n'}
          {'\n'}
          Покупайте, продавайте и находите лучшее — честно, просто и без посредников.{'\n'}
          {'\n'}
          <Text style={{ fontWeight: '700', color: theme.primary }}>
            360° — всё, что движет вами.
          </Text>
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <CountryCodeSelector
            selectedCountry={selectedCountry}
            onSelect={setSelectedCountry}
          />
          <View
            style={[
              styles.phoneInputContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.phoneInput, { color: theme.text }]}
              placeholder={selectedCountry.code === 'KG' 
                ? '555 123 456' 
                : selectedCountry.code === 'KZ' || selectedCountry.code === 'RU'
                ? '700 123 4567'
                : 'XX XXX XXXX'}
              value={phoneNumber}
              onChangeText={(text) => {
                // Автоматическое форматирование номера при вводе
                const digits = text.replace(/\D/g, '');
                setPhoneNumber(digits);
                // Визуальная обратная связь при вводе
                if (Platform.OS === 'ios' && digits.length > 0) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholderTextColor={theme.placeholder}
              editable={!loading}
              maxLength={selectedCountry.code === 'KG' ? 9 : selectedCountry.code === 'KZ' || selectedCountry.code === 'RU' ? 10 : 9}
            />
          </View>
        </View>

        {/* Галочки */}
        <View style={styles.checkboxesContainer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToAge(!agreedToAge)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                agreedToAge && [styles.checkboxChecked, { backgroundColor: theme.primary }],
                { borderColor: agreedToAge ? theme.primary : theme.border },
              ]}
            >
              {agreedToAge && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[styles.checkboxText, { color: theme.text }]}>
              Мне есть 18 лет
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setAgreedToPersonalData(!agreedToPersonalData);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                agreedToPersonalData &&
                  [styles.checkboxChecked, { backgroundColor: theme.primary }],
                {
                  borderColor: agreedToPersonalData ? theme.primary : theme.border,
                },
              ]}
            >
              {agreedToPersonalData && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', flex: 1 }}>
              <Text style={[styles.checkboxText, { color: theme.text }]}>Я согласен на </Text>
              <TouchableOpacity 
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/legal/privacy' as any);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.checkboxLink, { color: theme.primary }]}>
                  обработку персональных данных
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setAgreedToOffer(!agreedToOffer);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                agreedToOffer &&
                  [styles.checkboxChecked, { backgroundColor: theme.primary }],
                { borderColor: agreedToOffer ? theme.primary : theme.border },
              ]}
            >
              {agreedToOffer && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', flex: 1 }}>
              <Text style={[styles.checkboxText, { color: theme.text }]}>Я согласен с </Text>
              <TouchableOpacity 
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/legal/terms' as any);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.checkboxLink, { color: theme.primary }]}>
                  оффертой
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.primary,
            },
            (loading ||
              !phoneNumber ||
              !agreedToAge ||
              !agreedToPersonalData ||
              !agreedToOffer) &&
              styles.buttonDisabled,
          ]}
          onPress={handleSendCode}
          disabled={
            loading ||
            !phoneNumber ||
            !agreedToAge ||
            !agreedToPersonalData ||
            !agreedToOffer
          }
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Отправить код</Text>
          )}
        </TouchableOpacity>

        {infoMessage ? (
          <Text style={[styles.infoText, { color: theme.warning }]}>
            {infoMessage}
          </Text>
        ) : null}
      </View>
    </>
  );

  const renderCodeStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => {
            setStep('phone');
            setCode('');
            setInfoMessage('');
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Введите код</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Код отправлен на {phone}
        </Text>
      </View>

      <View style={styles.form}>
        <View
          style={[
            styles.codeInputContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TextInput
            style={[styles.codeInput, { color: theme.text }]}
            placeholder="0000"
            value={code}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').substring(0, 4);
              setCode(digits);
              // Haptic feedback при вводе каждой цифры
              if (Platform.OS === 'ios' && digits.length > 0 && digits.length <= 4) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            keyboardType="number-pad"
            maxLength={4}
            textAlign="center"
            placeholderTextColor={theme.placeholder}
            autoFocus={Platform.OS === 'ios'}
            autoComplete="off"
            textContentType="none"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            (loading || code.length !== 4) && styles.buttonDisabled,
          ]}
          onPress={handleVerifyCode}
          disabled={loading || code.length !== 4}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Подтвердить</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={loading}
        >
          <Text style={[styles.resendText, { color: theme.primary }]}>
            Отправить код повторно
          </Text>
        </TouchableOpacity>

        {infoMessage ? (
          <Text style={[styles.infoText, { color: theme.warning }]}>
            {infoMessage}
          </Text>
        ) : null}
      </View>
    </>
  );

  const renderWelcomeStep = () => (
    <>
      <View style={styles.welcomeContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>360°</Text>
        </View>
        <Text style={[styles.welcomeTitle, { color: theme.text }]}>
          Добро пожаловать!
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
          Мы рады видеть вас в нашем сервисе.{'\n'}
          Теперь вы можете покупать и продавать автомобили,{'\n'}
          лошадей и недвижимость с удобством!
        </Text>
      </View>

      <View style={styles.form}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleContinueAfterWelcome}
        >
          <Text style={styles.buttonText}>Продолжить</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderNameStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => setStep('welcome')}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Как вас зовут?</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Укажите ваше имя для завершения регистрации
        </Text>
      </View>

      <View style={styles.form}>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={theme.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Введите ваше имя"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor={theme.placeholder}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            (loading || !name || name.trim().length < 2) && styles.buttonDisabled,
          ]}
          onPress={handleCompleteRegistration}
          disabled={loading || !name || name.trim().length < 2}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Завершить регистрацию</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const screenHeight = SCREEN_HEIGHT;
  const keyboardVerticalOffset = Platform.select({
    ios: 0,
    android: 20,
  }) || 0;

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: 'transparent' }]}
      edges={['top', 'bottom']}
    >
      <LinearGradient
        colors={theme.backgroundGradient}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
          enabled={Platform.OS === 'ios'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              { minHeight: screenHeight * 0.8 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={Platform.OS === 'ios'}
          >
            {step === 'phone' && renderPhoneStep()}
            {step === 'code' && renderCodeStep()}
            {step === 'welcome' && renderWelcomeStep()}
            {step === 'name' && renderNameStep()}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Platform.select({
      ios: 20,
      android: 16,
    }),
    paddingTop: Platform.select({
      ios: 20,
      android: 24,
    }),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FF3B30',
    textAlign: 'center',
  },
  slogan: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  phoneInputContainer: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  phoneInput: {
    paddingVertical: 16,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  codeInputContainer: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  codeInput: {
    paddingVertical: Platform.select({
      ios: 20,
      android: 18,
    }),
    fontSize: Platform.select({
      ios: 32,
      android: 28,
    }),
    fontWeight: '700',
    letterSpacing: Platform.select({
      ios: 8,
      android: 6,
    }),
  },
  checkboxesContainer: {
    marginBottom: 24,
    gap: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderWidth: 0,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  checkboxLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonHeader: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});
