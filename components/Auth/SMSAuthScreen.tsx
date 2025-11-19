// components/Auth/SMSAuthScreen.tsx
// Revolut Ultra Platinum 2025-2026 - Экран регистрации

import { ultra } from '@/lib/theme/ultra';
import { auth } from '@/services/auth';
import { SCREEN_HEIGHT } from '@/utils/constants';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

// Компонент чекбокса с анимацией scale
const CheckboxWithAnimation: React.FC<{
  checked: boolean;
  onPress: () => void;
  text: string;
  linkText?: string;
  onLinkPress?: () => void;
}> = ({ checked, onPress, text, linkText, onLinkPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable style={styles.checkboxRow} onPress={handlePress}>
      <Animated.View
        style={[
          styles.checkbox,
          checked && styles.checkboxChecked,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={Platform.select({ ios: 16, android: 15, default: 16 })} color={ultra.textPrimary} />}
      </Animated.View>
      {linkText ? (
        <View style={styles.checkboxTextContainer}>
          <Text style={styles.checkboxText}>{text}</Text>
          <Pressable onPress={onLinkPress}>
            <Text style={styles.checkboxLink}>{linkText}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.checkboxText}>{text}</Text>
      )}
    </Pressable>
  );
};

type Step = 'phone' | 'code' | 'welcome' | 'name';

export function SMSAuthScreen({ onAuthSuccess }: SMSAuthScreenProps) {
  const router = useRouter();
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
        
        // В development показываем testCode для удобства тестирования
        if (__DEV__ && result.testCode) {
          setCode(result.testCode); // Автоматически заполняем код
          setInfoMessage(`Код отправлен! (Dev: ${result.testCode})`);
          Alert.alert('Код отправлен', `В development режиме код: ${result.testCode}`);
        } else {
          setInfoMessage(result.warning || 'Код отправлен на ваш номер телефона');
          Alert.alert('Код отправлен', 'Проверьте SMS на вашем телефоне и введите 4-значный код');
        }
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
        
        // Проверяем, есть ли имя у пользователя
        const user = result.user;
        const hasName = user?.name && user.name.trim().length > 0 && user.name !== 'Пользователь';
        
        if (hasName) {
          // Пользователь уже зарегистрирован - сразу вызываем onAuthSuccess
          if (onAuthSuccess) {
            onAuthSuccess();
          } else {
            router.replace('/(tabs)');
          }
        } else {
          // Новый пользователь - переходим на экран приветствия
          setStep('welcome');
        }
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

  // Анимации для Revolut Ultra Platinum стиля
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateY = useRef(new Animated.Value(50)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const checkbox1Opacity = useRef(new Animated.Value(0)).current;
  const checkbox2Opacity = useRef(new Animated.Value(0)).current;
  const checkbox3Opacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;
  const [isFocused, setIsFocused] = useState(false);

  // Анимация появления логотипа и текста
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Текст появляется с задержкой
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 1200,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Поле ввода выдвигается снизу
    Animated.parallel([
      Animated.timing(inputTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Чекбоксы появляются по очереди
    Animated.sequence([
      Animated.timing(checkbox1Opacity, {
        toValue: 1,
        duration: 400,
        delay: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(checkbox2Opacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(checkbox3Opacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Пульсирующая анимация кнопки когда все чекбоксы отмечены
  useEffect(() => {
    if (agreedToAge && agreedToPersonalData && agreedToOffer && phoneNumber) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonPulse, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(buttonPulse, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      buttonPulse.setValue(1);
    }
  }, [agreedToAge, agreedToPersonalData, agreedToOffer, phoneNumber]);

  const renderPhoneStep = () => (
    <>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.logoText}>360°</Text>
        </Animated.View>
        <Animated.View style={{ opacity: textOpacity }}>
          <View style={styles.textBlock}>
            <Text style={styles.textLine}>
              Видео-лента самых важных объявлений.
            </Text>
            <Text style={styles.textLine}>
              Находите, продавайте и решайте в своём ритме.
            </Text>
            <Text style={styles.textLine}>
              Работает как TikTok — листайте, давайте сигнал, двигайтесь дальше.
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.form}>
        <Animated.View
          style={[
            styles.inputRow,
            {
              opacity: inputOpacity,
              transform: [{ translateY: inputTranslateY }],
            },
          ]}
        >
          <CountryCodeSelector
            selectedCountry={selectedCountry}
            onSelect={setSelectedCountry}
          />
          <Animated.View
            style={[
              styles.phoneInputContainer,
              isFocused && styles.phoneInputContainerFocused,
            ]}
          >
            <TextInput
              style={styles.phoneInput}
              placeholder={selectedCountry.code === 'KG' 
                ? '555 123 456' 
                : selectedCountry.code === 'KZ' || selectedCountry.code === 'RU'
                ? '700 123 4567'
                : 'XX XXX XXXX'}
              value={phoneNumber}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '');
                setPhoneNumber(digits);
                if (Platform.OS === 'ios' && digits.length > 0) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              onFocus={() => {
                setIsFocused(true);
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              onBlur={() => setIsFocused(false)}
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholderTextColor={ultra.textMuted}
              editable={!loading}
              maxLength={selectedCountry.code === 'KG' ? 9 : selectedCountry.code === 'KZ' || selectedCountry.code === 'RU' ? 10 : 9}
            />
          </Animated.View>
        </Animated.View>

        {/* Галочки - Revolut Ultra Platinum с анимациями */}
        <View style={styles.checkboxesContainer}>
          <Animated.View style={{ opacity: checkbox1Opacity }}>
            <CheckboxWithAnimation
              checked={agreedToAge}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setAgreedToAge(!agreedToAge);
              }}
              text="Мне есть 18 лет"
            />
          </Animated.View>

          <Animated.View style={{ opacity: checkbox2Opacity }}>
            <CheckboxWithAnimation
              checked={agreedToPersonalData}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setAgreedToPersonalData(!agreedToPersonalData);
              }}
              text="Я согласен на "
              linkText="обработку персональных данных"
              onLinkPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/legal/privacy' as any);
              }}
            />
          </Animated.View>

          <Animated.View style={{ opacity: checkbox3Opacity }}>
            <CheckboxWithAnimation
              checked={agreedToOffer}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setAgreedToOffer(!agreedToOffer);
              }}
              text="Я согласен с "
              linkText="офертой"
              onLinkPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/legal/terms' as any);
              }}
            />
          </Animated.View>
        </View>

        {/* Кнопка "Отправить код" - градиент Revolut Ultra Platinum с пульсацией */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ scale: buttonPulse }],
            },
          ]}
        >
          <Pressable
            style={[
              styles.button,
              (loading ||
                !phoneNumber ||
                !agreedToAge ||
                !agreedToPersonalData ||
                !agreedToOffer) &&
                styles.buttonDisabled,
            ]}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              // Анимация нажатия
              Animated.sequence([
                Animated.timing(buttonScale, {
                  toValue: 0.95,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(buttonScale, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start();
              handleSendCode();
            }}
            disabled={
              loading ||
              !phoneNumber ||
              !agreedToAge ||
              !agreedToPersonalData ||
              !agreedToOffer
            }
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ scale: buttonScale }] },
              ]}
            >
              <LinearGradient
                colors={[ultra.gradientStart, ultra.gradientEnd]} // #2C2C2C → #1A1A1A
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {loading ? (
              <ActivityIndicator color={ultra.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>Отправить код</Text>
            )}
          </Pressable>
        </Animated.View>

        {infoMessage ? (
          <Text style={styles.infoText}>
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
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22, default: 24 })} color={ultra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.codeTitle}>Введите код</Text>
        <Text style={styles.codeSubtitle}>
          Код отправлен на {phone}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
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
            placeholderTextColor={ultra.textMuted}
            autoFocus={Platform.OS === 'ios'}
            autoComplete="off"
            textContentType="none"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || code.length !== 4) && styles.buttonDisabled,
          ]}
          onPress={handleVerifyCode}
          disabled={loading || code.length !== 4}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ultra.gradientStart, ultra.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {loading ? (
            <ActivityIndicator color={ultra.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>Подтвердить</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={loading}
        >
          <Text style={styles.resendText}>
            Отправить код повторно
          </Text>
        </TouchableOpacity>

        {infoMessage ? (
          <Text style={styles.infoText}>
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
        <Text style={styles.welcomeTitle}>
          Добро пожаловать!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Мы рады видеть вас в нашем сервисе.{'\n'}
          Теперь вы можете покупать и продавать автомобили,{'\n'}
          лошадей и недвижимость с удобством!
        </Text>
      </View>

      <View style={styles.form}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinueAfterWelcome}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ultra.gradientStart, ultra.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22, default: 24 })} color={ultra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.codeTitle}>Как вас зовут?</Text>
        <Text style={styles.codeSubtitle}>
          Укажите ваше имя для завершения регистрации
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={Platform.select({ ios: 24, android: 22, default: 24 })}
            color={ultra.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Введите ваше имя"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor={ultra.textMuted}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || !name || name.trim().length < 2) && styles.buttonDisabled,
          ]}
          onPress={handleCompleteRegistration}
          disabled={loading || !name || name.trim().length < 2}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ultra.gradientStart, ultra.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {loading ? (
            <ActivityIndicator color={ultra.textPrimary} />
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
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <View style={styles.container}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background, // #0D0D0D
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Platform.select({
      ios: 24,
      android: 20,
    }),
    paddingTop: Platform.select({
      ios: 60,
      android: 50,
    }),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 48, android: 40, default: 48 }),
  },
  logoContainer: {
    marginBottom: Platform.select({ ios: 24, android: 20, default: 24 }),
  },
  logoText: {
    fontSize: Platform.select({ ios: 72, android: 68, default: 72 }), // Большой белый логотип
    fontWeight: '900',
    color: ultra.textPrimary, // #FFFFFF белый
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
    // Лёгкое свечение для логотипа
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  textBlock: {
    marginBottom: Platform.select({ ios: 48, android: 40, default: 48 }),
    alignItems: 'center',
  },
  textLine: {
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontWeight: '800',
    color: ultra.accentSecondary, // #E0E0E0 серебряный, жирный
    textAlign: 'center',
    marginBottom: Platform.select({ ios: 12, android: 10, default: 12 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
    textShadowColor: 'rgba(224, 224, 224, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: Platform.select({ ios: 10, android: 8, default: 10 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  form: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: Platform.select({ ios: 32, android: 28, default: 32 }),
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  phoneInputContainer: {
    flex: 1,
    height: 64, // Высота 64px
    borderRadius: 28, // Скругление 28px
    borderWidth: 1,
    borderColor: ultra.border, // #2A2A2A
    backgroundColor: ultra.card, // #171717 матовая
    paddingHorizontal: Platform.select({ ios: 20, android: 18, default: 20 }),
    justifyContent: 'center',
    // Никаких теней (TikTok стиль)
  },
  phoneInputContainerFocused: {
    borderColor: ultra.accent, // #C0C0C0 серебро при фокусе
  },
  phoneInput: {
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
    height: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Platform.select({ ios: 24, android: 22, default: 24 }),
    borderWidth: 1,
    borderColor: ultra.border, // #2A2A2A
    backgroundColor: ultra.card, // #171717 матовая
    marginBottom: Platform.select({ ios: 24, android: 20, default: 24 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 18, default: 20 }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputIcon: {
    marginRight: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  input: {
    flex: 1,
    paddingVertical: Platform.select({ ios: 18, android: 16, default: 18 }),
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  codeInputContainer: {
    borderRadius: Platform.select({ ios: 24, android: 22, default: 24 }),
    borderWidth: 1,
    borderColor: ultra.border, // #2A2A2A
    backgroundColor: ultra.card, // #171717 матовая
    marginBottom: Platform.select({ ios: 32, android: 28, default: 32 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 18, default: 20 }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  codeInput: {
    paddingVertical: Platform.select({
      ios: 20,
      android: 18,
    }),
    fontSize: Platform.select({
      ios: 36,
      android: 32,
    }),
    fontWeight: '900',
    letterSpacing: Platform.select({
      ios: 8,
      android: 6,
    }),
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
  codeTitle: {
    fontSize: Platform.select({ ios: 28, android: 26, default: 28 }),
    fontWeight: '800',
    color: ultra.textPrimary,
    marginBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  codeSubtitle: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    color: ultra.textSecondary,
    textAlign: 'center',
    lineHeight: Platform.select({ ios: 22, android: 20, default: 22 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  checkboxesContainer: {
    marginBottom: Platform.select({ ios: 32, android: 28, default: 32 }),
    gap: Platform.select({ ios: 20, android: 18, default: 20 }),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: Platform.select({ ios: 24, android: 22, default: 24 }),
    height: Platform.select({ ios: 24, android: 22, default: 24 }),
    borderWidth: 2,
    borderRadius: Platform.select({ ios: 6, android: 5, default: 6 }),
    marginRight: Platform.select({ ios: 12, android: 10, default: 12 }),
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: ultra.accent, // #C0C0C0 серебряная обводка
    backgroundColor: ultra.card, // #171717
  },
  checkboxChecked: {
    borderWidth: 0,
    backgroundColor: ultra.accent, // #C0C0C0 серебро
  },
  checkboxText: {
    flex: 1,
    fontSize: Platform.select({ ios: 15, android: 14, default: 15 }),
    lineHeight: Platform.select({ ios: 22, android: 20, default: 22 }),
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  checkboxTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  checkboxLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    color: ultra.accent, // #C0C0C0 серебро
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  buttonContainer: {
    marginBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
  },
  button: {
    height: 64, // Высота 64px
    borderRadius: 32, // Скругление 32px
    paddingHorizontal: Platform.select({ ios: 24, android: 20, default: 24 }),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333', // Тонкая обводка
    overflow: 'hidden',
    // Никаких теней (TikTok стиль)
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: ultra.textPrimary, // #FFFFFF белый
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  infoText: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    textAlign: 'center',
    marginTop: Platform.select({ ios: 8, android: 6, default: 8 }),
    color: ultra.accent, // #C0C0C0 серебро
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
  },
  resendText: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    fontWeight: '600',
    color: ultra.accent, // #C0C0C0 серебро
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  backButtonHeader: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Platform.select({ ios: 8, android: 6, default: 8 }),
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 60, android: 50, default: 60 }),
  },
  welcomeTitle: {
    fontSize: Platform.select({ ios: 32, android: 30, default: 32 }),
    fontWeight: '800',
    marginBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    textAlign: 'center',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  welcomeSubtitle: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    textAlign: 'center',
    lineHeight: Platform.select({ ios: 24, android: 22, default: 24 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
});
