/**
 * FavoritesTab - Saved listings by user
 * Part of unified profile system
 */

import { EmptyState } from '@/components/ui/EmptyState';
import { RevolutUltra } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Seller {
  id: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  is_verified?: boolean;
}

interface FavoriteListing {
  id: string;
  title: string;
  price: number;
  category: string;
  thumbnail_url?: string;
  seller?: Seller;
}

interface FavoritesTabProps {
  favorites: FavoriteListing[];
  onRemoveFavorite?: (listingId: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  car: '🚗',
  cars: '🚗',
  horse: '🐴',
  horses: '🐴',
  real_estate: '🏠',
};

export default function FavoritesTab({ favorites, onRemoveFavorite }: FavoritesTabProps) {
  const router = useRouter();

  const handleListingPress = useCallback((listing: FavoriteListing) => {
    router.push(`/car/${listing.id}` as any);
  }, [router]);

  const handleCall = useCallback((phone?: string) => {
    if (!phone) {
      Alert.alert('Ошибка', 'Номер телефона недоступен');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleMessage = useCallback((listing: FavoriteListing) => {
    // Navigate to chat with seller
    router.push(`/chat/new?listing=${listing.id}&seller=${listing.seller?.id}` as any);
  }, [router]);

  const handleLongPress = useCallback((listing: FavoriteListing) => {
    Alert.alert(
      'Удалить из избранного?',
      listing.title,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => onRemoveFavorite?.(listing.id),
        },
      ]
    );
  }, [onRemoveFavorite]);

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="Нет избранного"
          subtitle="Сохраняйте понравившиеся объявления, чтобы вернуться к ним позже"
          icon="heart-outline"
          iconColor={RevolutUltra.textSecondary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {favorites.map((listing, index) => (
        <Animated.View
          key={listing.id}
          entering={FadeInDown.delay(index * 50)}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleListingPress(listing)}
            onLongPress={() => handleLongPress(listing)}
            activeOpacity={0.8}
          >
            {/* Thumbnail */}
            <View style={styles.thumbnail}>
              {listing.thumbnail_url ? (
                <Image source={{ uri: listing.thumbnail_url }} style={styles.thumbnailImage} />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailIcon}>
                    {CATEGORY_ICONS[listing.category] || '📦'}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {listing.title}
              </Text>
              <Text style={styles.price}>
                {listing.price.toLocaleString('ru-RU')} сом
              </Text>

              {/* Seller info */}
              {listing.seller && (
                <View style={styles.sellerRow}>
                  <View style={styles.sellerAvatar}>
                    {listing.seller.avatar_url ? (
                      <Image
                        source={{ uri: listing.seller.avatar_url }}
                        style={styles.sellerAvatarImage}
                      />
                    ) : (
                      <Text style={styles.sellerAvatarLetter}>
                        {(listing.seller.name || 'П')[0]}
                      </Text>
                    )}
                    {listing.seller.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {listing.seller.name || 'Продавец'}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCall(listing.seller?.phone)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={18} color={RevolutUltra.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMessage(listing)}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-outline" size={18} color={RevolutUltra.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.removeButton]}
                onPress={() => onRemoveFavorite?.(listing.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={18} color="#FF5252" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Hint */}
      <Text style={styles.hint}>
        Удерживайте карточку, чтобы удалить из избранного
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: RevolutUltra.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailIcon: {
    fontSize: 36,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  sellerAvatarLetter: {
    fontSize: 12,
    fontWeight: '600',
    color: RevolutUltra.textSecondary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 13,
    color: RevolutUltra.textSecondary,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  actions: {
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  hint: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
