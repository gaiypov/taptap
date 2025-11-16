// app/(onboarding)/IntroCarousel.tsx
// Три слайда онбординга с анимацией

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Как работает 360°',
    description: 'Короткие видео-объявления в один тап',
    emoji: '🎥',
    illustration: 'video-circle', // Можно заменить на изображение
  },
  {
    id: 2,
    title: 'Для покупателей',
    description: 'Листай видео, ставь лайки, свяжись с продавцом',
    emoji: '👆',
    illustration: 'thumbs-up',
  },
  {
    id: 3,
    title: 'Для продавцов',
    description: 'Сними видео → AI анализирует → публикуется автоматически',
    emoji: '🤖',
    illustration: 'sparkles',
  },
];

export default function IntroCarousel() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextIndex = currentSlide + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentSlide(nextIndex);
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      handleStart();
    }
  };

  const handleStart = async () => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding:', error);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Пропустить</Text>
      </TouchableOpacity>

      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.content}>
              {/* Emoji/Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.emoji}>{slide.emoji}</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{slide.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={currentSlide === slides.length - 1 ? handleStart : handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? 'Начать просмотр' : 'Далее'}
          </Text>
          {currentSlide < slides.length - 1 && (
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.buttonIcon} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 48,
  },
  emoji: {
    fontSize: 120,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
    paddingTop: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A3C',
  },
  dotActive: {
    width: 32,
    backgroundColor: '#FF3B30',
  },
  button: {
    height: 56,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

