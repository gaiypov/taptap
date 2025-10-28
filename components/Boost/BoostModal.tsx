// Модальное окно для выбора тарифа BOOST

import { boostService, type BoostPlan } from '@/services/payments/boost';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PaymentMethodSelector from './PaymentMethodSelector';

interface BoostModalProps {
  visible: boolean;
  onClose: () => void;
  carId: string;
  userId: string;
  carName: string;
}

export default function BoostModal({ visible, onClose, carId, userId, carName }: BoostModalProps) {
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);

  const plans = boostService.getPlans();

  const handleSelectPlan = (plan: BoostPlan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handleBack = () => {
    if (step === 'payment') {
      setStep('select');
      setSelectedPlan(null);
    } else {
      onClose();
    }
  };

  const handlePaymentSuccess = () => {
    setStep('select');
    setSelectedPlan(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleBack}>
      <SafeAreaView style={styles.container}>
        {step === 'select' ? (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>🚀 Продвинуть объявление</Text>
              <Text style={styles.subtitle}>{carName}</Text>
            </View>

            <ScrollView style={styles.content}>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>💡 Что дает BOOST?</Text>
                <Text style={styles.infoText}>
                  • Ваше объявление увидит больше людей{'\n'}
                  • Выше в поиске и на главной{'\n'}
                  • Выделяется среди других{'\n'}
                  • Продайте быстрее!
                </Text>
              </View>

              <View style={styles.plansContainer}>
                {plans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={styles.planCard}
                    onPress={() => handleSelectPlan(plan)}
                  >
                    <LinearGradient
                      colors={plan.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.planGradient}
                    >
                      <View style={styles.planHeader}>
                        <Text style={styles.planEmoji}>{plan.emoji}</Text>
                        <Text style={styles.planName}>{plan.name}</Text>
                      </View>

                      <Text style={styles.planPrice}>{plan.price} сом</Text>
                      <Text style={styles.planDuration}>на {plan.duration} часов</Text>

                      <View style={styles.planFeatures}>
                        {plan.features.map((feature, index) => (
                          <View key={index} style={styles.featureRow}>
                            <Text style={styles.featureCheck}>✓</Text>
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.planButton}>
                        <Text style={styles.planButtonText}>Выбрать</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.bottomInfo}>
                <Text style={styles.bottomInfoText}>
                  🔒 Безопасная оплата через банк{'\n'}
                  📊 Результат виден сразу{'\n'}
                  💬 Поддержка 24/7
                </Text>
              </View>
            </ScrollView>
          </>
        ) : (
          selectedPlan && (
            <PaymentMethodSelector
              carId={carId}
              userId={userId}
              boostType={selectedPlan.id}
              amount={selectedPlan.price}
              onBack={handleBack}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 22,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  planGradient: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  planFeatures: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  planButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  bottomInfo: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bottomInfoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
});
