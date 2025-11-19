// app/splash.tsx
// Splash Screen — Revolut Ultra Platinum Style
// "Infinity 360" Concept
// ФИНАЛЬНАЯ ВЕРСИЯ — НОЯБРЬ 2025

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const SPLASH_DURATION = 2500; // Чуть дольше, чтобы насладиться анимацией
const { width, height } = Dimensions.get('window');

// Конфигурация фоновых элементов "360"
const BACKGROUND_ELEMENTS = [
  { size: 120, x: -50, y: -100, opacity: 0.03, duration: 8000, delay: 0 },
  { size: 180, x: width - 100, y: height - 200, opacity: 0.04, duration: 12000, delay: 500 },
  { size: 90, x: 50, y: height / 2, opacity: 0.02, duration: 15000, delay: 1000 },
  { size: 200, x: -80, y: height - 100, opacity: 0.03, duration: 10000, delay: 200 },
  { size: 140, x: width / 2, y: -50, opacity: 0.02, duration: 18000, delay: 1500 },
  { size: 160, x: width - 50, y: 100, opacity: 0.03, duration: 14000, delay: 800 },
];

// Компонент фонового элемента
const BackgroundElement = ({ config }: { config: typeof BACKGROUND_ELEMENTS[0] }) => {
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Медленное вращение
    rotation.value = withRepeat(
      withTiming(360, {
        duration: config.duration * 2,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Медленное парение вверх-вниз
    translateY.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: config.duration, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: config.duration, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [config.duration, rotation, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { translateY: translateY.value }
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.backgroundElement,
        {
          left: config.x,
          top: config.y,
          opacity: config.opacity,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.backgroundText, { fontSize: config.size }]}>360°</Text>
    </Animated.View>
  );
};

export default function SplashScreen() {
  const router = useRouter();
  const hasNavigatedRef = useRef(false);
  
  // Анимация главного логотипа
  const mainLogoScale = useSharedValue(0.8);
  const mainLogoOpacity = useSharedValue(0);
  const mainLogoGlow = useSharedValue(0); // Для пульсации свечения

  useEffect(() => {
    // Появление логотипа
    mainLogoOpacity.value = withTiming(1, { duration: 800 });
    mainLogoScale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
    
    // Пульсация свечения через секунду
    mainLogoGlow.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(10, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      )
    );

    const timer = setTimeout(async () => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;

      try {
        // Анимация выхода
        mainLogoScale.value = withTiming(10, { duration: 500 }); // Улетает в экран
        mainLogoOpacity.value = withTiming(0, { duration: 300 });

        // Проверка онбординга
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        
        // Небольшая задержка для анимации выхода
        setTimeout(() => {
          if (onboardingCompleted === 'true') {
            router.replace('/(tabs)');
          } else {
            router.replace('/(onboarding)/welcome');
          }
        }, 300);
        
      } catch (error) {
        console.error('Splash navigation error:', error);
        router.replace('/(onboarding)/IntroCarousel');
      }
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, [mainLogoGlow, mainLogoOpacity, mainLogoScale, router]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mainLogoScale.value }],
    opacity: mainLogoOpacity.value,
    textShadowRadius: mainLogoGlow.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Фоновые плавающие элементы */}
      {BACKGROUND_ELEMENTS.map((config, index) => (
        <BackgroundElement key={index} config={config} />
      ))}

      {/* Центральный логотип */}
      <View style={styles.centerContainer}>
        <Animated.Text style={[styles.mainLogo, logoStyle]}>
          360°
        </Animated.Text>
        
        {/* Подпись "Ultra Marketplace" (опционально, для стиля) */}
        <Animated.Text 
          entering={FadeIn.delay(1000).duration(800)}
          style={styles.subtitle}
        >
          MARKETPLACE
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D', // Ultra Background
    overflow: 'hidden',
  },
  backgroundElement: {
    position: 'absolute',
    zIndex: 0,
  },
  backgroundText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
    fontWeight: '900',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mainLogo: {
    fontSize: Platform.select({ ios: 96, android: 88, default: 96 }),
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
    letterSpacing: -2,
    // Начальные тени (будут анимироваться)
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '700',
    color: '#808080', // Серый
    letterSpacing: 6, // Широкий трекинг как в премиум брендах
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  }
});
