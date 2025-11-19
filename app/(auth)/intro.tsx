// app/(auth)/intro.tsx
// РЕГИСТРАЦИЯ — REVOLUT ULTRA PLATINUM STYLE (ФИНАЛ НОЯБРЬ 2025)
// Идеальная симметрия • Matte Black • Silver Accents

import { CountryCodeSelector, COUNTRIES, type Country } from '@/components/Auth/CountryCodeSelector';
import { ultra } from '@/lib/theme/ultra';
import { auth } from '@/services/auth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthIntroScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  
  // State
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Checkboxes
  const [agreedToAge, setAgreedToAge] = useState(false);
  const [agreedToPersonalData, setAgreedToPersonalData] = useState(false);
  const [agreedToOffer, setAgreedToOffer] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Button Pulse Animation when ready
  useEffect(() => {
    if (phoneNumber.length > 8 && agreedToAge && agreedToPersonalData && agreedToOffer) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
          Animated.timing(buttonScale, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      buttonScale.setValue(1);
    }
  }, [phoneNumber, agreedToAge, agreedToPersonalData, agreedToOffer]);

  const formatPhone = (country: Country, digits: string) => {
    // Simple formatter logic
    const clean = digits.replace(/\D/g, '');
    if (country.code === 'KG' && !clean.startsWith('996')) return `+996${clean}`;
    return `${country.dialCode}${clean}`;
  };

  const handleSendCode = async () => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!phoneNumber || phoneNumber.length < 9) {
        Alert.alert('Ошибка', 'Введите корректный номер телефона');
        return;
    }
    if (!agreedToAge || !agreedToPersonalData || !agreedToOffer) {
        Alert.alert('Внимание', 'Необходимо принять все условия');
        return;
    }

    try {
      setLoading(true);
      const fullPhone = formatPhone(selectedCountry, phoneNumber);
      const result = await auth.sendVerificationCode(fullPhone);
      
      if (result.success) {
        router.push({ pathname: '/(auth)/verify', params: { phone: fullPhone } });
      } else {
        Alert.alert('Ошибка', result.error || 'Сбой отправки SMS');
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            {/* 1. LOGO SECTION */}
            <View style={styles.headerSection}>
              <Text style={styles.logoText}>360°</Text>
              <View style={styles.sloganContainer}>
                <Text style={styles.sloganText}>Видео-лента самых важных объявлений.</Text>
                <Text style={styles.sloganText}>Находите, продавайте и решайте в своём ритме.</Text>
                <Text style={styles.sloganText}>Работает как TikTok — листайте, давайте сигнал, двигайтесь дальше.</Text>
              </View>
            </View>

            {/* 2. INPUT SECTION */}
            <View style={styles.formSection}>
              <View style={styles.phoneRow}>
                {/* Country Selector */}
                <View style={styles.countryWrapper}>
                  <CountryCodeSelector 
                    selectedCountry={selectedCountry} 
                    onSelect={setSelectedCountry} 
                  />
                </View>
                
                {/* Phone Input */}
                <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="555 000 000"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                </View>
              </View>

              {/* 3. CHECKBOXES */}
              <View style={styles.checkboxGroup}>
                <CheckboxRow 
                  checked={agreedToAge} 
                  onPress={() => setAgreedToAge(!agreedToAge)}
                  text="Мне есть 18 лет"
                />
                <CheckboxRow 
                  checked={agreedToPersonalData} 
                  onPress={() => setAgreedToPersonalData(!agreedToPersonalData)}
                  text="Я согласен на обработку данных"
                  isLink
                  onLink={() => router.push('/legal/privacy' as any)}
                />
                <CheckboxRow 
                  checked={agreedToOffer} 
                  onPress={() => setAgreedToOffer(!agreedToOffer)}
                  text="Я согласен с офертой"
                  isLink
                  onLink={() => router.push('/legal/terms' as any)}
                />
              </View>

              {/* 4. ACTION BUTTON */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <Pressable 
                  style={[
                    styles.mainButton, 
                    (!phoneNumber || !agreedToAge || !agreedToPersonalData || !agreedToOffer) && styles.buttonDisabled
                  ]}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                   <LinearGradient
                    colors={['#2C2C2C', '#1A1A1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.buttonText}>
                    {loading ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ КОД'}
                  </Text>
                </Pressable>
              </Animated.View>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- COMPONENTS ---

const CheckboxRow = ({ checked, onPress, text, isLink, onLink }: any) => (
  <Pressable style={styles.checkboxRow} onPress={onPress}>
    <View style={[styles.checkboxBase, checked && styles.checkboxActive]}>
      {checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
    </View>
    <Text style={styles.checkboxLabel}>
      {text}
    </Text>
  </Pressable>
);

// --- STYLES ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  
  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 32,
    letterSpacing: -2,
    textShadowColor: 'rgba(255, 255, 255, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  sloganContainer: {
    gap: 12,
    alignItems: 'center',
  },
  sloganText: {
    color: '#E0E0E0',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
    opacity: 0.9,
  },

  // Form
  formSection: {
    gap: 32,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
    height: 64,
  },
  countryWrapper: {
    width: 80,
    height: '100%',
    backgroundColor: '#171717',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    backgroundColor: '#171717',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  inputFocused: {
    borderColor: '#C0C0C0', // Silver focus
  },
  phoneInput: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    height: '100%',
  },

  // Checkboxes
  checkboxGroup: {
    gap: 16,
    paddingHorizontal: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#404040',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#C0C0C0',
    backgroundColor: '#C0C0C0',
  },
  checkboxLabel: {
    color: '#B8B8B8',
    fontSize: 15,
    fontWeight: '500',
  },

  // Button
  mainButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
