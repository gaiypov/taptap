// app/filters/RealEstateFiltersScreen.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlatinumButton } from '@/components/ui/PlatinumButton';
import { PlatinumChip } from '@/components/ui/PlatinumChip';
import { theme } from '@/lib/theme';

const REAL_TYPES = ['Квартира', 'Дом', 'Участок', 'Коммерция'];
const BUILDING_TYPES = ['Панельный', 'Кирпичный', 'Монолит'];
const ROOMS = ['Студия', '1', '2', '3', '4', '5+'];

export default function RealEstateFiltersScreen() {
  const router = useRouter();

  const [realType, setRealType] = React.useState<string | null>(null);
  const [roomCount, setRoomCount] = React.useState<string | null>(null);
  const [buildingType, setBuildingType] = React.useState<string | null>(null);

  const handleApply = () => {
    router.back();
  };

  const handleReset = () => {
    setRealType(null);
    setRoomCount(null);
    setBuildingType(null);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerCancel} onPress={() => router.back()}>
          Отмена
        </Text>
        <Text style={styles.headerTitle}>🏠 Фильтры</Text>
        <Text style={styles.headerReset} onPress={handleReset}>
          Сбросить
        </Text>
      </View>

      {/* Тип */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>🏡 Тип</Text>
        <View style={styles.chipsRow}>
          {REAL_TYPES.map((item) => (
            <PlatinumChip
              key={item}
              label={item}
              selected={realType === item}
              onPress={() => setRealType(item)}
            />
          ))}
        </View>
      </View>

      {/* Комнат */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>🛏 Комнат</Text>
        <View style={styles.chipsRow}>
          {ROOMS.map((item) => (
            <PlatinumChip
              key={item}
              label={item}
              selected={roomCount === item}
              onPress={() => setRoomCount(item)}
            />
          ))}
        </View>
      </View>

      {/* Тип здания */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>🏗 Тип здания</Text>
        <View style={styles.chipsRow}>
          {BUILDING_TYPES.map((item) => (
            <PlatinumChip
              key={item}
              label={item}
              selected={buildingType === item}
              onPress={() => setBuildingType(item)}
            />
          ))}
        </View>
      </View>

      {/* Дополнительно */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Дополнительно</Text>
        {/* сюда можно добавить переключатель "Только проверенные" в платиновом стиле */}
      </View>

      <View style={styles.footer}>
        <PlatinumButton title="Показать" onPress={handleApply} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: theme.screen.paddingHorizontal,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  headerCancel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  headerReset: {
    fontSize: 16,
    color: '#FF4B4B',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    ...(theme.typography?.label || {}),
    marginBottom: theme.spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footer: {
    marginTop: theme.spacing.lg,
  },
});

