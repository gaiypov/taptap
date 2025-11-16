import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { db } from '@/services/supabase';
import { Car } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { SCREEN_WIDTH } from '@/utils/constants';
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type ListingFilter = 'active' | 'sold' | 'all';

export default function MyListingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [filter, setFilter] = useState<ListingFilter>('active');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadListings();
    }
  }, [currentUser, filter]);

  const loadUser = async () => {
    try {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadListings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      errorTracking.addBreadcrumb('Loading my listings', 'data', { filter });

      const { data, error } = await db.getSellerCars(currentUser.id);

      if (error) throw error;

      let filteredCars = data || [];
      
      // Apply filter
      if (filter === 'active') {
        filteredCars = filteredCars.filter((car) => car.status === 'active');
      } else if (filter === 'sold') {
        filteredCars = filteredCars.filter((car) => car.status === 'sold');
      }

      setCars(filteredCars);
    } catch (error) {
      console.error('Error loading listings:', error);
      errorTracking.captureException(error as Error, {
        tags: { screen: 'myListings', action: 'load' },
        extra: { filter },
      });
      Alert.alert('Ошибка', 'Не удалось загрузить объявления');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteListing = (carId: string) => {
    Alert.alert(
      'Удалить объявление?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteListing(carId),
        },
      ]
    );
  };

  const deleteListing = async (carId: string) => {
    try {
      const { error } = await db.deleteCar(carId);

      if (error) throw error;

      setCars((prev) => prev.filter((car) => car.id !== carId));
      Alert.alert('Успех', 'Объявление удалено');
    } catch (error) {
      console.error('Error deleting listing:', error);
      errorTracking.captureException(error as Error, {
        tags: { screen: 'myListings', action: 'delete' },
        extra: { carId },
      });
      Alert.alert('Ошибка', 'Не удалось удалить объявление');
    }
  };

  const handleEditListing = (carId: string) => {
    // TODO: Navigate to edit screen
    Alert.alert('В разработке', 'Редактирование объявлений скоро будет доступно');
  };

  const renderFilterButton = (filterType: ListingFilter, label: string, count: number) => {
    const isActive = filter === filterType;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilter(filterType)}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {label}
        </Text>
        <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
          <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCarCard = ({ item }: { item: Car }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => router.push(`/car/${item.id}`)}
    >
      <Image source={{ uri: item.thumbnail_url }} style={styles.carImage} />
      
      {/* Status Badge */}
      {item.status === 'sold' && (
        <View style={styles.soldBadge}>
          <Text style={styles.soldBadgeText}>Продано</Text>
        </View>
      )}
      
      {item.is_promoted && (
        <View style={styles.promotedBadge}>
          <Ionicons name="flash" size={12} color="#FFF" />
        </View>
      )}

      <View style={styles.carInfo}>
        <Text style={styles.carTitle} numberOfLines={1}>
          {item.brand || 'Авто'} {item.model || ''}
        </Text>
        <Text style={styles.carYear}>{item.year || 'N/A'} год</Text>
        <Text style={styles.carPrice}>{item.price?.toLocaleString()} сом</Text>
        
        {/* Stats */}
        <View style={styles.carStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={12} color="#8E8E93" />
            <Text style={styles.statText}>{item.views}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={12} color="#8E8E93" />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={12} color="#8E8E93" />
            <Text style={styles.statText}>{item.messages_count || 0}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditListing(item.id)}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteListing(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-sport" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>
        {filter === 'active' ? 'Нет активных объявлений' : 
         filter === 'sold' ? 'Нет проданных автомобилей' : 
         'У вас пока нет объявлений'}
      </Text>
      <Text style={styles.emptyText}>
        Добавьте свое первое объявление, чтобы начать продавать
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/upload')}
      >
        <Ionicons name="add" size={24} color="#FFF" />
        <Text style={styles.addButtonText}>Добавить объявление</Text>
      </TouchableOpacity>
    </View>
  );

  const activeCars = cars.filter(c => c.status === 'active');
  const soldCars = cars.filter(c => c.status === 'sold');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мои объявления</Text>
        <TouchableOpacity
          style={styles.addIconButton}
          onPress={() => router.push('/(tabs)/upload')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Все', cars.length)}
        {renderFilterButton('active', 'Активные', activeCars.length)}
        {renderFilterButton('sold', 'Проданные', soldCars.length)}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      ) : (
        <FlatList
          data={cars}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadListings(true)}
              tintColor="#FF3B30"
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  addIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: '#FF3B30',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#FFF',
  },
  filterBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterBadgeTextActive: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  carCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 4,
  },
  carImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: '#2C2C2E',
  },
  soldBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  promotedBadge: {
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
  carInfo: {
    padding: 12,
  },
  carTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  carYear: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 8,
  },
  carStats: {
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
    color: '#8E8E93',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  actionButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

