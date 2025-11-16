// components/Auth/CountryCodeSelector.tsx
// Компонент выбора кода страны

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
import { useAppTheme } from '@/lib/theme';

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
  const theme = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <Text style={[styles.dialCode, { color: theme.text }]}>
          {selectedCountry.dialCode}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Выберите страну
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    {
                      backgroundColor:
                        selectedCountry.code === item.code
                          ? theme.primary + '20'
                          : 'transparent',
                    },
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
                    <Text style={[styles.countryName, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.countryDialCode, { color: theme.textSecondary }]}
                    >
                      {item.dialCode}
                    </Text>
                  </View>
                  {selectedCountry.code === item.code && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
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
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 100,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  countryDialCode: {
    fontSize: 14,
  },
});

