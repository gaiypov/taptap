// components/Upload/RecordingGuide.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface RecordingGuideProps {
  category: 'car' | 'horse';
  onStart: () => void;
  onBack: () => void;
}

interface TipItem {
  icon: string;
  text: string;
}

interface GuideConfig {
  icon: string;
  title: string;
  subtitle: string;
  tips: TipItem[];
  gradientColors: string[];
}

const guides: Record<'car' | 'horse', GuideConfig> = {
  car: {
    icon: '🚗',
    title: 'Как снять авто правильно?',
    subtitle: 'Следуйте этим советам для лучшего результата',
    tips: [
      { icon: '📹', text: 'Снимите видео 60-120 секунд' },
      { icon: '🌞', text: 'Хорошее освещение (день, без теней)' },
      { icon: '🔄', text: 'Покажите авто со ВСЕХ сторон' },
      { icon: '🚪', text: 'Откройте двери, покажите салон' },
      { icon: '🔊', text: 'Заведите двигатель, покажите звук' },
      { icon: '🚗', text: 'Проедьтесь немного (если возможно)' },
      { icon: '🚫', text: 'Не загораживайте номера' },
      { icon: '📱', text: 'Держите телефон вертикально' },
    ],
    gradientColors: ['#3B82F6', '#2563EB'],
  },
  horse: {
    icon: '🐴',
    title: 'Как снять лошадь правильно?',
    subtitle: 'Покажите коня во всей красе',
    tips: [
      { icon: '📹', text: 'Снимите видео 60-120 секунд' },
      { icon: '🌞', text: 'Хорошее освещение (день, ясная погода)' },
      { icon: '🔄', text: 'Покажите лошадь со всех сторон' },
      { icon: '🏃', text: 'Покажите как двигается (шаг, рысь)' },
      { icon: '👀', text: 'Крупный план: морда, глаза, уши' },
      { icon: '🦵', text: 'Покажите ноги, копыта' },
      { icon: '📄', text: 'Покажите документы (паспорт, ветсправка)' },
      { icon: '📱', text: 'Держите телефон вертикально' },
    ],
    gradientColors: ['#D97706', '#B45309'],
  },
};

export default function RecordingGuide({ category, onStart, onBack }: RecordingGuideProps) {
  const guide = guides[category];

  return (
    <View style={styles.container}>
      {/* Header с кнопкой назад */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#999" />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.emoji}>{guide.icon}</Text>
          <Text style={styles.title}>{guide.title}</Text>
          <Text style={styles.subtitle}>{guide.subtitle}</Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          {guide.tips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {/* Example video button (optional) */}
        <TouchableOpacity style={styles.exampleButton} activeOpacity={0.7}>
          <Text style={styles.exampleIcon}>📺</Text>
          <Text style={styles.exampleText}>Посмотреть пример</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Start button */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={onStart} activeOpacity={0.8}>
          <LinearGradient
            colors={guide.gradientColors as any}
            style={styles.startButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startButtonText}>Начать съемку</Text>
            <Text style={styles.startButtonEmoji}>🎬</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  tipsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  tipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIcon: {
    fontSize: 24,
    flexShrink: 0,
  },
  tipText: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
    lineHeight: 24,
  },
  exampleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  exampleIcon: {
    fontSize: 24,
  },
  exampleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  startButton: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  startButtonEmoji: {
    fontSize: 24,
  },
});

