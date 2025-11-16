// app/(tabs)/profile.tsx - Улучшенный профиль с интегрированными сообщениями
// Адаптировано для 360AutoMVP согласно CursorAI-Prompt.md

import { SMSAuthScreen } from '@/components/Auth/SMSAuthScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Colors } from '@/constants/Colors';
import { useAppTheme } from '@/lib/theme';
import { supabase } from '@/services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  city?: string;
  created_at: string;
}

interface UserStats {
  activeListings: number;
  soldListings: number;
  totalViews: number;
  rating: number;
}

interface Conversation {
  id: string;
  other_user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  last_message: {
    text: string;
    created_at: string;
    is_read: boolean;
  };
  unread_count: number;
  listing?: {
    id: string;
    title: string;
    category: string;
  };
}

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  status: 'active' | 'sold' | 'expired';
  views_count: number;
  likes_count: number;
  thumbnail_url?: string;
  created_at: string;
}

// Helper для получения иконки категории
function getCategoryIcon(category: string): string {
  switch (category) {
    case 'cars': return '🚗';
    case 'horses': return '🐴';
    case 'real_estate': return '🏠';
    default: return '📦';
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = useState<'listings' | 'messages'>('listings');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    activeListings: 0,
    soldListings: 0,
    totalViews: 0,
    rating: 0,
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных пользователя
  const fetchListings = useCallback(async (userId: string) => {
    try {
      const [carsData, horsesData, realEstateData] = await Promise.all([
        supabase.from('listings').select('*').eq('seller_user_id', userId).eq('category', 'car'),
        supabase.from('listings').select('*').eq('seller_user_id', userId).eq('category', 'horse'),
        supabase.from('listings').select('*').eq('seller_user_id', userId).eq('category', 'real_estate'),
      ]);

      // Проверка сетевых ошибок
      const checkNetworkError = (error: any) => {
        if (!error) return false;
        return (
          error.message?.includes('Network request failed') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('network') ||
          (error as any)?.code === 'PGRST301' ||
          (error as any)?.code === 'ENOTFOUND' ||
          (error as any)?.code === 'ETIMEDOUT'
        );
      };

      // Логируем только критические ошибки
      if (carsData.error && !checkNetworkError(carsData.error)) {
        console.warn('[Profile] Error loading cars:', carsData.error.message);
      }
      if (horsesData.error && !checkNetworkError(horsesData.error)) {
        console.warn('[Profile] Error loading horses:', horsesData.error.message);
      }
      if (realEstateData.error && !checkNetworkError(realEstateData.error)) {
        console.warn('[Profile] Error loading real estate:', realEstateData.error.message);
      }

      const allListings = [
        ...(carsData.data || []).map(item => ({ ...item, category: 'cars' })),
        ...(horsesData.data || []).map(item => ({ ...item, category: 'horses' })),
        ...(realEstateData.data || []).map(item => ({ ...item, category: 'real_estate' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setListings(allListings);
      return allListings;
    } catch (error: any) {
      const isNetworkError = 
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('Failed to fetch') ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ETIMEDOUT';
      
      if (!isNetworkError) {
        console.error('[Profile] Error fetching listings:', error);
      }
      return [];
    }
  }, []);

  const fetchStats = useCallback(async (userId: string, listingsData: Listing[] = []) => {
    try {
      // Если уже загрузили объявления, используем их для статистики
      if (listingsData.length > 0) {
        const activeCount = listingsData.filter(l => l.status === 'active').length;
        const soldCount = listingsData.filter(l => l.status === 'sold').length;
        const totalViews = listingsData.reduce(
          (sum, listing) => sum + ((listing as any).views_count ?? (listing as any).views ?? 0),
          0
        );
        const ratio = soldCount > 0 && totalViews > 0 ? soldCount / totalViews : 0;

        setStats({
          activeListings: activeCount,
          soldListings: soldCount,
          totalViews,
          rating: ratio > 0 ? Math.min(5, Math.max(0, 4.0 + ratio * 0.8)) : 4.8,
        });
        return;
      }

      // Иначе загружаем статистику отдельно
      const [carsData, horsesData, realEstateData] = await Promise.all([
        supabase.from('listings').select('status, views_count').eq('seller_user_id', userId).eq('category', 'car'),
        supabase.from('listings').select('status, views_count').eq('seller_user_id', userId).eq('category', 'horse'),
        supabase.from('listings').select('status, views_count').eq('seller_user_id', userId).eq('category', 'real_estate'),
      ]);

      // Проверка сетевых ошибок
      const checkNetworkError = (error: any) => {
        if (!error) return false;
        return (
          error.message?.includes('Network request failed') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('network') ||
          (error as any)?.code === 'PGRST301' ||
          (error as any)?.code === 'ENOTFOUND' ||
          (error as any)?.code === 'ETIMEDOUT'
        );
      };

      // Игнорируем сетевые ошибки, логируем остальные
      if (carsData.error && !checkNetworkError(carsData.error)) {
        console.warn('[Profile] Error loading stats for cars:', carsData.error.message);
      }
      if (horsesData.error && !checkNetworkError(horsesData.error)) {
        console.warn('[Profile] Error loading stats for horses:', horsesData.error.message);
      }
      if (realEstateData.error && !checkNetworkError(realEstateData.error)) {
        console.warn('[Profile] Error loading stats for real estate:', realEstateData.error.message);
      }

      const allStatuses = [
        ...(carsData.data || []).map(i => i.status),
        ...(horsesData.data || []).map(i => i.status),
        ...(realEstateData.data || []).map(i => i.status),
      ];

      const activeCount = allStatuses.filter(s => s === 'active').length;
      const soldCount = allStatuses.filter(s => s === 'sold').length;

      const aggregatedViews = [
        ...(carsData.data || []),
        ...(horsesData.data || []),
        ...(realEstateData.data || []),
      ].reduce((sum: number, item: any) => sum + (item.views_count ?? item.views ?? 0), 0);

      const totalViews = listingsData.length > 0
        ? listingsData.reduce(
            (sum, listing) => sum + ((listing as any).views_count ?? (listing as any).views ?? 0),
            0
          )
        : aggregatedViews;

      // Вычисляем ratio на основе продаж и просмотров
      const ratio = soldCount > 0 && totalViews > 0 ? soldCount / totalViews : 0;

      setStats({
        activeListings: activeCount,
        soldListings: soldCount,
        totalViews,
        rating: ratio > 0 ? Math.min(5, Math.max(0, 4.0 + ratio * 0.8)) : 4.8,
      });
    } catch (error: any) {
      const isNetworkError = 
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('Failed to fetch') ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ETIMEDOUT';
      
      if (!isNetworkError) {
        console.error('[Profile] Error fetching stats:', error);
      }
      // Устанавливаем дефолтные значения при ошибке
      setStats({
        activeListings: 0,
        soldListings: 0,
        totalViews: 0,
        rating: 4.8,
      });
    }
  }, []);

  const fetchConversations = useCallback(async (userId: string) => {
    try {
      // Используем сервис для получения conversations
      const { db } = await import('@/services/supabase');
      let result = await db.getUserConversations(userId);
      
      let { data, error } = result;

      // Fallback на прямые запросы если сервис не работает
      if (error && error.message?.includes('does not exist')) {
        const conversationsResult = await supabase
          .from('conversations')
          .select(`
            id,
            buyer:users!buyer_id(id, name, avatar_url),
            seller:users!seller_id(id, name, avatar_url),
            car:cars(id, title, category),
            last_message,
            last_message_at
          `)
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
          .eq('is_active', true)
          .order('last_message_at', { ascending: false });

        data = conversationsResult.data as any;
        error = conversationsResult.error;

        if (data && data.length > 0) {
          const threadIds = data.map((c: any) => c.id);
          const { data: unreadData } = await supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', threadIds)
            .eq('is_read', false)
            .neq('sender_id', userId);

          const unreadCounts: Record<string, number> = {};
          unreadData?.forEach((msg: any) => {
            unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1;
          });

          data = data.map((conv: any) => ({
            ...conv,
            listing: conv.car ? { ...conv.car, category: conv.car.category || 'cars' } : null,
            car: undefined,
            unread_count_buyer: conv.buyer?.id === userId ? (unreadCounts[conv.id] || 0) : 0,
            unread_count_seller: conv.seller?.id === userId ? (unreadCounts[conv.id] || 0) : 0,
          }));
        }
      }

      // Проверка сетевых ошибок
      const isNetworkError = 
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('network') ||
        (error as any)?.code === 'PGRST301' ||
        (error as any)?.code === 'ENOTFOUND' ||
        (error as any)?.code === 'ETIMEDOUT';

      if (error) {
        if (isNetworkError) {
          console.warn('[Profile] Network error loading conversations:', error.message);
          // Не показываем ошибку пользователю при сетевых проблемах
          setConversations([]);
          return [];
        } else {
          setError(`Не удалось загрузить сообщения: ${error.message}`);
          setConversations([]);
          return [];
        }
      }

      if (data) {
        const formattedConversations: Conversation[] = data.map((thread: any) => {
          const buyer = Array.isArray(thread.buyer) ? thread.buyer[0] : thread.buyer;
          const seller = Array.isArray(thread.seller) ? thread.seller[0] : thread.seller;
          const otherUser = buyer?.id === userId ? seller : buyer;
          const unreadCount = thread.unread_count ||
            (thread.buyer?.id === userId
              ? (thread.unread_count_buyer || 0)
              : (thread.unread_count_seller || 0));

          const listing = thread.listing || thread.car;

          return {
            id: thread.id,
            other_user: {
              id: otherUser?.id || '',
              name: otherUser?.name || 'Пользователь',
              avatar_url: otherUser?.avatar_url,
            },
            last_message: {
              text: thread.last_message || '',
              created_at: thread.last_message_at || thread.created_at,
              is_read: unreadCount === 0,
            },
            unread_count: unreadCount,
            listing: listing
              ? {
                  id: listing.id,
                  title: listing.title || `${listing.brand ?? ''} ${listing.model ?? ''}`.trim() || 'Объявление',
                  category: listing.category || 'cars',
                }
              : undefined,
          };
        });

        setConversations(formattedConversations);
        return formattedConversations;
      }
    } catch (error: any) {
      const isNetworkError = 
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('Failed to fetch') ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ETIMEDOUT';
      
      if (!isNetworkError) {
        console.error('[Profile] Error fetching conversations:', error);
      }
      // Устанавливаем пустой массив при любых ошибках
      setConversations([]);
      return [];
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Проверка сетевых ошибок
      const isNetworkError = 
        userError?.message?.includes('Network request failed') ||
        userError?.message?.includes('Failed to fetch') ||
        userError?.code === 'ENOTFOUND' ||
        userError?.code === 'ETIMEDOUT';

      if (userError) {
        if (isNetworkError) {
          console.warn('[Profile] Network error getting user:', userError.message);
          setError('Проблема с подключением к сети. Проверьте интернет.');
        } else {
          setError(`Ошибка авторизации: ${userError.message}`);
        }
        setLoading(false);
        return;
      }
      
      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      setIsAuthenticated(true);

      // Используем сервис для получения профиля
      const { db } = await import('@/services/supabase');
      const { data: profileData, error: profileError } = await db.getUserById(user.id);

      if (profileError) {
        const isProfileNetworkError = 
          profileError?.message?.includes('Network request failed') ||
          profileError?.message?.includes('Failed to fetch') ||
          (profileError as any)?.code === 'ENOTFOUND' ||
          (profileError as any)?.code === 'ETIMEDOUT';
        
        if (isProfileNetworkError) {
          console.warn('[Profile] Network error loading profile:', profileError.message);
          setError('Проблема с подключением. Повторите попытку.');
        } else {
          setError(`Не удалось загрузить профиль: ${profileError.message}`);
        }
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData);
      }

      // Загружаем данные параллельно
      const listingsData = await fetchListings(user.id);
      await Promise.all([
        fetchConversations(user.id),
        fetchStats(user.id, listingsData),
      ]);
    } catch (error: any) {
      const isNetworkError = 
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('Failed to fetch') ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ETIMEDOUT';
      
      if (isNetworkError) {
        console.warn('[Profile] Network error fetching user data:', error?.message);
        setError('Проблема с подключением к сети. Проверьте интернет и повторите попытку.');
      } else {
        console.error('❌ Error fetching user data:', error);
        if (error instanceof Error) {
          setError(`Ошибка загрузки данных: ${error.message}`);
        } else {
          setError('Произошла неизвестная ошибка');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [fetchConversations, fetchListings, fetchStats]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'sold': return Colors.primary;
      case 'expired': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активно';
      case 'sold': return 'Продано';
      case 'expired': return 'Истекло';
      default: return status;
    }
  };

  if (loading) {
    return <LoadingOverlay message="Загрузка профиля..." />;
  }

  // Если пользователь не авторизован, показываем экран регистрации
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <SMSAuthScreen 
          onAuthSuccess={() => {
            setIsAuthenticated(true);
            fetchUserData();
          }} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Визуальный fallback для ошибок */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            ❌ {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              fetchUserData();
            }}
          >
            <Text style={styles.retryButtonText}>Повторить попытку</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!error && (
        <>
      {/* Шапка профиля */}
      <LinearGradient
        colors={[Colors.primary, '#FF6B58']}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatar}>👤</Text>
            )}
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{profile?.name || 'Пользователь'}</Text>
          {profile?.city && (
            <Text style={styles.userLocation}>📍 {profile.city}</Text>
          )}
          
          {/* Статистика */}
          <View style={styles.statsContainer}>
            <StatItem label="Активных" value={stats.activeListings} />
            <View style={styles.statsDivider} />
            <StatItem label="Продано" value={stats.soldListings} />
            <View style={styles.statsDivider} />
            <StatItem label="Просмотры" value={stats.totalViews} />
            <View style={styles.statsDivider} />
            <StatItem label="Рейтинг" value={stats.rating} icon="⭐" />
          </View>
        </View>
      </LinearGradient>

      {/* Табы: Объявления / Сообщения */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'listings' && styles.tabActive]}
          onPress={() => setActiveTab('listings')}
        >
          <Text style={[styles.tabText, activeTab === 'listings' && styles.tabTextActive]}>
            Мои объявления
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            💬 Сообщения
            {conversations.some(c => c.unread_count > 0) && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
                </Text>
              </View>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Контент */}
      <ScrollView style={styles.content}>
        {activeTab === 'listings' ? (
          <View style={styles.listingsGrid}>
            {listings.length > 0 ? (
              listings.map((listing) => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.listingCard}
                  onPress={() => router.push({ pathname: '/car/[id]', params: { id: listing.id } })}
                >
                  <View style={styles.listingImage}>
                    <Text style={styles.listingIcon}>{getCategoryIcon(listing.category)}</Text>
                    <View style={[styles.listingStatus, { backgroundColor: getStatusColor(listing.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(listing.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>{listing.price.toLocaleString('ru-RU')} с</Text>
                  <View style={styles.listingStats}>
                    <Text style={styles.listingStat}>👁 {listing.views_count || 0}</Text>
                    <Text style={styles.listingStat}>❤️ {listing.likes_count || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                title="Нет объявлений"
                subtitle="Создайте первое объявление, чтобы начать продавать"
                icon="cube-outline"
              >
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/(tabs)/upload')}
                >
                  <Text style={styles.emptyButtonText}>Создать объявление</Text>
                </TouchableOpacity>
              </EmptyState>
            )}
          </View>
        ) : (
          <View style={styles.messagesContainer}>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={styles.messageItem}
                  onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: conv.id } })}
                >
                  <View style={styles.messageAvatar}>
                    {conv.other_user.avatar_url ? (
                      <Image source={{ uri: conv.other_user.avatar_url }} style={styles.messageAvatarImage} />
                    ) : (
                      <Text style={styles.messageAvatarText}>
                        {conv.other_user.name?.charAt(0) || '?'}
                      </Text>
                    )}
                    {conv.unread_count > 0 && (
                      <View style={styles.messageBadge}>
                        <Text style={styles.messageBadgeText}>{conv.unread_count}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageUserName}>{conv.other_user.name}</Text>
                      <Text style={styles.messageTime}>
                        {new Date(conv.last_message.created_at).toLocaleDateString('ru-RU')}
                      </Text>
                    </View>
                    
                    {conv.listing && (
                      <Text style={styles.messageListingTitle} numberOfLines={1}>
                        📦 {conv.listing.title}
                      </Text>
                    )}
                    
                    <Text style={styles.messageLastMessage} numberOfLines={1}>
                      {conv.last_message.text}
                    </Text>
                  </View>
                  
                  <Text style={styles.messageArrow}>›</Text>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                title="Нет сообщений"
                subtitle="Здесь будут отображаться ваши чаты с покупателями"
                icon="chatbubbles-outline"
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Кнопки действий */}
      <View style={styles.actionsBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/profile/edit')}
        >
          <Text style={styles.actionButtonIcon}>⚙️</Text>
          <Text style={styles.actionButtonText}>Настройки</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={() => router.push('/(tabs)/upload')}
        >
          <Text style={styles.actionButtonIconPrimary}>➕</Text>
          <Text style={styles.actionButtonTextPrimary}>Создать объявление</Text>
        </TouchableOpacity>
      </View>
        </>
      )}
    </SafeAreaView>
  );
}

// Компонент элемента статистики
function StatItem({ label, value, icon }: { label: string; value: number; icon?: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>
        {icon && icon} {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 80,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Colors.text,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  listingCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    margin: '1%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listingImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  listingIcon: {
    fontSize: 60,
  },
  listingStatus: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  listingTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    height: 36,
  },
  listingPrice: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  listingStats: {
    flexDirection: 'row',
    gap: 12,
  },
  listingStat: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  messagesContainer: {
    padding: 12,
  },
  messageItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  messageAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  messageAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  messageAvatarText: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 50,
    color: Colors.text,
  },
  messageBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  messageBadgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageUserName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  messageTime: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  messageListingTitle: {
    color: Colors.secondary,
    fontSize: 13,
    marginBottom: 4,
  },
  messageLastMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  messageArrow: {
    color: Colors.textSecondary,
    fontSize: 24,
    marginLeft: 8,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonIconPrimary: {
    fontSize: 16,
  },
  actionButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
