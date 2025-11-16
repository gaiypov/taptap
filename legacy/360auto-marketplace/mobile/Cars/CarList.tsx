// components/Cars/CarList.tsx
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCars } from '../../hooks/useCars';
import { Car } from '../../types';

interface CarListProps {
  onCarPress?: (car: Car) => void;
}

export function CarList({ onCarPress }: CarListProps) {
  const { cars, loading, error, incrementViews } = useCars();

  const handleCarPress = async (car: Car) => {
    if (car.id) {
      await incrementViews(car.id);
    }
    onCarPress?.(car);
  };

  const renderCar = ({ item }: { item: Car }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => handleCarPress(item)}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      
      <View style={styles.carInfo}>
        <Text style={styles.carTitle}>
          {item.brand || 'Авто'} {item.model || ''} ({item.year || 'N/A'})
        </Text>
        
        <Text style={styles.carDetails}>
          {item.mileage ? item.mileage.toLocaleString() : '0'} км • {item.location || 'Не указано'}
        </Text>
        
        {item.aiAnalysis && (
          <View style={styles.aiAnalysis}>
            <Text style={styles.conditionText}>
              Состояние: {item.aiAnalysis.condition}
            </Text>
            <Text style={styles.priceText}>
              {item.aiAnalysis.estimatedPrice.min.toLocaleString()} - {item.aiAnalysis.estimatedPrice.max.toLocaleString()} сом
            </Text>
          </View>
        )}
        
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>👁️</Text>
            <Text style={styles.statText}>{item.views}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>💾</Text>
            <Text style={styles.statText}>{item.saves}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка автомобилей...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Ошибка: {error}</Text>
      </View>
    );
  }

  if (cars.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Автомобили не найдены</Text>
        <Text style={styles.emptySubtext}>
          Будьте первым, кто добавит автомобиль!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={cars}
      renderItem={renderCar}
      keyExtractor={(item) => item.id || Math.random().toString()}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  carCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  carInfo: {
    padding: 16,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  carDetails: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  aiAnalysis: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  conditionText: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: '#ccc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ccc',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
});
