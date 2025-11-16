import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
}

export default function CodeInput({
  value,
  onChange,
  length = 6,
  error,
}: CodeInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, digit: string) => {
    // Only allow digits
    if (!/^\d*$/.test(digit)) return;

    const newValue = value.split('');
    newValue[index] = digit;
    const result = newValue.join('');
    onChange(result);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            value={value[index] || ''}
            onChangeText={(text) => handleChange(index, text)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            onFocus={() => setFocusedIndex(index)}
            maxLength={1}
            keyboardType="number-pad"
            style={[
              styles.input,
              error && styles.inputError,
              focusedIndex === index && styles.inputFocused,
            ]}
            textAlign="center"
          />
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    width: 48,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});

