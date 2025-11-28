/**
 * Boost & продвижение пользователя
 * Показывает список Boost для объявлений пользователя (активные + архив)
 */

import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useAppSelector } from '@/lib/store/hooks';
import { ultra } from '@/lib/theme/ultra';
import { db } from '@/services/supabase';
import { boostService } from '@/services/payments/boost';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BoostRecord {
  id: string;
  listing_id: string;
  boost_type?: string;
  type?: string;
  started_at?: string;
  expires_at?: string;
  created_at: string;
  status?: string;
  listing?: {
    id: string;
    title?: string;
    category?: string;
    price?: number;
  };
}

export default function BoostHistoryScreen() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [boosts, setBoosts] = useState<BoostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBoosts = useCallback(async (isRefresh = false) => {
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
      // Используем boostService для получения истории
      const boostHistory = await boostService.getBoostHistory(user.id, 50);
      
      // Если boostService вернул пустой массив, пробуем через db
      if (boostHistory.length === 0) {
        const { data, error } = await db.getUserBoosts(user.id);
        
        if (error) {
          appLogger.error('[BoostHistory] Error loading boosts', { error });
          setBoosts([]);
        } else {
          setBoosts((data || []) as BoostRecord[]);
        }
      } else {
        // Преобразуем BoostTransaction в BoostRecord
        const records: BoostRecord[] = boostHistory.map((tx: any) => ({
          id: tx.id,
          listing_id: tx.car_id || tx.listing_id || '',
          boost_type: tx.boost_type,
          type: tx.boost_type,
          started_at: tx.activated_at || tx.started_at,
          expires_at: tx.expires_at,
          created_at: tx.created_at,
          status: tx.status === 'success' ? 'active' : tx.status,
          listing: tx.listing,
        }));
        setBoosts(records);
      }
    } catch (error: any) {
      appLogger.error('[BoostHistory] Error', { error });
      setBoosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadBoosts();
  }, [loadBoosts]);

  // Группировка по статусу
  const { activeBoosts, expiredBoosts } = useMemo(() => {
    const now = new Date();
    const active: BoostRecord[] = [];
    const expired: BoostRecord[] = [];

    boosts.forEach((boost) => {
      if (boost.expires_at) {
        const expiresAt = new Date(boost.expires_at);
        if (expiresAt > now) {
          active.push(boost);
        } else {
          expired.push(boost);
        }
      } else if (boost.status === 'active' || boost.status === 'success') {
        active.push(boost);
      } else {
        expired.push(boost);
      }
    });

    return { activeBoosts: active, expiredBoosts: expired };
  }, [boosts]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  const getPlanName = (boostType?: string) => {
    if (!boostType) return 'Boost';
    const plan = boostService.getPlan(boostType as any);
    return plan ? `${plan.emoji} ${plan.name}` : 'Boost';
  };

  const getListingTitle = (boost: BoostRecord) => {
    if (boost.listing?.title) return boost.listing.title;
    if (boost.listing?.category) {
      const categoryMap: Record<string, string> = {
        car: 'Автомобиль',
        cars: 'Автомобиль',
        horse: 'Лошадь',
        horses: 'Лошадь',
        real_estate: 'Недвижимость',
        realestate: 'Недвижимость',
      };
      return categoryMap[boost.listing.category] || 'Объявление';
    }
    return 'Объявление';
  };

  const handleBoostListing = useCallback(() => {
    router.push('/(protected)/my-listings');
  }, [router]);

  if (loading && !refreshing) {
    return <LoadingOverlay message="Загрузка истории Boost..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={ultra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boost & продвижение</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {boosts.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <EmptyState
            title="Нет Boost"
            subtitle="Вы ещё не продвигали объявления"
            icon="flash-outline"
            iconColor={ultra.textMuted}
            backgroundColor={ultra.background}
          >
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleBoostListing}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.ctaButtonText}>Продвинуть объявление</Text>
            </TouchableOpacity>
          </EmptyState>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadBoosts(true)}
              tintColor={ultra.accent}
              colors={[ultra.accent]}
            />
          }
        >
          {/* Активные Boost */}
          {activeBoosts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Активные Boost</Text>
              {activeBoosts.map((boost, index) => (
                <Animated.View key={boost.id} entering={FadeInDown.delay(index * 50)}>
                  <View style={styles.boostCard}>
                    <View style={styles.boostHeader}>
                      <View style={styles.boostIcon}>
                        <Ionicons name="flash" size={24} color="#FFD60A" />
                      </View>
                      <View style={styles.boostInfo}>
                        <Text style={styles.boostPlan}>{getPlanName(boost.boost_type || boost.type)}</Text>
                        <Text style={styles.boostListing}>{getListingTitle(boost)}</Text>
                        {boost.listing?.price && (
                          <Text style={styles.boostPrice}>
                            {boost.listing.price.toLocaleString('ru-RU')} сом
                          </Text>
                        )}
                      </View>
                      <View style={[styles.statusBadge, styles.activeBadge]}>
                        <Text style={styles.statusText}>Активен</Text>
                      </View>
                    </View>
                    {boost.expires_at && (
                      <Text style={styles.boostExpires}>
                        Активен до {formatDate(boost.expires_at)}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Завершённые Boost */}
          {expiredBoosts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Завершённые Boost</Text>
              {expiredBoosts.map((boost, index) => (
                <Animated.View key={boost.id} entering={FadeInDown.delay(index * 50)}>
                  <View style={styles.boostCard}>
                    <View style={styles.boostHeader}>
                      <View style={[styles.boostIcon, styles.expiredIcon]}>
                        <Ionicons name="flash-outline" size={24} color={ultra.textMuted} />
                      </View>
                      <View style={styles.boostInfo}>
                        <Text style={styles.boostPlan}>{getPlanName(boost.boost_type || boost.type)}</Text>
                        <Text style={styles.boostListing}>{getListingTitle(boost)}</Text>
                        {boost.listing?.price && (
                          <Text style={styles.boostPrice}>
                            {boost.listing.price.toLocaleString('ru-RU')} сом
                          </Text>
                        )}
                      </View>
                      <View style={[styles.statusBadge, styles.expiredBadge]}>
                        <Text style={styles.statusText}>Завершён</Text>
                      </View>
                    </View>
                    {boost.expires_at && (
                      <Text style={styles.boostExpires}>
                        Завершён {formatDate(boost.expires_at)}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity style={styles.ctaButton} onPress={handleBoostListing} activeOpacity={0.8}>
            <Ionicons name="flash" size={20} color="#FFF" />
            <Text style={styles.ctaButtonText}>Продвинуть объявление</Text>
          </TouchableOpacity>
        </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: 12,
  },
  boostCard: {
    backgroundColor: ultra.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boostIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD60A20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expiredIcon: {
    backgroundColor: ultra.surface,
  },
  boostInfo: {
    flex: 1,
  },
  boostPlan: {
    fontSize: 16,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: 4,
  },
  boostListing: {
    fontSize: 14,
    color: ultra.textSecondary,
    marginBottom: 2,
  },
  boostPrice: {
    fontSize: 13,
    color: ultra.accent,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadge: {
    backgroundColor: ultra.accent,
  },
  expiredBadge: {
    backgroundColor: ultra.textMuted,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  boostExpires: {
    fontSize: 12,
    color: ultra.textSecondary,
    marginTop: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD60A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

