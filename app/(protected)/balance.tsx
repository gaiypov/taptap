/**
 * Balance Screen - Кошелёк пользователя
 * Revolut Ultra Neutral Design
 *
 * - Баланс
 * - Пополнение
 * - Продвижение объявлений
 * - История операций
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
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Transaction {
  id: string;
  type: 'topup' | 'boost' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  listing_title?: string;
  boost_type?: string;
}

interface BoostPlan {
  id: string;
  type: '3h' | '24h' | '7d' | '30d';
  label: string;
  price: number;
  description: string;
}

const BOOST_PLANS: BoostPlan[] = [
  { id: '1', type: '3h', label: '3 часа', price: 100, description: 'Быстрый тест' },
  { id: '2', type: '24h', label: '24 часа', price: 300, description: 'На день' },
  { id: '3', type: '7d', label: '7 дней', price: 1500, description: 'Неделя' },
  { id: '4', type: '30d', label: '30 дней', price: 5000, description: 'Месяц' },
];

export default function BalanceScreen() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // TODO: Load real balance from Supabase
      // For now, mock data
      setBalance(500);

      // TODO: Load real transactions
      setTransactions([
        {
          id: '1',
          type: 'topup',
          amount: 500,
          description: 'Пополнение баланса',
          status: 'success',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      appLogger.error('[Balance] Error loading data', { error });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTopUp = () => {
    // TODO: Open top-up modal or navigate to payment
    appLogger.info('[Balance] Top up pressed');
  };

  const handleBoostListing = () => {
    // Navigate to listing selection for boost
    router.push('/(protected)/boost-listing');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'topup':
        return 'add-circle';
      case 'boost':
        return 'flash';
      case 'refund':
        return 'arrow-undo';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'topup':
        return '#4CAF50';
      case 'boost':
        return '#FF9800';
      case 'refund':
        return '#2196F3';
      default:
        return RevolutUltra.textSecondary;
    }
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
        <Text style={styles.headerTitle}>Баланс</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={RevolutUltra.textPrimary}
          />
        }
      >
        {/* Balance Card */}
        <Animated.View entering={FadeIn} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Ваш баланс</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
            <Text style={styles.balanceCurrency}>сом</Text>
          </View>
          <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
            <Ionicons name="add" size={20} color="#000" />
            <Text style={styles.topUpButtonText}>Пополнить</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Slots Section - Мои слоты */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={20} color={RevolutUltra.textPrimary} />
            <Text style={styles.sectionTitle}>Мои слоты</Text>
          </View>
          <View style={styles.slotsCard}>
            <View style={styles.slotsInfo}>
              <Text style={styles.slotsUsed}>3</Text>
              <Text style={styles.slotsLabel}>использовано</Text>
            </View>
            <View style={styles.slotsDivider} />
            <View style={styles.slotsInfo}>
              <Text style={styles.slotsTotal}>5</Text>
              <Text style={styles.slotsLabel}>всего</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.buySlotButton}>
            <Ionicons name="add-circle" size={18} color={RevolutUltra.textPrimary} />
            <Text style={styles.buySlotText}>Купить слоты</Text>
          </TouchableOpacity>
          <Text style={styles.slotHint}>
            1 слот = 1 активное объявление. Докупите слоты для большего количества объявлений.
          </Text>
        </Animated.View>

        {/* Boost Section */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color="#FFD60A" />
            <Text style={styles.sectionTitle}>Продвижение</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Продвигайте объявления, чтобы получить больше просмотров
          </Text>
          <TouchableOpacity style={styles.boostButton} onPress={handleBoostListing}>
            <Ionicons name="rocket" size={20} color={RevolutUltra.textPrimary} />
            <Text style={styles.boostButtonText}>Продвинуть объявление</Text>
            <Ionicons name="chevron-forward" size={18} color={RevolutUltra.textSecondary} />
          </TouchableOpacity>

          {/* Boost Plans Preview */}
          <View style={styles.plansPreview}>
            {BOOST_PLANS.map((plan) => (
              <View key={plan.id} style={styles.planChip}>
                <Text style={styles.planChipText}>{plan.label}</Text>
                <Text style={styles.planChipPrice}>{plan.price}с</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Transaction History */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={RevolutUltra.textSecondary} />
            <Text style={styles.sectionTitle}>История операций</Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={RevolutUltra.textSecondary} />
              <Text style={styles.emptyText}>Пока нет операций</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: getTransactionColor(transaction.type) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getTransactionIcon(transaction.type)}
                      size={18}
                      color={getTransactionColor(transaction.type)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'boost' ? '#FF9800' : '#4CAF50' },
                    ]}
                  >
                    {transaction.type === 'boost' ? '-' : '+'}
                    {transaction.amount} сом
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerSpacer: {
    width: 40,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    backgroundColor: RevolutUltra.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: RevolutUltra.textSecondary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  balanceCurrency: {
    fontSize: 20,
    fontWeight: '600',
    color: RevolutUltra.textSecondary,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD60A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  topUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: RevolutUltra.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  sectionDescription: {
    fontSize: 14,
    color: RevolutUltra.textSecondary,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RevolutUltra.card2,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  boostButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  plansPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RevolutUltra.bg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  planChipText: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  planChipPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  transactionDate: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  // Slots styles
  slotsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RevolutUltra.card2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  slotsInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slotsUsed: {
    fontSize: 32,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  slotsTotal: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  slotsLabel: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  slotsDivider: {
    width: 1,
    height: 40,
    backgroundColor: RevolutUltra.border,
  },
  buySlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RevolutUltra.card2,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 8,
  },
  buySlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  slotHint: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomSpacer: {
    height: 40,
  },
});
