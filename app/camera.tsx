import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { SCREEN_HEIGHT } from '@/utils/constants';

export default function CameraScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const cameraRef = useRef<CameraView>(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 минуты максимум
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  
  // Запрос разрешений при монтировании
  useEffect(() => {
    (async () => {
      if (!cameraPermission) {
        await requestCameraPermission();
      }
      if (!microphonePermission) {
        await requestMicrophonePermission();
      }
    })();
  }, [cameraPermission, requestCameraPermission, microphonePermission, requestMicrophonePermission]);
  
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    try {
      if (cameraRef.current) {
        cameraRef.current.stopRecording();
      }
    } catch (error) {
      // Игнорируем ошибки при остановке
    }
    
    setIsRecording(false);
  }, [isRecording]);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      // Очищаем таймер
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      // Останавливаем запись если активна
      if (isRecording && cameraRef.current) {
        try {
          cameraRef.current.stopRecording();
        } catch (error) {
          // Игнорируем ошибки при cleanup
        }
      }
    };
  }, [isRecording]);

  // Таймер обратного отсчета
  useEffect(() => {
    // Очищаем предыдущий интервал
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    if (isRecording && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
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
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isRecording, countdown, stopRecording]);
  
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
  
  if (!cameraPermission || !microphonePermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Запрос разрешений...</Text>
      </View>
    );
  }
  
  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          {!cameraPermission.granted && 'Нет доступа к камере\n'}
          {!microphonePermission.granted && 'Нет доступа к микрофону'}
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={async () => {
            if (!cameraPermission.granted) {
              await requestCameraPermission();
            }
            if (!microphonePermission.granted) {
              await requestMicrophonePermission();
            }
          }}
        >
          <Text style={styles.buttonText}>Разрешить доступ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { marginTop: 10, backgroundColor: '#666' }]}
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
          setIsCameraReady(true);
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
              style={[
                styles.recordButton,
                (!isCameraReady || isRecording) && { opacity: 0.5 }
              ]}
              disabled={!isCameraReady || isRecording}
              onPress={async () => {
                if (isRecording) {
                  stopRecording();
                } else {
                  // Проверяем разрешения перед записью
                  if (!cameraPermission?.granted || !microphonePermission?.granted) {
                    Alert.alert(
                      'Нужны разрешения',
                      'Для записи видео нужен доступ к камере и микрофону',
                      [
                        { text: 'Отмена', style: 'cancel' },
                        { 
                          text: 'Разрешить', 
                          onPress: async () => {
                            if (!cameraPermission?.granted) {
                              await requestCameraPermission();
                            }
                            if (!microphonePermission?.granted) {
                              await requestMicrophonePermission();
                            }
                          }
                        }
                      ]
                    );
                    return;
                  }

                  if (!cameraRef.current || !isCameraReady) {
                    Alert.alert('Ошибка', 'Камера не готова. Подождите немного.');
                    return;
                  }

                  try {
                    setIsRecording(true);
                    setCountdown(120); // Сброс таймера
                    
                    // Используем recordAsync (правильный API для expo-camera)
                    const recording = cameraRef.current.recordAsync({
                      maxDuration: 120,
                    });
                    
                    recordingPromiseRef.current = recording;
                    
                    recording.then((video) => {
                      recordingPromiseRef.current = null;

                      if (video && video.uri) {
                        setIsRecording(false);
                        
                        // Видео записано, можно загрузить на сервер
                        Alert.alert(
                          'Видео записано!',
                          'Видео успешно записано. Хотите загрузить его?',
                          [
                            { text: 'Записать еще', style: 'cancel', onPress: () => setCountdown(120) },
                            { 
                              text: 'Загрузить', 
                              onPress: () => {
                                // TODO: Загрузить видео на сервер через delegated upload
                                router.back();
                              }
                            }
                          ]
                        );
                      } else {
                        setIsRecording(false);
                        Alert.alert('Ошибка', 'Видео не было записано');
                      }
                    }).catch((error: any) => {
                      recordingPromiseRef.current = null;
                      setIsRecording(false);
                      Alert.alert('Ошибка', error?.message || 'Не удалось записать видео');
                    });
                  } catch (error: any) {
                    recordingPromiseRef.current = null;
                    setIsRecording(false);
                    Alert.alert('Ошибка', error?.message || 'Не удалось начать запись');
                  }
                }
              }}
            >
              <View style={[
                styles.recordDot,
                isRecording && styles.recordingDot
              ]} />
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
    top: SCREEN_HEIGHT * 0.4,
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
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  recordingDot: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f00',
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
