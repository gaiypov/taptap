// app/components/FiltersButton.tsx
// Кнопка фильтров с bottom sheet

import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface FiltersButtonProps {
  category: 'car' | 'horse' | 'real_estate';
  onApplyFilters: (filters: any) => void;
}

export default function FiltersButton({ category, onApplyFilters }: FiltersButtonProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [filters, setFilters] = useState({
    price_min: '',
    price_max: '',
    year_min: '',
    year_max: '',
    brand: '',
    mileage_min: '',
    mileage_max: '',
  });
  
  const openFilters = () => {
    bottomSheetRef.current?.expand();
  };
  
  const handleApply = () => {
    onApplyFilters(filters);
    bottomSheetRef.current?.close();
  };
  
  const handleClear = () => {
    setFilters({
      price_min: '',
      price_max: '',
      year_min: '',
      year_max: '',
      brand: '',
      mileage_min: '',
      mileage_max: '',
    });
  };
  
  // CAR_BRANDS can be used for dropdown in future
  // const CAR_BRANDS = [
  //   'Toyota', 'Mercedes-Benz', 'BMW', 'Lexus', 
  //   'Honda', 'Nissan', 'Mazda', 'Volkswagen',
  //   'Audi', 'Hyundai', 'Kia', 'Chevrolet'
  // ];
  
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );
  
  return (
    <>
      <TouchableOpacity 
        style={styles.button}
        onPress={openFilters}
      >
        <Ionicons name="filter" size={20} color="#667eea" />
        <Text style={styles.buttonText}>Фильтры</Text>
      </TouchableOpacity>
      
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['80%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Фильтры</Text>
          
          {/* Price Range */}
          <View style={styles.filterGroup}>
            <Text style={styles.label}>Цена (сом)</Text>
            <View style={styles.rangeInputs}>
              <TextInput
                style={styles.input}
                placeholder="От"
                keyboardType="number-pad"
                value={filters.price_min}
                onChangeText={(val) => setFilters({...filters, price_min: val})}
                placeholderTextColor="#8E8E93"
              />
              <Text style={styles.separator}>—</Text>
              <TextInput
                style={styles.input}
                placeholder="До"
                keyboardType="number-pad"
                value={filters.price_max}
                onChangeText={(val) => setFilters({...filters, price_max: val})}
                placeholderTextColor="#8E8E93"
              />
            </View>
          </View>
          
          {/* Car-specific filters */}
          {category === 'car' && (
            <>
              {/* Year */}
              <View style={styles.filterGroup}>
                <Text style={styles.label}>Год выпуска</Text>
                <View style={styles.rangeInputs}>
                  <TextInput
                    style={styles.input}
                    placeholder="От"
                    keyboardType="number-pad"
                    value={filters.year_min}
                    onChangeText={(val) => setFilters({...filters, year_min: val})}
                    placeholderTextColor="#8E8E93"
                  />
                  <Text style={styles.separator}>—</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="До"
                    keyboardType="number-pad"
                    value={filters.year_max}
                    onChangeText={(val) => setFilters({...filters, year_max: val})}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>
              
              {/* Mileage */}
              <View style={styles.filterGroup}>
                <Text style={styles.label}>Пробег (км)</Text>
                <View style={styles.rangeInputs}>
                  <TextInput
                    style={styles.input}
                    placeholder="От"
                    keyboardType="number-pad"
                    value={filters.mileage_min}
                    onChangeText={(val) => setFilters({...filters, mileage_min: val})}
                    placeholderTextColor="#8E8E93"
                  />
                  <Text style={styles.separator}>—</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="До"
                    keyboardType="number-pad"
                    value={filters.mileage_max}
                    onChangeText={(val) => setFilters({...filters, mileage_max: val})}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>
            </>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Text style={styles.clearButtonText}>Очистить</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={handleApply}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>Применить</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  buttonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSheetBackground: {
    backgroundColor: '#1C1C1E',
  },
  handleIndicator: {
    backgroundColor: '#8E8E93',
  },
  filterContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 24,
  },
  filterGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    color: '#FFF',
    fontSize: 16,
  },
  separator: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
