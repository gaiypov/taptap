// app/(tabs)/favorites.tsx
// Избранное

import { db, supabase } from '@/services/supabase';
import type { Listing } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get saved listings (используем новый API)
      const { data: savesData, error } = await db.getUserSaves(user.id);
      
      if (error) throw error;
      
      // Извлекаем listings из saves (savesData это массив с полями listing_id и listing)
      const savedListings = (savesData || []).map((save: any) => {
        // Если есть вложенный listing объект
        if (save.listing) {
          return save.listing;
        }
        // Если listing_id есть, но объекта нет, возвращаем null (будет отфильтрован)
        return null;
      }).filter(Boolean) as Listing[];
      
      setFavorites(savedListings);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleListingPress = (listingId: string) => {
    router.push(`/car/${listingId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Избранное</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Избранное</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyText}>Нет избранного</Text>
          <Text style={styles.emptySubtext}>
            Сохраняйте понравившиеся объявления
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Избранное</Text>
        <Text style={styles.headerCount}>{favorites.length} шт.</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleListingPress(item.id)}
          >
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={styles.image}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="images-outline" size={40} color="#8E8E93" />
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
                  <Text style={styles.sellerName}>{item.seller.name}</Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <Ionicons name="heart" size={24} color="#FF3B30" />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  headerCount: {
    fontSize: 14,
    color: '#8E8E93',
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
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: 120,
    height: 120,
    backgroundColor: '#2C2C2E',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 8,
  },
  seller: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sellerName: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actions: {
    justifyContent: 'center',
    paddingRight: 16,
  },
});

