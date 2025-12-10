/**
 * Edit Profile Screen - Revolut Ultra UI
 */

import { useAppDispatch } from '@/lib/store/hooks';
import { setCredentials } from '@/lib/store/slices/authSlice';
import { RevolutUltra } from '@/lib/theme/colors';
import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { supabase } from '@/services/supabase';
import { User } from '@/types';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import SettingsTab from '@/components/Profile/SettingsTab';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleToggleNotifications = useCallback((enabled: boolean) => {
    setNotificationsEnabled(enabled);
    // TODO: Save notification preference to storage/backend
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await auth.getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || '');
        setPhone(currentUser.phone || '');
        setAvatarUrl(currentUser.avatar_url || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      errorTracking.captureException(error as Error, {
        tags: { screen: 'editProfile', action: 'loadUser' },
      });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение для доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setShowAvatarSheet(false);
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение для доступа к камере');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setShowAvatarSheet(false);
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingImage(true);

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar_${Date.now()}.${ext}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      setAvatarUrl(urlData.publicUrl);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      errorTracking.captureException(error as Error, {
        tags: { screen: 'editProfile', action: 'uploadAvatar' },
      });
      Alert.alert('Ошибка', 'Не удалось загрузить фото');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Ошибка', 'Введите имя');
        return;
      }

      if (!user || !user.id) {
        Alert.alert('Ошибка', 'Пользователь не найден. Перезайдите в приложение.');
        return;
      }

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setSaving(true);

      const updates = {
        name: name.trim(),
        avatar_url: avatarUrl,
      };

      appLogger.info('[EditProfile] Saving profile updates', { userId: user.id, updates });

      // Используем только auth.updateCurrentUser - он уже вызывает db.updateUser внутри
      // и обновляет storage
      const result = await auth.updateCurrentUser(updates);

      if (!result.success) {
        const errorMessage = result.error || 'Не удалось сохранить изменения';
        appLogger.error('[EditProfile] Failed to save profile', { 
          error: errorMessage,
          userId: user.id 
        });
        errorTracking.captureException(new Error(errorMessage), {
          tags: { screen: 'editProfile', action: 'save' },
          extra: { updates, userId: user.id },
        });
        Alert.alert('Ошибка', errorMessage);
        return;
      }

      // Обновляем Redux store с новыми данными
      const updatedUser = result.user as User | undefined;
      if (updatedUser) {
        const { default: storageService } = await import('@/services/storage');
        const token = await storageService.getAuthToken();

        if (token) {
          dispatch(setCredentials({
            user: updatedUser,
            token: token,
          }));
          appLogger.info('[EditProfile] Redux store updated', { userId: updatedUser.id });
        }
      }

      // Обновляем локальное состояние
      setUser(updatedUser);
      setName(updatedUser?.name || name);
      setAvatarUrl(updatedUser?.avatar_url || avatarUrl);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      appLogger.info('[EditProfile] ✅ Profile saved successfully', { userId: updatedUser?.id });
      Alert.alert('Успех', 'Профиль обновлен', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      appLogger.error('[EditProfile] Error saving profile', {
        error: error?.message,
        stack: error?.stack,
        userId: user?.id,
      });
      errorTracking.captureException(error as Error, {
        tags: { screen: 'editProfile', action: 'save' },
        extra: { updates: { name, avatarUrl }, userId: user?.id },
      });
      Alert.alert('Ошибка', error?.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RevolutUltra.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={RevolutUltra.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Редактировать профиль</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={() => setShowAvatarSheet(true)} disabled={uploadingImage}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={60} color={RevolutUltra.textSecondary} />
                  </View>
                )}

                {uploadingImage ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator size="small" color={RevolutUltra.textPrimary} />
                  </View>
                ) : (
                  <View style={styles.editAvatarButton}>
                    <Ionicons name="camera" size={20} color={RevolutUltra.textPrimary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Имя</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Введите имя"
                placeholderTextColor={RevolutUltra.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Телефон</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputText}>{phone}</Text>
              </View>
              <Text style={styles.hint}>Телефон нельзя изменить</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color={RevolutUltra.textPrimary} />
              ) : (
                <Text style={styles.saveButtonText}>Сохранить</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Настройки</Text>
            <SettingsTab
              isNotificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Avatar Picker Bottom Sheet */}
      <Modal visible={showAvatarSheet} transparent animationType="fade" onRequestClose={() => setShowAvatarSheet(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowAvatarSheet(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetContent}>
              <TouchableOpacity style={styles.sheetOption} onPress={pickImage} activeOpacity={0.7}>
                <Ionicons name="images-outline" size={24} color={RevolutUltra.textPrimary} />
                <Text style={styles.sheetOptionText}>Выбрать фото</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetOption} onPress={takePhoto} activeOpacity={0.7}>
                <Ionicons name="camera-outline" size={24} color={RevolutUltra.textPrimary} />
                <Text style={styles.sheetOptionText}>Открыть камеру</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetOption, styles.sheetOptionCancel]}
                onPress={() => setShowAvatarSheet(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.sheetOptionCancelText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RevolutUltra.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RevolutUltra.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RevolutUltra.neutral.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: RevolutUltra.bg,
  },
  form: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: RevolutUltra.card2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: RevolutUltra.textPrimary,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  inputDisabled: {
    opacity: 0.6,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: RevolutUltra.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    marginTop: 6,
  },
  saveButton: {
    height: 52,
    backgroundColor: RevolutUltra.neutral.light,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
  },
  settingsSection: {
    marginTop: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: RevolutUltra.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: RevolutUltra.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetContent: {
    paddingHorizontal: 24,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: RevolutUltra.border,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
  },
  sheetOptionCancel: {
    borderBottomWidth: 0,
    marginTop: 8,
    justifyContent: 'center',
  },
  sheetOptionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    textAlign: 'center',
  },
});
