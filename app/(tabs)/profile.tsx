/**
 * Profile Screen V5 - Revolut Ultra Neutral Edition
 * Unified Buyer+Seller UX with clean visual hierarchy
 * Only Ultra-neutral palette (no colors)
 */

import ListingsTab from '@/components/Profile/ListingsTab';
import LogoutSheet from '@/components/Profile/LogoutSheet';
import ProfileActionGrid from '@/components/Profile/ProfileActionGrid';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { logout } from '@/lib/store/slices/authSlice';
import { RevolutUltra } from '@/lib/theme/colors';
import { auth } from '@/services/auth';
import { db, supabase } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import { requireAuth } from '@/utils/permissionManager';
import { navigateFromProfile } from '@/utils/profileNavigator';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton } from '@/components/ui/PremiumButton';

// TabType imported from ProfileTabs

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  city?: string;
  bio?: string;
  is_verified?: boolean;
  created_at?: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  status: 'active' | 'sold' | 'pending_review' | 'archived';
  views_count?: number;
  likes_count?: number;
  thumbnail_url?: string;
  video_hls_url?: string;
  created_at?: string;
  seller?: { id: string; name: string; avatar_url?: string };
  stats?: { call_count?: number; message_count?: number; share_count?: number } | null;
}

interface Conversation {
  id: string;
  other_user: { id: string; name: string; avatar_url?: string };
  last_message: { text: string; created_at: string };
  unread_count: number;
  listing?: { id: string; title: string };
}

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token, isLoading } = useAppSelector((state) => state.auth);

  // DEBUG: Log auth state when entering profile
  useEffect(() => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       👤 PROFILE SCREEN - AUTH STATE DEBUG 👤               ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║ STEP 3: Checking Redux State in Profile                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('[DEBUG] Redux auth state:');
    console.log('[DEBUG]   isAuthenticated:', isAuthenticated);
    console.log('[DEBUG]   isLoading:', isLoading);
    console.log('[DEBUG]   hasUser:', !!user);
    console.log('[DEBUG]   hasToken:', !!token);

    if (user) {
      console.log('');
      console.log('[DEBUG] ✅ USER DATA FROM REDUX:');
      console.log('[DEBUG]   id:', user.id);
      console.log('[DEBUG]   phone:', user.phone);
      console.log('[DEBUG]   name:', user.name);
      console.log('[DEBUG]   avatar_url:', user.avatar_url);
      console.log('[DEBUG]   free_limit:', user.free_limit);
      console.log('[DEBUG]   paid_slots:', user.paid_slots);
    } else {
      console.log('');
      console.log('[DEBUG] ❌ NO USER IN REDUX STATE');
    }

    // VERIFY: Check if user.id and user.phone exist
    if (isAuthenticated && user) {
      console.log('');
      console.log('[DEBUG] Validation checks:');
      if (!user.id) {
        console.error('[DEBUG] ❌ CRITICAL: user.id is MISSING!');
      } else {
        console.log('[DEBUG] ✅ user.id exists:', user.id);
      }
      if (!user.phone) {
        console.warn('[DEBUG] ⚠️ WARNING: user.phone is MISSING');
      } else {
        console.log('[DEBUG] ✅ user.phone exists:', user.phone);
      }
      if (!user.name || user.name === 'Пользователь') {
        console.warn('[DEBUG] ⚠️ WARNING: user.name not set or is default');
      } else {
        console.log('[DEBUG] ✅ user.name exists:', user.name);
      }
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║ END PROFILE AUTH DEBUG                                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  }, [isAuthenticated, isLoading, user, token]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);

  const totalUnread = useMemo(() => conversations.reduce((sum, c) => sum + c.unread_count, 0), [conversations]);

  const loadEverything = useCallback(
    async (isPull = false) => {
      if (!isAuthenticated || !user?.id) {
        setProfile(null);
        setListings([]);
        setFavorites([]);
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!isPull) setLoading(true);
      setRefreshing(isPull);

      if (isPull && Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const currentUser = user;

      try {
        const [profileRes, listingsRes, favoritesRes, convRes] = await Promise.allSettled([
          db.getUserById(currentUser.id).catch((err: any) => {
            appLogger.warn('[Profile] Error loading user profile', { error: err, userId: currentUser.id });
            return { data: null, error: err };
          }),
          Promise.resolve(
            supabase
              .from('listings')
              .select('*')
              .eq('seller_user_id', currentUser.id)
              .order('created_at', { ascending: false })
          ).catch((err: any) => {
            appLogger.warn('[Profile] Error loading listings', { error: err, userId: currentUser.id });
            return { data: null, error: err };
          }),
          db.getUserSaves(currentUser.id).catch((err: any) => {
            appLogger.warn('[Profile] Error loading favorites', { error: err, userId: currentUser.id });
            return { data: [], error: err };
          }),
          db.getUserConversations(currentUser.id).catch((err: any) => {
            appLogger.warn('[Profile] Error loading conversations', { error: err, userId: currentUser.id });
            return { data: [], error: err };
          }),
        ]);

        // Профиль
        if (profileRes.status === 'fulfilled' && profileRes.value?.data && typeof profileRes.value.data === 'object') {
          try {
            const profileData = profileRes.value.data as any;
            setProfile({
              id: profileData.id || currentUser.id,
              name: profileData.name || currentUser.name || 'Пользователь',
              phone: profileData.phone || currentUser.phone || '',
              avatar_url: profileData.avatar_url || undefined,
              city: profileData.city || undefined,
              bio: profileData.bio || undefined,
              is_verified: profileData.is_verified || false,
              created_at: profileData.created_at || undefined,
            });
          } catch (err) {
            appLogger.error('[Profile] Error setting profile data', { error: err });
          }
        } else {
          setProfile((prev) =>
            prev ??
            {
              id: currentUser.id,
              name: currentUser.name || 'Пользователь',
              phone: currentUser.phone || '',
            }
          );
        }

        // Мои объявления
        if (listingsRes.status === 'fulfilled' && listingsRes.value?.data) {
          try {
            const all = Array.isArray(listingsRes.value.data) ? (listingsRes.value.data as Listing[]) : [];
            setListings(all);
          } catch (err) {
            appLogger.error('[Profile] Error processing listings', { error: err });
            setListings([]);
          }
        } else {
          setListings([]);
        }

        // Избранное
        if (favoritesRes.status === 'fulfilled' && favoritesRes.value?.data && Array.isArray(favoritesRes.value.data)) {
          try {
            const saves = favoritesRes.value.data as any[];
            const favListings = saves
              .map((save: any) => save.listing)
              .filter((listing: any) => listing && listing.id) as Listing[];
            setFavorites(favListings);
          } catch (err) {
            appLogger.error('[Profile] Error processing favorites', { error: err });
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }

        // Сообщения
        if (convRes.status === 'fulfilled' && convRes.value?.data && Array.isArray(convRes.value.data)) {
          const formatted = convRes.value.data
            .filter((c: any) => c && c.id)
            .map((c: any) => {
              try {
                const isBuyer = c.buyer?.id === currentUser.id;
                const otherUser = isBuyer ? c.seller : c.buyer;

                return {
                  id: c.id,
                  other_user: {
                    id: otherUser?.id || 'unknown',
                    name: otherUser?.name || 'Пользователь',
                    avatar_url: otherUser?.avatar_url || undefined,
                  },
                  last_message: {
                    text: c.last_message || 'Фото',
                    created_at: c.last_message_at || new Date().toISOString(),
                  },
                  unread_count: Number(c.unread_count) || 0,
                  listing:
                    c.listing && c.listing.id && c.listing.title
                      ? { id: c.listing.id, title: c.listing.title }
                      : undefined,
                };
              } catch (err) {
                appLogger.warn('[Profile] Error formatting conversation', { error: err, conversation: c });
                return null;
              }
            })
            .filter((c: any) => c !== null);
          setConversations(formatted as Conversation[]);
        } else {
          setConversations([]);
        }
      } catch (error: any) {
        appLogger.error('[Profile] Error loading data', {
          error: error?.message || error,
          stack: error?.stack,
          userId: currentUser?.id,
        });

        setProfile((prev) =>
          prev ??
          {
            id: currentUser?.id || '',
            name: currentUser?.name || 'Пользователь',
            phone: currentUser?.phone || '',
          }
        );
        setListings([]);
        setFavorites([]);
        setConversations([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, user]
  );

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadEverything();
    } else {
      setLoading(false);
      setRefreshing(false);
      setProfile(null);
      setListings([]);
      setFavorites([]);
      setConversations([]);
    }
  }, [isAuthenticated, user?.id, loadEverything]);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      dispatch(logout());
      setShowLogoutSheet(false);
      router.replace('/(tabs)');
    } catch (error: any) {
      appLogger.error('[Profile] Logout error', { error });
    }
  }, [dispatch, router]);

  const handleListingPress = useCallback(
    (listing: Listing) => {
      // Always edit listing from profile
      if (requireAuth('edit')) {
        router.push(`/(protected)/listing/${listing.id}/edit`);
      }
    },
    [router]
  );

  if (loading && !refreshing) return <LoadingOverlay message="Загрузка профиля..." />;

  // Guest view
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.guestContainer} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp} style={styles.guestContent}>
            <View style={styles.guestAvatar}>
              <Ionicons name="person-outline" size={60} color={RevolutUltra.textSecondary} />
            </View>
            <Text style={styles.guestTitle}>Гость</Text>
            <Text style={styles.guestSubtitle}>Войдите, чтобы пользоваться функциями</Text>

            <PremiumButton
              variant="primary"
              size="xl"
              fullWidth
              onPress={() => router.push('/(auth)/register')}
              haptic="medium"
              style={styles.guestButton}
            >
              Войти / Создать аккаунт
            </PremiumButton>

            <PremiumButton
              variant="ghost"
              size="lg"
              onPress={() => router.back()}
              haptic="light"
            >
              Продолжить просмотр
            </PremiumButton>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEverything(true)}
            tintColor={RevolutUltra.textPrimary}
            colors={[RevolutUltra.textPrimary]}
          />
        }
      >
        {/* (1) Hero Block — V7 Ultra Neutral Final */}
        <Animated.View entering={FadeInUp}>
          <LinearGradient
            colors={RevolutUltra.gradientProfile || RevolutUltra.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.hero}
          >
            {/* Settings Button - Top Right */}
            {isAuthenticated && (
              <PremiumButton
                variant="icon"
                size="sm"
                style={styles.settingsBtn}
                onPress={() => navigateFromProfile('settings')}
                haptic="light"
              >
                <Ionicons name="settings-outline" size={22} color={RevolutUltra.textPrimary} />
              </PremiumButton>
            )}
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={56} color={RevolutUltra.textSecondary} />
                </View>
              )}
              {isAuthenticated && (
                <PremiumButton
                  variant="icon"
                  size="sm"
                  style={styles.editAvatarBtn}
                  onPress={() => navigateFromProfile('edit')}
                  haptic="light"
                >
                  <Ionicons name="create-outline" size={14} color={RevolutUltra.textPrimary} />
                </PremiumButton>
              )}
            </View>
            <Text style={styles.name}>
              {isAuthenticated 
                ? (profile?.name && profile.name.trim() && profile.name !== 'Пользователь' 
                    ? profile.name 
                    : 'Пользователь')
                : 'Пользователь / Гость'}
            </Text>
            <Text style={styles.phone}>
              {isAuthenticated 
                ? (profile?.phone || user?.phone || '')
                : 'Гость'}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Guest CTA — V7 Ultra Neutral */}
        {!isAuthenticated && (
          <Animated.View entering={FadeInUp.delay(50)} style={styles.guestCTAContainer}>
            <PremiumButton
              variant="primary"
              size="xl"
              fullWidth
              onPress={() => {
                if (requireAuth('view' as any)) {
                  router.push('/(auth)/register');
                }
              }}
              haptic="medium"
              style={styles.guestPrimaryButton}
            >
              Войти / Создать аккаунт
            </PremiumButton>
            
            <PremiumButton
              variant="ghost"
              size="lg"
              onPress={() => {
                // Продолжить просмотр - просто закрываем или ничего не делаем
              }}
              haptic="light"
            >
              Продолжить просмотр
            </PremiumButton>
          </Animated.View>
        )}

        {/* (2) Buyer Quick Row + (3) Seller Quick Row — V8 Ultra Routing */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <ProfileActionGrid
            isAuthenticated={isAuthenticated}
            showSellerRow={isAuthenticated}
            unreadCount={totalUnread}
            favoritesCount={favorites.length}
          />
        </Animated.View>

        {/* (4) My Listings Section — Мои объявления */}
        {isAuthenticated && (
          <Animated.View entering={FadeIn.delay(300)}>
            <View style={styles.listingsHeader}>
              <Ionicons name="hammer-outline" size={20} color={RevolutUltra.textPrimary} />
              <Text style={styles.listingsTitle}>Мои объявления</Text>
              <View style={styles.listingsCount}>
                <Text style={styles.listingsCountText}>{listings.length}</Text>
              </View>
            </View>
            <ListingsTab
              listings={listings}
              onEditListing={handleListingPress}
            />
          </Animated.View>
        )}

        {/* (6) Logout / Login Button */}
        <View style={styles.logoutSection}>
          {isAuthenticated ? (
            <PremiumButton
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => setShowLogoutSheet(true)}
              haptic="warning"
              style={styles.logoutButton}
            >
              <View style={styles.logoutButtonContent}>
                <Ionicons name="exit-outline" size={20} color={RevolutUltra.textPrimary} />
                <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
              </View>
            </PremiumButton>
          ) : (
            <PremiumButton
              variant="primary"
              size="xl"
              fullWidth
              onPress={() => router.push('/(auth)/register')}
              haptic="medium"
              style={styles.loginButton}
            >
              Войти / Создать аккаунт
            </PremiumButton>
          )}
        </View>
      </ScrollView>

      {/* Logout Sheet */}
      <LogoutSheet
        visible={showLogoutSheet}
        onClose={() => setShowLogoutSheet(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RevolutUltra.bg,
  },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: Platform.select({ ios: 24, android: 20, default: 24 }),
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  settingsBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 12,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RevolutUltra.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  editAvatarBtn: {
    position: 'absolute',
    right: -4,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RevolutUltra.card,
    borderWidth: 1.5,
    borderColor: RevolutUltra.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  name: {
    fontSize: Platform.select({ ios: 28, android: 26, default: 28 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: Platform.select({ ios: 4, android: 3, default: 4 }),
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  phone: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: RevolutUltra.textSecondary,
    opacity: 0.7,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  listingCard: {
    width: '47%',
    backgroundColor: RevolutUltra.card,
    borderRadius: Platform.select({ ios: 18, android: 16, default: 18 }),
    padding: Platform.select({ ios: 12, android: 10, default: 12 }),
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  thumb: {
    height: Platform.select({ ios: 110, android: 100, default: 110 }),
    backgroundColor: RevolutUltra.card2,
    borderRadius: Platform.select({ ios: 14, android: 12, default: 14 }),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    position: 'relative',
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  thumbIcon: {
    fontSize: 56,
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
    color: RevolutUltra.textPrimary,
    fontWeight: '700',
  },
  listingTitle: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    marginBottom: Platform.select({ ios: 6, android: 5, default: 6 }),
    minHeight: Platform.select({ ios: 36, android: 34, default: 36 }),
    lineHeight: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  price: {
    fontSize: Platform.select({ ios: 17, android: 16, default: 17 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
  },
  createButton: {
    width: '47%',
    height: 120,
    backgroundColor: RevolutUltra.card2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: RevolutUltra.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: RevolutUltra.textSecondary,
  },
  messages: {
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  msgItem: {
    flexDirection: 'row',
    backgroundColor: RevolutUltra.card,
    borderRadius: Platform.select({ ios: 18, android: 16, default: 18 }),
    padding: Platform.select({ ios: 14, android: 12, default: 14 }),
    marginBottom: Platform.select({ ios: 12, android: 10, default: 12 }),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  msgAvatar: {
    position: 'relative',
    marginRight: Platform.select({ ios: 14, android: 12, default: 14 }),
  },
  msgAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  msgAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  msgAvatarLetter: {
    fontSize: 24,
    color: RevolutUltra.textPrimary,
    fontWeight: '700',
  },
  msgBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: RevolutUltra.neutral.light,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: RevolutUltra.bg,
    paddingHorizontal: 5,
  },
  msgBadgeText: {
    color: RevolutUltra.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  msgContent: {
    flex: 1,
  },
  msgName: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: Platform.select({ ios: 3, android: 2, default: 3 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  msgListing: {
    fontSize: Platform.select({ ios: 13, android: 12, default: 13 }),
    color: RevolutUltra.textSecondary,
    marginBottom: Platform.select({ ios: 4, android: 3, default: 4 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  msgPreview: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: RevolutUltra.textSecondary,
    opacity: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cta: {
    backgroundColor: RevolutUltra.neutral.light,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  ctaText: {
    color: RevolutUltra.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Listings Header
  listingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: RevolutUltra.border,
    marginTop: 8,
  },
  listingsTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  listingsCount: {
    backgroundColor: RevolutUltra.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  listingsCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  logoutSection: {
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RevolutUltra.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    gap: 8,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
  },
  loginButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
  },
  guestCTAContainer: {
    marginTop: Platform.select({ ios: 20, android: 16, default: 20 }),
    marginHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  guestPrimaryButton: {
    height: Platform.select({ ios: 56, android: 52, default: 56 }),
    borderRadius: Platform.select({ ios: 16, android: 14, default: 16 }),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  guestPrimaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestPrimaryButtonText: {
    fontSize: Platform.select({ ios: 17, android: 16, default: 17 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  guestSecondaryButton: {
    height: Platform.select({ ios: 52, android: 48, default: 52 }),
    borderRadius: Platform.select({ ios: 16, android: 14, default: 16 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestSecondaryButtonText: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '600',
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: '100%',
  },
  guestContent: {
    alignItems: 'center',
    width: '100%',
  },
  guestAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    color: RevolutUltra.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  guestButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  guestButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonText: {
    color: RevolutUltra.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  guestButtonSecondary: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: RevolutUltra.card,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonSecondaryText: {
    color: RevolutUltra.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
