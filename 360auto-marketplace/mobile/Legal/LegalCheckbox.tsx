import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LegalCheckboxProps {
  checked: boolean;
  onPress: () => void;
  type: 'terms' | 'privacy' | 'consent' | 'all';
}

export default function LegalCheckbox({ checked, onPress, type }: LegalCheckboxProps) {
  const router = useRouter();

  const handleLinkPress = (path: string) => {
    router.push(path as any);
  };

  const renderText = () => {
    switch (type) {
      case 'terms':
        return (
          <Text style={styles.text}>
            Я принимаю{' '}
            <Text
              style={styles.link}
              onPress={() => handleLinkPress('/legal/terms')}
            >
              Пользовательское соглашение
            </Text>
          </Text>
        );
      case 'privacy':
        return (
          <Text style={styles.text}>
            Я принимаю{' '}
            <Text
              style={styles.link}
              onPress={() => handleLinkPress('/legal/privacy')}
            >
              Политику конфиденциальности
            </Text>
          </Text>
        );
      case 'consent':
        return (
          <Text style={styles.text}>
            Я даю{' '}
            <Text
              style={styles.link}
              onPress={() => handleLinkPress('/legal/consent')}
            >
              Согласие на обработку персональных данных
            </Text>
          </Text>
        );
      case 'all':
        return (
          <Text style={styles.text}>
            Я принимаю{' '}
            <Text
              style={styles.link}
              onPress={() => handleLinkPress('/legal/terms')}
            >
              Пользовательское соглашение
            </Text>
            ,{' '}
            <Text
              style={styles.link}
              onPress={() => handleLinkPress('/legal/privacy')}
            >
              Политику конфиденциальности
            </Text>
            {' '}и даю{' '}
            <Text
              style={styles.link}
              onPress={() => handleLinkPress('/legal/consent')}
            >
              Согласие на обработку данных
            </Text>
          </Text>
        );
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={18} color="#FFF" />}
      </View>
      <View style={styles.textContainer}>
        {renderText()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

