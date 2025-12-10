/**
 * AboutTab - User bio, location, and seller stats
 * Part of unified profile system
 */

import { RevolutUltra } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface SellerStats {
  total_sales?: number;
  rating?: number;
  reviews_count?: number;
  response_time_hours?: number;
  active_listings_count?: number;
}

interface AboutTabProps {
  bio?: string;
  city?: string;
  createdAt?: string;
  isVerified?: boolean;
  sellerStats?: SellerStats | null;
  hasListings?: boolean;
}

export default function AboutTab({
  bio,
  city,
  createdAt,
  isVerified,
  sellerStats,
  hasListings,
}: AboutTabProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Недавно';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    return date.toLocaleDateString('ru-RU', options);
  };

  const formatResponseTime = (hours?: number) => {
    if (!hours) return 'Обычно отвечает быстро';
    if (hours < 1) return 'Отвечает моментально';
    if (hours <= 2) return 'Отвечает в течение 2 часов';
    if (hours <= 24) return 'Отвечает в течение дня';
    return `Отвечает в течение ${hours} часов`;
  };

  return (
    <View style={styles.container}>
      {/* Bio section */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={18} color={RevolutUltra.textSecondary} />
          <Text style={styles.sectionTitle}>О себе</Text>
        </View>
        <Text style={styles.bioText}>
          {bio?.trim() || 'Пользователь пока не добавил описание'}
        </Text>
      </Animated.View>

      {/* Location section */}
      {city && (
        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={RevolutUltra.textSecondary} />
            <Text style={styles.sectionTitle}>Местоположение</Text>
          </View>
          <Text style={styles.locationText}>{city}</Text>
        </Animated.View>
      )}

      {/* Member since */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={18} color={RevolutUltra.textSecondary} />
        <Text style={styles.infoText}>На 360Auto с {formatDate(createdAt)}</Text>
      </Animated.View>

      {/* Verified badge */}
      {isVerified && (
        <Animated.View entering={FadeInDown.delay(250)} style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
          <Text style={[styles.infoText, { color: '#4CAF50' }]}>Телефон подтверждён</Text>
        </Animated.View>
      )}

      {/* Seller stats (if has listings) */}
      {hasListings && sellerStats && (
        <Animated.View entering={FadeInDown.delay(300)} style={styles.sellerSection}>
          <Text style={styles.sellerTitle}>Статистика продавца</Text>

          <View style={styles.statsGrid}>
            {/* Active listings */}
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sellerStats.active_listings_count || 0}</Text>
              <Text style={styles.statLabel}>Объявлений</Text>
            </View>

            {/* Total sales */}
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sellerStats.total_sales || 0}</Text>
              <Text style={styles.statLabel}>Продаж</Text>
            </View>

            {/* Rating */}
            {(sellerStats.rating ?? 0) > 0 && (
              <View style={styles.statItem}>
                <View style={styles.ratingRow}>
                  <Text style={styles.statNumber}>{sellerStats.rating?.toFixed(1)}</Text>
                  <Ionicons name="star" size={14} color="#FFD700" />
                </View>
                <Text style={styles.statLabel}>
                  {sellerStats.reviews_count || 0} отзывов
                </Text>
              </View>
            )}
          </View>

          {/* Response time */}
          <View style={styles.responseTime}>
            <Ionicons name="time-outline" size={16} color={RevolutUltra.textSecondary} />
            <Text style={styles.responseText}>
              {formatResponseTime(sellerStats.response_time_hours)}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  section: {
    backgroundColor: RevolutUltra.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  bioText: {
    fontSize: 15,
    color: RevolutUltra.textPrimary,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  locationText: {
    fontSize: 15,
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 14,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sellerSection: {
    backgroundColor: RevolutUltra.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    marginTop: 8,
  },
  sellerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  statLabel: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responseTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: RevolutUltra.border,
  },
  responseText: {
    fontSize: 13,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
