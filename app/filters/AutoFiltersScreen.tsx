// app/filters/AutoFiltersScreen.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextStyle, View } from 'react-native';

import { GlassField } from '@/components/ui/GlassField';
import { PlatinumButton } from '@/components/ui/PlatinumButton';
import { PlatinumChip } from '@/components/ui/PlatinumChip';
import { theme } from '@/lib/theme';

const TRANSMISSIONS = ['Механика', 'Автомат', 'Вариатор', 'Робот'];
const ENGINE_TYPES = ['Бензин', 'Дизель', 'Гибрид', 'Электро'];

export default function AutoFiltersScreen() {
  const router = useRouter();
  const [transmission, setTransmission] = React.useState<string | null>(null);
  const [engineType, setEngineType] = React.useState<string | null>(null);

  const handleApply = () => {
    router.back();
  };

  const handleReset = () => {
    setTransmission(null);
    setEngineType(null);
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
        <Text style={styles.headerTitle}>🚗 Фильтры</Text>
        <Text style={styles.headerReset} onPress={handleReset}>
          Сбросить
        </Text>
      </View>

      {/* Марка / Модель */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Параметры</Text>
        <GlassField label="🏭 Марка" placeholder="Поиск марки…" />
        <GlassField
          label="🚙 Модель"
          placeholder="Поиск модели…"
          containerStyle={{ marginTop: theme.spacing.sm }}
        />
      </View>

      {/* Коробка передач */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>⚙️ Коробка передач</Text>
        <View style={styles.chipsRow}>
          {TRANSMISSIONS.map((item) => (
            <PlatinumChip
              key={item}
              label={item}
              selected={transmission === item}
              onPress={() => setTransmission(item)}
            />
          ))}
        </View>
      </View>

      {/* Тип двигателя */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>⛽ Тип двигателя</Text>
        <View style={styles.chipsRow}>
          {ENGINE_TYPES.map((item) => (
            <PlatinumChip
              key={item}
              label={item}
              selected={engineType === item}
              onPress={() => setEngineType(item)}
            />
          ))}
        </View>
      </View>

      {/* TODO: Цвет, пробег и другие поля по аналогии */}

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
  sectionTitle: {
    ...((theme.typography?.sectionTitle || {}) as TextStyle),
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    ...((theme.typography?.label || {}) as TextStyle),
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

