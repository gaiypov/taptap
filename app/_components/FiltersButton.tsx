// app/components/Filters/FiltersButton.tsx

import { ultra } from '@/lib/theme/ultra';

import { Ionicons } from '@expo/vector-icons';

import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { LinearGradient } from 'expo-linear-gradient';

import * as Haptics from 'expo-haptics';

import React, { useCallback, useMemo, useRef } from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Category = 'car' | 'horse' | 'real_estate';

interface Filters {
  price_min?: string;
  price_max?: string;
  year_min?: string;
  year_max?: string;
  mileage_min?: string;
  mileage_max?: string;
  brand?: string;
  breed?: string; // для лошадей
  rooms?: string; // для недвижимости
  area_min?: string;
  area_max?: string;
}

interface FiltersButtonProps {
  category: Category;
  onApplyFilters: (filters: Partial<Filters>) => void;
  activeFiltersCount?: number;
}

const CATEGORY_CONFIG = {
  car: {
    title: 'Фильтры авто',
    fields: ['price', 'year', 'mileage', 'brand'],
  },
  horse: {
    title: 'Фильтры лошадей',
    fields: ['price', 'breed'],
  },
  real_estate: {
    title: 'Фильтры недвижимости',
    fields: ['price', 'rooms', 'area'],
  },
} as const;

export default function FiltersButton({ category, onApplyFilters, activeFiltersCount = 0 }: FiltersButtonProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [filters, setFilters] = React.useState<Filters>({});

  const snapPoints = useMemo(() => ['80%'], []);

  const activeCount = activeFiltersCount || Object.values(filters).filter(Boolean).length;

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.expand();
  };

  const close = () => bottomSheetRef.current?.close();

  const apply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cleaned = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined)
    );
    onApplyFilters(cleaned);
    close();
  };

  const clear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFilters({});
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ),
    []
  );

  return (
    <>
      {/* Кнопка */}
      <TouchableOpacity style={styles.trigger} onPress={open} activeOpacity={0.7}>
        <Ionicons name="options-outline" size={20} color={ultra.accent} />
        <Text style={styles.triggerText}>Фильтры</Text>
        {activeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
        index={-1}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{CATEGORY_CONFIG[category].title}</Text>

          {/* Цена — всегда */}
          <FilterGroup label="Цена (сом)">
            <RangeInput
              placeholderFrom="От"
              placeholderTo="До"
              valueFrom={filters.price_min || ''}
              valueTo={filters.price_max || ''}
              onChangeFrom={(v) => setFilters((p) => ({ ...p, price_min: v }))}
              onChangeTo={(v) => setFilters((p) => ({ ...p, price_max: v }))}
            />
          </FilterGroup>

          {/* Авто */}
          {category === 'car' && (
            <>
              <FilterGroup label="Год выпуска">
                <RangeInput
                  placeholderFrom="От"
                  placeholderTo="До"
                  valueFrom={filters.year_min || ''}
                  valueTo={filters.year_max || ''}
                  onChangeFrom={(v) => setFilters((p) => ({ ...p, year_min: v }))}
                  onChangeTo={(v) => setFilters((p) => ({ ...p, year_max: v }))}
                  keyboardType="number-pad"
                />
              </FilterGroup>

              <FilterGroup label="Пробег (км)">
                <RangeInput
                  placeholderFrom="От"
                  placeholderTo="До"
                  valueFrom={filters.mileage_min || ''}
                  valueTo={filters.mileage_max || ''}
                  onChangeFrom={(v) => setFilters((p) => ({ ...p, mileage_min: v }))}
                  onChangeTo={(v) => setFilters((p) => ({ ...p, mileage_max: v }))}
                  keyboardType="number-pad"
                />
              </FilterGroup>

              <FilterGroup label="Марка">
                <TextInput
                  style={styles.input}
                  placeholder="Например: Toyota"
                  value={filters.brand || ''}
                  onChangeText={(v) => setFilters((p) => ({ ...p, brand: v }))}
                  placeholderTextColor={ultra.textMuted}
                />
              </FilterGroup>
            </>
          )}

          {/* Лошади */}
          {category === 'horse' && (
            <FilterGroup label="Порода">
              <TextInput
                style={styles.input}
                placeholder="Ахалтекинская, Арабская..."
                value={filters.breed || ''}
                onChangeText={(v) => setFilters((p) => ({ ...p, breed: v }))}
                placeholderTextColor={ultra.textMuted}
              />
            </FilterGroup>
          )}

          {/* Недвижимость */}
          {category === 'real_estate' && (
            <>
              <FilterGroup label="Комнаты">
                <TextInput
                  style={styles.input}
                  placeholder="1, 2, 3, 4+"
                  value={filters.rooms || ''}
                  onChangeText={(v) => setFilters((p) => ({ ...p, rooms: v }))}
                  placeholderTextColor={ultra.textMuted}
                />
              </FilterGroup>

              <FilterGroup label="Площадь (м²)">
                <RangeInput
                  placeholderFrom="От"
                  placeholderTo="До"
                  valueFrom={filters.area_min || ''}
                  valueTo={filters.area_max || ''}
                  onChangeFrom={(v) => setFilters((p) => ({ ...p, area_min: v }))}
                  onChangeTo={(v) => setFilters((p) => ({ ...p, area_max: v }))}
                  keyboardType="number-pad"
                />
              </FilterGroup>
            </>
          )}

          {/* Кнопки */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clear} activeOpacity={0.7}>
              <Text style={styles.clearText}>Очистить</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={apply} activeOpacity={0.7}>
              <LinearGradient
                colors={[ultra.gradientStart, ultra.gradientEnd]}
                style={styles.applyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.applyText}>Применить</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}

// Маленькие компоненты
const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.group}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const RangeInput: React.FC<{
  placeholderFrom: string;
  placeholderTo: string;
  valueFrom: string;
  valueTo: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  keyboardType?: 'default' | 'number-pad';
}> = ({ placeholderFrom, placeholderTo, valueFrom, valueTo, onChangeFrom, onChangeTo, keyboardType = 'default' }) => (
  <View style={styles.range}>
    <TextInput
      style={styles.input}
      placeholder={placeholderFrom}
      value={valueFrom}
      onChangeText={onChangeFrom}
      keyboardType={keyboardType}
      placeholderTextColor={ultra.textMuted}
    />
    <Text style={styles.dash}>—</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholderTo}
      value={valueTo}
      onChangeText={onChangeTo}
      keyboardType={keyboardType}
      placeholderTextColor={ultra.textMuted}
    />
  </View>
);

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ultra.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ultra.border,
    gap: 8,
  },
  triggerText: {
    color: ultra.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: ultra.accent,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: ultra.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  sheetBg: { backgroundColor: ultra.card },
  handle: { backgroundColor: ultra.border, width: 40 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: ultra.textPrimary, marginBottom: 24 },
  group: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: ultra.textPrimary, marginBottom: 12 },
  range: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    flex: 1,
    backgroundColor: ultra.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    color: ultra.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  dash: { fontSize: 20, color: ultra.textSecondary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  clearBtn: {
    flex: 1,
    backgroundColor: ultra.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ultra.border,
  },
  clearText: { color: ultra.textSecondary, fontSize: 16, fontWeight: '600' },
  applyBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  applyGradient: { paddingVertical: 16, alignItems: 'center' },
  applyText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
