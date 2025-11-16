import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Car } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerProps {
  car: Car;
  isActive: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
}

export default function VideoPlayer({
  car,
  isActive,
  onLike,
  onSave,
  onShare,
}: VideoPlayerProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(car.id);
  };

  const formatPrice = (price: number) => {
    return `${(price / 1000000).toFixed(1)} млн сом`;
  };

  return (
    <View style={styles.container}>
      {/* Видео (сейчас заменено на изображение для демо) */}
      <Image
        source={{ uri: car.thumbnailUrl }}
        style={styles.video}
        resizeMode="cover"
      />
      
      {/* Можно заменить на настоящий Video когда будет контент
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: car.videoUrl }}
        resizeMode={ResizeMode.COVER}
        isLooping
        onPlaybackStatusUpdate={setStatus}
      />
      */}

      {/* Градиент снизу */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />

      {/* Информация об авто */}
      <View style={styles.infoContainer}>
        {/* Продавец */}
        <View style={styles.sellerInfo}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${car.sellerName}` }}
            style={styles.avatar}
          />
          <Text style={styles.sellerName}>{car.sellerName}</Text>
          {car.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#0A84FF" />
          )}
        </View>

        {/* Авто инфо */}
        <Text style={styles.carTitle}>
          {car.brand} {car.model} {car.year}
        </Text>
        <Text style={styles.carDetails}>
          {car.mileage.toLocaleString()} км • {car.location}
        </Text>

        {/* Цена */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(car.price)}</Text>
          {car.aiAnalysis && (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>
                Состояние: {car.aiAnalysis.conditionScore}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Боковые кнопки */}
      <View style={styles.actionsContainer}>
        {/* Лайк */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={32}
            color={isLiked ? '#FF3B30' : '#FFF'}
          />
          <Text style={styles.actionText}>{car.likes}</Text>
        </TouchableOpacity>

        {/* Сохранить */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setIsSaved(!isSaved);
            onSave(car.id);
          }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={32}
            color="#FFF"
          />
          <Text style={styles.actionText}>{car.saves}</Text>
        </TouchableOpacity>

        {/* Поделиться */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare(car.id)}
        >
          <Ionicons name="share-social-outline" size={32} color="#FFF" />
          <Text style={styles.actionText}>Поделиться</Text>
        </TouchableOpacity>

        {/* Сообщение продавцу */}
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  sellerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  carTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carDetails: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  price: {
    color: '#FF3B30',
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
  },
  conditionBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0A84FF',
  },
  conditionText: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 120,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  messageButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});