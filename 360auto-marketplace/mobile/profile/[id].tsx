import { auth } from '@/services/auth';
import { db } from '@/services/supabase';
import { Car, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CAR_CARD_WIDTH = (width - 48) / 2; // 2 колонки с отступами

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [seller, setSeller] = useState<User | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Загружаем текущего пользователя
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
      
      // Загружаем профиль продавца
      const { data: userData, error: userError } = await db.getUserById(id);
      if (userError) throw userError;
      
      setSeller(userData);
      
      // Загружаем объявления продавца
      const { data: carsData, error: carsError } = await db.getSellerCars(id);
      if (carsError) throw carsError;
      
      setCars(carsData || []);
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleMessage = async () => {
    if (!currentUser) {
      router.push({ pathname: '/(tabs)/profile' });
      return;
    }

    if (!seller) {
      return;
    }
    
    try {
      // Создаем или получаем существующий чат
      const { data: conversation, error } = await db.getOrCreateConversation(
        seller.id, // carId (используем ID продавца как carId для простоты)
        currentUser.id, // buyerId
        seller.id // sellerId
      );
      
      if (error) throw error;
      if (!conversation) throw new Error('Conversation was not created');
      
      // Переходим в чат
      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId: conversation.id },
      });
    } catch (error) {
      console.error('Create conversation error:', error);
      // Fallback - показываем заглушку
      Alert.alert('Ошибка', 'Не удалось открыть чат');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Продавец не найден</Text>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === seller.id;
  const activeCars = cars.filter((car) => car.status === 'active');
  const soldCars = cars.filter((car) => car.status === 'sold');

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header с градиентом */}
        <LinearGradient
          colors={['#FF3B30', '#FF6B35']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          {/* Аватар */}
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: seller.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&size=200`,
              }}
              style={styles.avatar}
            />
            {seller.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={32} color="#0A84FF" />
              </View>
            )}
          </View>
          
          {/* Имя */}
          <Text style={styles.name}>{seller.name}</Text>
          
          {/* Статистика */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seller.total_sales}</Text>
              <Text style={styles.statLabel}>Продано</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeCars.length}</Text>
              <Text style={styles.statLabel}>Активных</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {seller.rating > 0 ? seller.rating.toFixed(1) : '-'}
              </Text>
              <Text style={styles.statLabel}>Рейтинг</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Кнопка "Написать" */}
        {!isOwnProfile && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
            >
              <LinearGradient
                colors={['#FF3B30', '#FF6B35']}
                style={styles.messageButtonGradient}
              >
                <Ionicons name="chatbubble" size={20} color="#FFF" />
                <Text style={styles.messageButtonText}>Написать</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Объявления */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Объявления ({activeCars.length})
          </Text>
          
          {activeCars.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyText}>Нет активных объявлений</Text>
            </View>
          ) : (
            <FlatList
              data={activeCars}
              renderItem={({ item }) => <CarCard car={item} />}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.carGrid}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Проданные (опционально) */}
        {soldCars.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Продано ({soldCars.length})
            </Text>
            <FlatList
              data={soldCars}
              renderItem={({ item }) => <CarCard car={item} sold />}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.carGrid}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Компонент карточки авто
function CarCard({ car, sold = false }: { car: Car; sold?: boolean }) {
  const router = useRouter();

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн`;
    }
    return `${(price / 1000).toFixed(0)} тыс`;
  };

  return (
    <TouchableOpacity
      style={[styles.carCard, sold && styles.carCardSold]}
      onPress={() => router.push(`/car/${car.id}`)}
    >
      <Image
        source={{ uri: car.thumbnail_url }}
        style={styles.carImage}
        resizeMode="cover"
      />
      
      {sold && (
        <View style={styles.soldBadge}>
          <Text style={styles.soldBadgeText}>Продано</Text>
        </View>
      )}
      
      <View style={styles.carInfo}>
        <Text style={styles.carBrand} numberOfLines={1}>
          {car.brand || 'Авто'} {car.model || ''}
        </Text>
        <Text style={styles.carDetails} numberOfLines={1}>
          {car.year || 'N/A'} • {car.mileage ? (car.mileage / 1000).toFixed(0) : '0'}k км
        </Text>
        <Text style={styles.carPrice}>{formatPrice(car.price)} сом</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionContainer: {
    padding: 20,
  },
  messageButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  carGrid: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  carCard: {
    width: CAR_CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  carCardSold: {
    opacity: 0.6,
  },
  carImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#1C1C1E',
  },
  soldBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  carInfo: {
    padding: 12,
  },
  carBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  carDetails: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  carPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
});
