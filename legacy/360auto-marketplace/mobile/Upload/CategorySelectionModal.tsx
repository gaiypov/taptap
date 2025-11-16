// components/Upload/CategorySelectionModal.tsx
import UpgradeModal from '@/components/Business/UpgradeModal';
import { checkCreateListingLimit } from '@/lib/business/check-limits';
import { auth } from '@/services/auth';
import { UpgradeReason } from '@/types/business';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Category {
  id: 'car' | 'horse' | 'realty';
  name: string;
  emoji: string;
  description: string;
  gradientColors: string[];
  active: boolean;
  comingSoon?: string;
}

interface CategorySelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const categories: Category[] = [
  {
    id: 'car',
    name: 'Автомобиль',
    emoji: '🚗',
    description: 'Снимите видео вашего авто и продайте за 3 дня',
    gradientColors: ['#3B82F6', '#2563EB'],
    active: true,
  },
  {
    id: 'horse',
    name: 'Лошадь',
    emoji: '🐴',
    description: 'Продайте породистого скакуна через видео',
    gradientColors: ['#D97706', '#B45309'],
    active: true,
  },
  {
    id: 'realty',
    name: 'Недвижимость',
    emoji: '🏠',
    description: 'Квартиры, дома, участки - видео туры',
    gradientColors: ['#A855F7', '#EC4899'],
    active: false,
    comingSoon: '🚀 Скоро! Готовим что-то крутое',
  },
];

const comingSoonTexts = [
  '🏗️ Строим этот раздел...',
  '🎨 Скоро здесь будут квартиры!',
  '🚀 В разработке',
  '✨ Готовим что-то крутое',
  '🔥 Coming Soon',
];

export default function CategorySelectionModal({ visible, onClose }: CategorySelectionModalProps) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason | undefined>(undefined);

  const handleSelectCategory = async (category: Category) => {
    if (!category.active) {
      // Показать toast для coming soon
      const randomText = comingSoonTexts[Math.floor(Math.random() * comingSoonTexts.length)];
      setToastMessage(`🏠 ${randomText}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Проверка лимитов ПЕРЕД созданием объявления
    try {
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        // Если не авторизован, всё равно разрешаем создать (будет prompt авторизации)
        router.push(`/listing/new?category=${category.id}` as any);
        onClose();
        return;
      }

      // Проверяем лимиты
      const limitCheck = await checkCreateListingLimit(currentUser.id, category.id);

      if (!limitCheck.canCreate && limitCheck.reason) {
        // Показать upgrade modal
        setUpgradeReason(limitCheck.reason);
        setShowUpgrade(true);
        return;
      }

      // Всё ОК - создаём объявление
      router.push(`/listing/new?category=${category.id}` as any);
      onClose();
    } catch (error) {
      console.error('Error checking limits:', error);
      // При ошибке всё равно разрешаем создать
      router.push(`/listing/new?category=${category.id}` as any);
      onClose();
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.backdrop}>
          <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
          
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />

          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Что продаете?</Text>
                <Text style={styles.headerSubtitle}>
                  Выберите категорию для создания объявления
                </Text>
              </View>

              {/* Categories */}
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleSelectCategory(category)}
                    disabled={!category.active}
                    activeOpacity={0.8}
                    style={styles.categoryButton}
                  >
                    <LinearGradient
                      colors={category.gradientColors as any}
                      style={[
                        styles.categoryGradient,
                        !category.active && styles.categoryDisabled,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {/* Coming soon overlay */}
                      {!category.active && (
                        <BlurView
                          intensity={20}
                          tint="dark"
                          style={styles.comingSoonOverlay}
                        >
                          <Text style={styles.comingSoonText}>
                            {category.comingSoon}
                          </Text>
                          <View style={styles.dotsContainer}>
                            <View style={[styles.dot, styles.dot1]} />
                            <View style={[styles.dot, styles.dot2]} />
                            <View style={[styles.dot, styles.dot3]} />
                          </View>
                        </BlurView>
                      )}

                      <View style={styles.categoryContent}>
                        {/* Emoji */}
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>

                        {/* Text */}
                        <View style={styles.categoryTextContainer}>
                          <Text style={styles.categoryName}>{category.name}</Text>
                          <Text style={styles.categoryDescription}>
                            {category.description}
                          </Text>
                        </View>

                        {/* Arrow */}
                        {category.active && (
                          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cancel button */}
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast для coming soon */}
      {showToast && (
        <View style={styles.toastContainer}>
          <LinearGradient
            colors={['#A855F7', '#EC4899'] as any}
            style={styles.toast}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Upgrade modal */}
      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 440,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  categoriesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  categoryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryGradient: {
    padding: 20,
    borderRadius: 16,
  },
  categoryDisabled: {
    opacity: 0.6,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryEmoji: {
    fontSize: 48,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
});

