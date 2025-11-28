/**
 * Редактирование объявления
 * Позволяет редактировать цену, описание, локацию и текстовые поля деталей
 * Только владелец может редактировать
 */

import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import SoldButton from '@/components/Listing/SoldButton';
import { useAppSelector } from '@/lib/store/hooks';
import { ultra } from '@/lib/theme/ultra';
import { db, supabase } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import { validateOwner } from '@/utils/listingActions';
import { requireAuth } from '@/utils/permissionManager';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  city?: string;
  location?: string;
  category: string;
  seller_user_id?: string;
  seller_id?: string;
  details?: any;
  status?: 'active' | 'sold' | 'archived' | 'expired';
  delete_at?: string;
}

export default function EditListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');

  const loadListing = useCallback(async () => {
    if (!id || !user?.id) {
      setLoading(false);
      return;
    }

    if (!requireAuth('edit')) {
      router.back();
      return;
    }

    try {
      const { data, error } = await db.getListing(id);

      if (error) {
        appLogger.error('[EditListing] Error loading listing', { error });
        Alert.alert('Ошибка', 'Не удалось загрузить объявление');
        router.back();
        return;
      }

      if (!data) {
        Alert.alert('Ошибка', 'Объявление не найдено');
        router.back();
        return;
      }

      const listingData = data as any;

      // Проверка владельца
      if (!validateOwner(user, listingData)) {
        Alert.alert('Ошибка', 'Только владелец может редактировать объявление');
        router.back();
        return;
      }

      setListing(listingData);
      setPrice(String(listingData.price || 0));
      setDescription(listingData.description || '');
      setCity(listingData.city || '');
      setLocation(listingData.location || listingData.location_text || '');
    } catch (error: any) {
      appLogger.error('[EditListing] Error', { error });
      Alert.alert('Ошибка', 'Не удалось загрузить объявление');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, user, router]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  // Удаление объявления
  const handleDelete = useCallback(async () => {
    if (!listing || !user?.id) return;

    Alert.alert(
      '🗑️ Удалить объявление?',
      'Это действие нельзя отменить. Объявление будет удалено безвозвратно.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listing.id)
                .eq('seller_user_id', user.id);

              if (error) throw error;

              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              Alert.alert('✅ Удалено', 'Объявление успешно удалено', [
                { text: 'OK', onPress: () => router.replace('/(protected)/my-listings') },
              ]);
            } catch (error: any) {
              appLogger.error('[EditListing] Error deleting', { error });
              Alert.alert('Ошибка', 'Не удалось удалить объявление');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [listing, user, router]);

  const handleSave = useCallback(async () => {
    if (!listing || !user?.id) return;

    if (!requireAuth('edit')) {
      return;
    }

    if (!validateOwner(user, listing)) {
      Alert.alert('Ошибка', 'Только владелец может редактировать объявление');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Ошибка', 'Введите корректную цену');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSaving(true);

    try {
      const updates: any = {
        price: priceNum,
        description: description.trim() || null,
        city: city.trim() || null,
        location: location.trim() || null,
        location_text: location.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await db.updateListing(listing.id, updates);

      if (error) {
        throw error;
      }

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Успешно', 'Объявление обновлено', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      appLogger.error('[EditListing] Error saving', { error });
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  }, [listing, user, price, description, city, location, router]);

  if (loading) {
    return <LoadingOverlay message="Загрузка объявления..." />;
  }

  if (!listing) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={ultra.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Редактировать</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={ultra.textPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Основная информация</Text>

          {/* Title (read-only) */}
          <View style={styles.field}>
            <Text style={styles.label}>Название</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{listing.title}</Text>
            </View>
            <Text style={styles.hint}>Название нельзя изменить</Text>
          </View>

          {/* Price */}
          <View style={styles.field}>
            <Text style={styles.label}>Цена (сом) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Введите цену"
              placeholderTextColor={ultra.textMuted}
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Опишите объявление..."
              placeholderTextColor={ultra.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* City */}
          <View style={styles.field}>
            <Text style={styles.label}>Город</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Например: Бишкек"
              placeholderTextColor={ultra.textMuted}
            />
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={styles.label}>Адрес / Локация</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Укажите адрес или район"
              placeholderTextColor={ultra.textMuted}
            />
          </View>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={ultra.textSecondary} />
          <Text style={styles.noteText}>
            Видео и изображения нельзя изменить. Для изменения медиа создайте новое объявление.
          </Text>
        </View>

        {/* Действия с объявлением */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Управление объявлением</Text>
          
          {/* Кнопка "Продано" / "Вернуть" */}
          <SoldButton
            listingId={listing.id}
            status={listing.status || 'active'}
            deleteAt={listing.delete_at}
            onStatusChange={() => loadListing()}
          />

          {/* Кнопка удаления */}
          {listing.status !== 'sold' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.deleteButtonText}>Удалить объявление</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ultra.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: ultra.accent,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: ultra.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: ultra.textPrimary,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  readOnlyField: {
    backgroundColor: ultra.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  readOnlyText: {
    fontSize: 16,
    color: ultra.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: ultra.textMuted,
    marginTop: 4,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ultra.surface,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: ultra.textSecondary,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

