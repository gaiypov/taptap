import { CategoryModal } from '@/components/Upload/CategoryModal';
import { TipsModal } from '@/components/Upload/TipsModal';
import { CategoryType, UPLOAD_TEXTS } from '@/config/uploadTexts';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UploadScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryType>('auto');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  const config = UPLOAD_TEXTS[category];

  // Пульсирующая анимация иконки
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleRecordVideo = async () => {
    if ('disabled' in config.mainButton && config.mainButton.disabled) {
      return;
    }
    
    try {
      // 1. Запросить разрешения
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const audioPermission = await Audio.requestPermissionsAsync();
      
      if (!cameraPermission.granted || !audioPermission.granted) {
        Alert.alert(
          'Нужны разрешения',
          'Разрешите доступ к камере и микрофону для записи видео',
          [
            { text: 'Отмена', style: 'cancel' },
            { 
              text: 'Открыть настройки', 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
        return;
      }
      
      // 2. Перейти на экран камеры
      router.push({
        pathname: '/camera',
        params: { category }
      });
      
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось получить разрешения для камеры'
      );
    }
  };

  const handleGallery = () => {
    // TODO: Implement gallery picker
    alert('Загрузка из галереи скоро появится!');
  };

  const handlePhoto = () => {
    // TODO: Implement photo picker
    alert('Загрузка фото скоро появится!');
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* Header с переключателем категорий */}
      <TouchableOpacity 
        style={styles.categorySelector}
        onPress={() => setShowCategoryModal(true)}
      >
        <Text style={styles.categoryIcon}>{config.icon}</Text>
        <Text style={styles.categoryTitle}>{config.title}</Text>
        <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Hero секция с анимацией */}
      <View style={styles.hero}>
        <Animated.View 
          style={[
            styles.heroCircle, 
            {
              transform: [
                { scale: scaleAnim }, 
                { rotate: spin }
              ]
            }
          ]}
        >
          <Ionicons name="cloud-upload-outline" size={80} color="#FFFFFF" />
        </Animated.View>
        
        <Text style={styles.heroEmoji}>{config.hero.emoji}</Text>
        <Text style={styles.heroTitle}>{config.hero.title}</Text>
        <Text style={styles.heroSubtitle}>{config.hero.subtitle}</Text>
        
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{config.hero.cta}</Text>
        </View>
      </View>
      
      {/* Статистика */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {config.stats.sold.split(' ')[0]}
          </Text>
          <Text style={styles.statLabel}>
            {config.stats.sold.split(' ').slice(1).join(' ')}
          </Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{config.stats.rating}</Text>
          <Text style={styles.statLabel}>Средний рейтинг</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{config.stats.aiScore}</Text>
          <Text style={styles.statLabel}>AI точность</Text>
        </View>
      </View>
      
      {/* AI Promise */}
      <View style={styles.aiCard}>
        <Text style={styles.aiIcon}>{config.aiPromise.icon}</Text>
        <Text style={styles.aiTitle}>{config.aiPromise.title}</Text>
        <Text style={styles.aiSubtitle}>{config.aiPromise.subtitle}</Text>
        
        <View style={styles.aiFeatures}>
          {config.aiPromise.features.map((feature, i) => (
            <View key={i} style={styles.aiFeature}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.aiFeatureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Главная кнопка */}
      <TouchableOpacity 
        style={[
          styles.mainButton,
          'disabled' in config.mainButton && config.mainButton.disabled && styles.mainButtonDisabled
        ]}
        onPress={() => handleRecordVideo()}
        disabled={'disabled' in config.mainButton ? config.mainButton.disabled : false}
      >
        <LinearGradient
          colors={'disabled' in config.mainButton && config.mainButton.disabled 
            ? ['#9CA3AF', '#6B7280'] 
            : ['#E63946', '#D62828']}
          style={styles.mainButtonGradient}
        >
          <Ionicons 
            name={'disabled' in config.mainButton && config.mainButton.disabled ? "lock-closed" : "videocam"} 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={styles.mainButtonText}>
            {config.mainButton.text}
          </Text>
          <Text style={styles.mainButtonEmoji}>
            {config.mainButton.emoji}
          </Text>
        </LinearGradient>
        <Text style={styles.mainButtonSubtitle}>
          {config.mainButton.subtitle}
        </Text>
      </TouchableOpacity>
      
      {/* Кнопка "Советы по съемке" */}
      <TouchableOpacity 
        style={styles.tipsButton}
        onPress={() => setShowTips(true)}
      >
        <Ionicons name="bulb-outline" size={20} color="#E63946" />
        <Text style={styles.tipsButtonText}>
          Как правильно снимать {category === 'auto' ? 'авто' : category === 'horse' ? 'коня' : 'недвижимость'}?
        </Text>
      </TouchableOpacity>
      
      {/* Альтернативные способы */}
      <View style={styles.alternativeButtons}>
        <TouchableOpacity style={styles.altButton} onPress={handleGallery}>
          <Ionicons name="images-outline" size={24} color="#111827" />
          <Text style={styles.altButtonText}>Галерея</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.altButton} onPress={handlePhoto}>
          <Ionicons name="camera-outline" size={24} color="#111827" />
          <Text style={styles.altButtonText}>Фото</Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal выбора категории */}
      <CategoryModal 
        visible={showCategoryModal}
        onSelect={(cat) => {
          setCategory(cat);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />
      
      {/* Modal с советами */}
      <TipsModal
        visible={showTips}
        category={category}
        tips={config.tips}
        onClose={() => setShowTips(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 15,
  },
  heroBadge: {
    backgroundColor: '#E63946',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2C2C2E',
  },
  aiCard: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  aiIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  aiSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 15,
  },
  aiFeatures: {
    gap: 10,
  },
  aiFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiFeatureText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  mainButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mainButtonDisabled: {
    opacity: 0.6,
  },
  mainButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mainButtonEmoji: {
    fontSize: 18,
  },
  mainButtonSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  tipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  tipsButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  alternativeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  altButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  altButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});
