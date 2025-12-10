import { getTierBadge, getTierFeatures } from '@/lib/business/tier-features';
import type { BusinessTier } from '@/types/business';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function isBusinessTier(value: string): value is BusinessTier {
  return value === 'free' || value === 'lite' || value === 'business' || value === 'pro';
}

export default function BusinessSetupScreen() {
  const router = useRouter();
  const { tier } = useLocalSearchParams<{ tier?: string }>();

  const selectedTier = useMemo<BusinessTier>(() => {
    if (tier && typeof tier === 'string' && isBusinessTier(tier)) {
      return tier;
    }
    return 'lite';
  }, [tier]);

  const tierConfig = getTierFeatures(selectedTier);
  const tierBadge = getTierBadge(selectedTier);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Настройка компании</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tierCard}>
          <Text style={styles.badgeEmoji}>{tierBadge.emoji}</Text>
          <Text style={styles.tierLabel}>{tierBadge.label}</Text>
          <Text style={styles.tierTitle}>{tierConfig.name}</Text>
          <Text style={styles.tierDescription}>
            Подготовьте данные компании, чтобы активировать все преимущества тарифа.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Что понадобится:</Text>
          <View style={styles.requirementsList}>
            <RequirementItem icon="business" text="Название компании и юридическая информация" />
            <RequirementItem icon="documents" text="Скан документов или свидетельства о регистрации" />
            <RequirementItem icon="call" text="Контактные данные менеджера" />
            <RequirementItem icon="image" text="Логотип и фирменные цвета для витрины" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Возможности тарифа</Text>
          <View style={styles.featuresContainer}>
            {tierConfig.features.map((feature) => (
              <View key={feature} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => {
            // Пока backend ещё не готов, просто возвращаемся в профиль
            router.replace('/(tabs)/profile');
          }}
        >
          <Text style={styles.ctaText}>Заполнить регистрацию</Text>
          <Ionicons name="arrow-forward" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.helperText}>
          После отправки заявки команда поддержки проверит данные и активирует бизнес-панель.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function RequirementItem({ icon, text }: { icon: 'business' | 'documents' | 'call' | 'image'; text: string }) {
  const iconName = (() => {
    switch (icon) {
      case 'business':
        return 'briefcase-outline';
      case 'documents':
        return 'documents-outline';
      case 'call':
        return 'call-outline';
      case 'image':
        return 'image-outline';
      default:
        return 'information-circle-outline';
    }
  })();

  return (
    <View style={styles.requirementItem}>
      <Ionicons name={iconName} size={20} color="#60A5FA" />
      <Text style={styles.requirementText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    padding: 20,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  tierCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    alignItems: 'center',
    gap: 12,
  },
  badgeEmoji: {
    fontSize: 36,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
    letterSpacing: 1,
  },
  tierTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierDescription: {
    fontSize: 15,
    textAlign: 'center',
    color: '#CBD5F5',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requirementsList: {
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    padding: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#E2E8F0',
    flex: 1,
  },
  featuresContainer: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#F1F5F9',
    flex: 1,
  },
  ctaButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  helperText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
