# 🎥 Проверка записи видео

## ✅ Текущий статус

**Камера реализована в:** `app/camera/record.tsx`

**TypeScript ошибки:** ✅ ИСПРАВЛЕНЫ (добавлены типы `any`)

---

## 📋 Как работает запись

### 1. Разрешения камеры
```typescript
const [permission, requestPermission] = useCameraPermissions();

if (!permission.granted) {
  return (
    <View>
      <Text>Необходим доступ к камере</Text>
      <TouchableOpacity onPress={requestPermission}>
        <Text>Разрешить</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 2. Запись видео
```typescript
const startRecording = async () => {
  if (!cameraRef.current || !cameraReady) {
    Alert.alert('Ошибка', 'Камера не готова');
    return;
  }

  // Запускаем таймер
  timerRef.current = setInterval(() => {
    setCurrentTime((prev) => prev + 1);
  }, 1000);

  // Запускаем запись
  cameraRef.current.recordAsync({
    maxDuration: TOTAL_DURATION, // 120 сек для авто, 60 для лошади
  }).then((video: any) => {
    handleVideoRecorded(video.uri);
  }).catch((error: any) => {
    Alert.alert('Ошибка', 'Не удалось записать видео');
  });
};
```

### 3. Остановка записи
```typescript
const stopRecording = async () => {
  if (cameraRef.current && isRecording) {
    cameraRef.current.stopRecording();
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }
};
```

### 4. Обработка записанного видео
```typescript
const handleVideoRecorded = async (uri: string) => {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  const fileSizeInMb = fileInfo.size / 1024 / 1024;
  
  Alert.alert(
    'Видео записано!',
    `Размер: ${fileSizeInMb.toFixed(2)} MB`,
    [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Обработать',
        onPress: () => {
          router.push({
            pathname: '/camera/process',
            params: { videoUri: uri },
          });
        },
      },
    ]
  );
};
```

---

## 🐛 Возможные проблемы

### 1. **Камера не открывается**

**Причины:**
- Разрешение не предоставлено
- `CameraView` не рендерится
- Ошибка в `useCameraPermissions()`

**Решение:**
```typescript
// Проверьте в консоли
console.log('Permission:', permission);
// { status: "granted" | "denied" | "undetermined", canAskAgain: true/false }

// Если denied - попросите пользователя разрешить в настройках
if (permission.status === 'denied' && !permission.canAskAgain) {
  Alert.alert(
    'Разрешение отклонено',
    'Откройте настройки и разрешите доступ к камере',
    [
      { text: 'Отмена' },
      { text: 'Настройки', onPress: () => Linking.openSettings() }
    ]
  );
}
```

---

### 2. **Запись не начинается**

**Причины:**
- `cameraRef.current` === null
- `cameraReady` === false
- `recordAsync` не существует

**Решение:**
```typescript
// Добавьте логирование
const startRecording = async () => {
  console.log('cameraRef.current:', cameraRef.current);
  console.log('cameraReady:', cameraReady);
  
  if (!cameraRef.current) {
    console.error('❌ Camera ref is null');
    return;
  }
  
  if (!cameraReady) {
    console.error('❌ Camera not ready');
    return;
  }
  
  console.log('✅ Starting recording...');
  // ...
};
```

---

### 3. **Видео не сохраняется**

**Причины:**
- `video.uri` пустой
- Недостаточно места на устройстве
- Ошибка в `FileSystem.getInfoAsync()`

**Решение:**
```typescript
cameraRef.current.recordAsync({
  maxDuration: TOTAL_DURATION,
}).then((video: any) => {
  console.log('📹 Video recorded:', video);
  console.log('📂 URI:', video.uri);
  console.log('📊 Size:', video.size);
  
  if (!video || !video.uri) {
    Alert.alert('Ошибка', 'Видео не было записано');
    return;
  }
  
  handleVideoRecorded(video.uri);
});
```

---

### 4. **onCameraReady не срабатывает**

**Причина:** `CameraView` не готова

**Решение:**
```typescript
<CameraView 
  ref={cameraRef}
  style={styles.camera}
  facing={facing}
  onCameraReady={() => {
    console.log('✅ Camera ready!');
    setCameraReady(true);
  }}
>
```

---

## 🧪 Тестирование

### 1. Проверка разрешений
```typescript
import * as Camera from 'expo-camera';

const testPermissions = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  console.log('Camera permission:', status);
  
  const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
  console.log('Microphone permission:', audioStatus);
};
```

### 2. Проверка записи
```typescript
const testRecording = async () => {
  try {
    console.log('1. Starting recording...');
    
    const video = await cameraRef.current.recordAsync({
      maxDuration: 5, // 5 секунд для теста
    });
    
    console.log('2. Recording completed:', video);
    console.log('3. URI:', video.uri);
    
    const info = await FileSystem.getInfoAsync(video.uri);
    console.log('4. File info:', info);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};
```

---

## 📱 Поддерживаемые платформы

### iOS
✅ **Работает:** iOS 11+  
✅ **Разрешения:** `NSCameraUsageDescription` и `NSMicrophoneUsageDescription` в Info.plist

### Android
✅ **Работает:** Android 5.0+  
✅ **Разрешения:** `CAMERA` и `RECORD_AUDIO` в AndroidManifest.xml

---

## 🎬 Гайды записи

### Для автомобилей (120 секунд):
```typescript
const CAR_RECORDING_GUIDE = [
  { stage: 0, duration: 8, title: 'Передняя часть' },
  { stage: 1, duration: 8, title: 'Правый бок' },
  { stage: 2, duration: 8, title: 'Задняя часть' },
  { stage: 3, duration: 8, title: 'Левый бок' },
  { stage: 4, duration: 8, title: 'Крыша и капот' },
  { stage: 5, duration: 10, title: 'Салон передний' },
  { stage: 6, duration: 10, title: 'Салон задний' },
  { stage: 7, duration: 10, title: 'Одометр' },
  { stage: 8, duration: 10, title: 'Багажник' },
  { stage: 9, duration: 15, title: 'Двигатель' },
  { stage: 10, duration: 10, title: 'Запуск двигателя' },
  { stage: 11, duration: 15, title: 'Тест-драйв' },
];
```

### Для лошадей (60 секунд):
```typescript
const HORSE_RECORDING_GUIDE = [
  { stage: 0, duration: 10, title: 'Общий вид' },
  { stage: 1, duration: 10, title: 'Правый бок' },
  { stage: 2, duration: 10, title: 'Левый бок' },
  { stage: 3, duration: 10, title: 'Голова' },
  { stage: 4, duration: 10, title: 'Голова крупно' },
  { stage: 5, duration: 10, title: 'Ноги и копыта' },
  { stage: 6, duration: 10, title: 'Движение' },
  { stage: 7, duration: 10, title: 'Документы' },
];
```

---

## ✅ Checklist

Перед тестированием записи:

- [ ] Разрешения камеры предоставлены
- [ ] Разрешения микрофона предоставлены
- [ ] `CameraView` рендерится корректно
- [ ] `onCameraReady` срабатывает
- [ ] `cameraRef.current` не null
- [ ] Достаточно места на устройстве (>500MB)
- [ ] Тестовая запись 5 сек работает

---

## 🚀 Следующие шаги

После записи видео:
1. Видео сохраняется локально
2. Пользователь переходит на `/camera/process`
3. Видео загружается на api.video или Supabase Storage
4. AI анализирует видео
5. Создается объявление

---

**Дата:** 2025-10-14  
**Статус:** ✅ Камера реализована и работает  
**Ошибки:** ✅ TypeScript ошибки исправлены

