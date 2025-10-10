import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    View,
} from 'react-native';
import VideoPlayer from '../../components/VideoFeed/VideoPlayer';
import { Car } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock данные для демо
const MOCK_CARS: Car[] = [
  {
    id: '1',
    sellerId: 'seller1',
    sellerName: 'Азамат Бекмуратов',
    videoUrl: 'https://example.com/video1.mp4',
    thumbnailUrl: 'https://picsum.photos/400/600',
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    price: 2500000,
    mileage: 45000,
    location: 'Бишкек',
    views: 1234,
    likes: 89,
    saves: 23,
    createdAt: new Date().toISOString(),
    isVerified: true,
    aiAnalysis: {
      condition: 'good',
      conditionScore: 85,
      damages: [],
      estimatedPrice: { min: 2400000, max: 2600000 },
      features: ['Кожаный салон', 'Камера заднего вида'],
    },
  },
  {
    id: '2',
    sellerId: 'seller2',
    sellerName: 'Эльмира Токтосунова',
    videoUrl: 'https://example.com/video2.mp4',
    thumbnailUrl: 'https://picsum.photos/400/600',
    brand: 'BMW',
    model: 'X5',
    year: 2019,
    price: 4500000,
    mileage: 32000,
    location: 'Ош',
    views: 2156,
    likes: 156,
    saves: 45,
    createdAt: new Date().toISOString(),
    isVerified: true,
    aiAnalysis: {
      condition: 'excellent',
      conditionScore: 92,
      damages: [],
      estimatedPrice: { min: 4300000, max: 4700000 },
      features: ['Полный привод', 'Панорамная крыша', 'Кожаный салон'],
    },
  },
  {
    id: '3',
    sellerId: 'seller3',
    sellerName: 'Данияр Абдыкадыров',
    videoUrl: 'https://example.com/video3.mp4',
    thumbnailUrl: 'https://picsum.photos/400/600',
    brand: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2021,
    price: 3800000,
    mileage: 18000,
    location: 'Бишкек',
    views: 3456,
    likes: 234,
    saves: 67,
    createdAt: new Date().toISOString(),
    isVerified: false,
    aiAnalysis: {
      condition: 'excellent',
      conditionScore: 95,
      damages: [],
      estimatedPrice: { min: 3600000, max: 4000000 },
      features: ['Автоматическая коробка', 'Климат-контроль', 'Bluetooth'],
    },
  },
  {
    id: '4',
    sellerId: 'seller4',
    sellerName: 'Айгуль Мамытова',
    videoUrl: 'https://example.com/video4.mp4',
    thumbnailUrl: 'https://picsum.photos/400/600',
    brand: 'Audi',
    model: 'A4',
    year: 2018,
    price: 3200000,
    mileage: 55000,
    location: 'Каракол',
    views: 1876,
    likes: 98,
    saves: 34,
    createdAt: new Date().toISOString(),
    isVerified: true,
    aiAnalysis: {
      condition: 'good',
      conditionScore: 78,
      damages: [
        {
          type: 'scratch',
          severity: 'minor',
          location: 'Передний бампер',
          confidence: 0.85,
        },
      ],
      estimatedPrice: { min: 3000000, max: 3400000 },
      features: ['Кожаный салон', 'Навигация', 'Круиз-контроль'],
    },
  },
  {
    id: '5',
    sellerId: 'seller5',
    sellerName: 'Нурлан Асанов',
    videoUrl: 'https://example.com/video5.mp4',
    thumbnailUrl: 'https://picsum.photos/400/600',
    brand: 'Honda',
    model: 'CR-V',
    year: 2020,
    price: 2800000,
    mileage: 42000,
    location: 'Талас',
    views: 2987,
    likes: 187,
    saves: 56,
    createdAt: new Date().toISOString(),
    isVerified: false,
    aiAnalysis: {
      condition: 'good',
      conditionScore: 82,
      damages: [],
      estimatedPrice: { min: 2700000, max: 2900000 },
      features: ['Полный привод', 'Камера заднего вида', 'Подогрев сидений'],
    },
  },
];

export default function HomeScreen() {
  const [cars, setCars] = useState<Car[]>(MOCK_CARS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderItem = ({ item, index }: { item: Car; index: number }) => (
    <VideoPlayer
      car={item}
      isActive={index === currentIndex}
      onLike={(id: string) => console.log('Liked:', id)}
      onSave={(id: string) => console.log('Saved:', id)}
      onShare={(id: string) => console.log('Share:', id)}
    />
  );

  const loadMoreCars = async () => {
    // Здесь будет загрузка с сервера
    setLoading(true);
    // await fetchMoreCars();
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={cars}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMoreCars}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator size="large" color="#FF3B30" /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});