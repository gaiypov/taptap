// app/(tabs)/upload/PhotoToVideoScreen.tsx — СОЗДАНИЕ ВИДЕО ИЗ ФОТО УРОВНЯ 2025

import { ultra } from '@/lib/theme/ultra';

import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';

import { LinearGradient } from 'expo-linear-gradient';

import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Animated, { FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const PHOTO_SIZE = (width - 60) / 3;

const DURATION_OPTIONS = [
  { value: 3, label: '3 сек' },
  { value: 4, label: '4 сек' },
  { value: 5, label: '5 сек' },
] as const;

const TRANSITION_OPTIONS = [
  { value: 'fade', label: 'Плавное', icon: '◐' },
  { value: 'slide', label: 'Скольжение', icon: '→' },
  { value: 'zoom', label: 'Зум', icon: '⊕' },
  { value: 'none', label: 'Без', icon: '▯' },
] as const;

const MUSIC_OPTIONS = [
  { value: 'upbeat', label: 'Энергичная', icon: '⚡' },
  { value: 'calm', label: 'Спокойная', icon: '🌊' },
  { value: 'none', label: 'Без музыки', icon: '🔇' },
] as const;

export default function PhotoToVideoScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [settings, setSettings] = useState<{
    duration: number;
    transition: 'none' | 'fade' | 'slide' | 'zoom';
    music: 'none' | 'upbeat' | 'calm';
  }>({
    duration: 4,
    transition: 'fade',
    music: 'upbeat',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Доступ запрещён', 'Разрешите доступ к галерее', [
        { text: 'Отмена' },
        { text: 'Настройки', onPress: Linking.openSettings },
      ]);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.9,
      aspect: [9, 16],
    });

    if (!result.canceled && result.assets.length >= 2) {
      setPhotos(result.assets);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const createVideo = async () => {
    if (photos.length < 2) return Alert.alert('Нужно минимум 2 фото');

    setIsProcessing(true);
    setProgress(0);

    try {
      // Имитация загрузки (в реальности — твой backend)
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 400));
        setProgress(i);
      }

      // Успех!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Готово!', 'Видео создано из фото', [
        { text: 'Смотреть', onPress: () => router.push('/preview') },
        { text: 'Опубликовать', onPress: () => router.push('/upload') },
      ]);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось создать видео');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <LinearGradient colors={[ultra.gradientStart, ultra.gradientEnd]} style={styles.full}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.processingTitle}>Создаём видео...</Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.percent}>{progress}%</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={28} color={ultra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Видео из фото</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Empty State */}
      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images" size={100} color={ultra.textMuted} />
          <Text style={styles.emptyTitle}>Выберите 2–6 фото</Text>
          <Text style={styles.emptyText}>Мы создадим красивое вертикальное видео</Text>
          <TouchableOpacity style={styles.bigButton} onPress={pickPhotos} activeOpacity={0.7}>
            <LinearGradient colors={[ultra.gradientStart, ultra.gradientEnd]} style={styles.bigButtonGrad}>
              <Ionicons name="add" size={28} color="#FFF" />
              <Text style={styles.bigButtonText}>Выбрать фото</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Photos Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Фото ({photos.length}/6)</Text>
            <View style={styles.grid}>
              {photos.map((photo, i) => (
                <PhotoCard key={photo.uri} photo={photo} index={i} onRemove={() => removePhoto(i)} isCover={i === 0} />
              ))}
              {photos.length < 6 && (
                <TouchableOpacity style={styles.addMore} onPress={pickPhotos} activeOpacity={0.7}>
                  <Ionicons name="add-circle" size={40} color={ultra.accent} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.settings}>
            <Text style={styles.sectionTitle}>Настройки</Text>

            <SettingRow label="Длительность фото">
              {DURATION_OPTIONS.map(o => (
                <OptionButton
                  key={o.value}
                  active={settings.duration === o.value}
                  onPress={() => setSettings(p => ({ ...p, duration: o.value }))}
                >
                  {o.label}
                </OptionButton>
              ))}
            </SettingRow>

            <SettingRow label="Переходы">
              {TRANSITION_OPTIONS.map(o => (
                <OptionButton
                  key={o.value}
                  active={settings.transition === o.value}
                  onPress={() => setSettings(p => ({ ...p, transition: o.value }))}
                >
                  <Text style={styles.icon}>{o.icon}</Text>
                  <Text>{o.label}</Text>
                </OptionButton>
              ))}
            </SettingRow>

            <SettingRow label="Музыка">
              {MUSIC_OPTIONS.map(o => (
                <OptionButton
                  key={o.value}
                  active={settings.music === o.value}
                  onPress={() => setSettings(p => ({ ...p, music: o.value }))}
                >
                  <Text style={styles.icon}>{o.icon}</Text>
                  <Text>{o.label}</Text>
                </OptionButton>
              ))}
            </SettingRow>

            <View style={styles.total}>
              <Text style={styles.totalLabel}>Длительность видео:</Text>
              <Text style={styles.totalValue}>{photos.length * settings.duration} сек</Text>
            </View>
          </View>

          {/* Create Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.createBtn} onPress={createVideo} activeOpacity={0.7}>
              <LinearGradient colors={[ultra.gradientStart, ultra.gradientEnd]} style={styles.createGrad}>
                <Ionicons name="videocam" size={24} color="#FFF" />
                <Text style={styles.createText}>Создать видео</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// Маленькие компоненты
const PhotoCard = ({ photo, index, onRemove, isCover }: any) => {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={ZoomIn.delay(index * 100)} style={animated}>
      <View style={styles.photo}>
        <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {isCover && (
          <View style={styles.cover}>
            <Text style={styles.coverText}>Обложка</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.remove}
          onPress={onRemove}
          onPressIn={() => (scale.value = withSpring(0.9))}
          onPressOut={() => (scale.value = withSpring(1))}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={28} color="#FF3B30" />
        </TouchableOpacity>
        <View style={styles.index}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const SettingRow = ({ label, children }: any) => (
  <View style={styles.settingRow}>
    <Text style={styles.settingLabel}>{label}</Text>
    <View style={styles.options}>{children}</View>
  </View>
);

const OptionButton = ({ children, active, onPress }: any) => (
  <TouchableOpacity style={[styles.option, active && styles.optionActive]} onPress={onPress} activeOpacity={0.7}>
    {children}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ultra.background },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: ultra.textPrimary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 28, fontWeight: '800', color: ultra.textPrimary, marginTop: 20 },
  emptyText: { fontSize: 16, color: ultra.textSecondary, textAlign: 'center', marginTop: 12 },
  bigButton: { marginTop: 40, borderRadius: 20, overflow: 'hidden' },
  bigButtonGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  bigButtonText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: ultra.textPrimary, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.6, borderRadius: 16, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  remove: { position: 'absolute', top: 8, right: 8 },
  cover: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: ultra.accent, padding: 8, alignItems: 'center' },
  coverText: { color: '#FFF', fontWeight: '700' },
  index: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  indexText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  settings: { padding: 20, backgroundColor: ultra.card, marginHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: ultra.border },
  settingRow: { marginBottom: 24 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: ultra.textPrimary, marginBottom: 12 },
  options: { flexDirection: 'row', gap: 12 },
  option: { flex: 1, backgroundColor: ultra.surface, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  optionActive: { borderColor: ultra.accent, backgroundColor: ultra.card },
  icon: { fontSize: 24, marginBottom: 4 },
  total: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: ultra.surface, padding: 16, borderRadius: 12 },
  totalLabel: { fontSize: 16, color: ultra.textSecondary },
  totalValue: { fontSize: 20, fontWeight: '800', color: ultra.accent },
  footer: { padding: 20 },
  createBtn: { borderRadius: 20, overflow: 'hidden' },
  createGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  createText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  full: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  processingTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginTop: 30 },
  progressBar: { width: width - 80, height: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 5, marginTop: 30, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFF' },
  percent: { fontSize: 36, fontWeight: '900', color: '#FFF', marginTop: 20 },
  addMore: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.6, borderRadius: 16, borderWidth: 2, borderColor: ultra.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
});
