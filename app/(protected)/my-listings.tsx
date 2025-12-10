/**
 * Единый Seller Dashboard
 * Показывает все объявления продавца: авто, лошади, недвижимость
 * Группировка по типам с красивым UI
 */

import BoostModal from '@/components/Boost/BoostModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { formatPriceWithUSD } from '@/constants/currency';
import { normalizeVideoUrl } from '@/lib/video/videoSource';
import { ultra } from '@/lib/theme/ultra';
import { auth } from '@/services/auth';
import { db, supabase } from '@/services/supabase';
import { Listing } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import {
  getCurrentUserSafe,
  openCall,
  openChat,
  toggleLike,
  toggleSave,
  triggerHaptic,
  validateOwner,
} from '@/utils/listingActions';
import { appLogger } from '@/utils/logger';
import { isOwner, requireAuth } from '@/utils/permissionManager';

// Типы объявлений
type ListingType = 'car' | 'horse' | 'real_estate';

// Группировка объявлений по типам
interface GroupedListings {
  car: Listing[];
  horse: Listing[];
  real_estate: Listing[];
}

// Иконки для категорий
const CATEGORY_ICONS: Record<ListingType, string> = {
  car: '🚗',
  horse: '🐴',
  real_estate: '🏠',
};

const CATEGORY_LABELS: Record<ListingType, string> = {
  car: 'Авто',
  horse: 'Лошади',
  real_estate: 'Недвижимость',
};

// Компонент карточки объявления
interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onLike: () => void;
  onSave: () => void;
  onChat: () => void;
  onCall: () => void;
  onBoost: () => void;
  onEdit: () => void;
  isOwner: boolean;
}

const ListingCard = React.memo<ListingCardProps>(
  ({ listing, onPress, onLike, onSave, onChat, onCall, onBoost, onEdit, isOwner }) => {
    const priceInfo = useMemo(() => formatPriceWithUSD(listing.price || 0), [listing.price]);
    const thumbnailUrl = useMemo(() => {
      if (listing.thumbnail_url) {
        return normalizeVideoUrl(listing.thumbnail_url);
      }
      if (listing.video_url) {
        return normalizeVideoUrl(listing.video_url);
      }
      return undefined;
    }, [listing.thumbnail_url, listing.video_url]);

    const categoryIcon = CATEGORY_ICONS[listing.category as ListingType] || '📦';
    const statusColor =
      listing.status === 'active'
        ? ultra.accent
        : listing.status === 'sold'
          ? '#FF3B30'
          : ultra.textMuted;

    return (
      <Animated.View entering={FadeInDown}>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {thumbnailUrl ? (
              <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.thumbnailIcon}>{categoryIcon}</Text>
              </View>
            )}

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {listing.status === 'active'
                  ? 'Активно'
                  : listing.status === 'sold'
                    ? 'Продано'
                    : 'Истекло'}
              </Text>
            </View>

            {/* Boost Badge */}
            {listing.is_promoted && (
              <View style={styles.boostBadge}>
                <Ionicons name="flash" size={12} color="#FFF" />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {listing.title || 'Объявление'}
            </Text>
            <Text style={styles.cardPrice}>{priceInfo.kgs}</Text>
            <Text style={styles.cardPriceUSD}>{priceInfo.usd}</Text>

            {/* Stats */}
            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color={ultra.textMuted} />
                <Text style={styles.statText}>{listing.views || listing.views_count || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name={listing.is_liked ? 'heart' : 'heart-outline'}
                  size={14}
                  color={listing.is_liked ? ultra.accent : ultra.textMuted}
                />
                <Text style={styles.statText}>{listing.likes || listing.likes_count || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name={listing.is_saved ? 'bookmark' : 'bookmark-outline'}
                  size={14}
                  color={listing.is_saved ? ultra.accentSecondary : ultra.textMuted}
                />
                <Text style={styles.statText}>{listing.saves || listing.saves_count || 0}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          {isOwner && (
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                <Ionicons name="create-outline" size={18} color={ultra.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={onBoost}>
                <Ionicons name="flash-outline" size={18} color="#FFD60A" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);
ListingCard.displayName = 'ListingCard';

// Компонент секции с группировкой
interface SectionProps {
  type: ListingType;
  listings: Listing[];
  onListingPress: (listing: Listing) => void;
  onListingLike: (listing: Listing) => void;
  onListingSave: (listing: Listing) => void;
  onListingChat: (listing: Listing) => void;
  onListingCall: (listing: Listing) => void;
  onListingBoost: (listing: Listing) => void;
  onListingEdit: (listing: Listing) => void;
  isOwner: (listing: Listing) => boolean;
}

const Section = React.memo<SectionProps>(
  ({
    type,
    listings,
    onListingPress,
    onListingLike,
    onListingSave,
    onListingChat,
    onListingCall,
    onListingBoost,
    onListingEdit,
    isOwner,
  }) => {
    if (listings.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{CATEGORY_ICONS[type]}</Text>
          <Text style={styles.sectionTitle}>
            {CATEGORY_LABELS[type]} ({listings.length})
          </Text>
        </View>
        <View style={styles.sectionGrid}>
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPress={() => onListingPress(listing)}
              onLike={() => onListingLike(listing)}
              onSave={() => onListingSave(listing)}
              onChat={() => onListingChat(listing)}
              onCall={() => onListingCall(listing)}
              onBoost={() => onListingBoost(listing)}
              onEdit={() => onListingEdit(listing)}
              isOwner={isOwner(listing)}
            />
          ))}
        </View>
      </View>
    );
  }
);
Section.displayName = 'Section';

// Skeleton Loader
const SkeletonCard = () => (
  <View style={styles.card}>
    <Skeleton width="100%" height={180} borderRadius={12} />
    <View style={styles.cardInfo}>
      <Skeleton width="80%" height={16} borderRadius={4} />
      <Skeleton width="60%" height={20} borderRadius={4} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Skeleton width={60} height={14} borderRadius={4} />
        <Skeleton width={60} height={14} borderRadius={4} />
        <Skeleton width={60} height={14} borderRadius={4} />
      </View>
    </View>
  </View>
);

export default function MyListingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedListingForBoost, setSelectedListingForBoost] = useState<Listing | null>(null);

  // Группировка объявлений по типам
  const groupedListings = useMemo<GroupedListings>(() => {
    const grouped: GroupedListings = {
      car: [],
      horse: [],
      real_estate: [],
    };

    listings.forEach((listing) => {
      const category = listing.category?.toLowerCase();
      if (category === 'car' || category === 'cars') {
        grouped.car.push(listing);
      } else if (category === 'horse' || category === 'horses') {
        grouped.horse.push(listing);
      } else if (category === 'real_estate' || category === 'realestate') {
        grouped.real_estate.push(listing);
      }
    });

    return grouped;
  }, [listings]);

  // Загрузка пользователя
  const loadUser = useCallback(async () => {
    try {
      const user = await getCurrentUserSafe();
      setCurrentUser(user);
      return user;
    } catch (error) {
      appLogger.error('[MyListings] Error loading user', { error });
      return null;
    }
  }, []);

  // Загрузка объявлений
  const loadListings = useCallback(
    async (isRefresh = false) => {
      if (!currentUser?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

        console.log('[MyListings] Fetching listings for user:', currentUser.id);
        const { data, error } = await db.getSellerListings(currentUser.id);
        const dataArray = Array.isArray(data) ? data : [];
        console.log('[MyListings] Result:', { data: dataArray.length, error });

      if (error) throw error;

        // Загружаем информацию о лайках и сохранениях для каждого объявления
        const listingsArray = Array.isArray(data) ? data : [];
        const listingsWithInteractions = await Promise.all(
          listingsArray.map(async (listing: Listing) => {
            const [likedRes, savedRes] = await Promise.all([
              db.checkUserLiked(currentUser.id, listing.id),
              db.checkUserSaved(currentUser.id, listing.id),
            ]);

            return {
              ...listing,
              is_liked: !!likedRes.data,
              is_saved: !!savedRes.data,
            };
          })
        );

        setListings(listingsWithInteractions);
    } catch (error) {
        appLogger.error('[MyListings] Error loading listings', { error });
        if (!isRefresh) {
      Alert.alert('Ошибка', 'Не удалось загрузить объявления');
        }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    },
    [currentUser]
  );

  // Инициализация
  useEffect(() => {
    const init = async () => {
      const user = await loadUser();
      if (user) {
        await loadListings();
      }
    };
    init();
  }, []);

  // Обработчики действий
  const handleListingPress = useCallback(
    (listing: Listing) => {
      triggerHaptic('light');
      const routeMap: Record<string, string> = {
        car: '/car',
        cars: '/car',
        horse: '/car', // TODO: создать /horse/[id]
        horses: '/car',
        real_estate: '/car', // TODO: создать /real-estate/[id]
        realestate: '/car',
      };
      const route = routeMap[listing.category?.toLowerCase() || 'car'] || '/car';
      router.push(`${route}/${listing.id}` as any);
    },
    [router]
  );

  const handleLike = useCallback(
    async (listing: Listing) => {
      if (!requireAuth('like')) return;
      if (!currentUser) return;

      triggerHaptic('medium');

      try {
        const result = await toggleLike(
          currentUser.id,
          listing.id,
          !!listing.is_liked,
          listing.likes || listing.likes_count || 0
        );

        setListings((prev) =>
          prev.map((l) =>
            l.id === listing.id
              ? { ...l, is_liked: result.isLiked, likes: result.likesCount, likes_count: result.likesCount }
              : l
          )
        );
      } catch (error) {
        appLogger.error('[MyListings] Error toggling like', { error });
      }
    },
    [currentUser]
  );

  const handleSave = useCallback(
    async (listing: Listing) => {
      if (!requireAuth('save')) return;
      if (!currentUser) return;

      triggerHaptic('medium');

      try {
        const result = await toggleSave(
          currentUser.id,
          listing.id,
          !!listing.is_saved,
          listing.saves || listing.saves_count || 0
        );

        setListings((prev) =>
          prev.map((l) =>
            l.id === listing.id
              ? { ...l, is_saved: result.isSaved, saves: result.savesCount, saves_count: result.savesCount }
              : l
          )
        );
      } catch (error) {
        appLogger.error('[MyListings] Error toggling save', { error });
      }
    },
    [currentUser]
  );

  const handleChat = useCallback(
    async (listing: Listing) => {
      if (!requireAuth('message')) return;
      if (!currentUser) return;
      
      // Используем seller_id или seller_user_id (для совместимости)
      const sellerId = (listing as any).seller_user_id || listing.seller_id;
      if (!sellerId) return;

      triggerHaptic('medium');

      try {
        const conversationId = await openChat(currentUser.id, sellerId, listing.id);
        if (conversationId) {
          router.push({
            pathname: '/chat/[conversationId]',
            params: { conversationId },
          });
        }
      } catch (error) {
        appLogger.error('[MyListings] Error opening chat', { error });
      }
    },
    [currentUser, router]
  );

  const handleCall = useCallback(
    (listing: Listing) => {
      if (!requireAuth('call')) return;
      if (!listing.seller?.phone) {
        Alert.alert('Ошибка', 'Номер телефона не указан');
        return;
      }

      triggerHaptic('medium');
      openCall(listing.seller.phone);
    },
    []
  );

  const handleBoost = useCallback(
    (listing: Listing) => {
      if (!requireAuth('boost')) return;
      if (!currentUser || !validateOwner(currentUser, listing)) {
        Alert.alert('Ошибка', 'Только владелец может продвигать объявление');
        return;
      }

      triggerHaptic('medium');
      setSelectedListingForBoost(listing);
      setShowBoostModal(true);
    },
    [currentUser]
  );

  const handleEdit = useCallback(
    (listing: Listing) => {
      if (!requireAuth('edit')) return;
      if (!currentUser || !validateOwner(currentUser, listing)) {
        Alert.alert('Ошибка', 'Только владелец может редактировать объявление');
        return;
      }

      triggerHaptic('light');
      router.push(`/(protected)/listing/${listing.id}/edit`);
    },
    [currentUser, router]
  );

  const checkIsOwner = useCallback(
    (listing: Listing): boolean => {
      if (!currentUser) return false;
      return isOwner(currentUser, listing);
    },
    [currentUser]
  );

  // Empty State
  const renderEmpty = () => (
    <EmptyState
      title="У вас пока нет объявлений"
      subtitle="Создайте первое объявление, чтобы начать продавать 🚀"
      icon="cube-outline"
      iconColor={ultra.textMuted}
      backgroundColor={ultra.background}
    >
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => {
          if (requireAuth('create')) {
            router.push('/(tabs)/upload');
          }
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[ultra.gradientStart, ultra.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyButtonGradient}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.emptyButtonText}>Создать объявление</Text>
        </LinearGradient>
      </TouchableOpacity>
    </EmptyState>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={ultra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мои объявления</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (requireAuth('create')) {
              router.push('/(tabs)/upload');
            }
          }}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <ScrollView contentContainerStyle={styles.loadingContainer}>
          <View style={styles.skeletonGrid}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
        </View>
        </ScrollView>
      ) : listings.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>{renderEmpty()}</ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadListings(true)}
              tintColor={ultra.accent}
              colors={[ultra.accent]}
            />
          }
        >
          <Section
            type="car"
            listings={groupedListings.car}
            onListingPress={handleListingPress}
            onListingLike={handleLike}
            onListingSave={handleSave}
            onListingChat={handleChat}
            onListingCall={handleCall}
            onListingBoost={handleBoost}
            onListingEdit={handleEdit}
            isOwner={checkIsOwner}
          />
          <Section
            type="horse"
            listings={groupedListings.horse}
            onListingPress={handleListingPress}
            onListingLike={handleLike}
            onListingSave={handleSave}
            onListingChat={handleChat}
            onListingCall={handleCall}
            onListingBoost={handleBoost}
            onListingEdit={handleEdit}
            isOwner={checkIsOwner}
          />
          <Section
            type="real_estate"
            listings={groupedListings.real_estate}
            onListingPress={handleListingPress}
            onListingLike={handleLike}
            onListingSave={handleSave}
            onListingChat={handleChat}
            onListingCall={handleCall}
            onListingBoost={handleBoost}
            onListingEdit={handleEdit}
            isOwner={checkIsOwner}
          />
        </ScrollView>
      )}

      {/* Boost Modal */}
      {selectedListingForBoost && currentUser && (
        <BoostModal
          visible={showBoostModal}
          onClose={() => {
            setShowBoostModal(false);
            setSelectedListingForBoost(null);
          }}
          carId={selectedListingForBoost.id}
          userId={currentUser.id}
          carName={selectedListingForBoost.title || 'Объявление'}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ultra.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: ultra.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
  },
  thumbnailContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: ultra.surface,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ultra.surface,
  },
  thumbnailIcon: {
    fontSize: 48,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  boostBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textPrimary,
    marginBottom: 6,
    minHeight: 36,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.accent,
    marginBottom: 2,
  },
  cardPriceUSD: {
    fontSize: 12,
    color: ultra.textMuted,
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: ultra.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: ultra.border,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ultra.surface,
    borderRadius: 8,
  },
  emptyButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

