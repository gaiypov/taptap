import { ultra } from '@/lib/theme/ultra';
import { db, supabase } from '@/services/supabase';
import type { Listing } from '@/types';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(isRefresh);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!isRefresh) setFavorites([]);
        return;
      }

      const { data: savesData, error } = await db.getUserSaves(user.id);
      if (error) throw error;

      const saves = Array.isArray(savesData) ? savesData : [];
      const listings = saves
        .map((save: any) => save.listing)
        .filter((listing: any) => listing && listing.id) as Listing[];

      setFavorites(listings);
    } catch (error: any) {
      appLogger.error('[Favorites] Error loading favorites', { error });
      Alert.alert('Ошибка', 'Не удалось загрузить избранное. Попробуйте позже.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const removeFromFavorites = useCallback(async (listingId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await db.unsaveListing(user.id, listingId);
      if (error) throw error;

      setFavorites(prev => prev.filter(item => item.id !== listingId));
    } catch (error: any) {
      appLogger.error('[Favorites] Error removing favorite', { error });
      Alert.alert('Ошибка', 'Не удалось удалить из избранного');
    }
  }, []);

  const handleListingPress = useCallback((listingId: string) => {
    router.push(`/car/${listingId}`);
  }, [router]);

  if (loading && favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Избранное</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ultra.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Избранное</Text>
        {favorites.length > 0 && (
          <Text style={styles.headerCount}>{favorites.length} шт.</Text>
        )}
      </View>

      <FlatList
        data={favorites}
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
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={Platform.select({ ios: 80, android: 75, default: 80 })} color={ultra.textMuted} />
            <Text style={styles.emptyText}>Нет избранного</Text>
            <Text style={styles.emptySubtext}>
              Сохраняйте понравившиеся объявления, нажимая ❤️
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleListingPress(item.id)}
              activeOpacity={0.8}
            >
              {item.thumbnail_url ? (
                <Image
                  source={{ uri: item.thumbnail_url }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={Platform.select({ ios: 48, android: 44, default: 48 })} color={ultra.textMuted} />
                </View>
              )}

              <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.price}>
                  {item.price?.toLocaleString('ru-RU')} сом
                </Text>

                {item.seller && (
                  <View style={styles.seller}>
                    {item.seller.avatar_url ? (
                      <Image
                        source={{ uri: item.seller.avatar_url }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={16} color="#FFF" />
                      </View>
                    )}
                    <Text style={styles.sellerName}>{item.seller.name || 'Продавец'}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  removeFromFavorites(item.id);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={Platform.select({ ios: 28, android: 26, default: 28 })} color={ultra.accent} />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
        contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS !== 'web'}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: Platform.select({ ios: 152, android: 144, default: 152 }) || 152,
          offset: (Platform.select({ ios: 152, android: 144, default: 152 }) || 152) * index,
          index,
        })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background, // #0D0D0D
  },
  header: {
    paddingTop: Platform.select({ ios: 12, android: 8, default: 12 }),
    paddingBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 32, android: 30, default: 32 }),
    fontWeight: '800',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  headerCount: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 40, android: 32, default: 40 }),
    paddingVertical: Platform.select({ ios: 60, android: 50, default: 60 }),
  },
  emptyText: {
    marginTop: Platform.select({ ios: 20, android: 18, default: 20 }),
    fontSize: Platform.select({ ios: 22, android: 20, default: 22 }),
    fontWeight: '800',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  emptySubtext: {
    marginTop: Platform.select({ ios: 8, android: 6, default: 8 }),
    fontSize: Platform.select({ ios: 15, android: 14, default: 15 }),
    color: ultra.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  listContent: {
    padding: Platform.select({ ios: 16, android: 12, default: 16 }),
    paddingBottom: Platform.select({ ios: 100, android: 90, default: 100 }),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: ultra.card,
    borderRadius: Platform.select({ ios: 20, android: 18, default: 20 }),
    marginBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  image: {
    width: Platform.select({ ios: 120, android: 110, default: 120 }),
    height: Platform.select({ ios: 120, android: 110, default: 120 }),
    backgroundColor: ultra.background,
  },
  imagePlaceholder: {
    width: Platform.select({ ios: 120, android: 110, default: 120 }),
    height: Platform.select({ ios: 120, android: 110, default: 120 }),
    backgroundColor: ultra.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Platform.select({ ios: 12, android: 10, default: 12 }),
    justifyContent: 'space-between',
  },
  title: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '800',
    color: ultra.textPrimary,
    marginBottom: Platform.select({ ios: 4, android: 3, default: 4 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  price: {
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }),
    fontWeight: '900',
    color: ultra.accentSecondary, // #E0E0E0 светлое серебро
    marginBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
  seller: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: Platform.select({ ios: 24, android: 22, default: 24 }),
    height: Platform.select({ ios: 24, android: 22, default: 24 }),
    borderRadius: Platform.select({ ios: 12, android: 11, default: 12 }),
    marginRight: Platform.select({ ios: 8, android: 6, default: 8 }),
  },
  avatarPlaceholder: {
    width: Platform.select({ ios: 24, android: 22, default: 24 }),
    height: Platform.select({ ios: 24, android: 22, default: 24 }),
    borderRadius: Platform.select({ ios: 12, android: 11, default: 12 }),
    backgroundColor: ultra.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Platform.select({ ios: 8, android: 6, default: 8 }),
  },
  sellerName: {
    fontSize: Platform.select({ ios: 12, android: 11, default: 12 }),
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  favoriteButton: {
    position: 'absolute',
    top: Platform.select({ ios: 12, android: 10, default: 12 }),
    right: Platform.select({ ios: 12, android: 10, default: 12 }),
    backgroundColor: ultra.background + 'E6',
    padding: Platform.select({ ios: 8, android: 7, default: 8 }),
    borderRadius: Platform.select({ ios: 20, android: 18, default: 20 }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

