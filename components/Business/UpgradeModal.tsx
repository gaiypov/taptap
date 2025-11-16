// Модальное окно предложения upgrade

import { getTierFeatures } from '@/lib/business/tier-features';
import { UpgradeReason } from '@/types/business';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  reason?: UpgradeReason;
}

export default function UpgradeModal({
  visible,
  onClose,
  reason,
}: UpgradeModalProps) {
  const router = useRouter();

  if (!visible || !reason) return null;

  const messages = {
    transport_limit: {
      title: '🎉 Пора расти!',
      message: `У вас уже ${reason.currentCount} объявления транспорта!`,
    },
    horse_limit: {
      title: '🎉 Отличный старт!',
      message: `У вас уже ${reason.currentCount} объявления лошадей!`,
    },
    realty_limit: {
      title: '🎉 Развивайте бизнес!',
      message: `У вас уже ${reason.currentCount} объявление недвижимости!`,
    },
    tier_limit: {
      title: '🚀 Время расширяться!',
      message: `Вы достигли лимита объявлений (${reason.maxCount})!`,
    },
  };

  const msg = messages[reason.type];
  const suggestedTier = getTierFeatures(reason.suggestedTier);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={styles.title}>{msg.title}</Text>
            <Text style={styles.subtitle}>{msg.message}</Text>

            {/* Benefits */}
            <View style={styles.benefitsBox}>
              <Text style={styles.benefitsTitle}>
                Станьте бизнес-аккаунтом и получите:
              </Text>

              {suggestedTier.features.map((feature, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#10B981"
                  />
                  <Text style={styles.benefitText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Price */}
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>От {suggestedTier.price} сом/месяц</Text>
              <Text style={styles.pricePromo}>
                🎁 Первые 7 дней бесплатно!
              </Text>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                onClose();
                router.push('/(business)/upgrade');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Выбрать тариф</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.laterButtonText}>Может позже</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  priceBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  pricePromo: {
    fontSize: 17,
    fontWeight: '600',
    color: '#10B981',
  },
  upgradeButton: {
    height: 56,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  laterButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

