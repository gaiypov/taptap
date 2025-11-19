import { SMSAuthScreen } from '@/components/Auth/SMSAuthScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { ultra } from '@/lib/theme/ultra';
import { db, supabase } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'listings' | 'messages';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  city?: string;
}

interface Stats {
  active: number;
  sold: number;
  views: number;
  rating: number;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  status: 'active' | 'sold' | 'expired';
  views_count?: number;
  likes_count?: number;
  thumbnail_url?: string;
}

interface Conversation {
  id: string;
  other_user: { id: string; name: string; avatar_url?: string };
  last_message: { text: string; created_at: string };
  unread_count: number;
  listing?: { id: string; title: string };
}

const CATEGORY_ICONS: Record<string, string> = {
  car: '🚗',
  cars: '🚗',
  horse: '🐴',
  horses: '🐴',
  real_estate: '🏠',
};

// === Универсальные компоненты ===
const Stat = React.memo(({ label, value, icon }: { label: string; value: number | string; icon?: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{icon} {value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));
Stat.displayName = 'Stat';

const ListingCard = React.memo(({ item, onPress }: { item: Listing; onPress: () => void }) => (
  <Animated.View entering={FadeInDown}>
    <TouchableOpacity style={styles.listingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.thumb}>
        <Text style={styles.thumbIcon}>{CATEGORY_ICONS[item.category] || '📦'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? ultra.accent : ultra.textMuted }]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Активно' : item.status === 'sold' ? 'Продано' : 'Истекло'}
          </Text>
        </View>
      </View>
      <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.price}>{item.price.toLocaleString('ru-RU')} с</Text>
      <View style={styles.footerStats}>
        <Text style={styles.small}>👁 {item.views_count || 0}</Text>
        <Text style={styles.small}>❤️ {item.likes_count || 0}</Text>
      </View>
    </TouchableOpacity>
  </Animated.View>
));
ListingCard.displayName = 'ListingCard';

const MessageItem = React.memo(({ conv, onPress }: { conv: Conversation; onPress: () => void }) => (
  <TouchableOpacity style={styles.msgItem} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.msgAvatar}>
      {conv.other_user.avatar_url ? (
        <Image source={{ uri: conv.other_user.avatar_url }} style={styles.msgAvatarImg} />
      ) : (
        <View style={styles.msgAvatarFallback}>
          <Text style={styles.msgAvatarLetter}>{conv.other_user.name[0]}</Text>
        </View>
      )}
      {conv.unread_count > 0 && (
        <View style={styles.msgBadge}>
          <Text style={styles.msgBadgeText}>{conv.unread_count}</Text>
        </View>
      )}
    </View>
    <View style={styles.msgContent}>
      <Text style={styles.msgName}>{conv.other_user.name}</Text>
      {conv.listing && <Text style={styles.msgListing}>📦 {conv.listing.title}</Text>}
      <Text style={styles.msgPreview} numberOfLines={1}>{conv.last_message.text}</Text>
    </View>
    <Text style={styles.msgArrow}>›</Text>
  </TouchableOpacity>
));
MessageItem.displayName = 'MessageItem';

export default function ProfileScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('listings');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({ active: 0, sold: 0, views: 0, rating: 4.8 });
  const [listings, setListings] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const totalUnread = useMemo(() => conversations.reduce((sum, c) => sum + c.unread_count, 0), [conversations]);

  const loadEverything = useCallback(async (isPull = false) => {
    if (!isPull) setLoading(true);
    setRefreshing(isPull);

    if (isPull && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Проверяем авторизацию через auth.getCurrentUser() (JWT токен)
      const { auth: authService } = await import('@/services/auth');
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        setIsAuthenticated(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      setIsAuthenticated(true);

      const [profileRes, listingsRes, convRes] = await Promise.all([
        db.getUserById(currentUser.id),
        supabase.from('listings').select('*').eq('seller_user_id', currentUser.id).order('created_at', { ascending: false }),
        db.getUserConversations(currentUser.id).catch(() => ({ data: [], error: null })),
      ]);

      if (profileRes.data && typeof profileRes.data === 'object') {
        setProfile(profileRes.data as UserProfile);
      }

      if (listingsRes.data) {
        const all = listingsRes.data as Listing[];
        setListings(all);
        const active = all.filter(l => l.status === 'active').length;
        const sold = all.filter(l => l.status === 'sold').length;
        const views = all.reduce((s, l) => s + (l.views_count || 0), 0);
        const ratio = sold && views ? sold / views : 0;
        setStats({
          active,
          sold,
          views,
          rating: ratio ? Math.min(5, 4.2 + ratio * 1.2) : 4.8,
        });
      }

      if (convRes.data && Array.isArray(convRes.data)) {
        const formatted = convRes.data.map((c: any) => ({
          id: c.id,
          other_user: {
            id: c.buyer?.id === currentUser.id ? c.seller?.id : c.buyer?.id,
            name: c.buyer?.id === currentUser.id ? c.seller?.name : c.buyer?.name || 'Пользователь',
            avatar_url: c.buyer?.id === currentUser.id ? c.seller?.avatar_url : c.buyer?.avatar_url,
          },
          last_message: { text: c.last_message || 'Фото', created_at: c.last_message_at },
          unread_count: c.unread_count || 0,
          listing: c.listing ? { id: c.listing.id, title: c.listing.title } : undefined,
        }));
        setConversations(formatted);
      }
    } catch (error: any) {
      appLogger.error('[Profile] Error loading data', { error });
      Alert.alert('Ошибка', 'Не удалось загрузить данные. Проверьте интернет.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEverything();
  }, [loadEverything]);

  const handleTabChange = useCallback((newTab: Tab) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTab(newTab);
  }, []);

  if (loading && !refreshing) return <LoadingOverlay message="Загрузка профиля..." />;
  if (!isAuthenticated) return <SMSAuthScreen onAuthSuccess={() => loadEverything()} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEverything(true)}
            tintColor={ultra.accent}
            colors={[ultra.accent]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInUp}>
          <LinearGradient colors={[ultra.gradientStart, ultra.gradientEnd]} style={styles.header}>
            <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>👤</Text>
                </View>
            )}
            <TouchableOpacity 
                style={styles.editBtn}
              onPress={() => router.push('/profile/edit')}
                activeOpacity={0.7}
            >
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
            <Text style={styles.name}>{profile?.name || 'Пользователь'}</Text>
            {profile?.city && <Text style={styles.city}>📍 {profile.city}</Text>}
            <View style={styles.statsRow}>
              <Stat label="Активно" value={stats.active} />
              <Stat label="Продано" value={stats.sold} />
              <Stat label="Просмотры" value={stats.views} />
              <Stat label="Рейтинг" value={stats.rating.toFixed(1)} icon="⭐" />
        </View>
      </LinearGradient>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabs}>
        <TouchableOpacity
            style={[styles.tab, tab === 'listings' && styles.activeTab]}
            onPress={() => handleTabChange('listings')}
            activeOpacity={0.7}
        >
            <Text style={[styles.tabText, tab === 'listings' && styles.activeTabText]}>Объявления</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.tab, tab === 'messages' && styles.activeTab]}
            onPress={() => handleTabChange('messages')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === 'messages' && styles.activeTabText]}>
              Сообщения {totalUnread > 0 && <Text style={styles.badge}>{totalUnread}</Text>}
          </Text>
        </TouchableOpacity>
      </View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(200)}>
          {tab === 'listings' ? (
            listings.length > 0 ? (
              <View style={styles.grid}>
                {listings.map(item => (
                  <ListingCard
                    key={item.id}
                    item={item}
                    onPress={() => router.push(`/car/${item.id}`)}
                  />
                ))}
                  </View>
            ) : (
              <EmptyState title="Нет объявлений" subtitle="Создайте первое!" icon="car-outline">
                <TouchableOpacity style={styles.cta} onPress={() => router.push('/(tabs)/upload')} activeOpacity={0.7}>
                  <Text style={styles.ctaText}>Создать объявление</Text>
                </TouchableOpacity>
              </EmptyState>
            )
          ) : (
            conversations.length > 0 ? (
              <View style={styles.messages}>
                {conversations.map(conv => (
                  <MessageItem
                  key={conv.id}
                    conv={conv}
                    onPress={() => router.push(`/chat/${conv.id}`)}
                  />
                ))}
                  </View>
            ) : (
              <EmptyState title="Нет сообщений" subtitle="Покупатели скоро напишут" icon="chatbubbles-outline" />
            )
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.push('/profile/edit')} activeOpacity={0.7}>
          <Text style={styles.bottomIcon}>⚙️</Text>
          <Text style={styles.bottomText}>Настройки</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.bottomBtn, styles.primaryBtn]}
          onPress={() => router.push('/(tabs)/upload')}
          activeOpacity={0.7}
        >
          <Text style={styles.bottomIcon}>➕</Text>
          <Text style={styles.bottomTextPrimary}>Создать</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ultra.background },
  header: { paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: ultra.border },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: ultra.card, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 48 },
  editBtn: { position: 'absolute', right: 0, bottom: 0, backgroundColor: ultra.card, padding: 10, borderRadius: 20, borderWidth: 1, borderColor: ultra.border },
  editIcon: { fontSize: 16 },
  name: { fontSize: 28, fontWeight: '800', color: ultra.textPrimary, fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold' },
  city: { fontSize: 15, color: ultra.textSecondary, marginBottom: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: ultra.card, padding: 16, borderRadius: 20, width: '100%', justifyContent: 'space-around', borderWidth: 1, borderColor: ultra.border },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: ultra.textPrimary, fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold' },
  statLabel: { fontSize: 11, color: ultra.textSecondary },
  tabs: { flexDirection: 'row', backgroundColor: ultra.card, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: ultra.accent },
  tabText: { fontSize: 15, color: ultra.textSecondary, fontWeight: '600' },
  activeTabText: { color: ultra.textPrimary, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold' },
  badge: { backgroundColor: ultra.accent, color: ultra.textPrimary, fontSize: 10, paddingHorizontal: 6, borderRadius: 10, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  listingCard: { width: '48%', backgroundColor: ultra.card, borderRadius: 20, padding: 10, margin: 4, borderWidth: 1, borderColor: ultra.border },
  thumb: { height: 120, backgroundColor: ultra.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  thumbIcon: { fontSize: 56 },
  statusBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, color: ultra.textPrimary, fontWeight: '700' },
  listingTitle: { fontSize: 14, fontWeight: '800', color: ultra.textPrimary, height: 40 },
  price: { fontSize: 18, fontWeight: '900', color: ultra.accentSecondary, marginVertical: 4 },
  footerStats: { flexDirection: 'row', gap: 12 },
  small: { fontSize: 12, color: ultra.textSecondary },
  messages: { padding: 12 },
  msgItem: { flexDirection: 'row', backgroundColor: ultra.card, borderRadius: 20, padding: 12, marginBottom: 8, alignItems: 'center' },
  msgAvatar: { position: 'relative', marginRight: 12 },
  msgAvatarImg: { width: 56, height: 56, borderRadius: 28 },
  msgAvatarFallback: { width: 56, height: 56, borderRadius: 28, backgroundColor: ultra.surface, justifyContent: 'center', alignItems: 'center' },
  msgAvatarLetter: { fontSize: 24, color: ultra.textPrimary },
  msgBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: ultra.accent, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  msgBadgeText: { color: ultra.textPrimary, fontSize: 11, fontWeight: '700' },
  msgContent: { flex: 1 },
  msgName: { fontSize: 16, fontWeight: '800', color: ultra.textPrimary },
  msgListing: { fontSize: 13, color: ultra.accent, marginVertical: 2 },
  msgPreview: { fontSize: 14, color: ultra.textSecondary },
  msgArrow: { fontSize: 24, color: ultra.textMuted, marginLeft: 8 },
  bottomBar: { flexDirection: 'row', backgroundColor: ultra.card, padding: 12, borderTopWidth: 1, borderTopColor: ultra.border },
  bottomBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: ultra.background, paddingVertical: 12, borderRadius: 16, marginHorizontal: 4, borderWidth: 1, borderColor: ultra.border },
  primaryBtn: { backgroundColor: ultra.accent },
  bottomIcon: { fontSize: 18, marginRight: 6 },
  bottomText: { fontSize: 14, color: ultra.textPrimary, fontWeight: '600' },
  bottomTextPrimary: { color: ultra.textPrimary, fontWeight: '700' },
  cta: { backgroundColor: ultra.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 16 },
  ctaText: { color: ultra.textPrimary, fontWeight: '700' },
});
