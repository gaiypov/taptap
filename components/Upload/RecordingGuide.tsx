// components/Upload/RecordingGuide.tsx
// REVOLUT ULTRA STYLE — RECORDING GUIDE (ULTIMATE EDITION)
// Specific guides for Cars, Horses, Real Estate

import { CategoryType, UPLOAD_TEXTS } from '@/config/uploadTexts';
import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface RecordingGuideProps {
  category: CategoryType;
  onStart: () => void;
  onBack: () => void;
}

interface VideoExample {
  emoji: string;
  label: string;
  duration: string;
}

// Специфичные примеры для каждой категории
const VIDEO_EXAMPLES: Record<CategoryType, VideoExample[]> = {
  auto: [
    { emoji: '🌪️', label: '360° обзор', duration: '1:20' },
    { emoji: '🚗', label: 'Салон', duration: '0:45' },
    { emoji: '🔊', label: 'Двигатель', duration: '0:30' },
  ],
  horse: [
    { emoji: '🐎', label: 'Экстерьер (стойка)', duration: '0:30' },
    { emoji: '🏃', label: 'Движения (рысь)', duration: '0:45' },
    { emoji: '🐴', label: 'Крупный план', duration: '0:20' },
  ],
  real_estate: [
    { emoji: '🚶', label: 'Walkthrough тур', duration: '1:30' },
    { emoji: '☀️', label: 'Вид из окон', duration: '0:20' },
    { emoji: '🛁', label: 'Ванная и кухня', duration: '0:40' },
  ],
};

// Специфичные ошибки
const MISTAKES: Record<CategoryType, string[]> = {
  auto: [
    'Грязная машина — теряете 30% цены',
    'Съемка ночью или в тени',
    'Вертикальное видео (лучше вертикально, но стабилизируйте!)',
  ],
  horse: [
    'Съемка против солнца (силуэт)',
    'Лошадь грязная или неухоженная',
    'Слишком далеко — не видно деталей',
  ],
  real_estate: [
    'Слишком быстрые повороты камерой',
    'Закрытые шторы (темно)',
    'Беспорядок в комнатах',
  ],
};

export default function RecordingGuide({ category, onStart, onBack }: RecordingGuideProps) {
  const normalizedCategory = (category as string) === 'car' ? 'auto' : category;
  const config = UPLOAD_TEXTS[normalizedCategory as CategoryType];
  const examples = VIDEO_EXAMPLES[normalizedCategory as CategoryType] || VIDEO_EXAMPLES.auto;
  const mistakes = MISTAKES[normalizedCategory as CategoryType] || MISTAKES.auto;
  const scrollY = useRef(new Animated.Value(0)).current;

  if (!config || !config.tips) return null;

  const getCategoryTitle = () => {
    switch (normalizedCategory) {
      case 'auto': return 'Как снимать авто';
      case 'horse': return 'Как снимать лошадей';
      case 'real_estate': return 'Как снимать недвижимость';
      default: return 'Как снимать';
    }
  };

  const getCategoryIcon = () => {
    switch (normalizedCategory) {
      case 'auto': return 'car-sport';
      case 'horse': return 'paw';
      case 'real_estate': return 'home';
      default: return 'videocam';
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Header — Revolut Ultra Style */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity 
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.selectionAsync();
            onBack();
          }} 
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={ultra.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{getCategoryTitle()}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Tip — Revolut Ultra Gradient */}
        <View style={styles.heroTip}>
          <LinearGradient
            colors={[ultra.gradientStart, ultra.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name={getCategoryIcon() as any} size={40} color={ultra.accentSecondary} />
            </View>
            <Text style={styles.heroTipText}>
              {normalizedCategory === 'auto' ? 'Чистый авто продается на 20% дороже. Помойте машину перед съемкой!' : 
               normalizedCategory === 'horse' ? 'Покажите лошадь в движении на ровной площадке. Покупатели хотят видеть аллюры.' :
               'Откройте все шторы и включите свет. Светлые квартиры выглядят просторнее.'}
            </Text>
          </LinearGradient>
        </View>

        {/* Checklist Section — Revolut Ultra Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={22} color={ultra.accent} />
            <Text style={styles.sectionTitle}>Чек-лист съемки:</Text>
          </View>
          
          <View style={styles.cardContainer}>
            <View style={styles.checklistVerticalLine} />
            {config.tips.map((tip, index) => {
              const emojiMatch = tip.match(/^([^\s]+)\s/);
              const emoji = emojiMatch ? emojiMatch[1] : '✓';
              const textContent = tip.substring(tip.indexOf(' ') + 1);
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.checklistItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS === 'ios') Haptics.selectionAsync();
                  }}
                >
                  <View style={styles.checklistIconContainer}>
                    <Text style={styles.checklistEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.checklistContent}>
                    <Text style={styles.checklistText}>{textContent}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Examples Section — Revolut Ultra Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle" size={22} color={ultra.accent} />
            <Text style={styles.sectionTitle}>Примеры хороших видео:</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examplesScroll}
          >
            {examples.map((example, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.exampleCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={styles.examplePreview}>
                  <Text style={styles.exampleEmoji}>{example.emoji}</Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{example.duration}</Text>
                  </View>
                </View>
                <Text style={styles.exampleLabel}>{example.label}</Text>
                <TouchableOpacity 
                  style={styles.watchButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS === 'ios') Haptics.selectionAsync();
                  }}
                >
                  <Ionicons name="play" size={16} color={ultra.accent} />
                  <Text style={styles.watchButtonText}>Смотреть</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Mistakes Section — Revolut Ultra Style (без красного!) */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="close-circle" size={22} color={ultra.textSecondary} />
            <Text style={styles.sectionTitle}>Частые ошибки:</Text>
          </View>
          
          <View style={styles.mistakesCardContainer}>
            <View style={styles.mistakesVerticalLine} />
            {mistakes.map((mistake, index) => (
              <View key={index} style={styles.mistakeItem}>
                <View style={styles.mistakeIconContainer}>
                  <Ionicons name="close-circle" size={20} color={ultra.textMuted} />
                </View>
                <Text style={styles.mistakeText}>{mistake}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Footer Button — Revolut Ultra Gradient */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onStart();
          }}
          activeOpacity={0.85} 
          style={styles.startButton}
        >
          <LinearGradient
            colors={[ultra.accentSecondary, ultra.accent]}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="videocam" size={24} color={ultra.background} />
            <Text style={styles.startButtonText}>Понятно, начать съемку!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingBottom: Platform.select({ ios: 20, android: 16, default: 20 }),
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
    backgroundColor: ultra.background,
    zIndex: 10,
  },
  closeButton: {
    width: Platform.select({ ios: 40, android: 44, default: 40 }),
    height: Platform.select({ ios: 40, android: 44, default: 40 }),
    borderRadius: Platform.select({ ios: 20, android: 22, default: 20 }),
    backgroundColor: ultra.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 22, android: 21, default: 22 }),
    fontWeight: '900',
    color: ultra.textPrimary,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  headerSpacer: {
    width: Platform.select({ ios: 40, android: 44, default: 40 }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  
  heroTip: {
    marginBottom: Platform.select({ ios: 32, android: 28, default: 32 }),
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroGradient: {
    padding: Platform.select({ ios: 28, android: 24, default: 28 }),
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ultra.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: ultra.border,
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
  heroTipText: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 17, android: 16, default: 17 }),
    lineHeight: Platform.select({ ios: 26, android: 24, default: 26 }),
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },

  section: {
    marginBottom: Platform.select({ ios: 32, android: 28, default: 32 }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.select({ ios: 10, android: 8, default: 10 }),
    marginBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: Platform.select({ ios: 15, android: 14, default: 15 }),
    fontWeight: '800',
    color: ultra.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  
  cardContainer: {
    backgroundColor: ultra.card,
    borderRadius: 28,
    padding: Platform.select({ ios: 24, android: 20, default: 24 }),
    borderWidth: 1.5,
    borderColor: ultra.border,
    gap: Platform.select({ ios: 22, android: 20, default: 22 }),
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  checklistVerticalLine: {
    position: 'absolute',
    left: Platform.select({ ios: 24, android: 20, default: 24 }),
    top: Platform.select({ ios: 24, android: 20, default: 24 }),
    bottom: Platform.select({ ios: 24, android: 20, default: 24 }),
    width: 3.5,
    backgroundColor: ultra.accent,
    borderRadius: 2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Platform.select({ ios: 16, android: 14, default: 16 }),
    paddingLeft: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  checklistIconContainer: {
    width: Platform.select({ ios: 36, android: 34, default: 36 }),
    height: Platform.select({ ios: 36, android: 34, default: 36 }),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ultra.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  checklistEmoji: {
    fontSize: Platform.select({ ios: 22, android: 21, default: 22 }),
  },
  checklistContent: {
    flex: 1,
    paddingTop: Platform.select({ ios: 4, android: 3, default: 4 }),
  },
  checklistText: {
    fontSize: Platform.select({ ios: 17, android: 16, default: 17 }),
    color: ultra.textPrimary,
    fontWeight: '600',
    lineHeight: Platform.select({ ios: 24, android: 23, default: 24 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },

  examplesScroll: {
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
    paddingRight: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  exampleCard: {
    width: Platform.select({ ios: 160, android: 150, default: 160 }),
    backgroundColor: ultra.card,
    borderRadius: 24,
    padding: Platform.select({ ios: 18, android: 16, default: 18 }),
    borderWidth: 1.5,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  examplePreview: {
    height: Platform.select({ ios: 120, android: 115, default: 120 }),
    backgroundColor: ultra.surface,
    borderRadius: 20,
    marginBottom: Platform.select({ ios: 14, android: 12, default: 14 }),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: ultra.border,
  },
  exampleEmoji: {
    fontSize: Platform.select({ ios: 44, android: 42, default: 44 }),
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Platform.select({ ios: 8, android: 6, default: 8 }),
    paddingVertical: Platform.select({ ios: 4, android: 3, default: 4 }),
    borderRadius: 8,
  },
  durationText: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 12, android: 11, default: 12 }),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  exampleLabel: {
    color: ultra.textPrimary,
    fontSize: Platform.select({ ios: 15, android: 14, default: 15 }),
    fontWeight: '700',
    marginBottom: Platform.select({ ios: 10, android: 8, default: 10 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.select({ ios: 6, android: 5, default: 6 }),
  },
  watchButtonText: {
    color: ultra.accent,
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },

  mistakesCardContainer: {
    backgroundColor: ultra.card,
    borderRadius: 28,
    padding: Platform.select({ ios: 24, android: 20, default: 24 }),
    borderWidth: 1.5,
    borderColor: ultra.border,
    gap: Platform.select({ ios: 20, android: 18, default: 20 }),
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mistakesVerticalLine: {
    position: 'absolute',
    left: Platform.select({ ios: 24, android: 20, default: 24 }),
    top: Platform.select({ ios: 24, android: 20, default: 24 }),
    bottom: Platform.select({ ios: 24, android: 20, default: 24 }),
    width: 3.5,
    backgroundColor: ultra.textMuted,
    borderRadius: 2,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
    paddingLeft: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  mistakeIconContainer: {
    marginTop: 2,
  },
  mistakeText: {
    flex: 1,
    color: ultra.textSecondary,
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '600',
    lineHeight: Platform.select({ ios: 23, android: 22, default: 23 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    backgroundColor: ultra.background,
    borderTopWidth: 1,
    borderTopColor: ultra.border,
  },
  startButton: {
    height: Platform.select({ ios: 68, android: 64, default: 68 }),
    borderRadius: Platform.select({ ios: 34, android: 32, default: 34 }),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  startButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Platform.select({ ios: 10, android: 8, default: 10 }),
  },
  startButtonText: {
    color: ultra.background,
    fontSize: Platform.select({ ios: 19, android: 18, default: 19 }),
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
});
