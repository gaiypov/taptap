import { CategoryType, UPLOAD_TEXTS } from '@/config/uploadTexts';
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

interface CategoryModalProps {
  visible: boolean;
  onSelect: (category: CategoryType) => void;
  onClose: () => void;
}

export function CategoryModal({ visible, onSelect, onClose }: CategoryModalProps) {
  
  const categories: CategoryType[] = ['auto', 'horse', 'real_estate'];
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Выберите категорию</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          
          {categories.map((category) => {
            const config = UPLOAD_TEXTS[category];
            const isDisabled = 'disabled' in config.mainButton && config.mainButton.disabled;
            
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryCard,
                  isDisabled && styles.categoryCardDisabled
                ]}
                onPress={() => {
                  if (!isDisabled) {
                    onSelect(category);
                  }
                }}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={isDisabled 
                    ? ['#F3F4F6', '#E5E7EB'] 
                    : ['#FFFFFF', '#F9FAFB']}
                  style={styles.categoryGradient}
                >
                  
                  {/* Иконка и заголовок */}
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryIcon}>{config.icon}</Text>
                    <View style={styles.categoryInfo}>
                      <Text style={[
                        styles.categoryTitle,
                        isDisabled && styles.categoryTitleDisabled
                      ]}>
                        {config.title}
                      </Text>
                      <Text style={[
                        styles.categorySubtitle,
                        isDisabled && styles.categorySubtitleDisabled
                      ]}>
                        {config.hero.subtitle}
                      </Text>
                    </View>
                    {isDisabled && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Скоро</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Статистика */}
                  <View style={styles.categoryStats}>
                    <View style={styles.statItem}>
                      <Text style={[
                        styles.statNumber,
                        isDisabled && styles.statNumberDisabled
                      ]}>
                        {config.stats.sold.split(' ')[0]}
                      </Text>
                      <Text style={[
                        styles.statLabel,
                        isDisabled && styles.statLabelDisabled
                      ]}>
                        {config.stats.sold.split(' ').slice(1).join(' ')}
                      </Text>
                    </View>
                    
                    <View style={styles.statDivider} />
                    
                    <View style={styles.statItem}>
                      <Text style={[
                        styles.statNumber,
                        isDisabled && styles.statNumberDisabled
                      ]}>
                        {config.stats.rating}
                      </Text>
                      <Text style={[
                        styles.statLabel,
                        isDisabled && styles.statLabelDisabled
                      ]}>
                        Рейтинг
                      </Text>
                    </View>
                    
                    <View style={styles.statDivider} />
                    
                    <View style={styles.statItem}>
                      <Text style={[
                        styles.statNumber,
                        isDisabled && styles.statNumberDisabled
                      ]}>
                        {config.stats.aiScore}
                      </Text>
                      <Text style={[
                        styles.statLabel,
                        isDisabled && styles.statLabelDisabled
                      ]}>
                        AI точность
                      </Text>
                    </View>
                  </View>
                  
                  {/* AI Promise */}
                  <View style={styles.aiPromise}>
                    <Text style={styles.aiIcon}>{config.aiPromise.icon}</Text>
                    <View style={styles.aiText}>
                      <Text style={[
                        styles.aiTitle,
                        isDisabled && styles.aiTitleDisabled
                      ]}>
                        {config.aiPromise.title}
                      </Text>
                      <Text style={[
                        styles.aiSubtitle,
                        isDisabled && styles.aiSubtitleDisabled
                      ]}>
                        {config.aiPromise.subtitle}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Кнопка действия */}
                  <View style={styles.actionButton}>
                    <LinearGradient
                      colors={isDisabled 
                        ? ['#9CA3AF', '#6B7280'] 
                        : ['#E63946', '#D62828']}
                      style={styles.actionButtonGradient}
                    >
                      <Ionicons 
                        name={isDisabled ? "lock-closed" : "videocam"} 
                        size={20} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.actionButtonText}>
                        {config.mainButton.text}
                      </Text>
                      <Text style={styles.actionButtonEmoji}>
                        {config.mainButton.emoji}
                      </Text>
                    </LinearGradient>
                  </View>
                  
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
          
        </ScrollView>
        
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
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
    paddingTop: 20,
  },
  categoryCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryCardDisabled: {
    opacity: 0.6,
  },
  categoryGradient: {
    padding: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  categoryTitleDisabled: {
    color: '#9CA3AF',
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  categorySubtitleDisabled: {
    color: '#9CA3AF',
  },
  comingSoonBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 2,
  },
  statNumberDisabled: {
    color: '#9CA3AF',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  statLabelDisabled: {
    color: '#9CA3AF',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#D1D5DB',
  },
  aiPromise: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  aiIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  aiText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  aiTitleDisabled: {
    color: '#9CA3AF',
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  aiSubtitleDisabled: {
    color: '#9CA3AF',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtonEmoji: {
    fontSize: 16,
  },
});
