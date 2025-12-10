// components/Listing/LocationAutocomplete.tsx
// Автодополнение городов Кыргызстана

import { ultra } from '@/lib/theme/ultra';
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { LegendList } from '@legendapp/list';

// Города Кыргызстана с районами
const KYRGYZSTAN_LOCATIONS = [
  // Бишкек и районы
  { city: 'Бишкек', district: '', fullName: 'Бишкек', popular: true },
  { city: 'Бишкек', district: 'Ленинский район', fullName: 'Бишкек, Ленинский район', popular: false },
  { city: 'Бишкек', district: 'Октябрьский район', fullName: 'Бишкек, Октябрьский район', popular: false },
  { city: 'Бишкек', district: 'Первомайский район', fullName: 'Бишкек, Первомайский район', popular: false },
  { city: 'Бишкек', district: 'Свердловский район', fullName: 'Бишкек, Свердловский район', popular: false },

  // Ош
  { city: 'Ош', district: '', fullName: 'Ош', popular: true },

  // Джалал-Абад
  { city: 'Джалал-Абад', district: '', fullName: 'Джалал-Абад', popular: true },

  // Каракол
  { city: 'Каракол', district: '', fullName: 'Каракол', popular: true },

  // Токмок
  { city: 'Токмок', district: '', fullName: 'Токмок', popular: false },

  // Кара-Балта
  { city: 'Кара-Балта', district: '', fullName: 'Кара-Балта', popular: false },

  // Кант
  { city: 'Кант', district: '', fullName: 'Кант', popular: false },

  // Узген
  { city: 'Узген', district: '', fullName: 'Узген', popular: false },

  // Кара-Суу
  { city: 'Кара-Суу', district: '', fullName: 'Кара-Суу', popular: false },

  // Нарын
  { city: 'Нарын', district: '', fullName: 'Нарын', popular: false },

  // Талас
  { city: 'Талас', district: '', fullName: 'Талас', popular: false },

  // Баткен
  { city: 'Баткен', district: '', fullName: 'Баткен', popular: false },

  // Кызыл-Кия
  { city: 'Кызыл-Кия', district: '', fullName: 'Кызыл-Кия', popular: false },

  // Сулюкта
  { city: 'Сулюкта', district: '', fullName: 'Сулюкта', popular: false },

  // Исфана
  { city: 'Исфана', district: '', fullName: 'Исфана', popular: false },

  // Чолпон-Ата
  { city: 'Чолпон-Ата', district: '', fullName: 'Чолпон-Ата', popular: false },

  // Кочкор
  { city: 'Кочкор', district: '', fullName: 'Кочкор', popular: false },

  // Балыкчи
  { city: 'Балыкчи', district: '', fullName: 'Балыкчи', popular: false },

  // Кеден
  { city: 'Кеден', district: '', fullName: 'Кеден', popular: false },

  // Ак-Суу
  { city: 'Ак-Суу', district: '', fullName: 'Ак-Суу', popular: false },
];

export interface LocationAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (location: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export default function LocationAutocomplete({
  value,
  onChangeText,
  onSelect,
  placeholder = 'Введите город...',
  label = 'Город',
  error,
}: LocationAutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Фильтрация локаций по введенному тексту
  const filteredLocations = useMemo(() => {
    if (!value || value.trim().length === 0) {
      // Показываем популярные города если ничего не введено
      return KYRGYZSTAN_LOCATIONS.filter(loc => loc.popular);
    }

    const searchTerm = value.toLowerCase().trim();
    return KYRGYZSTAN_LOCATIONS.filter(loc =>
      loc.fullName.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Ограничиваем 10 результатами
  }, [value]);

  const handleSelect = (location: string) => {
    onSelect(location);
    onChangeText(location);
    setShowDropdown(false);
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    // Задержка чтобы успел сработать onPress на элементе списка
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
    }, 200);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Input */}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={ultra.textSecondary}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Dropdown — LegendList */}
      {showDropdown && filteredLocations.length > 0 && (
        <View style={styles.dropdown}>
          <LegendList
            data={filteredLocations}
            keyExtractor={(item: typeof KYRGYZSTAN_LOCATIONS[0], index: number) => `${item.fullName}-${index}`}
            renderItem={({ item }: { item: typeof KYRGYZSTAN_LOCATIONS[0] }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelect(item.fullName)}
                activeOpacity={0.7}
              >
                <Text style={styles.cityName}>{item.city}</Text>
                {item.district && (
                  <Text style={styles.districtName}>{item.district}</Text>
                )}
              </TouchableOpacity>
            )}
            style={styles.dropdownList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            recycleItems={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: ultra.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ultra.border,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderColor: ultra.accent,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: ultra.error,
  },
  input: {
    fontSize: 16,
    color: ultra.textPrimary,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: ultra.error,
    marginTop: 4,
    marginLeft: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: ultra.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ultra.border,
    marginTop: 4,
    maxHeight: 240,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  dropdownList: {
    maxHeight: 240,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: ultra.textPrimary,
    marginBottom: 2,
  },
  districtName: {
    fontSize: 13,
    color: ultra.textSecondary,
  },
});
