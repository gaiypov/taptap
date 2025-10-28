// Компонент выбора метода оплаты

import { getAvailablePaymentMethods, type PaymentMethod } from '@/services/payments';
import { boostService, type BoostType } from '@/services/payments/boost';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PaymentMethodSelectorProps {
  carId: string;
  userId: string;
  boostType: BoostType;
  amount: number;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentMethodSelector({
  carId,
  userId,
  boostType,
  amount,
  onBack,
  onPaymentSuccess,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = getAvailablePaymentMethods();

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Ошибка', 'Выберите способ оплаты');
      return;
    }

    setIsProcessing(true);

    try {
      // Создаем транзакцию BOOST
      const result = await boostService.createBoostTransaction(
        carId,
        userId,
        boostType,
        amount,
        selectedMethod
      );

      if (!result.success || !result.transaction) {
        Alert.alert('Ошибка', result.error || 'Не удалось создать транзакцию');
        setIsProcessing(false);
        return;
      }

      // Открываем страницу оплаты
      if (result.transaction.payment_url) {
        const canOpen = await Linking.canOpenURL(result.transaction.payment_url);
        if (canOpen) {
          await Linking.openURL(result.transaction.payment_url);

          // В реальном приложении здесь нужно отслеживать статус платежа
          // Пока показываем информационное сообщение
          Alert.alert(
            'Оплата',
            'Пожалуйста, завершите оплату в браузере. После успешной оплаты BOOST будет активирован автоматически.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onPaymentSuccess();
                },
              },
            ]
          );
        } else {
          Alert.alert('Ошибка', 'Не удалось открыть страницу оплаты');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при создании платежа');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Выберите способ оплаты</Text>
      </View>

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>К оплате:</Text>
        <Text style={styles.amountValue}>{amount} сом</Text>
      </View>

      <ScrollView style={styles.methodsList}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.methodCardSelected,
              !method.enabled && styles.methodCardDisabled,
            ]}
            onPress={() => method.enabled && setSelectedMethod(method.id)}
            disabled={!method.enabled}
          >
            <View style={styles.methodIcon}>
              <Text style={styles.methodIconText}>{method.icon}</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
            {selectedMethod === method.id && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
            {!method.enabled && (
              <View style={styles.disabledBadge}>
                <Text style={styles.disabledText}>Скоро</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (!selectedMethod || isProcessing) && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={!selectedMethod || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Оплатить {amount} сом</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.secureText}>🔒 Безопасная оплата через банк</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  methodsList: {
    flex: 1,
    padding: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  methodCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodIconText: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: '#666',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
  disabledText: {
    fontSize: 11,
    color: '#666',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secureText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
  },
});
