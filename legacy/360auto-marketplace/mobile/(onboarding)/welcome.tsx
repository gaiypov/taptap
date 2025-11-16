import { useTranslation } from '@/lib/i18n/useTranslation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, isLoading } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    checkOnboardingComplete();
  }, []);

  const checkOnboardingComplete = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      if (completed === 'true') {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    }
  };

  const slides = [
    {
      emoji: '🎥',
      titleKey: 'onboarding.welcome.title',
      subtitleKey: 'onboarding.welcome.subtitle',
    },
    {
      emoji: '🤖',
      titleKey: 'AI проверяет качество',
      subtitleKey: 'Искусственный интеллект оценит ваше видео',
    },
    {
      emoji: '💰',
      titleKey: 'Продавайте быстро',
      subtitleKey: 'Тысячи покупателей увидят за минуты',
    },
  ];

  const handleContinue = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/(onboarding)/permissions');
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/');
    } catch (error) {
      console.error('Error setting onboarding complete:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  const slide = slides[currentSlide];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Skip button */}
      <Pressable onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>{t('onboarding.welcome.skip')} →</Text>
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        {/* Emoji */}
        <Text style={styles.emoji}>{slide.emoji}</Text>

        {/* Title */}
        <Text style={styles.title}>
          {currentSlide === 0 ? t(slide.titleKey) : slide.titleKey}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {currentSlide === 0 ? t(slide.subtitleKey) : slide.subtitleKey}
        </Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1
              ? t('onboarding.welcome.button')
              : t('common.continue')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 120,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: width - 80,
  },
  bottom: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: '#FF3B30',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#3A3A3C',
  },
  button: {
    height: 56,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

