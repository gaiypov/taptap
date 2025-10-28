import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const cameraRef = useRef<CameraView>(null);
  
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 минуты максимум
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  
  // Таймер обратного отсчета
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (recording && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording, countdown]);
  
  // Запрос разрешений при монтировании
  useEffect(() => {
    (async () => {
      if (!permission) {
        await requestPermission();
        // Permission state will be updated automatically
      }
    })();
  }, [permission, requestPermission]);
  
  const startRecording = async () => {
    // Проверяем разрешения
    if (!permission?.granted) {
      Alert.alert(
        'Нужны разрешения',
        'Для записи видео нужен доступ к камере',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Разрешить', onPress: requestPermission }
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
      setRecording(true);
      setCountdown(120); // Сброс таймера
      
      // Небольшая задержка для стабилизации
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: 120,
      });
      
      console.log('Video recorded:', video);
      
      // Видео записано, можно загрузить на сервер
      Alert.alert(
        'Видео записано!',
        'Видео успешно записано. Хотите загрузить его?',
        [
          { text: 'Записать еще', style: 'cancel' },
          { 
            text: 'Загрузить', 
            onPress: () => {
              // TODO: Загрузить видео на сервер
              router.back();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Ошибка', 'Не удалось записать видео');
    } finally {
      setRecording(false);
    }
  };
  
  const stopRecording = () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
      setRecording(false);
    }
  };
  
  const toggleCameraType = () => {
    setCameraType(current => 
      current === 'back' ? 'front' : 'back'
    );
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Запрос разрешений...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Нет доступа к камере</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        onCameraReady={() => {
          console.log('✅ Camera ready!');
          setCameraReady(true);
        }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {category === 'auto' ? '🚗' : category === 'horse' ? '🐴' : '🏠'} 
                Запись видео
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={toggleCameraType}
            >
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.timer}>
              <Text style={styles.timerText}>
                {formatTime(countdown)}
              </Text>
            </View>
          </View>
          
          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsText}>
              {category === 'auto' && 'Покажите авто со всех сторон'}
              {category === 'horse' && 'Покажите коня целиком'}
              {category === 'real_estate' && 'Медленно пройдите по комнатам'}
            </Text>
          </View>
          
          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            
            {/* Gallery Button */}
            <TouchableOpacity style={styles.galleryButton}>
              <View style={styles.galleryPreview}>
                <Ionicons name="images" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            {/* Record Button */}
            <TouchableOpacity 
              style={styles.recordButton}
              onPress={recording ? stopRecording : startRecording}
            >
              <LinearGradient
                colors={recording ? ['#FF3B30', '#FF453A'] : ['#FFFFFF', '#F2F2F7']}
                style={styles.recordButtonGradient}
              >
                <View style={[
                  styles.recordButtonInner,
                  recording && styles.recordButtonInnerRecording
                ]} />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Flash Button */}
            <TouchableOpacity style={styles.flashButton}>
              <Ionicons name="flash-off" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
          </View>
          
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  message: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    backgroundColor: '#E63946',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  tipsContainer: {
    position: 'absolute',
    top: height * 0.4,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tipsText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E63946',
  },
  recordButtonInnerRecording: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  flashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
