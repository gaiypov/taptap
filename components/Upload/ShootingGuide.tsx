// components/Upload/ShootingGuide.tsx
// Компактный визуальный гайд съемки - показывается ДО начала записи

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 667;

interface ShootingGuideProps {
  category: 'car' | 'horse' | 'real_estate';
  visible: boolean;
}

interface GuideStep {
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  label: string;
  duration: string;
}

const GUIDE_STEPS: Record<'car' | 'horse' | 'real_estate', GuideStep[]> = {
  car: [
    { icon: 'car-sport-outline', emoji: '🚗', label: 'Спереди', duration: '0:20' },
    { icon: 'car-sport-outline', emoji: '🚗', label: 'Сзади', duration: '0:20' },
    { icon: 'car-outline', emoji: '🚪', label: 'Салон', duration: '0:40' },
    { icon: 'volume-high-outline', emoji: '🔊', label: 'Двигатель', duration: '0:20' },
  ],
  horse: [
    { icon: 'body-outline', emoji: '🐴', label: 'Стойка', duration: '0:20' },
    { icon: 'walk-outline', emoji: '🏃', label: 'Движение', duration: '0:40' },
    { icon: 'eye-outline', emoji: '👀', label: 'Крупно', duration: '0:20' },
    { icon: 'fitness-outline', emoji: '🦵', label: 'Ноги', duration: '0:20' },
  ],
  real_estate: [
    { icon: 'walk-outline', emoji: '🚶', label: 'Обход', duration: '0:40' },
    { icon: 'sunny-outline', emoji: '🪟', label: 'Вид', duration: '0:20' },
    { icon: 'bed-outline', emoji: '🛋️', label: 'Ремонт', duration: '0:30' },
    { icon: 'home-outline', emoji: '🏡', label: 'Двор', duration: '0:20' },
  ],
};

export default function ShootingGuide({ category, visible }: ShootingGuideProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const steps = GUIDE_STEPS[category];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 30 : 0}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="list-outline" size={16} color={ultra.accentSecondary} />
          </View>
          <Text style={styles.headerText}>Что снимать:</Text>
        </View>

        {/* Steps Grid */}
        <View style={styles.stepsGrid}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              {/* Icon Container */}
              <View style={styles.stepIconContainer}>
                <BlurView
                  intensity={Platform.OS === 'ios' ? 20 : 0}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
              </View>

              {/* Label */}
              <Text style={styles.stepLabel}>{step.label}</Text>

              {/* Duration */}
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={10} color={ultra.textSecondary} />
                <Text style={styles.durationText}>{step.duration}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Hint */}
        <View style={styles.hint}>
          <Ionicons name="bulb-outline" size={12} color={ultra.accentSecondary} />
          <Text style={styles.hintText}>Держите телефон вертикально</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: IS_SMALL_SCREEN ? 140 : (Platform.OS === 'ios' ? 160 : 150),
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(23, 23, 23, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  content: {
    padding: IS_SMALL_SCREEN ? 10 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  headerIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  stepsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepIconContainer: {
    width: IS_SMALL_SCREEN ? 48 : 56,
    height: IS_SMALL_SCREEN ? 48 : 56,
    borderRadius: IS_SMALL_SCREEN ? 24 : 28,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepEmoji: {
    fontSize: IS_SMALL_SCREEN ? 22 : 26,
  },
  stepNumber: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ultra.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 9,
    fontWeight: '900',
    color: ultra.background,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ultra.textPrimary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: ultra.textSecondary,
    fontFamily: 'monospace',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hintText: {
    fontSize: 11,
    fontWeight: '600',
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
});
