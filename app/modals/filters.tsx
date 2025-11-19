// app/modals/filters.tsx
// Global filters modal

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FiltersModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(true);

  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    yearMin: '',
    yearMax: '',
    brand: '',
  });

  const handleClose = () => {
    setVisible(false);
    router.back();
  };

  const handleApply = () => {
    // TODO: Apply filters
    handleClose();
  };

  const handleClear = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      yearMin: '',
      yearMax: '',
      brand: '',
    });
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
            <Text style={styles.headerTitle}>Фильтры</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={Platform.select({ ios: 28, android: 26, default: 28 })} color={ultra.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Цена (KGS)</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="От"
                  placeholderTextColor={ultra.textMuted}
                  value={filters.priceMin}
                  onChangeText={(text) => setFilters({ ...filters, priceMin: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.filterInput}
                  placeholder="До"
                  placeholderTextColor={ultra.textMuted}
                  value={filters.priceMax}
                  onChangeText={(text) => setFilters({ ...filters, priceMax: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Год</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="От"
                  placeholderTextColor={ultra.textMuted}
                  value={filters.yearMin}
                  onChangeText={(text) => setFilters({ ...filters, yearMin: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.filterInput}
                  placeholder="До"
                  placeholderTextColor={ultra.textMuted}
                  value={filters.yearMax}
                  onChangeText={(text) => setFilters({ ...filters, yearMax: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Марка</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Введите марку"
                placeholderTextColor={ultra.textMuted}
                value={filters.brand}
                onChangeText={(text) => setFilters({ ...filters, brand: text })}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.clearButton]}
              onPress={handleClear}
            >
              <Text style={[styles.footerButtonText, styles.clearButtonText]}>Очистить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.applyButton]}
              onPress={handleApply}
            >
              <Text style={[styles.footerButtonText, styles.applyButtonText]}>Применить</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '90%',
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
  filterGroup: {
    marginBottom: Platform.select({ ios: 24, android: 20, default: 24 }),
  },
  filterLabel: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '600',
    marginBottom: Platform.select({ ios: 12, android: 10, default: 12 }),
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  filterInput: {
    flex: 1,
    paddingHorizontal: Platform.select({ ios: 16, android: 14, default: 16 }),
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    borderRadius: Platform.select({ ios: 16, android: 14, default: 16 }),
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    backgroundColor: ultra.background,
    borderWidth: 1,
    borderColor: ultra.border,
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  footer: {
    flexDirection: 'row',
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 16, android: 14, default: 16 }),
    borderTopWidth: 1,
    borderTopColor: ultra.border,
  },
  footerButton: {
    flex: 1,
    paddingVertical: Platform.select({ ios: 16, android: 14, default: 16 }),
    borderRadius: Platform.select({ ios: 16, android: 14, default: 16 }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    borderWidth: 1,
    borderColor: ultra.border,
    backgroundColor: ultra.card,
  },
  applyButton: {
    backgroundColor: ultra.accent, // #C0C0C0 серебро
  },
  footerButtonText: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  clearButtonText: {
    color: ultra.textSecondary,
  },
  applyButtonText: {
    color: ultra.textPrimary,
  },
});

