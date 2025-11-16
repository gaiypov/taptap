import BoostBadge from '@/components/Boost/BoostBadge';
import BoostModal from '@/components/Boost/BoostModal';
import { ReportButton } from '@/components/ReportButton';
import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { boostService } from '@/services/payments/boost';
import { db } from '@/services/supabase';
import { Car, Damage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [activeBoost, setActiveBoost] = useState<any>(null);

  useEffect(() => {
    loadCarDetails();
    loadUser();
  }, [id]);

  useEffect(() => {
    if (car) {
      loadBoostStatus();
    }
  }, [car]);

  const loadUser = async () => {
    try {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      errorTracking.addBreadcrumb('Loading car details', 'data', { carId: id });

      const { data, error } = await db.getCarById(id as string);

      if (error) throw error;

      if (data) {
        setCar(data);
        setIsLiked(data.isLiked || false);
        setIsSaved(data.isSaved || false);
      }
    } catch (error) {
      console.error('Error loading car:', error);
      errorTracking.captureException(error as Error, {
        tags: { screen: 'carDetails', action: 'loadCar' },
        extra: { carId: id },
      });
      Alert.alert('Ошибка', 'Не удалось загрузить информацию об автомобиле');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser || !car) return;
    try {
      if (isLiked) {
        await db.unlikeCar(currentUser.id, car.id);
        setIsLiked(false);
        setCar({ ...car, likes: car.likes - 1 });
      } else {
        await db.likeCar(currentUser.id, car.id);
        setIsLiked(true);
        setCar({ ...car, likes: car.likes + 1 });
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !car) return;
    try {
      if (isSaved) {
        await db.unsaveCar(currentUser.id, car.id);
        setIsSaved(false);
        setCar({ ...car, saves: car.saves - 1 });
      } else {
        await db.saveCar(currentUser.id, car.id);
        setIsSaved(true);
        setCar({ ...car, saves: car.saves + 1 });
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !car) return;
    
    try {
      const { data: conversation, error } = await db.getOrCreateConversation(
        car.id,
        currentUser.id,
        car.seller_id
      );

      if (error) throw error;

      if (conversation) {
        router.push(`/chat/${conversation.id}`);
      }
    } catch (error) {
      console.error('Message error:', error);
      Alert.alert('Ошибка', 'Не удалось создать чат');
    }
  };

  const handleCall = () => {
    if (car?.seller?.phone) {
      Linking.openURL(`tel:${car.seller.phone}`);
    }
  };

  const loadBoostStatus = async () => {
    if (!car) return;
    
    try {
      const boost = await boostService.getActiveBoost(car.id);
      if (boost && boost.type) {
        setActiveBoost(boost);
      } else {
        setActiveBoost(null);
      }
    } catch (error) {
      console.error('Error loading boost status:', error);
      setActiveBoost(null);
    }
  };

  const handleBoost = () => {
    if (!currentUser || !car) return;
    
    // Проверяем что пользователь владелец
    if (currentUser.id !== car.seller_id) {
      Alert.alert('Ошибка', 'Только владелец может продвигать объявление');
      return;
    }
    
    setShowBoostModal(true);
  };

  const isOwner = currentUser && car && currentUser.id === car.seller_id;

  const renderAIScore = (score?: number) => {
    if (!score) return null;

    let color = '#4CAF50';
    let label = 'Отличное';
    
    if (score < 50) {
      color = '#FF3B30';
      label = 'Плохое';
    } else if (score < 70) {
      color = '#FF9500';
      label = 'Удовлетворительное';
    } else if (score < 85) {
      color = '#FFCC00';
      label = 'Хорошее';
    }

    return (
      <View style={styles.aiScoreCard}>
        <View style={styles.aiScoreHeader}>
          <Ionicons name="sparkles" size={24} color={color} />
          <Text style={styles.aiScoreTitle}>AI Оценка</Text>
        </View>
        
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color }]}>{score}</Text>
          <Text style={styles.scoreLabel}>{label}</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  const renderDamages = (damages?: Damage[]) => {
    if (!damages || damages.length === 0) return null;

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'minor': return '#4CAF50';
        case 'moderate': return '#FFCC00';
        case 'major': return '#FF9500';
        case 'severe': return '#FF3B30';
        default: return '#8E8E93';
      }
    };

    const getSeverityLabel = (severity: string) => {
      switch (severity) {
        case 'minor': return 'Незначительное';
        case 'moderate': return 'Среднее';
        case 'major': return 'Серьезное';
        case 'severe': return 'Критическое';
        default: return severity;
      }
    };

    return (
      <View style={styles.damagesCard}>
        <Text style={styles.sectionTitle}>Обнаруженные повреждения</Text>
        
        {Array.isArray(damages) && damages.map((damage, index) => (
          <View key={index} style={styles.damageItem}>
            <View style={styles.damageHeader}>
              <Text style={styles.damageType}>{damage.type}</Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(damage.severity) + '20' }]}>
                <Text style={[styles.severityText, { color: getSeverityColor(damage.severity) }]}>
                  {getSeverityLabel(damage.severity)}
                </Text>
              </View>
            </View>
            <Text style={styles.damageLocation}>{damage.location}</Text>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${damage.confidence * 100}%` }]} />
            </View>
            <Text style={styles.confidenceText}>Уверенность: {Math.round(damage.confidence * 100)}%</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Автомобиль не найден</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: car.video_url }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
          />
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          {/* Report Button */}
          <View style={styles.reportButtonContainer}>
            <ReportButton
              targetType="car"
              targetId={car.id}
              reportedUserId={car.seller_id}
              iconColor="#FFF"
            />
          </View>
        </View>

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.carTitle}>{car.brand || 'Авто'} {car.model || ''}</Text>
              <Text style={styles.carYear}>{car.year || 'N/A'} год</Text>
            </View>
            {activeBoost && activeBoost.type && (
              <BoostBadge type={activeBoost.type} />
            )}
          </View>
          <Text style={styles.carPrice}>{car.price?.toLocaleString()} сом</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={20} color="#8E8E93" />
            <Text style={styles.statValue}>{car.mileage?.toLocaleString()}</Text>
            <Text style={styles.statLabel}>км</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={20} color="#8E8E93" />
            <Text style={styles.statValue}>{car.location}</Text>
            <Text style={styles.statLabel}>Город</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={20} color="#8E8E93" />
            <Text style={styles.statValue}>{car.views}</Text>
            <Text style={styles.statLabel}>Просмотров</Text>
          </View>
        </View>

        {/* AI Analysis */}
        {car.ai_score && renderAIScore(car.ai_score)}

        {/* Damages */}
        {car.ai_damages && renderDamages(car.ai_damages)}

        {/* Description */}
        {car.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.descriptionText}>{car.description}</Text>
          </View>
        )}

        {/* Seller Info */}
        {car.seller && (
          <TouchableOpacity 
            style={styles.sellerCard}
            onPress={() => router.push(`/profile/${car.seller_id}`)}
          >
            <Image
              source={{ uri: car.seller.avatar_url || 'https://via.placeholder.com/50' }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{car.seller.name}</Text>
                {car.seller.is_verified && (
                  <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                )}
              </View>
              <View style={styles.sellerStats}>
                <Ionicons name="star" size={14} color="#FFCC00" />
                <Text style={styles.sellerRating}>{car.seller.rating?.toFixed(1) || '0.0'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
          </TouchableOpacity>
        )}

        {/* BOOST Section (только для владельца) */}
        {isOwner && (
          <View style={styles.boostSection}>
            <View style={styles.boostHeader}>
              <View>
                <Text style={styles.boostTitle}>📈 Хотите больше просмотров?</Text>
                <Text style={styles.boostDescription}>
                  Продвиньте объявление и получите до 10x больше просмотров!
                </Text>
              </View>
            </View>
            
            {activeBoost && activeBoost.type ? (
              <View style={styles.activeBoostInfo}>
                <View style={styles.activeBoostHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.activeBoostTitle}>BOOST активен</Text>
                </View>
                <Text style={styles.activeBoostTime}>
                  Осталось: {Math.floor(activeBoost.hoursRemaining)} часов
                </Text>
                <Text style={styles.activeBoostDescription}>
                  Ваше объявление продвигается с тарифом &ldquo;{boostService.getPlan(activeBoost.type)?.name}&rdquo;
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.boostButton}
                onPress={handleBoost}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF3B30', '#FF1744']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.boostButtonGradient}
                >
                  <Text style={styles.boostButtonText}>🚀 ПРОДВИНУТЬ ОБЪЯВЛЕНИЕ</Text>
                  <Text style={styles.boostButtonSubtext}>от 50 сом</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <LinearGradient
        colors={['transparent', '#000000']}
        style={styles.actionBar}
      >
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#FF3B30" : "#FFF"} 
          />
          <Text style={styles.actionCount}>{car.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? "#007AFF" : "#FFF"} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleMessage}>
          <Ionicons name="chatbubble" size={20} color="#FFF" />
          <Text style={styles.primaryButtonText}>Написать</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* BOOST Modal */}
      {currentUser && car && (
        <BoostModal
          visible={showBoostModal}
          onClose={() => {
            setShowBoostModal(false);
            loadBoostStatus(); // Обновляем статус после закрытия
            loadCarDetails(); // Обновляем данные авто
          }}
          carId={car.id}
          userId={currentUser.id}
          carName={`${car.brand} ${car.model} ${car.year}`}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainInfo: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  carTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  carYear: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  carPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 12,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  aiScoreCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  aiScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  damagesCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  damageItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  damageType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  damageLocation: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  descriptionCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  sellerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  sellerRating: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 34,
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 10,
    color: '#FFF',
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#FF3B30',
    borderRadius: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostSection: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  boostHeader: {
    marginBottom: 16,
  },
  boostTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  boostDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  activeBoostInfo: {
    backgroundColor: '#0a2f0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  activeBoostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  activeBoostTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  activeBoostTime: {
    fontSize: 14,
    color: '#8BC34A',
    marginBottom: 8,
    fontWeight: '600',
  },
  activeBoostDescription: {
    fontSize: 13,
    color: '#A5D6A7',
    lineHeight: 18,
  },
  boostButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  boostButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  boostButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  boostButtonSubtext: {
    fontSize: 12,
    color: '#FFE5E5',
  },
});
