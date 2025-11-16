// app/components/ListMapToggle.tsx
// Toggle для переключения между List и Map view

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ListMapToggleProps {
  viewMode: 'list' | 'map';
  onToggle: (mode: 'list' | 'map') => void;
}

export function ListMapToggle({ viewMode, onToggle }: ListMapToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, viewMode === 'list' && styles.buttonActive]}
        onPress={() => onToggle('list')}
      >
        <Ionicons
          name="list"
          size={20}
          color={viewMode === 'list' ? '#FFF' : '#8E8E93'}
        />
        <Text
          style={[
            styles.buttonText,
            viewMode === 'list' && styles.buttonTextActive,
          ]}
        >
          Лента
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, viewMode === 'map' && styles.buttonActive]}
        onPress={() => onToggle('map')}
      >
        <Ionicons
          name="map"
          size={20}
          color={viewMode === 'map' ? '#FFF' : '#8E8E93'}
        />
        <Text
          style={[
            styles.buttonText,
            viewMode === 'map' && styles.buttonTextActive,
          ]}
        >
          Карта
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 4,
    borderRadius: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#667eea',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  buttonTextActive: {
    color: '#FFF',
  },
});

// Default export for Expo Router (not used as route)
export default function ListMapToggleDefault() {
  return null;
}

