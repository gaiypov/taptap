// app/modals/categories.tsx
// Category selection modal

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORIES } from '@/constants/categories';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setActiveCategory } from '@/lib/store/slices/feedSlice';

export default function CategoriesModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const activeCategory = useAppSelector((state) => state.feed.activeCategory);
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    router.back();
  };

  const handleCategorySelect = (categoryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dispatch(setActiveCategory(categoryId));
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalOverlay} />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: ultra.card, // #171717 матовая
              paddingTop: Math.max(insets.top, Platform.select({ ios: 20, android: 16, default: 20 })),
              paddingBottom: Math.max(insets.bottom, Platform.select({ ios: 20, android: 16, default: 20 })),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Выберите категорию</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={Platform.select({ ios: 28, android: 26, default: 28 })} color={ultra.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {CATEGORIES.filter((cat) => cat.id !== 'all').map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: ultra.card,
                      borderColor: isActive ? ultra.accent : ultra.border,
                    },
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      {
                        color: isActive ? ultra.textPrimary : ultra.textSecondary,
                        fontWeight: isActive ? '800' : '500',
                        fontFamily: Platform.OS === 'ios' ? 'System' : (isActive ? 'Inter-Bold' : 'Inter-Medium'),
                      },
                    ]}
                  >
                    {category.name}
                  </Text>
                  {isActive && <Ionicons name="checkmark-circle" size={Platform.select({ ios: 24, android: 22, default: 24 })} color={ultra.accent} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    borderTopLeftRadius: Platform.select({ ios: 28, android: 24, default: 28 }),
    borderTopRightRadius: Platform.select({ ios: 28, android: 24, default: 28 }),
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 16, android: 14, default: 16 }),
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 24, android: 22, default: 24 }),
    fontWeight: '800',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  content: {
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 16, android: 14, default: 16 }),
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 16, android: 14, default: 16 }),
    borderRadius: Platform.select({ ios: 20, android: 16, default: 20 }),
    marginBottom: Platform.select({ ios: 12, android: 10, default: 12 }),
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryIcon: {
    fontSize: Platform.select({ ios: 28, android: 26, default: 28 }),
    marginRight: Platform.select({ ios: 16, android: 14, default: 16 }),
  },
  categoryName: {
    flex: 1,
    fontSize: Platform.select({ ios: 18, android: 17, default: 18 }),
  },
});

