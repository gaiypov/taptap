import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UploadScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    
    if (status === 'granted') {
      router.push('/camera/record');
    } else {
      Alert.alert(
        'Разрешение необходимо',
        'Для съемки видео необходим доступ к камере'
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000', '#1a1a1a']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="videocam" size={60} color="#FF3B30" />
            <Text style={styles.title}>Продать автомобиль</Text>
            <Text style={styles.subtitle}>
              Снимите видео и AI определит всю информацию
            </Text>
          </View>

          {/* Guide Steps */}
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>Как снимать:</Text>
            
            <GuideStep
              number="1"
              icon="car-outline"
              title="Экстерьер (40 сек)"
              description="Обойдите авто по кругу: передняя часть, правый бок, задняя, левый бок"
            />
            
            <GuideStep
              number="2"
              icon="car-sport-outline"
              title="Интерьер (40 сек)"
              description="Салон, передние и задние сиденья, панель приборов, одометр крупно"
            />
            
            <GuideStep
              number="3"
              icon="construct-outline"
              title="Двигатель (20 сек)"
              description="Откройте капот и снимите моторный отсек"
            />
            
            <GuideStep
              number="4"
              icon="document-text-outline"
              title="Документы (20 сек)"
              description="Техпаспорт и документы (без личных данных)"
            />
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Feature
              icon="sparkles"
              text="AI определит марку, модель и состояние"
            />
            <Feature
              icon="shield-checkmark"
              text="Автоматическая оценка стоимости"
            />
            <Feature
              icon="eye-off"
              text="Номера будут автоматически размыты"
            />
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF6B35']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="videocam" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Начать съемку</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Alternative */}
          <TouchableOpacity style={styles.galleryButton}>
            <Ionicons name="images-outline" size={20} color="#8E8E93" />
            <Text style={styles.galleryText}>Загрузить из галереи</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

// Helper Components
function GuideStep({ number, icon, title, description }: any) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={24} color="#FF3B30" />
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

function Feature({ icon, text }: any) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color="#0A84FF" />
      <Text style={styles.featureText}>{text}</Text>
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
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  guideContainer: {
    marginBottom: 30,
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  startButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#8E8E93',
    borderRadius: 12,
    gap: 8,
  },
  galleryText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});