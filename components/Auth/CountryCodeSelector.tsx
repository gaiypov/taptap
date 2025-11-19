// components/Auth/CountryCodeSelector.tsx
// Компонент выбора кода страны

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  { code: 'KG', name: 'Кыргызстан', flag: '🇰🇬', dialCode: '+996' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿', dialCode: '+7' },
  { code: 'UZ', name: 'Узбекистан', flag: '🇺🇿', dialCode: '+998' },
  { code: 'TJ', name: 'Таджикистан', flag: '🇹🇯', dialCode: '+992' },
  { code: 'RU', name: 'Россия', flag: '🇷🇺', dialCode: '+7' },
];

interface CountryCodeSelectorProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
}

export function CountryCodeSelector({
  selectedCountry,
  onSelect,
}: CountryCodeSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <Text style={styles.dialCode}>
          {selectedCountry.dialCode}
        </Text>
        <Ionicons name="chevron-down" size={Platform.select({ ios: 16, android: 15, default: 16 })} color={ultra.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Выберите страну
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={Platform.select({ ios: 24, android: 22, default: 24 })} color={ultra.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry.code === item.code && styles.countryItemActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    onSelect(item);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={styles.countryName}>
                      {item.name}
                    </Text>
                    <Text style={styles.countryDialCode}>
                      {item.dialCode}
                    </Text>
                  </View>
                  {selectedCountry.code === item.code && (
                    <Ionicons name="checkmark-circle" size={Platform.select({ ios: 20, android: 19, default: 20 })} color={ultra.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64, // Высота 64px
    paddingHorizontal: Platform.select({ ios: 12, android: 10, default: 12 }),
    borderRadius: 28, // Скругление 28px
    borderWidth: 1,
    borderColor: ultra.border, // #2A2A2A
    backgroundColor: ultra.card, // #171717 матовая
    marginRight: Platform.select({ ios: 12, android: 10, default: 12 }),
    minWidth: Platform.select({ ios: 100, android: 95, default: 100 }),
    justifyContent: 'center',
    // Никаких теней (TikTok стиль)
  },
  flag: {
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }),
    marginRight: Platform.select({ ios: 8, android: 6, default: 8 }),
  },
  dialCode: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '600',
    marginRight: Platform.select({ ios: 4, android: 3, default: 4 }),
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Platform.select({ ios: 28, android: 24, default: 28 }),
    borderTopRightRadius: Platform.select({ ios: 28, android: 24, default: 28 }),
    paddingTop: Platform.select({ ios: 20, android: 18, default: 20 }),
    paddingBottom: Platform.select({ ios: 40, android: 36, default: 40 }),
    maxHeight: '70%',
    backgroundColor: ultra.card, // #171717 матовая
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingBottom: Platform.select({ ios: 16, android: 14, default: 16 }),
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  modalTitle: {
    fontSize: Platform.select({ ios: 20, android: 19, default: 20 }),
    fontWeight: '800',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Bold',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 16, android: 14, default: 16 }),
    backgroundColor: ultra.card,
  },
  countryItemActive: {
    backgroundColor: ultra.background,
  },
  countryFlag: {
    fontSize: Platform.select({ ios: 24, android: 22, default: 24 }),
    marginRight: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
    fontWeight: '600',
    marginBottom: Platform.select({ ios: 2, android: 1, default: 2 }),
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  countryDialCode: {
    fontSize: Platform.select({ ios: 14, android: 13, default: 14 }),
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
});

