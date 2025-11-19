// app/(auth)/phone.tsx
// Экран ввода номера телефона с выбором страны

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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
import { CountryCodeSelector, COUNTRIES, type Country } from '@/components/Auth/CountryCodeSelector';
import { auth } from '@/services/auth';
import { ultra } from '@/lib/theme/ultra';
import { LinearGradient } from 'expo-linear-gradient';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // КГ по умолчанию
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const phone = formatPhone(selectedCountry, phoneNumber);
    
    // Валидация
    if (!phoneNumber.trim()) {
      Alert.alert('Ошибка', 'Введите номер телефона');
      return;
    }

    if (phone.length < 10) {
      Alert.alert('Ошибка', 'Некорректный номер телефона');
      return;
    }

    setLoading(true);

    try {
      const result = await auth.sendVerificationCode(phone);

      if (result.success) {
        // Сохраняем номер телефона для следующего экрана
        // Можно использовать AsyncStorage или передать через параметры
        router.push({
          pathname: '/(auth)/verify',
          params: { phone },
        });
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось отправить код');
      }
    } catch (error) {
      console.error('Send code error:', error);
      Alert.alert('Ошибка', 'Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

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
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Вход по телефону</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          {/* Instructions */}
          <Text style={styles.instruction}>
            Введите номер телефона, и мы отправим вам код подтверждения
          </Text>

          {/* Phone input */}
          <View style={styles.inputContainer}>
            <CountryCodeSelector
              selectedCountry={selectedCountry}
              onSelect={setSelectedCountry}
            />
            <TextInput
              style={styles.phoneInput}
              placeholder="Номер телефона"
              placeholderTextColor="#8E8E93"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoFocus
              editable={!loading}
            />
          </View>

          {/* Send button — градиент металлик Revolut Ultra */}
          <TouchableOpacity
            style={[
              styles.button,
              (!phoneNumber.trim() || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={!phoneNumber.trim() || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[ultra.gradientStart, ultra.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {loading ? (
              <Text style={styles.buttonText}>Отправка...</Text>
            ) : (
              <Text style={styles.buttonText}>Отправить код</Text>
            )}
          </TouchableOpacity>
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
    marginBottom: Platform.select({ ios: 32, android: 28, default: 32 }),
    lineHeight: Platform.select({ ios: 22, android: 21, default: 22 }),
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  phoneInput: {
    flex: 1,
    height: Platform.select({ ios: 56, android: 52, default: 56 }),
    backgroundColor: ultra.card,
    borderRadius: Platform.select({ ios: 12, android: 10, default: 12 }),
    paddingHorizontal: Platform.select({ ios: 16, android: 14, default: 16 }),
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    borderWidth: 1,
    borderColor: ultra.border,
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
  buttonText: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  },
});

