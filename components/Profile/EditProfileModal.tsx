/**
 * EditProfileModal - Edit user profile information
 * Part of unified profile system
 */

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { updateUser } from '@/lib/store/slices/authSlice';
import { RevolutUltra } from '@/lib/theme/colors';
import { db } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function EditProfileModal({ visible, onClose, onSave }: EditProfileModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Ошибка', 'Нужно разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;

    if (!name.trim()) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        name: name.trim(),
        bio: bio.trim() || null,
        city: city.trim() || null,
      };

      // TODO: Upload avatar to storage if changed
      // For now, just update the URL if it's a remote URL
      if (avatarUri && avatarUri.startsWith('http')) {
        updates.avatar_url = avatarUri;
      }

      const { error } = await db.updateUser(user.id, updates);

      if (error) {
        throw error;
      }

      // Update Redux state
      dispatch(updateUser(updates));

      appLogger.info('[EditProfile] Profile updated successfully');
      onSave?.();
      onClose();
    } catch (error: any) {
      appLogger.error('[EditProfile] Error saving profile', { error });
      Alert.alert('Ошибка', error?.message || 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  }, [user?.id, name, bio, city, avatarUri, dispatch, onSave, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.cancelText}>Отмена</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Редактировать</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={RevolutUltra.textPrimary} />
            ) : (
              <Text style={styles.saveText}>Сохранить</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color={RevolutUltra.textSecondary} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={16} color={RevolutUltra.textPrimary} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Нажмите, чтобы изменить фото</Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Имя</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ваше имя"
                  placeholderTextColor={RevolutUltra.textSecondary}
                  maxLength={50}
                />
              </View>

              {/* Bio */}
              <View style={styles.field}>
                <Text style={styles.label}>О себе</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Расскажите о себе"
                  placeholderTextColor={RevolutUltra.textSecondary}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{bio.length}/500</Text>
              </View>

              {/* City */}
              <View style={styles.field}>
                <Text style={styles.label}>Город</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Например: Бишкек"
                  placeholderTextColor={RevolutUltra.textSecondary}
                  maxLength={50}
                />
              </View>

              {/* Phone (read-only) */}
              <View style={styles.field}>
                <Text style={styles.label}>Телефон</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{user?.phone || 'Не указан'}</Text>
                  <Ionicons name="lock-closed" size={16} color={RevolutUltra.textSecondary} />
                </View>
                <Text style={styles.hint}>Телефон нельзя изменить</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RevolutUltra.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RevolutUltra.border,
  },
  headerButton: {
    minWidth: 70,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  cancelText: {
    fontSize: 16,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RevolutUltra.card,
    borderWidth: 2,
    borderColor: RevolutUltra.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 13,
    color: RevolutUltra.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  input: {
    backgroundColor: RevolutUltra.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: RevolutUltra.textPrimary,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: RevolutUltra.card2,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  readOnlyText: {
    fontSize: 16,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  hint: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
