import { auth } from '@/services/auth';
import { errorTracking } from '@/services/errorTracking';
import { db, storage } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

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
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingImage(true);
      
      // Upload to Supabase Storage
      const { url, error } = await storage.uploadThumbnail(uri, user.id);
      
      if (error) throw error;
      
      setAvatarUrl(url);
      Alert.alert('Успех', 'Фото профиля обновлено');
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

      setSaving(true);

      const updates = {
        name: name.trim(),
        avatar_url: avatarUrl,
      };

      const { error } = await db.updateUser(user.id, updates);

      if (error) throw error;

      // Update local storage
      await auth.updateCurrentUser(updates);

      Alert.alert('Успех', 'Профиль обновлен', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      errorTracking.captureException(error as Error, {
        tags: { screen: 'editProfile', action: 'save' },
        extra: { updates: { name, avatarUrl } },
      });
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Редактировать профиль</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} disabled={uploadingImage}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={60} color="#8E8E93" />
                </View>
              )}
              
              {uploadingImage ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              ) : (
                <View style={styles.editAvatarButton}>
                  <Ionicons name="camera" size={20} color="#FFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Нажмите, чтобы изменить фото</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Имя</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Введите имя"
              placeholderTextColor="#8E8E93"
              autoCapitalize="words"
            />
          </View>

          {/* Phone (read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Телефон</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputText}>{phone}</Text>
            </View>
            <Text style={styles.hint}>Телефон нельзя изменить</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Сохранить изменения</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>О профиле</Text>
            <Text style={styles.infoText}>
              Ваше имя и фото будут видны другим пользователям при просмотре объявлений и в чатах.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
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
    backgroundColor: '#1C1C1E',
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
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  avatarHint: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  form: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFF',
  },
  inputDisabled: {
    opacity: 0.6,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#FFF',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 6,
  },
  saveButton: {
    height: 52,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 32,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});

