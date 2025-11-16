// app/(auth)/intro.tsx
// Экран входа с логотипом и кнопкой авторизации через телефон

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

export default function AuthIntroScreen() {
  const router = useRouter();

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(auth)/phone');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://example.com/terms'); // Замените на реальный URL
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://example.com/privacy'); // Замените на реальный URL
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/logos/360-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Slogan */}
        <Text style={styles.slogan}>
          Лучший сервис для покупки и продажи 360°
        </Text>

        {/* Continue button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Ionicons name="call-outline" size={24} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Продолжить по номеру телефона</Text>
        </TouchableOpacity>
      </View>

      {/* Legal links */}
      <View style={styles.legalContainer}>
        <TouchableOpacity onPress={handleOpenTerms} style={styles.legalLink}>
          <Text style={styles.legalText}>Пользовательское соглашение</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}> • </Text>
        <TouchableOpacity onPress={handleOpenPrivacy} style={styles.legalLink}>
          <Text style={styles.legalText}>Политика конфиденциальности</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}> • </Text>
        <Text style={styles.ageText}>18+</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 150,
    height: 150,
    marginBottom: 48,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  slogan: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  legalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    paddingHorizontal: 24,
    flexWrap: 'wrap',
  },
  legalLink: {
    paddingVertical: 8,
  },
  legalText: {
    color: '#8E8E93',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: '#8E8E93',
    fontSize: 12,
  },
  ageText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
});

