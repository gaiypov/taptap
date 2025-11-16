// Экран выбора тарифа бизнес-аккаунта

import BusinessBadge from '@/components/Business/BusinessBadge';
import TierSelector from '@/components/Business/TierSelector';
import { getBusinessAccount } from '@/lib/business/check-limits';
import { getTierFeatures } from '@/lib/business/tier-features';
import { auth } from '@/services/auth';
import { BusinessTier } from '@/types/business';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { appLogger } from '@/utils/logger';

export default function UpgradeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<BusinessTier>('free');
  const [selectedTier, setSelectedTier] = useState<BusinessTier>('lite');

  const loadUserData = useCallback(async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        Alert.alert('Ошибка', 'Необходима авторизация');
        router.back();
        return;
      }

      const business = await getBusinessAccount(user.id);
      if (business) {
        setCurrentTier(business.tier);
        setSelectedTier(business.tier === 'pro' ? 'pro' : (business.tier === 'business' ? 'business' : 'lite'));
      }
    } catch (error) {
      appLogger.error('Error loading user:', { error });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleSelectTier = (tier: BusinessTier) => {
    setSelectedTier(tier);
  };

  const handleContinue = () => {
    if (selectedTier === currentTier) {
      Alert.alert('Уже активен', 'Этот тариф уже активен у вас');
      return;
    }

    // Переход на setup (настройка компании) или сразу на оплату
    router.push({
      pathname: '/(business)/setup',
      params: { tier: selectedTier },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#EF4444" />
      </SafeAreaView>
    );
  }

  const selectedConfig = getTierFeatures(selectedTier);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Выберите тариф</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current tier */}
        {currentTier !== 'free' && (
          <View style={styles.currentTierBox}>
            <Text style={styles.currentTierLabel}>Текущий тариф:</Text>
            <BusinessBadge tier={currentTier} size="medium" showLabel={true} />
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            🎁 Первые 7 дней бесплатно для новых пользователей!
          </Text>
        </View>

        {/* Tier selector */}
        <TierSelector currentTier={currentTier} onSelectTier={handleSelectTier} />

        {/* Selected tier details */}
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Что входит в {selectedConfig.name}:</Text>

          {selectedConfig.features.map((feature, index) => (
            <View key={index} style={styles.detailItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.detailText}>{feature}</Text>
            </View>
          ))}

          {/* Price */}
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Итого:</Text>
            <Text style={styles.priceValue}>{selectedConfig.price} сом/мес</Text>
          </View>

          {selectedTier !== currentTier && currentTier === 'free' && (
            <Text style={styles.trialInfo}>
              Первые 7 дней бесплатно, затем {selectedConfig.price} сом/мес
            </Text>
          )}
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.continueButton, getShadowStyle()]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {currentTier === 'free' ? 'Начать пробный период' : 'Изменить тариф'}
          </Text>
        </TouchableOpacity>

        {/* FAQ */}
        <View style={styles.faqBox}>
          <Text style={styles.faqTitle}>Часто задаваемые вопросы:</Text>

          <Text style={styles.faqQuestion}>📅 Как отменить подписку?</Text>
          <Text style={styles.faqAnswer}>
            Вы можете отменить в любой момент в настройках профиля
          </Text>

          <Text style={styles.faqQuestion}>💳 Как оплатить?</Text>
          <Text style={styles.faqAnswer}>
            Принимаем ЭЛСОМ, Pay24, MBank, O!, Megapay
          </Text>

          <Text style={styles.faqQuestion}>🔄 Автопродление?</Text>
          <Text style={styles.faqAnswer}>
            Для тарифов БИЗНЕС и ПРОФИ подключено автопродление. Можно отключить.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Safe Platform check helper for SSR compatibility
const getShadowStyle = () => {
  try {
    // Check if Platform is available
    if (typeof Platform !== 'undefined' && Platform?.OS === 'web') {
      return { boxShadow: '0px 4px 8px rgba(239, 68, 68, 0.3)' };
    }
  } catch (e) {
    // Platform not available, fallback to mobile styles
  }
  // Default mobile/native shadow styles
  return {
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  currentTierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  currentTierLabel: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#93C5FD',
    lineHeight: 20,
  },
  detailsBox: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  trialInfo: {
    fontSize: 13,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 12,
  },
  continueButton: {
    height: 56,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    // Shadow styles applied dynamically via getShadowStyle() in component
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  faqBox: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});
