// app/splash.tsx
// Splash Screen с логотипом 360° и анимацией вращения
// Отображается 2 секунды при первом запуске

import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ROTATION_DURATION = 2000; // 2 секунды на полный оборот
const SPLASH_DURATION = 2000; // 2 секунды показываем splash

export default function SplashScreen() {
  const router = useRouter();
  const rotation = useSharedValue(0);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // Анимация вращения 360°
    rotation.value = withRepeat(
      withTiming(360, {
        duration: ROTATION_DURATION,
        easing: Easing.linear,
      }),
      -1, // бесконечное повторение
      false
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;

      try {
        // Проверяем, был ли онбординг
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        
        if (onboardingCompleted === 'true') {
          // Если онбординг пройден, идем на главную
          router.replace('/(tabs)');
        } else {
          // Если не пройден, идем на онбординг
          router.replace('/(onboarding)/IntroCarousel');
        }
      } catch (error) {
        console.error('Splash navigation error:', error);
        // Fallback на онбординг при ошибке
        router.replace('/(onboarding)/IntroCarousel');
      }
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image
          source={require('@/assets/logos/360-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

