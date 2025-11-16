import { db, supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CarManagementProps {
  carId: string;
  currentUserId?: string;
  onDelete?: () => void;
}

export default function CarManagement({
  carId,
  currentUserId,
  onDelete,
}: CarManagementProps) {
  const [canDelete, setCanDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkPermissions();
  }, [currentUserId, carId]);

  const checkPermissions = async () => {
    if (!currentUserId) return;

    try {
      const canDeleteCar = await db.canDeleteCar(carId, currentUserId);
      setCanDelete(canDeleteCar);
    } catch (error) {
      console.error('Check permissions error:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить объявление?',
      'Это действие нельзя отменить. Объявление и все связанные данные будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      // Помечаем объявление как архивированное (soft delete)
      const { error } = await supabase
        .from('listings')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('category', 'car')
        .eq('id', carId);

      if (error) throw error;

      Alert.alert('Успешно', 'Объявление удалено', [
        {
          text: 'OK',
          onPress: () => {
            setShowMenu(false);
            onDelete?.();
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Delete car error:', error);
      Alert.alert('Ошибка', 'Не удалось удалить объявление');
    }
  };

  const handleMarkAsSold = async () => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', carId)
        .eq('category', 'car');

      if (error) throw error;

      Alert.alert('Успешно', 'Объявление помечено как "Продано"');
      setShowMenu(false);
    } catch (error) {
      console.error('Mark as sold error:', error);
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    }
  };

  if (!canDelete) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowMenu(true)}
      >
        <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Управление объявлением</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                // Здесь можно добавить навигацию к экрану редактирования
                Alert.alert('Скоро', 'Редактирование скоро будет доступно');
              }}
            >
              <Ionicons name="create-outline" size={24} color="#007AFF" />
              <Text style={styles.menuItemText}>Редактировать</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleMarkAsSold();
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
              <Text style={styles.menuItemText}>Пометить &ldquo;Продано&rdquo;</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>
                Удалить объявление
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.cancelButton]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#000',
  },
  cancelButton: {
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
});

