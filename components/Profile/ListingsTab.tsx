/**
 * ListingsTab - User's own listings with stats
 * Part of unified profile system
 */

import { EmptyState } from '@/components/ui/EmptyState';
import { RevolutUltra } from '@/lib/theme/colors';
import { navigateFromProfile } from '@/utils/profileNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ListingStats {
  call_count?: number;
  message_count?: number;
  share_count?: number;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  status: 'active' | 'sold' | 'pending_review' | 'archived';
  thumbnail_url?: string;
  video_hls_url?: string;
  views_count?: number;
  likes_count?: number;
  created_at?: string;
  stats?: ListingStats | null;
}

interface ListingsTabProps {
  listings: Listing[];
  onEditListing?: (listing: Listing) => void;
  onDeleteListing?: (listing: Listing) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  car: '🚗',
  cars: '🚗',
  horse: '🐴',
  horses: '🐴',
  real_estate: '🏠',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Активно', color: '#4CAF50' },
  sold: { label: 'Продано', color: '#9E9E9E' },
  pending_review: { label: 'На модерации', color: '#FF9800' },
  archived: { label: 'В архиве', color: '#757575' },
};

type FilterType = 'all' | 'active' | 'sold';

export default function ListingsTab({
  listings,
  onEditListing,
  onDeleteListing,
}: ListingsTabProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredListings = useMemo(() => {
    if (filter === 'all') return listings;
    return listings.filter((l) => l.status === filter);
  }, [listings, filter]);

  const counts = useMemo(() => ({
    all: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    sold: listings.filter((l) => l.status === 'sold').length,
  }), [listings]);

  const handleListingPress = useCallback((listing: Listing) => {
    if (onEditListing) {
      onEditListing(listing);
    } else {
      router.push(`/listing/${listing.id}/edit` as any);
    }
  }, [onEditListing, router]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (listings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="Нет объявлений"
          subtitle="Создайте первое объявление и начните продавать"
          icon="car-outline"
        >
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigateFromProfile('createListing')}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color={RevolutUltra.textPrimary} />
            <Text style={styles.createButtonText}>Создать объявление</Text>
          </TouchableOpacity>
        </EmptyState>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Все ({counts.all})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Активные ({counts.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'sold' && styles.filterButtonActive]}
          onPress={() => setFilter('sold')}
        >
          <Text style={[styles.filterText, filter === 'sold' && styles.filterTextActive]}>
            Проданные ({counts.sold})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listings grid */}
      <View style={styles.grid}>
        {filteredListings.map((listing, index) => {
          const statusConfig = STATUS_CONFIG[listing.status] || STATUS_CONFIG.active;

          return (
            <Animated.View
              key={listing.id}
              entering={FadeInDown.delay(index * 50)}
              style={styles.cardWrapper}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleListingPress(listing)}
                activeOpacity={0.8}
              >
                {/* Thumbnail */}
                <View style={styles.thumbnail}>
                  {listing.thumbnail_url ? (
                    <Image source={{ uri: listing.thumbnail_url }} style={styles.thumbnailImage} />
                  ) : (
                    <Text style={styles.thumbnailIcon}>
                      {CATEGORY_ICONS[listing.category] || '📦'}
                    </Text>
                  )}
                  {/* Status badge */}
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                    <Text style={styles.statusText}>{statusConfig.label}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={styles.title} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={styles.price}>
                  {listing.price.toLocaleString('ru-RU')} сом
                </Text>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={12} color={RevolutUltra.textSecondary} />
                    <Text style={styles.statText}>{listing.views_count || 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="heart-outline" size={12} color={RevolutUltra.textSecondary} />
                    <Text style={styles.statText}>{listing.likes_count || 0}</Text>
                  </View>
                  {listing.stats?.call_count !== undefined && (
                    <View style={styles.statItem}>
                      <Ionicons name="call-outline" size={12} color={RevolutUltra.textSecondary} />
                      <Text style={styles.statText}>{listing.stats.call_count}</Text>
                    </View>
                  )}
                </View>

                {/* Date */}
                <Text style={styles.date}>{formatDate(listing.created_at)}</Text>

                {/* Edit button */}
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleListingPress(listing)}
                >
                  <Ionicons name="create-outline" size={14} color={RevolutUltra.textPrimary} />
                  <Text style={styles.editButtonText}>Редактировать</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Create new listing card */}
        <TouchableOpacity
          style={styles.createCard}
          onPress={() => navigateFromProfile('createListing')}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={32} color={RevolutUltra.textSecondary} />
          <Text style={styles.createCardText}>Создать объявление</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: RevolutUltra.card,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  filterButtonActive: {
    backgroundColor: RevolutUltra.neutral.light,
    borderColor: RevolutUltra.neutral.light,
  },
  filterText: {
    fontSize: 13,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  filterTextActive: {
    color: RevolutUltra.textPrimary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  cardWrapper: {
    width: '47%',
  },
  card: {
    backgroundColor: RevolutUltra.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  thumbnail: {
    height: 100,
    backgroundColor: RevolutUltra.card2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  thumbnailIcon: {
    fontSize: 48,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    marginBottom: 4,
    minHeight: 36,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  date: {
    fontSize: 11,
    color: RevolutUltra.textSecondary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: RevolutUltra.border,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  createCard: {
    width: '47%',
    height: 180,
    backgroundColor: RevolutUltra.card2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: RevolutUltra.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createCardText: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RevolutUltra.neutral.light,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
});
