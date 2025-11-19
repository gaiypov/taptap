// components/search/SearchCategoryTabs.tsx
import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

import { theme } from '@/lib/theme';

export type SearchCategory = 'auto' | 'horse' | 'real_estate';

interface Props {
  value: SearchCategory;
  onChange: (value: SearchCategory) => void;
}

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  auto: 'Автомобили',
  horse: 'Лошади',
  real_estate: 'Недвижимость',
};

export const SearchCategoryTabs: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      {(Object.keys(CATEGORY_LABELS) as SearchCategory[]).map((key) => {
        const selected = key === value;

        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabSelected,
              pressed && styles.tabPressed,
            ]}
          >
            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {CATEGORY_LABELS[key]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    backgroundColor: theme.surfaceGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    borderColor: theme.borderStrong,
    backgroundColor: theme.surfaceGlassStrong,
  },
  tabPressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  labelSelected: {
    color: theme.textPrimary,
  },
});

