// app/components/MapView.web.tsx — Web версия MapView (заглушка)

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ultra } from '@/lib/theme/ultra';

interface MapViewProps {
  listings: any[];
  onMarkerPress?: (listing: any) => void;
}

// Web версия - просто заглушка, так как react-native-maps не работает на web
export default function MapView({ listings, onMarkerPress }: MapViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.text}>🗺️</Text>
        <Text style={styles.label}>Карта недоступна на web</Text>
        <Text style={styles.subtext}>
          Используйте мобильное приложение для просмотра карты
        </Text>
        {listings.length > 0 && (
          <Text style={styles.count}>
            Найдено объявлений: {listings.length}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  text: {
    fontSize: 64,
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: ultra.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: ultra.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  count: {
    fontSize: 12,
    color: ultra.textMuted,
    textAlign: 'center',
  },
});

