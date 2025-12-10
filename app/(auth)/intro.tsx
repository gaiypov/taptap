// app/(auth)/intro.tsx
// LANDING PAGE — REVOLUT ULTRA PLATINUM STYLE
// Simple landing that redirects to unified registration

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthIntroScreen() {
  const router = useRouter();

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
  }, [fadeAnim, slideAnim]);

  // Button pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1.0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [buttonScale]);

  const handleGetStarted = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(auth)/register');
  };

  const handleSkip = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Logo Section */}
          <View style={styles.headerSection}>
            <Text style={styles.logoText}>360°</Text>
            <View style={styles.sloganContainer}>
              <Text style={styles.sloganText}>
                Видео-лента самых важных объявлений.
              </Text>
              <Text style={styles.sloganText}>
                Находите, продавайте и решайте в своём ритме.
              </Text>
              <Text style={styles.sloganText}>
                Работает как TikTok — листайте, давайте сигнал, двигайтесь дальше.
              </Text>
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            {/* Primary CTA - Go to Registration */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Pressable
                style={styles.primaryButton}
                onPress={handleGetStarted}
              >
                <LinearGradient
                  colors={['#2C2C2C', '#1A1A1A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.primaryButtonText}>НАЧАТЬ</Text>
              </Pressable>
            </Animated.View>

            {/* Secondary - Skip to Browse */}
            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>
                Смотреть без регистрации
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 80,
    paddingBottom: 40,
  },

  // Header
  headerSection: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 100,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 40,
    letterSpacing: -3,
    textShadowColor: 'rgba(255, 255, 255, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  sloganContainer: {
    gap: 16,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  sloganText: {
    color: '#E0E0E0',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
    opacity: 0.9,
  },

  // Actions
  actionsSection: {
    gap: 20,
  },
  primaryButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#808080',
    fontSize: 15,
    fontWeight: '500',
  },
});
