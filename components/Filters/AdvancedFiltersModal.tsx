// components/Filters/AdvancedFiltersModal.tsx
import {
    CategoryType,
    FilterDefinition,
    FilterOption,
    getCategoryConfig,
} from '@/config/filterConfig';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ButtonGroupFilter,
    ColorGridFilter,
    DualInputFilter,
    FilterSlider,
    SearchableSelectFilter,
} from './index';

interface AdvancedFiltersModalProps {
  visible: boolean;
  category: CategoryType;
  filters: any;
  onApply: (filters: any) => void;
  onClose: () => void;
  onReset: () => void;
  resultsCount?: number;
}

export default function AdvancedFiltersModal({
  visible,
  category,
  filters,
  onApply,
  onClose,
  onReset,
  resultsCount = 0,
}: AdvancedFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const config = getCategoryConfig(category);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: string, value: any) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const renderFilter = (key: string, filterDef: FilterDefinition) => {
    // Специальная обработка для city
    if (key === 'city') {
      return (
        <View key={key} style={styles.filterContainer}>
          <Text style={styles.filterLabel}>{filterDef.label}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.cityScrollView}
            contentContainerStyle={styles.cityScrollContent}
          >
            {Array.isArray(filterDef.options) && filterDef.options.map((city) => {
              const cityValue = typeof city === 'string' ? city : city.value;
              const cityLabel = typeof city === 'string' ? city : city.label;
              return (
                <TouchableOpacity
                  key={cityValue}
                  onPress={() => updateFilter(key, cityValue)}
                  style={[
                    styles.cityOption,
                    localFilters[key] === cityValue && styles.cityOptionActive
                  ]}
                >
                  <Text style={styles.cityIcon}>
                    {cityValue === 'Весь Кыргызстан' ? '🌍' : '📍'}
                  </Text>
                  <Text style={[
                    styles.cityText,
                    cityValue === 'Весь Кыргызстан' && styles.cityTextAll,
                    localFilters[key] === cityValue && styles.cityTextActive
                  ]}>
                    {cityLabel}
                  </Text>
                  {localFilters[key] === cityValue && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    switch (filterDef.type) {
      case 'buttons':
        return (
          <ButtonGroupFilter
            key={key}
            label={filterDef.label}
            options={
              Array.isArray(filterDef.options) ? filterDef.options : []
            }
            value={localFilters[key]}
            onChange={(value) => updateFilter(key, value)}
          />
        );

      case 'slider':
        return (
          <FilterSlider
            key={key}
            label={filterDef.label}
            min={filterDef.min || 0}
            max={filterDef.max || 100}
            step={filterDef.step || 1}
            unit={filterDef.unit}
            value={localFilters[key] || [filterDef.min, filterDef.max]}
            onChange={(value) => updateFilter(key, value)}
          />
        );

      case 'select':
        return (
          <ButtonGroupFilter
            key={key}
            label={filterDef.label}
            options={
              Array.isArray(filterDef.options) ? filterDef.options : []
            }
            value={localFilters[key]}
            onChange={(value) => updateFilter(key, value)}
          />
        );

      case 'searchable-select':
        return (
          <SearchableSelectFilter
            key={key}
            label={filterDef.label}
            options={
              Array.isArray(filterDef.options) 
                ? filterDef.options.map(opt => typeof opt === 'string' ? opt : opt.label)
                : []
            }
            placeholder={filterDef.placeholder}
            value={localFilters[key]}
            onChange={(value) => updateFilter(key, value)}
          />
        );

      case 'color-grid':
        return (
          <ColorGridFilter
            key={key}
            label={filterDef.label}
            colors={
              Array.isArray(filterDef.options) 
                ? filterDef.options.filter((opt): opt is FilterOption => typeof opt === 'object' && 'hex' in opt)
                : []
            }
            value={localFilters[key]}
            onChange={(value) => updateFilter(key, value)}
          />
        );

      case 'dual-input':
        return (
          <DualInputFilter
            key={key}
            label={filterDef.label}
            placeholders={filterDef.placeholders || ['', '']}
            value={localFilters[key]}
            onChange={(value) => updateFilter(key, value)}
          />
        );

      default:
        return null;
    }
  };

  const handleReset = () => {
    const resetFilters = { ...filters };
    // Reset all filters to null/undefined
    Object.keys(resetFilters).forEach((key) => {
      if (key !== 'category') {
        resetFilters[key] = null;
      }
    });
    setLocalFilters(resetFilters);
    onReset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.cancelText}>Отмена</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.categoryIcon}>{config.icon}</Text>
            <Text style={styles.headerText}>Фильтры</Text>
          </View>
          
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Сбросить</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Advanced Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Параметры</Text>
            {Object.entries(config.advancedFilters).map(([key, filterDef]) =>
              renderFilter(key, filterDef)
            )}
          </View>

          {/* Toggles */}
          {config.toggles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Дополнительно</Text>
              {config.toggles.map((toggle) => (
                <View key={toggle.key} style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{toggle.label}</Text>
                  <Switch
                    value={localFilters[toggle.key] || toggle.default}
                    onValueChange={(value) => updateFilter(toggle.key, value)}
                    trackColor={{ false: '#3A3A3C', true: config.color }}
                    thumbColor="#FFF"
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer with Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => onApply(localFilters)}
          >
            <LinearGradient
              colors={[config.color, config.color + 'CC']}
              style={styles.applyGradient}
            >
              <Text style={styles.applyText}>
                Показать {resultsCount > 0 ? `(${resultsCount})` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  closeButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 22,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  resetText: {
    fontSize: 16,
    color: '#E63946',
    minWidth: 60,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  toggleLabel: {
    fontSize: 15,
    color: '#FFF',
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // City selector styles
  cityScrollView: {
    marginTop: 8,
  },
  cityScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    marginRight: 8,
  },
  cityOptionActive: {
    backgroundColor: '#E63946',
  },
  cityIcon: {
    fontSize: 16,
  },
  cityText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  cityTextAll: {
    fontWeight: '600',
    color: '#E63946',
  },
  cityTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
});

