import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { aiService } from '../../services/ai';
import { Car } from '../../types';

export default function ProcessScreen() {
  const { videoUri } = useLocalSearchParams<{ videoUri: string }>();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<Partial<Car> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processVideo();
  }, []);

  const processVideo = async () => {
    try {
      setIsProcessing(true);
      
      // Симуляция этапов обработки
      const steps = [
        { step: 'Извлечение кадров...', progress: 15 },
        { step: 'Определение марки и модели...', progress: 30 },
        { step: 'Анализ состояния кузова...', progress: 50 },
        { step: 'Распознавание одометра...', progress: 65 },
        { step: 'Оценка интерьера...', progress: 80 },
        { step: 'Расчет стоимости...', progress: 95 },
        { step: 'Финализация...', progress: 100 },
      ];

      for (const { step, progress: stepProgress } of steps) {
        setCurrentStep(step);
        setProgress(stepProgress);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Вызываем AI анализ
      const analysisResult = await aiService.analyzeCar(videoUri || '');
      
      setResult(analysisResult);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Ошибка обработки видео');
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#FF3B30" />
          <Text style={styles.errorTitle}>Ошибка</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000', '#1a1a1a']}
          style={styles.gradient}
        >
          <View style={styles.processingContainer}>
            <Ionicons name="sparkles" size={80} color="#FF3B30" />
            <Text style={styles.processingTitle}>AI анализирует видео</Text>
            <Text style={styles.processingStep}>{currentStep}</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>

            {/* Animation */}
            <ActivityIndicator size="large" color="#FF3B30" style={styles.spinner} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!result) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <LinearGradient
          colors={['#FF3B30', '#FF6B35']}
          style={styles.resultHeader}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="checkmark-circle" size={60} color="#FFF" />
            <Text style={styles.headerTitle}>Анализ завершен!</Text>
            <Text style={styles.headerSubtitle}>
              AI определил всю информацию
            </Text>
          </View>
        </LinearGradient>

        {/* Car Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Автомобиль</Text>
          <View style={styles.carInfoCard}>
            <Text style={styles.carName}>
              {result.brand} {result.model} {result.year}
            </Text>
            <View style={styles.infoRow}>
              <InfoItem icon="color-palette" label="Цвет" value="Серебристый" />
              <InfoItem icon="speedometer" label="Пробег" value={`${result.mileage?.toLocaleString()} км`} />
            </View>
            <View style={styles.infoRow}>
              <InfoItem icon="cog" label="Коробка" value="Автомат" />
              <InfoItem icon="location" label="Город" value={result.location || 'Бишкек'} />
            </View>
          </View>
        </View>

        {/* AI Analysis */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>AI Оценка состояния</Text>
          <View style={styles.analysisCard}>
            {/* Score Circle */}
            <View style={styles.scoreContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>
                  {result.aiAnalysis?.conditionScore}
                </Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
              <Text style={styles.scoreText}>
                {result.aiAnalysis?.condition === 'excellent' && 'Отличное'}
                {result.aiAnalysis?.condition === 'good' && 'Хорошее'}
                {result.aiAnalysis?.condition === 'fair' && 'Удовлетворительное'}
                {result.aiAnalysis?.condition === 'poor' && 'Плохое'}
              </Text>
            </View>

            {/* Damages */}
            {result.aiAnalysis?.damages && result.aiAnalysis.damages.length > 0 && (
              <View style={styles.damagesContainer}>
                <Text style={styles.damagesTitle}>Обнаружено:</Text>
                {result.aiAnalysis.damages.map((damage, index) => (
                  <View key={index} style={styles.damageItem}>
                    <Ionicons 
                      name="alert-circle" 
                      size={20} 
                      color={damage.severity === 'severe' ? '#FF3B30' : '#FF9500'} 
                    />
                    <Text style={styles.damageText}>
                      {damage.type === 'scratch' && 'Царапина'}
                      {damage.type === 'dent' && 'Вмятина'}
                      {damage.type === 'rust' && 'Коррозия'}
                      {' на '}
                      {damage.location}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Price Estimate */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Рекомендуемая цена</Text>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>AI оценка стоимости:</Text>
            <Text style={styles.priceValue}>
              {((result.aiAnalysis?.estimatedPrice?.min || 0) / 1000000).toFixed(1)} - {((result.aiAnalysis?.estimatedPrice?.max || 0) / 1000000).toFixed(1)} млн сом
            </Text>
            <Text style={styles.priceHint}>
              Цена учитывает состояние, пробег и рыночную стоимость
            </Text>
          </View>
        </View>

        {/* Set Price */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Ваша цена</Text>
          <View style={styles.priceInputCard}>
            <Text style={styles.priceInputLabel}>Укажите стоимость:</Text>
            <TouchableOpacity style={styles.priceInput}>
              <Text style={styles.priceInputText}>2 500 000</Text>
              <Text style={styles.priceInputCurrency}>сом</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Publish Button */}
        <TouchableOpacity 
          style={styles.publishButton}
          onPress={() => {
            // Здесь будет публикация
            router.push('/(tabs)/profile');
          }}
        >
          <LinearGradient
            colors={['#FF3B30', '#FF6B35']}
            style={styles.publishGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="cloud-upload" size={24} color="#FFF" />
            <Text style={styles.publishText}>Опубликовать</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color="#8E8E93" />
      <View style={styles.infoItemContent}>
        <Text style={styles.infoItemLabel}>{label}</Text>
        <Text style={styles.infoItemValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 10,
  },
  processingStep: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 20,
  },
  spinner: {
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultHeader: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  carInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
  },
  carName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoItemContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  analysisCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  damagesContainer: {
    marginTop: 20,
  },
  damagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  damageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  damageText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  priceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  priceHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  priceInputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
  },
  priceInputLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
  },
  priceInputText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  priceInputCurrency: {
    fontSize: 18,
    color: '#8E8E93',
  },
  publishButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  publishGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  publishText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
