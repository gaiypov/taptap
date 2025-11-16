// components/Filters/ButtonGroupFilter.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FilterOption } from '@/config/filterConfig';

interface ButtonGroupFilterProps {
  label: string;
  options: FilterOption[] | string[];
  value?: string;
  onChange: (value: string | null) => void;
  multiSelect?: boolean;
}

export default function ButtonGroupFilter({
  label,
  options,
  value,
  onChange,
  multiSelect = false,
}: ButtonGroupFilterProps) {
  const normalizedOptions: FilterOption[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.buttonGroup}>
        {normalizedOptions.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.button,
                isSelected && styles.buttonSelected,
              ]}
              onPress={() => onChange(isSelected ? null : option.value)}
            >
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.buttonTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  buttonSelected: {
    backgroundColor: '#E63946',
    borderColor: '#E63946',
  },
  buttonText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  buttonTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
});

