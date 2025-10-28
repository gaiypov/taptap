// components/Listing/SoldButton.tsx
'use client';

import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ListingStatus } from '../../types';

interface SoldButtonProps {
  listingId: string;
  status: ListingStatus;
  deleteAt?: string;
  onStatusChange: () => void;
}

export default function SoldButton({ 
  listingId, 
  status, 
  deleteAt,
  onStatusChange 
}: SoldButtonProps) {
  const [loading, setLoading] = useState(false);

  /**
   * Отметить как проданное
   */
  const markAsSold = async () => {
    Alert.alert(
      'Отметить как проданное?',
      'Видео будет автоматически удалено через 14 дней. Вы сможете вернуть объявление в активные в течение этого времени.',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Да, продано',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/listings/${listingId}/mark-sold`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    // Добавьте auth token если нужно
                  }
                }
              );

              const data = await response.json();

              if (response.ok && data.success) {
                Alert.alert(
                  '✅ Успешно!',
                  `Объявление отмечено как проданное. Видео удалится ${formatDate(data.delete_at)}.`
                );
                onStatusChange();
              } else {
                Alert.alert('❌ Ошибка', data.error || 'Не удалось отметить как проданное');
              }
            } catch (error) {
              console.error('Error marking as sold:', error);
              Alert.alert('❌ Ошибка', 'Проблема с подключением к серверу');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  /**
   * Вернуть в активные
   */
  const reactivate = async () => {
    Alert.alert(
      'Вернуть объявление?',
      'Объявление снова станет активным и будет показываться в ленте.',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Да, вернуть',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/listings/${listingId}/reactivate`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                }
              );

              const data = await response.json();

              if (response.ok && data.success) {
                Alert.alert('✅ Успешно!', 'Объявление снова активно');
                onStatusChange();
              } else {
                Alert.alert('❌ Ошибка', data.error || 'Не удалось реактивировать');
              }
            } catch (error) {
              console.error('Error reactivating:', error);
              Alert.alert('❌ Ошибка', 'Проблема с подключением к серверу');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  /**
   * Форматирование даты
   */
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  /**
   * Вычислить дни до удаления
   */
  const getDaysLeft = (): number => {
    if (!deleteAt) return 0;
    const now = new Date();
    const deleteDate = new Date(deleteAt);
    const diffMs = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Если объявление активное - показываем кнопку "Продано"
  if (status === 'active') {
    return (
      <TouchableOpacity
        style={[styles.button, styles.soldButton]}
        onPress={markAsSold}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.buttonText}>✅ Отметить как проданное</Text>
            <Text style={styles.buttonSubtext}>Удалится через 14 дней</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  // Если объявление продано - показываем предупреждение и кнопку возврата
  if (status === 'sold' && deleteAt) {
    const daysLeft = getDaysLeft();

    return (
      <View style={styles.soldContainer}>
        {/* Предупреждение */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Продано</Text>
          <Text style={styles.warningText}>
            {daysLeft > 0 
              ? `Видео удалится через ${daysLeft} ${pluralizeDays(daysLeft)}`
              : 'Видео будет удалено в ближайшее время'
            }
          </Text>
          <Text style={styles.warningDate}>
            Удаление: {formatDate(deleteAt)}
          </Text>
        </View>

        {/* Кнопка возврата (только если срок не истек) */}
        {daysLeft > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.reactivateButton]}
            onPress={reactivate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>↩️ Вернуть в активные</Text>
                <Text style={styles.buttonSubtext}>Передумали продавать?</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Для archived и expired статусов не показываем кнопки
  if (status === 'archived') {
    return (
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📦 Объявление архивировано</Text>
      </View>
    );
  }

  if (status === 'expired') {
    return (
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>⏰ Срок объявления истек (90 дней)</Text>
      </View>
    );
  }

  return null;
}

/**
 * Склонение слова "день"
 */
function pluralizeDays(days: number): string {
  if (days % 10 === 1 && days % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
  return 'дней';
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  soldButton: {
    backgroundColor: '#10B981', // Green
  },
  reactivateButton: {
    backgroundColor: '#3B82F6', // Blue
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 4,
  },
  soldContainer: {
    width: '100%',
  },
  warningBox: {
    backgroundColor: '#FEF3C7', // Yellow-100
    borderWidth: 1,
    borderColor: '#FBBF24', // Yellow-400
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E', // Yellow-900
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#78350F', // Yellow-900
    marginBottom: 4,
  },
  warningDate: {
    fontSize: 12,
    color: '#92400E', // Yellow-800
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#F3F4F6', // Gray-100
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280', // Gray-600
    fontWeight: '500',
  },
});

