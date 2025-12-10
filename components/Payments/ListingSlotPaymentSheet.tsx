/**
 * Payment Sheet for Listing Slots
 * Shows when user exceeds free limit
 */

import { ultra } from '@/lib/theme/ultra';
import { db } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ListingSlotPaymentSheetProps {
  visible: boolean;
  slotNumber: number;
  price: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
  userId: string;
}

/**
 * Calculate price for slot number
 */
export function priceForSlot(n: number): number {
  if (n === 2) return 80;
  if (n === 3) return 150;
  return 50 * n;
}

export default function ListingSlotPaymentSheet({
  visible,
  slotNumber,
  price,
  onClose,
  onPaymentSuccess,
  userId,
}: ListingSlotPaymentSheetProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      // Increment paid_slots in database
      const { error } = await db.incrementPaidSlots(userId);

      if (error) {
        throw error;
      }

      // Success
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      onPaymentSuccess();
      onClose();
    } catch (error: any) {
      console.error('[PaymentSheet] Payment error:', error);
      Alert.alert('Ошибка', 'Не удалось обработать оплату. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Оплата слота</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={ultra.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={48} color={ultra.accent} />
              <Text style={styles.infoTitle}>Бесплатный лимит исчерпан</Text>
              <Text style={styles.infoText}>
                Для размещения {slotNumber}-го объявления необходимо оплатить слот
              </Text>
            </View>

            {/* Price */}
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Стоимость размещения:</Text>
              <Text style={styles.priceValue}>{price.toLocaleString('ru-RU')} сом</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayment}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[ultra.gradientStart, ultra.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.payButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="card" size={20} color="#FFF" />
                      <Text style={styles.payButtonText}>Оплатить</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: ultra.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ultra.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: ultra.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: ultra.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  priceCard: {
    backgroundColor: ultra.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  priceLabel: {
    fontSize: 14,
    color: ultra.textSecondary,
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: ultra.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: ultra.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ultra.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ultra.textPrimary,
  },
  payButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

