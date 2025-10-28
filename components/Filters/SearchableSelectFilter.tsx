// components/Filters/SearchableSelectFilter.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchableSelectFilterProps {
  label: string;
  options: string[];
  value?: string;
  placeholder?: string;
  onChange: (value: string | null) => void;
}

export default function SearchableSelectFilter({
  label,
  options,
  value,
  placeholder = 'Поиск...',
  onChange,
}: SearchableSelectFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Selected Value or Placeholder */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={[styles.selectorText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#8E8E93"
        />
      </TouchableOpacity>

      {/* Dropdown */}
      {isExpanded && (
        <View style={styles.dropdown}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={placeholder}
              placeholderTextColor="#8E8E93"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {/* Options List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item}
            style={styles.optionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  item === value && styles.optionSelected,
                ]}
                onPress={() => {
                  onChange(item === value ? null : item);
                  setIsExpanded(false);
                  setSearchQuery('');
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    item === value && styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {item === value && (
                  <Ionicons name="checkmark" size={20} color="#E63946" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Ничего не найдено</Text>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  selectorText: {
    fontSize: 15,
    color: '#FFF',
  },
  placeholder: {
    color: '#8E8E93',
  },
  dropdown: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
    paddingVertical: 0,
  },
  optionsList: {
    maxHeight: 250,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  optionSelected: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
  },
  optionText: {
    fontSize: 15,
    color: '#FFF',
  },
  optionTextSelected: {
    color: '#E63946',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

