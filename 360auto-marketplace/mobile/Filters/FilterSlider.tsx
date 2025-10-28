// components/Filters/FilterSlider.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FilterSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  value?: [number, number];
  onChange: (value: [number, number]) => void;
}

export default function FilterSlider({
  label,
  min,
  max,
  step,
  unit = '',
  value = [min, max],
  onChange,
}: FilterSliderProps) {
  const [localValue] = useState<[number, number]>(value);

  const formatValue = (val: number): string => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}K`;
    }
    return `${val}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.valuesContainer}>
        <Text style={styles.valueText}>
          От {formatValue(localValue[0])} {unit}
        </Text>
        <Text style={styles.valueText}>
          До {formatValue(localValue[1])} {unit}
        </Text>
      </View>

      {/* Simple Range Slider - using View instead of external library */}
      <View style={styles.sliderContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              {
                left: `${((localValue[0] - min) / (max - min)) * 100}%`,
                width: `${
                  ((localValue[1] - localValue[0]) / (max - min)) * 100
                }%`,
              },
            ]}
          />
        </View>
        <View style={styles.valuesRow}>
          <Text style={styles.minValue}>{formatValue(min)}</Text>
          <Text style={styles.maxValue}>{formatValue(max)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sliderContainer: {
    marginTop: 8,
  },
  track: {
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    position: 'relative',
  },
  trackFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#E63946',
    borderRadius: 2,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  minValue: {
    fontSize: 12,
    color: '#636366',
  },
  maxValue: {
    fontSize: 12,
    color: '#636366',
  },
});

