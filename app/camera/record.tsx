import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// const { height } = Dimensions.get('window');

type IoniconName = keyof typeof Ionicons.glyphMap;

interface RecordingStage {
  stage: number;
  duration: number;
  title: string;
  description: string;
  icon: IoniconName;
}

// Гайд по съемке АВТОМОБИЛЯ (120 секунд разбито на этапы)
const CAR_RECORDING_GUIDE: RecordingStage[] = [
  { 
    stage: 0, 
    duration: 8, 
    title: 'Передняя часть',
    description: 'Снимите переднюю часть автомобиля',
    icon: 'arrow-forward'
  },
  { 
    stage: 1, 
    duration: 8, 
    title: 'Правый бок',
    description: 'Медленно обойдите справа',
    icon: 'arrow-forward'
  },
  { 
    stage: 2, 
    duration: 8, 
    title: 'Задняя часть',
    description: 'Снимите заднюю часть',
    icon: 'arrow-forward'
  },
  { 
    stage: 3, 
    duration: 8, 
    title: 'Левый бок',
    description: 'Завершите круг слева',
    icon: 'arrow-forward'
  },
  { 
    stage: 4, 
    duration: 8, 
    title: 'Крыша и капот',
    description: 'Покажите верхнюю часть',
    icon: 'arrow-up'
  },
  { 
    stage: 5, 
    duration: 10, 
    title: 'Салон передний',
    description: 'Снимите передние сиденья и панель',
    icon: 'car-sport'
  },
  { 
    stage: 6, 
    duration: 10, 
    title: 'Салон задний',
    description: 'Покажите задние сиденья',
    icon: 'car-sport'
  },
  { 
    stage: 7, 
    duration: 10, 
    title: 'Одометр',
    description: 'КРУПНО снимите пробег!',
    icon: 'speedometer'
  },
  { 
    stage: 8, 
    duration: 10, 
    title: 'Багажник',
    description: 'Откройте и покажите багажник',
    icon: 'briefcase'
  },
  { 
    stage: 9, 
    duration: 15, 
    title: 'Двигатель',
    description: 'Откройте капот, снимите двигатель',
    icon: 'construct'
  },
  { 
    stage: 10, 
    duration: 15, 
    title: 'Документы',
    description: 'Покажите техпаспорт',
    icon: 'document-text'
  },
  { 
    stage: 11, 
    duration: 10, 
    title: 'Завершение',
    description: 'Общий обзор автомобиля',
    icon: 'checkmark-circle'
  },
];

// Гайд по съемке ЛОШАДИ (80 секунд разбито на этапы)
const HORSE_RECORDING_GUIDE: RecordingStage[] = [
  { 
    stage: 0, 
    duration: 10, 
    title: 'Общий вид спереди',
    description: 'Снимите лошадь в полный рост спереди',
    icon: 'arrow-forward'
  },
  { 
    stage: 1, 
    duration: 10, 
    title: 'Правый бок',
    description: 'Обойдите справа, покажите профиль',
    icon: 'arrow-forward'
  },
  { 
    stage: 2, 
    duration: 10, 
    title: 'Задняя часть',
    description: 'Снимите лошадь сзади',
    icon: 'arrow-forward'
  },
  { 
    stage: 3, 
    duration: 10, 
    title: 'Левый бок',
    description: 'Обойдите слева, завершите круг',
    icon: 'arrow-forward'
  },
  { 
    stage: 4, 
    duration: 10, 
    title: 'Голова и морда',
    description: 'КРУПНО снимите голову лошади',
    icon: 'eye'
  },
  { 
    stage: 5, 
    duration: 10, 
    title: 'Ноги и копыта',
    description: 'Покажите ноги со всех сторон',
    icon: 'walk'
  },
  { 
    stage: 6, 
    duration: 10, 
    title: 'Движение',
    description: 'Покажите, как лошадь ходит/бежит',
    icon: 'flash'
  },
  { 
    stage: 7, 
    duration: 10, 
    title: 'Документы',
    description: 'Покажите родословную (если есть)',
    icon: 'document-text'
  },
];

export default function RecordScreen() {
  // Получаем категорию из параметров URL
  const { category = 'car' } = useLocalSearchParams<{ category?: 'car' | 'horse' }>();
  
  // Выбираем подсказки в зависимости от категории
  const RECORDING_GUIDE = category === 'horse' ? HORSE_RECORDING_GUIDE : CAR_RECORDING_GUIDE;
  const TOTAL_DURATION = RECORDING_GUIDE.reduce((acc, stage) => acc + stage.duration, 0);
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Проверяем разрешения при монтировании
  useEffect(() => {
    const checkPermissions = async () => {
      if (!permission) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            'Нужны разрешения',
            'Для записи видео нужен доступ к камере',
            [
              { text: 'Отмена', onPress: () => router.back() },
              { text: 'Разрешить', onPress: () => requestPermission() }
            ]
          );
        }
      }
    };
    
    checkPermissions();
  }, [permission, requestPermission, router]);

  // Вычисляем текущий этап
  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < RECORDING_GUIDE.length; i++) {
      accumulated += RECORDING_GUIDE[i].duration;
      if (currentTime < accumulated) {
        setCurrentStage(i);
        break;
      }
    }
  }, [currentTime]);

  const startRecording = async () => {
    // Проверяем разрешения
    if (!permission?.granted) {
      Alert.alert(
        'Нужны разрешения',
        'Для записи видео нужен доступ к камере',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Разрешить', onPress: async () => {
            const result = await requestPermission();
            if (!result.granted) {
              Alert.alert('Ошибка', 'Не удалось получить разрешение на камеру');
            }
          }}
        ]
      );
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Ошибка', 'Камера не инициализирована.');
      return;
    }

    if (!cameraReady) {
      Alert.alert('Ошибка', 'Камера не готова. Пожалуйста, подождите загрузки камеры.');
      return;
    }

    try {
      setIsRecording(true);
      
      // Небольшая задержка для стабилизации
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✅ СНАЧАЛА запускаем таймер
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= TOTAL_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      // ✅ ПОТОМ запускаем запись БЕЗ await (в фоне)
      cameraRef.current.recordAsync({
        maxDuration: TOTAL_DURATION,
      }).then((video: any) => {
        console.log('✅ Recording completed:', video);
        if (video && video.uri) {
          handleVideoRecorded(video.uri);
        }
      }).catch((error: any) => {
        console.error('❌ Recording error:', error);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        Alert.alert('Ошибка', 'Не удалось записать видео. Попробуйте снова.');
      });
      
    } catch (error) {
      console.error('❌ Recording start error:', error);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      Alert.alert('Ошибка', 'Не удалось начать запись. Попробуйте снова.');
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };


  const handleVideoRecorded = async (uri: string) => {
    // Получаем информацию о файле
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists || fileInfo.isDirectory) {
      Alert.alert('Ошибка', 'Не удалось получить информацию о записанном видео');
      setIsRecording(false);
      return;
    }
    
    const fileSizeInMb = fileInfo.size ? fileInfo.size / 1024 / 1024 : 0;
    
    Alert.alert(
      'Видео записано!',
      `Размер: ${fileSizeInMb.toFixed(2)} MB`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Обработать',
          onPress: () => {
            // Переходим на экран обработки
            router.push({
              pathname: '/camera/process',
              params: { videoUri: uri },
            });
          },
        },
      ]
    );
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Необходим доступ к камере
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Разрешить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentGuide = RECORDING_GUIDE[currentStage];
  const progress = (currentTime / TOTAL_DURATION) * 100;
  const stageTimeLeft = RECORDING_GUIDE[currentStage].duration - 
    (currentTime - RECORDING_GUIDE.slice(0, currentStage).reduce((acc, s) => acc + s.duration, 0));

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setCameraReady(true)}
      >
        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topGradient}
        >
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(TOTAL_DURATION / 60)}:{(TOTAL_DURATION % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.flipButton}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Guide Overlay */}
        {isRecording && (
          <View style={styles.guideOverlay}>
            <LinearGradient
              colors={['rgba(255, 59, 48, 0.9)', 'rgba(255, 107, 53, 0.9)']}
              style={styles.guideCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name={currentGuide.icon} size={32} color="#FFF" />
              <Text style={styles.guideTitle}>{currentGuide.title}</Text>
              <Text style={styles.guideDescription}>{currentGuide.description}</Text>
              <Text style={styles.guideTimer}>{stageTimeLeft} сек</Text>
            </LinearGradient>
          </View>
        )}

        {/* Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        >
          <View style={styles.controlsContainer}>
            {!isRecording ? (
              // Start Button
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  !cameraReady && styles.recordButtonDisabled
                ]}
                onPress={startRecording}
                disabled={!cameraReady}
              >
                <View style={[
                  styles.recordButtonInner,
                  !cameraReady && { opacity: 0.5 }
                ]} />
                {!cameraReady && (
                  <Text style={styles.cameraNotReadyText}>Подождите...</Text>
                )}
              </TouchableOpacity>
            ) : (
              // Stop Button
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopRecording}
              >
                <View style={styles.stopButtonInner} />
              </TouchableOpacity>
            )}
          </View>

          {/* Stage Indicators */}
          <View style={styles.stageIndicators}>
            {RECORDING_GUIDE.map((stage, index) => (
              <View
                key={index}
                style={[
                  styles.stageIndicator,
                  index === currentStage && styles.stageIndicatorActive,
                  index < currentStage && styles.stageIndicatorComplete,
                ]}
              />
            ))}
          </View>
        </LinearGradient>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  topGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF3B30',
  },
  guideOverlay: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
  },
  guideCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  guideTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  guideDescription: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  guideTimer: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 12,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  stageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  stageIndicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  stageIndicatorActive: {
    backgroundColor: '#FF3B30',
  },
  stageIndicatorComplete: {
    backgroundColor: '#FFF',
  },
  permissionText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordButtonDisabled: {
    opacity: 0.6,
  },
  cameraNotReadyText: {
    position: 'absolute',
    bottom: -30,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

