import { CategoryType } from '@/config/uploadTexts';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Modal,
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
  
  // Примеры видео для каждой категории
  const examples = {
    auto: [
      { thumb: '📹', label: '360° обзор', duration: '1:20' },
      { thumb: '🚗', label: 'Салон', duration: '0:45' },
      { thumb: '🔊', label: 'Двигатель', duration: '0:30' }
    ],
    horse: [
      { thumb: '🐴', label: 'Полный обзор', duration: '1:15' },
      { thumb: '🏃', label: 'В движении', duration: '0:50' },
      { thumb: '👀', label: 'Крупный план', duration: '0:25' }
    ],
    real_estate: [
      { thumb: '🏠', label: 'Видео-тур', duration: '2:00' },
      { thumb: '🪟', label: 'Вид из окна', duration: '0:30' },
      { thumb: '🛁', label: 'Санузел', duration: '0:40' }
    ]
  };
  
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
    >
      <View style={styles.modalContainer}>
        
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Как снимать {categoryLabels[category]}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          
          {/* Советы */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>✅ Чек-лист съемки:</Text>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
          
          {/* Примеры */}
          <View style={styles.examplesSection}>
            <Text style={styles.sectionTitle}>📹 Примеры хороших видео:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {examples[category].map((example, index) => (
                <View key={index} style={styles.exampleCard}>
                  <View style={styles.exampleThumb}>
                    <Text style={styles.exampleEmoji}>{example.thumb}</Text>
                    <View style={styles.exampleDuration}>
                      <Text style={styles.exampleDurationText}>
                        {example.duration}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.exampleLabel}>{example.label}</Text>
                  <TouchableOpacity style={styles.exampleButton}>
                    <Ionicons name="play-circle" size={20} color="#E63946" />
                    <Text style={styles.exampleButtonText}>Смотреть</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
          
          {/* Ошибки */}
          <View style={styles.mistakesSection}>
            <Text style={styles.sectionTitle}>❌ Частые ошибки:</Text>
            <View style={styles.mistakeItem}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.mistakeText}>Темное видео - не видно деталей</Text>
            </View>
            <View style={styles.mistakeItem}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.mistakeText}>Трясется камера - сложно смотреть</Text>
            </View>
            <View style={styles.mistakeItem}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.mistakeText}>Слишком быстро - ничего не разглядеть</Text>
            </View>
          </View>
          
        </ScrollView>
        
        {/* Footer кнопка */}
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => {
              onClose();
              // Запустить камеру
            }}
          >
            <LinearGradient
              colors={['#E63946', '#D62828']}
              style={styles.startButtonGradient}
            >
              <Ionicons name="videocam" size={20} color="#FFFFFF" />
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
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tipsSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  tipItem: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  tipText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  examplesSection: {
    marginBottom: 30,
  },
  exampleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exampleThumb: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  exampleEmoji: {
    fontSize: 40,
  },
  exampleDuration: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#111827',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exampleDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  exampleButtonText: {
    fontSize: 12,
    color: '#E63946',
    fontWeight: '600',
  },
  mistakesSection: {
    marginBottom: 30,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  mistakeText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
