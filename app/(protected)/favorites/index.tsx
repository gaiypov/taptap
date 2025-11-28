// app/(protected)/favorites/index.tsx
// Страница избранного — V8 Ultra Routing

import { RevolutUltra } from '@/lib/theme/colors';
import { db } from '@/services/supabase';
import { useAppSelector } from '@/lib/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  thumbnail_url?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  car: '🚗',
  cars: '🚗',
  horse: '🐴',
  horses: '🐴',
  real_estate: '🏠',
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async (isPull = false) => {
    if (!user?.id) {
      setFavorites([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!isPull) setLoading(true);
    setRefreshing(isPull);

    try {
      const data = await db.getUserSaves(user.id);
      if (data && Array.isArray(data)) {
        const listings = data
          .map((save: any) => save.listing)
          .filter((listing: any) => listing && listing.id) as Listing[];
        setFavorites(listings);
      }
    } catch (error) {
      console.error('[Favorites] Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка избранного...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={RevolutUltra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Избранное</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFavorites(true)}
            tintColor={RevolutUltra.textPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={RevolutUltra.textSecondary} />
            <Text style={styles.emptyTitle}>Нет избранного</Text>
            <Text style={styles.emptySubtitle}>Сохраняйте понравившиеся объявления</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {favorites.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => router.push(`/car/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.thumb}>
                  <Text style={styles.thumbIcon}>{CATEGORY_ICONS[item.category] || '📦'}</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.price}>{item.price.toLocaleString('ru-RU')} сом</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RevolutUltra.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: RevolutUltra.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 16, android: 12, default: 16 }),
    borderBottomWidth: 1,
    borderBottomColor: RevolutUltra.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }),
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Platform.select({ ios: 20, android: 16, default: 20 }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  emptySubtitle: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: RevolutUltra.textSecondary,
    marginTop: 8,
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  card: {
    width: '47%',
    backgroundColor: RevolutUltra.card,
    borderRadius: Platform.select({ ios: 18, android: 16, default: 18 }),
    padding: Platform.select({ ios: 12, android: 10, default: 12 }),
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  thumb: {
    height: Platform.select({ ios: 110, android: 100, default: 110 }),
    backgroundColor: RevolutUltra.card2,
    borderRadius: Platform.select({ ios: 14, android: 12, default: 14 }),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 8, android: 6, default: 8 }),
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  thumbIcon: {
    fontSize: 48,
  },
  title: {
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
});

