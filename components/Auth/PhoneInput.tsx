import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = '+996 ___ ___ ___',
  error,
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 0) return '';

    let national = digits;

    if (national.startsWith('996')) {
      national = national.slice(3);
    }

    if (national.startsWith('0')) {
      national = national.slice(1);
    }

    national = national.slice(0, 9);

    return national.length > 0 ? `+996${national}` : '+996';
  };

  const handleChange = (text: string) => {
    const formatted = formatPhone(text);
    onChange(formatted);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          keyboardType="phone-pad"
          style={styles.input}
          autoComplete="tel"
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 18,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
  },
});
