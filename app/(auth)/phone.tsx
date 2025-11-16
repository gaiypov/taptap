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

          {/* Send button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!phoneNumber.trim() || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={!phoneNumber.trim() || loading}
            activeOpacity={0.8}
          >
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
    backgroundColor: '#000000',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instruction: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  button: {
    height: 56,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#3A3A3C',
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

