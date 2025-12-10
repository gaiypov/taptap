/**
 * История оплат / слотов
 * OPTIMIZED: FlatList, memoization, loading skeletons, re-render prevention
 */

import { EmptyState } from '@/components/ui/EmptyState';
import { useAppSelector } from '@/lib/store/hooks';
import { ultra } from '@/lib/theme/ultra';
import { db } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  description?: string;
  status: string;
  created_at: string;
  metadata?: any;
}

// Constants for FlatList optimization
const ITEM_HEIGHT = 80 + 12; // paymentCard height + marginBottom

// Memoized date formatter (cached results)
const dateFormatCache = new Map<string, string>();
const formatDate = (dateString: string): string => {
  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString)!;
  }

  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  const formatted = date.toLocaleDateString('ru-RU', options);
  dateFormatCache.set(dateString, formatted);
  return formatted;
};

// Get payment description helper
const getPaymentDescription = (payment: Payment): string => {
  if (payment.description) return payment.description;
  if (payment.payment_type === 'slot' || payment.payment_type === 'listing_slot') {
    return 'Дополнительный слот';
  }
  return 'Оплата';
};

/**
 * Loading Skeleton Component
 */
const SkeletonItem = memo(function SkeletonItem({ index }: { index: number }) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 100)}
      style={[styles.paymentCard, styles.skeletonCard]}
    >
      <View style={styles.paymentHeader}>
        <Animated.View style={[styles.skeletonIcon, animatedStyle]} />
        <View style={styles.paymentInfo}>
          <Animated.View style={[styles.skeletonTitle, animatedStyle]} />
          <Animated.View style={[styles.skeletonDate, animatedStyle]} />
        </View>
        <View style={styles.paymentAmount}>
          <Animated.View style={[styles.skeletonAmount, animatedStyle]} />
          <Animated.View style={[styles.skeletonBadge, animatedStyle]} />
        </View>
      </View>
    </Animated.View>
  );
});

/**
 * Loading Skeleton List
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <View style={styles.content}>
      {[0, 1, 2, 3].map((index) => (
        <SkeletonItem key={index} index={index} />
      ))}
    </View>
  );
});

/**
 * Memoized Payment Item Component
 */
const PaymentItem = memo(function PaymentItem({
  payment,
  index,
}: {
  payment: Payment;
  index: number;
}) {
  const description = useMemo(() => getPaymentDescription(payment), [payment]);
  const date = useMemo(() => formatDate(payment.created_at), [payment.created_at]);
  const formattedAmount = useMemo(
    () => `${payment.amount.toLocaleString('ru-RU')} сом`,
    [payment.amount]
  );

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 200))}>
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentIcon}>
            <Ionicons name="cube-outline" size={24} color={ultra.accent} />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>{description}</Text>
            <Text style={styles.paymentDate}>{date}</Text>
          </View>
          <View style={styles.paymentAmount}>
            <Text style={styles.amountText}>{formattedAmount}</Text>
            {payment.status === 'completed' && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Оплачено</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

/**
 * Header Component (memoized)
 */
const Header = memo(function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={ultra.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>История оплат</Text>
      <View style={styles.placeholder} />
    </View>
  );
});

export default function BillingHistoryScreen() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    try {
      const { data, error } = await db.getUserPayments(user.id);

      if (error) {
        appLogger.error('[BillingHistory] Error loading payments', { error });
        setPayments([]);
      } else {
        const paymentsArray = Array.isArray(data) ? data : [];

        const slotPayments = paymentsArray.filter(
          (p: any) =>
            p.payment_type === 'slot' ||
            p.payment_type === 'listing_slot' ||
            (p.description && p.description.includes('Слот'))
        );

        const paidSlots = (user as any).paid_slots;
        if (slotPayments.length === 0 && paidSlots && paidSlots > 0) {
          const syntheticPayments: Payment[] = [];
          for (let i = 0; i < paidSlots; i++) {
            const slotNumber = i + 2;
            let price = 80;
            if (slotNumber === 3) price = 150;
            else if (slotNumber > 3) price = 50 * slotNumber;

            syntheticPayments.push({
              id: `synthetic-${i}`,
              amount: price,
              currency: 'KGS',
              payment_type: 'slot',
              description: `Слот №${slotNumber}`,
              status: 'completed',
              created_at: new Date().toISOString(),
            });
          }
          setPayments(syntheticPayments);
        } else {
          setPayments(slotPayments as Payment[]);
        }
      }
    } catch (error: any) {
      appLogger.error('[BillingHistory] Error', { error });
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Memoized callbacks
  const handleBack = useCallback(() => router.back(), [router]);
  const handleRefresh = useCallback(() => loadPayments(true), [loadPayments]);

  // Memoized render item
  const renderItem = useCallback(
    ({ item, index }: { item: Payment; index: number }) => (
      <PaymentItem payment={item} index={index} />
    ),
    []
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: Payment) => item.id, []);

  // FlatList optimization: getItemLayout
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Memoized refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={ultra.accent}
        colors={[ultra.accent]}
      />
    ),
    [refreshing, handleRefresh]
  );

  // Memoized empty component
  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="Нет платежей"
          subtitle="Вы ещё не покупали дополнительные слоты"
          icon="receipt-outline"
          iconColor={ultra.textMuted}
          backgroundColor={ultra.background}
        />
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onBack={handleBack} />

      {loading && !refreshing ? (
        <LoadingSkeleton />
      ) : (
        <LegendList
          data={payments}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={payments.length === 0 ? styles.emptyListContainer : styles.content}
          refreshControl={refreshControl}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
          recycleItems={true}
          drawDistance={500}
        />
      )}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ultra.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  paymentCard: {
    backgroundColor: ultra.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ultra.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 13,
    color: ultra.textSecondary,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: ultra.accent,
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: ultra.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  // Skeleton styles
  skeletonCard: {
    borderColor: ultra.border,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ultra.surface,
    marginRight: 12,
  },
  skeletonTitle: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: ultra.surface,
    marginBottom: 8,
  },
  skeletonDate: {
    width: 160,
    height: 12,
    borderRadius: 4,
    backgroundColor: ultra.surface,
  },
  skeletonAmount: {
    width: 80,
    height: 18,
    borderRadius: 4,
    backgroundColor: ultra.surface,
    marginBottom: 8,
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: 8,
    backgroundColor: ultra.surface,
  },
});
