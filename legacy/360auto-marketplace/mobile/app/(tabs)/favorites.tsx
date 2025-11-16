import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutDown, FadeOutUp } from 'react-native-reanimated';

// Types
interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  thumbnail?: string;
  category: 'car' | 'horse' | 'real_estate';
  createdAt: string;
}

interface FavoriteCardProps {
  listing: Listing;
  onPress: () => void;
  onRemove: () => void;
}

// API Functions
const fetchFavorites = async (): Promise<Listing[]> => {
  // Mock data for now - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    // Mock favorites - remove when connecting to real API
  ];
};

const removeFavorite = async (listingId: string): Promise<void> => {
  // Mock API call - replace with actual API
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('Removing favorite:', listingId);
};

// Components
const FavoriteCard = ({ listing, onPress, onRemove }: FavoriteCardProps) => (
  <Animated.View entering={FadeInDown.delay(50)} exiting={FadeOutUp} style={styles.card}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardImageContainer}>
        <Image
          source={{ uri: listing.thumbnail || 'https://via.placeholder.com/200' }}
          style={styles.cardImage}
          contentFit="cover"
          transition={300}
        />
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.cardPrice}>
          {listing.price} {listing.currency}
        </Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          {listing.location}
        </Text>
      </View>
    </TouchableOpacity>
  </Animated.View>
);

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Ionicons name="heart-outline" size={64} color="#8E8E93" />
    <Text style={styles.emptyTitle}>Нет избранных объявлений</Text>
    <Text style={styles.emptySubtitle}>
      Добавьте объявления в избранное, чтобы не потерять их
    </Text>
    <TouchableOpacity
      style={styles.emptyButton}
      onPress={() => router.push('/(tabs)/')}
    >
      <Text style={styles.emptyButtonText}>Перейти на главную</Text>
    </TouchableOpacity>
  </View>
);

const LoadingSkeleton = () => (
  <View style={styles.loadingContainer}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={styles.skeletonCard}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonText} />
        <View style={styles.skeletonTextSmall} />
      </View>
    ))}
  </View>
);

// Main Component
export default function FavoritesScreen() {
  const queryClient = useQueryClient();
  const [undoing, setUndoing] = useState<string | null>(null);
  const lastRemoved = useState<{ id: string; data: Listing } | null>(null);

  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previousFavorites = queryClient.getQueryData<Listing[]>(['favorites']);

      if (previousFavorites) {
        const removedItem = previousFavorites.find(item => item.id === listingId);
        lastRemoved[0] = removedItem ? { id: listingId, data: removedItem } : null;

        queryClient.setQueryData(['favorites'], previousFavorites.filter(item => item.id !== listingId));

        // Show undo option
        setTimeout(() => {
          setUndoing(null);
          lastRemoved[0] = null;
        }, 3000);
      }

      return { previousFavorites };
    },
    onError: (err, listingId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
      Alert.alert('Ошибка', 'Не удалось удалить из избранного');
    },
  });

  const handleRemove = (listingId: string) => {
    removeFavoriteMutation.mutate(listingId);
  };

  const handleUndo = () => {
    if (lastRemoved[0]) {
      const favorites = queryClient.getQueryData<Listing[]>(['favorites']) || [];
      queryClient.setQueryData(['favorites'], [...favorites, lastRemoved[0].data]);
      setUndoing(null);
      lastRemoved[0] = null;
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!favorites || favorites.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Избранное</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FavoriteCard
            listing={item}
            onPress={() => router.push(`/listing/${item.id}` as any)}
            onRemove={() => handleRemove(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      />

      {lastRemoved[0] && undoing !== lastRemoved[0].id && (
        <Animated.View entering={FadeInUp.delay(100)} exiting={FadeOutDown} style={styles.undoSnackbar}>
          <Text style={styles.undoText}>Удалено из избранного</Text>
          <TouchableOpacity onPress={handleUndo}>
            <Text style={styles.undoButton}>Отменить</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  filterButton: { padding: 8 },
  listContent: { padding: 16 },
  columnWrapper: { justifyContent: 'space-between' },
  
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardImageContainer: { position: 'relative', aspectRatio: 4 / 3 },
  cardImage: { width: '100%', height: '100%' },
  removeButton: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  cardInfo: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  cardLocation: { fontSize: 12, color: '#8E8E93' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#000', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 24 },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  loadingContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 16 },
  skeletonCard: { width: '48%', marginBottom: 16 },
  skeletonImage: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#E5E5EA', borderRadius: 8 },
  skeletonText: { width: '80%', height: 16, backgroundColor: '#E5E5EA', borderRadius: 4, marginTop: 8 },
  skeletonTextSmall: { width: '60%', height: 12, backgroundColor: '#E5E5EA', borderRadius: 4, marginTop: 4 },

  undoSnackbar: { position: 'absolute', bottom: 32, left: 16, right: 16, backgroundColor: '#1C1C1E', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  undoText: { color: '#fff', fontSize: 14 },
  undoButton: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
});
