import { CategoryType, formatPrice, getCategoryConfig } from '@/config/filterConfig';
import { useUserBehavior } from '@/hooks/useUserBehavior';
import { useAppSelector } from '@/lib/store/hooks';
import { ultra } from '@/lib/theme/ultra';
import { db, supabase } from '@/services/supabase';
import type { Listing } from '@/types';
import { appLogger } from '@/utils/logger';
import { requireAuth } from '@/utils/permissionManager';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { BLURHASH, IMAGE_TRANSITION, getBlurhashByCategory } from '@/constants/blurhash';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScalePress, Shimmer } from '@/components/animations/PremiumAnimations';
import { spacing, fontSize, borderRadius } from '@/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ Types ============
type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low';
type CategoryFilter = 'all' | CategoryType;

interface CategoryTab {
  key: CategoryFilter;
  label: string;
  icon: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'Все', icon: 'grid-outline' },
  { key: 'car', label: 'Авто', icon: 'car-sport-outline' },
  { key: 'horse', label: 'Лошади', icon: 'paw-outline' },
  { key: 'real_estate', label: 'Недвижимость', icon: 'home-outline' },
];

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'newest', label: 'Новые', icon: 'time-outline' },
  { key: 'oldest', label: 'Старые', icon: 'hourglass-outline' },
  { key: 'price_high', label: 'Дорогие', icon: 'trending-up-outline' },
  { key: 'price_low', label: 'Дешёвые', icon: 'trending-down-outline' },
];

// ============ Main Component ============
export default function FavoritesScreen() {
  const router = useRouter();
  const behavior = useUserBehavior();

  // Use Redux auth state (single source of truth)
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Sort
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Load favorites
  const loadFavorites = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(isRefresh);

    try {
      // Use Redux user instead of supabase.auth.getUser()
      if (!isAuthenticated || !user?.id) {
        setFavorites([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: savesData, error } = await db.getUserSaves(user.id);
      if (error) throw error;

      const saves = Array.isArray(savesData) ? savesData : [];
      const listings = saves
        .map((save: any) => ({
          ...save.listing,
          savedAt: save.created_at || new Date().toISOString(),
        }))
        .filter((listing: any) => listing && listing.id) as (Listing & { savedAt: string })[];

      setFavorites(listings);
    } catch (error: any) {
      appLogger.error('[Favorites] Error loading favorites', { error });
      Alert.alert('Ошибка', 'Не удалось загрузить избранное');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...favorites];

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((item) => {
        const cat = item.category?.replace('s', '') as CategoryType;
        return cat === categoryFilter;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date((b as any).savedAt || b.created_at || 0).getTime() -
                 new Date((a as any).savedAt || a.created_at || 0).getTime();
        case 'oldest':
          return new Date((a as any).savedAt || a.created_at || 0).getTime() -
                 new Date((b as any).savedAt || b.created_at || 0).getTime();
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [favorites, categoryFilter, sortOption]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: favorites.length,
      car: 0,
      horse: 0,
      real_estate: 0,
    };

    favorites.forEach((item) => {
      const cat = (item.category?.replace('s', '') || 'car') as CategoryType;
      if (cat in counts) {
        counts[cat]++;
      }
    });

    return counts;
  }, [favorites]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (listingId: string) => {
    if (!requireAuth('save')) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const listing = favorites.find((item) => item.id === listingId);

    try {
      const { getCurrentUserSafe, toggleSave } = await import('@/utils/listingActions');
      const user = await getCurrentUserSafe();
      if (!user) return;

      // Optimistic update
      setFavorites((prev) => prev.filter((item) => item.id !== listingId));

      await toggleSave(user.id, listingId, true, 0);

      // Track unfavorite
      if (listing) {
        const cat = (listing.category?.replace('s', '') || 'car') as CategoryType;
        behavior.trackUnfavorite(listingId, cat);
      }
    } catch (error: any) {
      // Revert
      if (listing) {
        setFavorites((prev) => [...prev, listing]);
      }
      appLogger.error('[Favorites] Error removing', { error });
      Alert.alert('Ошибка', 'Не удалось удалить из избранного');
    }
  }, [favorites, behavior]);

  // Handle listing press
  const handleListingPress = useCallback((item: Listing) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Track view
    const cat = (item.category?.replace('s', '') || 'car') as CategoryType;
    const itemDetails = item.details as any;
    behavior.trackView(item.id, cat, {
      brand: itemDetails?.brand,
      price: item.price,
      city: item.city,
      source: 'favorites',
    });

    router.push(`/car/${item.id}`);
  }, [router, behavior]);

  // Category tab press
  const handleCategoryPress = useCallback((key: CategoryFilter) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCategoryFilter(key);
  }, []);

  // Sort press
  const handleSortPress = useCallback((key: SortOption) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSortOption(key);
    setShowSortMenu(false);
  }, []);

  // Render category tab
  const renderCategoryTab = useCallback(({ item }: { item: CategoryTab }) => {
    const isActive = categoryFilter === item.key;
    const count = categoryCounts[item.key];

    return (
      <TouchableOpacity
        style={[styles.categoryTab, isActive && styles.categoryTabActive]}
        onPress={() => handleCategoryPress(item.key)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.icon as any}
          size={18}
          color={isActive ? ultra.textPrimary : ultra.textSecondary}
        />
        <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
          {item.label}
        </Text>
        {count > 0 && (
          <View style={[styles.categoryBadge, isActive && styles.categoryBadgeActive]}>
            <Text style={[styles.categoryBadgeText, isActive && styles.categoryBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [categoryFilter, categoryCounts, handleCategoryPress]);

  // Loading state with Shimmer
  if (loading && favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Избранное</Text>
        </View>
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.card}>
              <Shimmer width={140} height={140} borderRadius={16} />
              <View style={styles.cardContent}>
                <Shimmer width={SCREEN_WIDTH * 0.4} height={18} borderRadius={4} />
                <Shimmer width={SCREEN_WIDTH * 0.3} height={14} borderRadius={4} style={{ marginTop: 8 }} />
                <Shimmer width={SCREEN_WIDTH * 0.35} height={20} borderRadius={4} style={{ marginTop: 12 }} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Избранное</Text>
          {favorites.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{favorites.length}</Text>
            </View>
          )}
        </View>

        {/* Sort Button */}
        {favorites.length > 0 && (
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={20} color={ultra.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.sortMenu}
        >
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortMenuItem,
                sortOption === option.key && styles.sortMenuItemActive,
              ]}
              onPress={() => handleSortPress(option.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon as any}
                size={18}
                color={sortOption === option.key ? ultra.accent : ultra.textSecondary}
              />
              <Text
                style={[
                  styles.sortMenuText,
                  sortOption === option.key && styles.sortMenuTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Category Tabs */}
      {favorites.length > 0 && (
        <View style={styles.categoryTabsContainer}>
          <LegendList
            horizontal
            data={CATEGORY_TABS}
            renderItem={renderCategoryTab}
            keyExtractor={(item) => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsContent}
            recycleItems={true}
          />
        </View>
      )}

      {/* List — LegendList для максимальной производительности */}
      <LegendList
        data={filteredAndSorted}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFavorites(true)}
            tintColor={ultra.accent}
            colors={[ultra.accent]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            isAuthenticated={isAuthenticated}
            hasFilter={categoryFilter !== 'all'}
            onLogin={() => router.push('/(auth)/register')}
            onClearFilter={() => setCategoryFilter('all')}
          />
        }
        renderItem={({ item, index }: { item: Listing; index: number }) => (
          <FavoriteCard
            listing={item}
            onPress={() => handleListingPress(item)}
            onRemove={() => removeFromFavorites(item.id)}
            index={index}
          />
        )}
        contentContainerStyle={
          filteredAndSorted.length === 0 ? styles.emptyListContainer : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        recycleItems={true}
        drawDistance={500}
      />
    </SafeAreaView>
  );
}

// ============ FavoriteCard Component ============
interface FavoriteCardProps {
  listing: Listing;
  onPress: () => void;
  onRemove: () => void;
  index: number;
}

const FavoriteCard = React.memo<FavoriteCardProps>(({ listing, onPress, onRemove, index }) => {
  const router = useRouter();
  const category = (listing.category?.replace('s', '') || 'car') as CategoryType;
  const details = listing.details as any;
  const [videoPlaying, setVideoPlaying] = useState(false);

  const getTitle = () => {
    if (category === 'car' && details?.brand) {
      return `${details.brand} ${details.model || ''}`.trim();
    }
    if (category === 'horse' && details?.breed) {
      return details.breed;
    }
    return listing.title || 'Объявление';
  };

  const getSubtitle = () => {
    const parts: string[] = [];

    if (category === 'car') {
      if (details?.year) parts.push(String(details.year));
      if (details?.mileage) parts.push(`${(details.mileage / 1000).toFixed(0)}k км`);
    }
    if (category === 'horse') {
      if (details?.age) parts.push(`${details.age} лет`);
    }
    if (listing.city) parts.push(listing.city);

    return parts.join(' • ') || 'Подробнее →';
  };

  const getCategoryIconName = () => {
    switch (category) {
      case 'car': return 'car-sport';
      case 'horse': return 'paw';
      case 'real_estate': return 'home';
      default: return 'cube';
    }
  };

  // Handle Call button
  const handleCall = useCallback((e: any) => {
    e.stopPropagation();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const phone = listing.seller?.phone || details?.phone;
    if (!phone) {
      Alert.alert('Номер недоступен', 'У продавца не указан номер телефона');
      return;
    }

    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Ошибка', 'Не удалось открыть номер телефона');
        }
      })
      .catch(() => {
        Alert.alert('Ошибка', 'Не удалось открыть номер телефона');
      });
  }, [listing.seller, details]);

  // Handle Message button
  const handleMessage = useCallback((e: any) => {
    e.stopPropagation();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!listing.seller?.id) {
      Alert.alert('Недоступно', 'Продавец не найден');
      return;
    }

    // Navigate to chat
    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId: `new_${listing.seller.id}`,
        sellerId: listing.seller.id,
        listingId: listing.id,
      },
    });
  }, [listing.seller, listing.id, router]);

  // Handle video thumbnail press
  const handleVideoPress = useCallback((e: any) => {
    e.stopPropagation();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // For now, just navigate to the listing detail where full video plays
    onPress();
  }, [onPress]);

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      layout={Layout.springify()}
    >
      <ScalePress scale={0.98}>
        <Pressable style={styles.card} onPress={onPress}>
          {/* Image/Video Preview */}
          <Pressable style={styles.imageContainer} onPress={handleVideoPress}>
            {listing.thumbnail_url ? (
              <Image
                source={{ uri: listing.thumbnail_url }}
                placeholder={{ blurhash: getBlurhashByCategory(listing.category) }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={IMAGE_TRANSITION.FAST}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color={ultra.textMuted} />
              </View>
            )}

            {/* Category Badge */}
            <View style={styles.categoryIconBadge}>
              <Ionicons name={getCategoryIconName() as any} size={16} color="#FFF" />
            </View>

            {/* Video Play Overlay */}
            {listing.video_url && (
              <View style={styles.videoPlayOverlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={24} color="#FFF" />
                </View>
              </View>
            )}
          </Pressable>

          {/* Content */}
          <View style={styles.cardContent}>
            {/* Top Row: Title + Remove Button */}
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {getTitle()}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={24} color={ultra.accent} />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {getSubtitle()}
            </Text>

            {/* Price */}
            <Text style={styles.cardPrice}>
              {formatPrice(listing.price)} сом
            </Text>

            {/* Seller Info */}
            {listing.seller && (
              <View style={styles.sellerRow}>
                {listing.seller.avatar_url ? (
                  <Image
                    source={{ uri: listing.seller.avatar_url }}
                    placeholder={{ blurhash: BLURHASH.AVATAR }}
                    style={styles.sellerAvatar}
                    contentFit="cover"
                    transition={IMAGE_TRANSITION.FAST}
                  />
                ) : (
                  <View style={styles.sellerAvatarPlaceholder}>
                    <Ionicons name="person" size={12} color="#FFF" />
                  </View>
                )}
                <Text style={styles.sellerName} numberOfLines={1}>
                  {listing.seller.name || 'Продавец'}
                </Text>
              </View>
            )}

            {/* Action Buttons: Call & Message */}
            <View style={styles.actionButtons}>
              <ScalePress scale={0.95}>
                <Pressable style={styles.callButton} onPress={handleCall}>
                  <Ionicons name="call" size={16} color="#FFF" />
                  <Text style={styles.callButtonText}>Позвонить</Text>
                </Pressable>
              </ScalePress>

              <ScalePress scale={0.95}>
                <Pressable style={styles.messageButton} onPress={handleMessage}>
                  <Ionicons name="chatbubble" size={16} color={ultra.accent} />
                  <Text style={styles.messageButtonText}>Написать</Text>
                </Pressable>
              </ScalePress>
            </View>
          </View>
        </Pressable>
      </ScalePress>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // ⚡ Custom comparator — ререндер только при реальных изменениях
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.listing.price === nextProps.listing.price &&
    prevProps.listing.thumbnail_url === nextProps.listing.thumbnail_url &&
    prevProps.index === nextProps.index
  );
});

FavoriteCard.displayName = 'FavoriteCard';

// ============ EmptyState Component ============
interface EmptyStateProps {
  isAuthenticated: boolean;
  hasFilter: boolean;
  onLogin: () => void;
  onClearFilter: () => void;
}

const EmptyState = React.memo<EmptyStateProps>(({
  isAuthenticated,
  hasFilter,
  onLogin,
  onClearFilter,
}) => {
  if (!isAuthenticated) {
    return (
      <Animated.View style={styles.emptyContainer} entering={FadeIn.duration(400)}>
        <View style={styles.emptyIconContainer}>
          <LinearGradient
            colors={[ultra.gradientStart, ultra.gradientEnd]}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="heart-outline" size={48} color="#FFF" />
          </LinearGradient>
        </View>
        <Text style={styles.emptyTitle}>Войдите в аккаунт</Text>
        <Text style={styles.emptySubtitle}>
          Сохраняйте понравившиеся объявления{'\n'}и получайте уведомления об изменении цен
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={onLogin}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ultra.gradientStart, ultra.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginButtonGradient}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.loginButtonText}>Войти</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (hasFilter) {
    return (
      <Animated.View style={styles.emptyContainer} entering={FadeIn.duration(400)}>
        <Ionicons name="search-outline" size={64} color={ultra.textMuted} />
        <Text style={styles.emptyTitle}>Ничего не найдено</Text>
        <Text style={styles.emptySubtitle}>
          В этой категории пока нет сохранённых объявлений
        </Text>
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={onClearFilter}
          activeOpacity={0.8}
        >
          <Text style={styles.clearFilterText}>Показать все</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={styles.emptyContainer} entering={FadeIn.duration(400)}>
      <View style={styles.emptyIconContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="heart-outline" size={48} color={ultra.textMuted} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Пока пусто</Text>
      <Text style={styles.emptySubtitle}>
        Нажмите ❤️ на понравившемся объявлении,{'\n'}чтобы сохранить его здесь
      </Text>
    </Animated.View>
  );
});

EmptyState.displayName = 'EmptyState';

// ============ Styles ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  header: {
    paddingTop: Platform.select({ ios: 8, android: 6 }),
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: ultra.textPrimary,
  },
  headerBadge: {
    backgroundColor: ultra.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  sortButton: {
    padding: 10,
    backgroundColor: ultra.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  sortMenu: {
    position: 'absolute',
    top: Platform.select({ ios: 110, android: 100 }),
    right: 16,
    backgroundColor: ultra.card,
    borderRadius: 16,
    padding: 8,
    zIndex: 100,
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sortMenuItemActive: {
    backgroundColor: ultra.surface,
  },
  sortMenuText: {
    fontSize: 15,
    color: ultra.textSecondary,
    fontWeight: '500',
  },
  sortMenuTextActive: {
    color: ultra.accent,
    fontWeight: '600',
  },
  categoryTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: ultra.surface,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  categoryTabActive: {
    backgroundColor: ultra.accent,
    borderColor: ultra.accent,
  },
  categoryTabText: {
    fontSize: 14,
    color: ultra.textSecondary,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: ultra.textPrimary,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: ultra.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
  },
  categoryBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryBadgeText: {
    fontSize: 11,
    color: ultra.textMuted,
    fontWeight: '600',
  },
  categoryBadgeTextActive: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ultra.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ultra.border,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ultra.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: ultra.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    width: '100%',
    maxWidth: 240,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: 28,
  },
  loginButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  clearFilterButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: ultra.surface,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  clearFilterText: {
    fontSize: 15,
    color: ultra.accent,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: ultra.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    width: 140,
    height: 140,
    backgroundColor: ultra.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardContent: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: ultra.textPrimary,
    lineHeight: 20,
  },
  removeButton: {
    padding: spacing.xs,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: ultra.textSecondary,
    marginTop: spacing.xs,
  },
  cardPrice: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: ultra.accentSecondary,
    marginTop: spacing.xs,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sellerAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ultra.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: fontSize.xs,
    color: ultra.textMuted,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: ultra.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  callButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#FFF',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: ultra.surface,
    borderWidth: 1,
    borderColor: ultra.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  messageButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: ultra.accent,
  },
});
