// components/ReportButton.tsx
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ReportButtonProps {
  targetType: 'car' | 'user' | 'message';
  targetId: string;
  reportedUserId?: string;
  iconSize?: number;
  iconColor?: string;
}

const REPORT_REASONS = [
  { id: 'inappropriate', label: 'Неподобающий контент', icon: '🔞' },
  { id: 'spam', label: 'Спам', icon: '📧' },
  { id: 'fraud', label: 'Мошенничество', icon: '⚠️' },
  { id: 'duplicate', label: 'Дубликат объявления', icon: '📋' },
  { id: 'misleading', label: 'Вводящая информация', icon: '❌' },
  { id: 'fake_price', label: 'Неверная цена', icon: '💰' },
  { id: 'stolen', label: 'Подозрение на угон', icon: '🚨' },
  { id: 'other', label: 'Другое', icon: '❓' },
];

export function ReportButton({ 
  targetType, 
  targetId, 
  reportedUserId,
  iconSize = 24,
  iconColor = '#FF3B30',
}: ReportButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async (reasonId: string) => {
    try {
      setSubmitting(true);

      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Ошибка', 'Необходимо войти в систему');
        return;
      }

      // Проверяем, не жаловался ли уже этот пользователь
      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .single();

      if (existingReport) {
        Alert.alert('Внимание', 'Вы уже подали жалобу на этот контент');
        setModalVisible(false);
        return;
      }

      // Создаем жалобу
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reported_user_id: reportedUserId,
        reason: reasonId,
        status: 'pending',
      });

      if (error) throw error;

      // Проверяем количество жалоб на этот контент
      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('status', 'pending');

      // Если >= 3 жалоб - автоматически архивируем контент
      if (count && count >= 3 && targetType === 'car') {
        await supabase
          .from('cars')
          .update({ status: 'archived' })
          .eq('id', targetId);
      }

      setModalVisible(false);
      Alert.alert(
        'Спасибо!',
        'Ваша жалоба отправлена. Мы проверим её в ближайшее время.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Report error:', error);
      Alert.alert('Ошибка', 'Не удалось отправить жалобу. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="flag-outline" size={iconSize} color={iconColor} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Пожаловаться</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reasonsList}>
              <Text style={styles.subtitle}>Выберите причину жалобы:</Text>
              
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={styles.reasonItem}
                  onPress={() => handleReport(reason.id)}
                  disabled={submitting}
                >
                  <Text style={styles.reasonIcon}>{reason.icon}</Text>
                  <Text style={styles.reasonLabel}>{reason.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.disclaimer}>
              Ложные жалобы могут привести к блокировке вашего аккаунта
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  reportButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 15,
  },
  reasonsList: {
    padding: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reasonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
  },
  disclaimer: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
});

