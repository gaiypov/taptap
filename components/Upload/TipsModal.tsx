// REVOLUT ULTRA PLATINUM 2025-2026 — Tips Modal
// Темная платина, титаново-черный, серебро

import { CategoryType } from '@/config/uploadTexts';
import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TipsModalProps {
  visible: boolean;
  category: CategoryType;
  tips: string[];
  onClose: () => void;
}

export function TipsModal({ visible, category, tips, onClose }: TipsModalProps) {
  
  const categoryLabels = {
    auto: 'авто',
    horse: 'коня',
    real_estate: 'недвижимость'
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
    >
      <View style={styles.modalContainer}>
        
        {/* Header — Revolut Ultra Glassmorphism */}
        <View style={styles.modalHeader}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 50 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="bulb" size={24} color={ultra.accent} style={styles.headerIcon} />
              <Text style={styles.modalTitle}>
                Как снимать {categoryLabels[category]}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <View style={styles.closeButtonInner}>
                <Ionicons name="close" size={22} color={ultra.textPrimary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Советы — Revolut Ultra Cards */}
          <View style={styles.tipsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={ultra.accent} />
              <Text style={styles.sectionTitle}>Чек-лист съемки</Text>
            </View>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <BlurView
                  intensity={Platform.OS === 'ios' ? 30 : 0}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <LinearGradient
                  colors={[ultra.card, ultra.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tipCardGradient}
                >
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
          
          {/* Частые ошибки — Revolut Ultra Cards */}
          <View style={styles.mistakesSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="close-circle" size={20} color={ultra.textMuted} />
              <Text style={styles.sectionTitle}>Частые ошибки</Text>
            </View>
            <View style={styles.mistakeCard}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 30 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={[ultra.card, ultra.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mistakeCardGradient}
              >
                <Ionicons name="close-circle" size={18} color={ultra.textMuted} />
                <Text style={styles.mistakeText}>Темное видео - не видно деталей</Text>
              </LinearGradient>
            </View>
            <View style={styles.mistakeCard}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 30 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={[ultra.card, ultra.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mistakeCardGradient}
              >
                <Ionicons name="close-circle" size={18} color={ultra.textMuted} />
                <Text style={styles.mistakeText}>Трясется камера - сложно смотреть</Text>
              </LinearGradient>
            </View>
            <View style={styles.mistakeCard}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 30 : 0}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={[ultra.card, ultra.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mistakeCardGradient}
              >
                <Ionicons name="close-circle" size={18} color={ultra.textMuted} />
                <Text style={styles.mistakeText}>Слишком быстро - ничего не разглядеть</Text>
              </LinearGradient>
            </View>
          </View>
          
        </ScrollView>
        
        {/* Footer кнопка — Revolut Ultra Style */}
        <View style={styles.modalFooter}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 50 : 0}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity 
            style={styles.startButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[ultra.gradientStart, ultra.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButtonGradient}
            >
              <Ionicons name="videocam" size={22} color={ultra.textPrimary} />
              <Text style={styles.startButtonText}>Понятно, начать съемку!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    marginRight: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: ultra.textPrimary,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ultra.card,
    borderWidth: 1,
    borderColor: ultra.border,
    borderRadius: 20,
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  tipsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  tipCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tipCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ultra.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ultra.accentSecondary,
  },
  tipNumberText: {
    color: ultra.background,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    color: ultra.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  mistakesSection: {
    marginBottom: 32,
  },
  mistakeCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  mistakeCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  mistakeText: {
    flex: 1,
    fontSize: 16,
    color: ultra.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: ultra.border,
    position: 'relative',
    overflow: 'hidden',
  },
  startButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: ultra.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  startButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: ultra.textPrimary,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Black',
  },
});
