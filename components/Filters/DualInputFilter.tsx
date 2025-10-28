// components/Filters/DualInputFilter.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface DualInputFilterProps {
  label: string;
  placeholders: [string, string];
  value?: [string, string];
  onChange: (value: [string, string]) => void;
}

export default function DualInputFilter({
  label,
  placeholders,
  value = ['', ''],
  onChange,
}: DualInputFilterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholders[0]}
          placeholderTextColor="#8E8E93"
          value={value[0]}
          onChangeText={(text) => onChange([text, value[1]])}
          keyboardType="numeric"
        />
        
        <Text style={styles.separator}>—</Text>
        
        <TextInput
          style={styles.input}
          placeholder={placeholders[1]}
          placeholderTextColor="#8E8E93"
          value={value[1]}
          onChangeText={(text) => onChange([value[0], text])}
          keyboardType="numeric"
        />
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  separator: {
    fontSize: 18,
    color: '#8E8E93',
  },
});

