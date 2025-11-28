import BoostBadge from '@/components/Boost/BoostBadge';
import BoostModal from '@/components/Boost/BoostModal';
import { SimilarListings } from '@/components/Feed/SimilarListings';
import { ReportButton } from '@/components/ReportButton';
import { CategoryType } from '@/config/filterConfig';
import { formatPriceWithUSD } from '@/constants/currency';
import { useUserBehavior } from '@/hooks/useUserBehavior';
import { isRealVideo, normalizeVideoUrl, PLACEHOLDER_VIDEO_URL } from '@/lib/video/videoSource';
import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { boostService } from '@/services/payments/boost';
import { db } from '@/services/supabase';
import { Car, Damage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from '@expo/video';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SCREEN_WIDTH } from '@/utils/constants';
import {
  getCurrentUserSafe,
  openCall,
  openChat,
  toggleLike,
  toggleSave,
  triggerHaptic,
  validateOwner,
} from '@/utils/listingActions';
import { appLogger } from '@/utils/logger';
import { isOwner, requireAuth } from '@/utils/permissionManager';

// Helper component for price display with error handling
function PriceDisplay({ price }: { price: number }) {
  // Handle invalid price values
  const safePrice = typeof price === 'number' && !isNaN(price) && price >= 0 ? price : 0;

  try {
    const priceInfo = formatPriceWithUSD(safePrice);
    return (
      <View>
        <Text style={styles.carPrice}>{priceInfo.kgs}</Text>
        <Text style={styles.carPriceUSD}>{priceInfo.usd}</Text>
      </View>
    );
  } catch {
    // Fallback if formatPriceWithUSD fails
    return (
      <View>
        <Text style={styles.carPrice}>{safePrice.toLocaleString('ru-RU')} сом</Text>
        <Text style={styles.carPriceUSD}>~${Math.round(safePrice * 0.0115).toLocaleString('en-US')}</Text>
      </View>
    );
  }
}

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const behavior = useUserBehavior();
  const viewTrackedRef = useRef(false);

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [activeBoost, setActiveBoost] = useState<any>(null);

  // Video player setup - КРИТИЧНО: нормализуем ПЕРЕД использованием
  // Android requires properly formatted string URLs
  const finalUrl = useMemo(() => {
    try {
      // Step 1: Get raw URL from car data
      const rawUrl = car?.video_url;

      // Step 2: Normalize the URL (handles Optional wrapping, invalid formats, etc.)
      const normalized = normalizeVideoUrl(rawUrl);

      // Step 3: Validate for Android - must be a clean string
      if (Platform.OS === 'android') {
        // Android native player requires clean string URL
        if (typeof normalized !== 'string' || normalized.length === 0) {
          appLogger.warn('[CarDetail] Invalid video URL for Android, using placeholder', {
            carId: car?.id,
            rawUrl: typeof rawUrl === 'string' ? rawUrl.substring(0, 50) : String(rawUrl),
          });
          return PLACEHOLDER_VIDEO_URL;
        }
        // Ensure no Optional() wrapper leaked through
        if (normalized.includes('Optional(')) {
          appLogger.error('[CarDetail] Optional wrapper detected in normalized URL!', {
            normalized: normalized.substring(0, 100),
          });
          return PLACEHOLDER_VIDEO_URL;
        }
      }

      // DEBUG log in development
      if (__DEV__) {
        appLogger.debug('[CarDetail] Video URL normalized', {
          original: typeof rawUrl === 'string' ? rawUrl.substring(0, 50) : String(rawUrl).substring(0, 50),
          normalized: normalized.substring(0, 50),
          platform: Platform.OS,
          carId: car?.id,
        });
      }

      return normalized;
    } catch (error) {
      appLogger.error('[CarDetail] Error normalizing video URL', { error, carId: car?.id });
      return PLACEHOLDER_VIDEO_URL;
    }
  }, [car?.video_url, car?.id]);

  const hasRealVideo = useMemo(() => {
    return isRealVideo(finalUrl);
  }, [finalUrl]);

  // Create player source - ALWAYS use { uri: string } format for both platforms
  // This is the safest format that works consistently on iOS and Android
  const playerSource = useMemo(() => {
    // Don't create player source if no valid URL
    if (!finalUrl || finalUrl.length === 0) {
      return null;
    }
    // Always use object format - works on both iOS and Android
    return { uri: finalUrl };
  }, [finalUrl]);

  // Initialize video player with object source format
  // Pass null if no valid source to prevent crashes
  // Note: expo-video 3.x accepts { uri: string } at runtime, but types may expect string
  const videoPlayer = useVideoPlayer(playerSource as any);

  const loadUser = useCallback(async () => {
    try {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      appLogger.error('Error loading user', { error });
    }
  }, []);

  const loadCarDetails = useCallback(async () => {
    try {
      setLoading(true);
      errorTracking.addBreadcrumb('Loading car details', 'data', { carId: id });

      const { data, error } = await db.getListing(id as string);

      if (error) throw error;

      if (data) {
        setCar(data as Car);
        setIsLiked((data as any).isLiked || false);
        setIsSaved((data as any).isSaved || false);
      }
    } catch (error) {
      appLogger.error('Error loading car', { error });
      errorTracking.captureException(error as Error, {
        tags: { screen: 'carDetails', action: 'loadCar' },
        extra: { carId: id },
      });
      appLogger.error('Failed to load car details', { error, carId: id });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadBoostStatus = useCallback(async (carId: string) => {
    if (!carId) return;
    try {
      const boost = await boostService.getActiveBoost(carId);
      setActiveBoost(boost);
    } catch (error) {
      appLogger.error('Error loading boost', { error });
    }
  }, []);

  useEffect(() => {
    loadCarDetails();
    loadUser();
  }, [loadCarDetails, loadUser]);

  // Update video player source when car changes
  // CRITICAL: Always use { uri: string } format for both platforms
  useEffect(() => {
    if (!videoPlayer || !finalUrl) return;

    try {
      if (isRealVideo(finalUrl) && typeof finalUrl === 'string' && !finalUrl.includes('Optional(')) {
        // Always use object format for both iOS and Android
        videoPlayer.replace({ uri: finalUrl } as any);
        appLogger.debug('[CarDetail] Video player source updated', {
          url: finalUrl.substring(0, 50),
          platform: Platform.OS,
        });
      }
    } catch (error) {
      appLogger.error('[CarDetail] Error updating video player', {
        error,
        carId: car?.id,
        platform: Platform.OS,
      });
    }
  }, [finalUrl, videoPlayer, car?.id]);

  useEffect(() => {
    if (car?.id) {
      loadBoostStatus(car.id);
    }
  }, [car?.id, loadBoostStatus]);

  // Трекинг просмотра объявления
  useEffect(() => {
    if (!car || viewTrackedRef.current) return;

    // Трекаем просмотр только один раз
    viewTrackedRef.current = true;

    const category = (car.category || 'car') as CategoryType;
    behavior.trackView(car.id, category, {
      brand: car.brand,
      model: car.model,
      price: car.price,
      year: car.year,
      city: car.city || car.location,
      color: car.color,
      transmission: car.transmission,
      source: 'detail',
    });

    // Запускаем таймер для длительного просмотра
    behavior.startViewTimer(car.id, category);

    return () => {
      behavior.stopViewTimer();
    };
  }, [car, behavior]);

  const handleLike = async () => {
    if (!requireAuth('like')) return;
    if (!car) return;
    
    triggerHaptic('medium');
    
    try {
      const user = await getCurrentUserSafe();
      if (!user) return;
      
      // Optimistic update
      const previousLiked = isLiked;
      const previousLikes = car.likes || 0;
      
      setIsLiked(!previousLiked);
      setCar({ ...car, likes: previousLiked ? Math.max(previousLikes - 1, 0) : previousLikes + 1 });
      
      // Backend call
      const result = await toggleLike(user.id, car.id, previousLiked, previousLikes);
      setIsLiked(result.isLiked);
      setCar({ ...car, likes: result.likesCount });

      // Трекинг поведения
      const category = (car.category || 'car') as CategoryType;
      if (result.isLiked) {
        behavior.trackLike(car.id, category, {
          brand: car.brand,
          price: car.price,
          city: car.city,
        });
      } else {
        behavior.trackUnlike(car.id, category);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setCar({ ...car, likes: isLiked ? (car.likes || 0) + 1 : Math.max((car.likes || 1) - 1, 0) });
      appLogger.error('Like error', { error });
    }
  };

  const handleSave = async () => {
    if (!requireAuth('save')) return;
    if (!car) return;
    
    triggerHaptic('medium');
    
    try {
      const user = await getCurrentUserSafe();
      if (!user) return;
      
      // Optimistic update
      const previousSaved = isSaved;
      const previousSaves = car.saves || 0;
      
      setIsSaved(!previousSaved);
      setCar({ ...car, saves: previousSaved ? Math.max(previousSaves - 1, 0) : previousSaves + 1 });
      
      // Backend call
      const result = await toggleSave(user.id, car.id, previousSaved, previousSaves);
      setIsSaved(result.isSaved);
      setCar({ ...car, saves: result.savesCount });

      // Трекинг поведения
      const category = (car.category || 'car') as CategoryType;
      if (result.isSaved) {
        behavior.trackFavorite(car.id, category, {
          brand: car.brand,
          price: car.price,
          city: car.city,
        });
      } else {
        behavior.trackUnfavorite(car.id, category);
      }
    } catch (error) {
      // Revert on error
      setIsSaved(!isSaved);
      setCar({ ...car, saves: isSaved ? (car.saves || 0) + 1 : Math.max((car.saves || 1) - 1, 0) });
      appLogger.error('Save error', { error });
    }
  };

  const handleMessage = async () => {
    if (!requireAuth('message')) return;
    if (!car) return;
    
    triggerHaptic('medium');
    
    try {
      const user = await getCurrentUserSafe();
      if (!user || !car.seller_id) return;
      
      const conversationId = await openChat(user.id, car.seller_id, car.id);
      if (conversationId) {
        // Трекинг начала чата
        const category = (car.category || 'car') as CategoryType;
        behavior.trackChatStart(car.id, category);

        router.push({
          pathname: '/chat/[conversationId]',
          params: { conversationId },
        });
      }
    } catch (error) {
      appLogger.error('Message error', { error });
    }
  };

  const handleCall = () => {
    if (!requireAuth('call')) return;
    if (!car?.seller?.phone) return;

    triggerHaptic('medium');

    // Трекинг звонка
    const category = (car.category || 'car') as CategoryType;
    behavior.trackCall(car.id, category);

    openCall(car.seller.phone);
  };

  const handleBoost = () => {
    if (!requireAuth('boost')) return;
    if (!car) return;
    
    triggerHaptic('medium');
    
    if (!currentUser || !validateOwner(currentUser, car)) {
      appLogger.warn('Boost attempted by non-owner', { userId: currentUser?.id, carId: car.id });
      return;
    }
    
    setShowBoostModal(true);
  };

  const owner = currentUser && car ? isOwner(currentUser, car) : false;

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

  const normalizedDetails = car.details ?? {
    brand: car.brand,
    model: car.model,
    year: car.year,
    mileage: car.mileage,
    color: car.color,
  };
  const carBrand = car.brand ?? normalizedDetails.brand ?? 'Авто';
  const carModel = car.model ?? normalizedDetails.model ?? '';
  const carYear = car.year ?? normalizedDetails.year ?? 'N/A';
  const carMileage = car.mileage ?? normalizedDetails.mileage ?? 0;
  const carLocation = car.city ?? car.location ?? 'Город не указан';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Video Player - Android-optimized */}
        <View style={styles.videoContainer}>
          {hasRealVideo && videoPlayer ? (
            <VideoView
              player={videoPlayer}
              style={styles.video}
              nativeControls
              contentFit="cover"
              allowsFullscreen
              showsTimecodes={false}
              requiresLinearPlayback={false}
              contentPosition={{ dx: 0, dy: 0 }}
            />
          ) : (
            <View style={[styles.video, styles.videoPlaceholder]}>
              {loading ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="videocam-off-outline" size={48} color="#666" />
                  <Text style={styles.noVideoText}>Видео недоступно</Text>
                </>
              )}
            </View>
          )}
          
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
              <Text style={styles.carTitle}>{carBrand} {carModel}</Text>
              <Text style={styles.carYear}>{carYear} год</Text>
            </View>
            {activeBoost && activeBoost.type && (
              <BoostBadge type={activeBoost.type} />
            )}
          </View>
          <PriceDisplay price={car.price || 0} />
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={20} color="#8E8E93" />
            <Text style={styles.statValue}>{carMileage.toLocaleString()}</Text>
            <Text style={styles.statLabel}>км</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={20} color="#8E8E93" />
            <Text style={styles.statValue}>{carLocation}</Text>
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
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
          </TouchableOpacity>
        )}

        {/* BOOST Section (только для владельца) */}
        {owner && (
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

        {/* Похожие объявления */}
        {car && (
          <SimilarListings
            listingId={car.id}
            category={(car.category || 'car') as CategoryType}
            limit={6}
          />
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
            if (car?.id) {
              loadBoostStatus(car.id);
            } // Обновляем статус после закрытия
            loadCarDetails(); // Обновляем данные авто
          }}
          carId={car.id}
          userId={currentUser.id}
          carName={`${carBrand} ${carModel} ${carYear}`}
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
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  noVideoText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
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
  carPriceUSD: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
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
