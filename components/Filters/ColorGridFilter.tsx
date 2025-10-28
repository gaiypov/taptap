// components/Filters/ColorGridFilter.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterOption } from '@/config/filterConfig';

interface ColorGridFilterProps {
  label: string;
  colors: FilterOption[];
  value?: string;
  onChange: (value: string | null) => void;
}

export default function ColorGridFilter({
  label,
  colors,
  value,
  onChange,
}: ColorGridFilterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.grid}>
        {colors.map((color) => {
          const isSelected = value === color.value;
          const isWhite = color.hex === '#FFFFFF';
          
          return (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorItem,
                isSelected && styles.colorItemSelected,
              ]}
              onPress={() => onChange(isSelected ? null : color.value)}
            >
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: color.hex },
                  isWhite && styles.colorCircleWhite,
                ]}
              >
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={isWhite ? '#000' : '#FFF'}
                  />
                )}
              </View>
              <Text style={styles.colorLabel}>{color.label}</Text>
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
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorItem: {
    alignItems: 'center',
    width: 70,
  },
  colorItemSelected: {
    // Selected styling
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  colorCircleWhite: {
    borderWidth: 2,
    borderColor: '#3A3A3C',
  },
  colorLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

