/**
 * Boost Listing Screen - Выбор объявления для продвижения
 * Revolut Ultra Neutral Design
 */

import { RevolutUltra } from '@/lib/theme/colors';
import { useAppSelector } from '@/lib/store/hooks';
import { db } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Listing {
  id: string;
  title: string;
  price: number;
  thumbnail_url?: string;
  video_url?: string;
  status: string;
  is_boosted?: boolean;
  boost_expires_at?: string;
  views_count?: number;
}

interface BoostPlan {
  id: string;
  type: '3h' | '24h' | '7d' | '30d';
  label: string;
  price: number;
  hours: number;
  description: string;
  popular?: boolean;
  details: string[];
  avgViews: string;
}

const BOOST_PLANS: BoostPlan[] = [
  {
    id: '1',
    type: '3h',
    label: '3 часа',
    price: 100,
    hours: 3,
    description: 'Быстрый тест',
    avgViews: '~50-100',
    details: [
      'Объявление в топе 3 часа',
      'Пометка "Продвигается"',
      'Идеально для теста',
    ],
  },
  {
    id: '2',
    type: '24h',
    label: '24 часа',
    price: 300,
    hours: 24,
    description: 'На день',
    popular: true,
    avgViews: '~300-500',
    details: [
      'Объявление в топе сутки',
      'Пометка "Продвигается"',
      'Приоритет в поиске',
      'Больше просмотров в прайм-тайм',
    ],
  },
  {
    id: '3',
    type: '7d',
    label: '7 дней',
    price: 1500,
    hours: 168,
    description: 'Неделя',
    avgViews: '~1500-2500',
    details: [
      'Топ позиция неделю',
      'Пометка "Продвигается"',
      'Максимальный приоритет в поиске',
      'Push-уведомления подписчикам',
      'Экономия 35% vs посуточно',
    ],
  },
  {
    id: '4',
    type: '30d',
    label: '30 дней',
    price: 5000,
    hours: 720,
    description: 'Месяц',
    avgViews: '~5000-8000',
    details: [
      'Топ позиция месяц',
      'Пометка "Продвигается"',
      'VIP приоритет в поиске',
      'Push-уведомления подписчикам',
      'Статистика просмотров',
      'Экономия 45% vs посуточно',
    ],
  },
];

export default function BoostListingScreen() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(BOOST_PLANS[1]); // 24h by default
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Load user listings
      const { data: listingsData } = await db.getSellerListings(user.id);
      if (listingsData && Array.isArray(listingsData)) {
        // Filter only active listings
        const activeListings = (listingsData as any[]).filter((l) => l.status === 'active');
        setListings(activeListings);
      }

      // TODO: Load real balance
      setBalance(500);
    } catch (error) {
      appLogger.error('[BoostListing] Error loading data', { error });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBoost = async () => {
    if (!selectedListing || !selectedPlan || !user?.id) return;

    if (balance < selectedPlan.price) {
      Alert.alert(
        'Недостаточно средств',
        `На балансе ${balance} сом, нужно ${selectedPlan.price} сом`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Пополнить', onPress: () => router.push('/(protected)/balance') },
        ]
      );
      return;
    }

    setBoosting(true);
    try {
      // TODO: Call Supabase function to boost listing
      // await db.boostListing(selectedListing.id, selectedPlan.type, selectedPlan.price);

      Alert.alert(
        'Успешно!',
        `Объявление "${selectedListing.title}" продвигается ${selectedPlan.label}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      appLogger.error('[BoostListing] Error boosting', { error });
      Alert.alert('Ошибка', error?.message || 'Не удалось продвинуть объявление');
    } finally {
      setBoosting(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString() + ' сом';
  };

  const getBoostStatus = (listing: Listing) => {
    if (!listing.is_boosted || !listing.boost_expires_at) return null;

    const expiresAt = new Date(listing.boost_expires_at);
    const now = new Date();

    if (expiresAt <= now) return null;

    const hoursLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    return `⚡ Активно ещё ${hoursLeft}ч`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RevolutUltra.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={RevolutUltra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Продвижение</Text>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>{balance} с</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Listing */}
        <Animated.View entering={FadeIn} style={styles.section}>
          <Text style={styles.stepLabel}>Шаг 1</Text>
          <Text style={styles.sectionTitle}>Выберите объявление</Text>

          {listings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={RevolutUltra.textSecondary} />
              <Text style={styles.emptyText}>У вас нет активных объявлений</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(tabs)/upload')}
              >
                <Text style={styles.createButtonText}>Создать объявление</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listingsGrid}>
              {listings.map((listing) => {
                const isSelected = selectedListing?.id === listing.id;
                const boostStatus = getBoostStatus(listing);

                return (
                  <TouchableOpacity
                    key={listing.id}
                    style={[styles.listingCard, isSelected && styles.listingCardSelected]}
                    onPress={() => setSelectedListing(listing)}
                    activeOpacity={0.7}
                  >
                    {listing.thumbnail_url ? (
                      <Image source={{ uri: listing.thumbnail_url }} style={styles.listingImage} />
                    ) : (
                      <View style={styles.listingImagePlaceholder}>
                        <Ionicons name="car" size={24} color={RevolutUltra.textSecondary} />
                      </View>
                    )}
                    <View style={styles.listingInfo}>
                      <Text style={styles.listingTitle} numberOfLines={1}>
                        {listing.title}
                      </Text>
                      <Text style={styles.listingPrice}>{formatPrice(listing.price)}</Text>
                      {boostStatus && <Text style={styles.boostStatus}>{boostStatus}</Text>}
                    </View>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={16} color="#000" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Step 2: Select Plan */}
        {selectedListing && (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <Text style={styles.stepLabel}>Шаг 2</Text>
            <Text style={styles.sectionTitle}>Выберите тариф</Text>

            <View style={styles.plansGrid}>
              {BOOST_PLANS.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.planCard, isSelected && styles.planCardSelected]}
                    onPress={() => setSelectedPlan(plan)}
                    activeOpacity={0.7}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Популярный</Text>
                      </View>
                    )}
                    <Text style={styles.planLabel}>{plan.label}</Text>
                    <Text style={styles.planPrice}>{plan.price} сом</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                    {isSelected && (
                      <View style={styles.planSelectedIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFD60A" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Plan Details - подробная информация о тарифе */}
        {selectedPlan && (
          <Animated.View entering={FadeInDown.delay(150)} style={styles.planDetailsSection}>
            <View style={styles.planDetailsHeader}>
              <View style={styles.planDetailsIcon}>
                <Ionicons name="information-circle" size={20} color="#FFD60A" />
              </View>
              <Text style={styles.planDetailsTitle}>
                Тариф "{selectedPlan.label}" включает:
              </Text>
            </View>

            <View style={styles.planDetailsList}>
              {selectedPlan.details.map((detail, index) => (
                <View key={index} style={styles.planDetailItem}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  <Text style={styles.planDetailText}>{detail}</Text>
                </View>
              ))}
            </View>

            <View style={styles.planStatsRow}>
              <View style={styles.planStat}>
                <Ionicons name="eye-outline" size={18} color={RevolutUltra.textSecondary} />
                <Text style={styles.planStatLabel}>Ожидаемые просмотры</Text>
                <Text style={styles.planStatValue}>{selectedPlan.avgViews}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Summary */}
        {selectedListing && selectedPlan && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Объявление</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {selectedListing.title}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Тариф</Text>
              <Text style={styles.summaryValue}>{selectedPlan.label}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Итого</Text>
              <Text style={styles.summaryTotalValue}>{selectedPlan.price} сом</Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Action */}
      {selectedListing && selectedPlan && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.boostButton, boosting && styles.boostButtonDisabled]}
            onPress={handleBoost}
            disabled={boosting}
          >
            {boosting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#000" />
                <Text style={styles.boostButtonText}>
                  Продвинуть за {selectedPlan.price} сом
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RevolutUltra.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RevolutUltra.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  balanceBadge: {
    backgroundColor: RevolutUltra.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  section: {
    padding: 16,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD60A',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  createButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: RevolutUltra.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  listingsGrid: {
    gap: 12,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: RevolutUltra.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    gap: 12,
  },
  listingCardSelected: {
    borderColor: '#FFD60A',
    borderWidth: 2,
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: RevolutUltra.card2,
  },
  listingImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  listingPrice: {
    fontSize: 13,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  boostStatus: {
    fontSize: 11,
    color: '#FFD60A',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  planCard: {
    width: '47%',
    backgroundColor: RevolutUltra.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    alignItems: 'center',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#FFD60A',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 214, 10, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FFD60A',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  planDescription: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  planSelectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  planDetailsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: RevolutUltra.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  planDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  planDetailsIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDetailsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  planDetailsList: {
    gap: 10,
    marginBottom: 16,
  },
  planDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planDetailText: {
    fontSize: 14,
    color: RevolutUltra.textPrimary,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  planStatsRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: RevolutUltra.border,
  },
  planStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planStatLabel: {
    fontSize: 13,
    color: RevolutUltra.textSecondary,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  planStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  summarySection: {
    margin: 16,
    padding: 16,
    backgroundColor: RevolutUltra.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: RevolutUltra.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: RevolutUltra.border,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD60A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: RevolutUltra.bg,
    borderTopWidth: 1,
    borderTopColor: RevolutUltra.border,
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD60A',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  boostButtonDisabled: {
    opacity: 0.6,
  },
  boostButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
});
