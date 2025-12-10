// components/Listing/ProgressIndicator.tsx
// Индикатор прогресса создания объявления (5 шагов)

import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface ProgressIndicatorProps {
  currentStep: number; // 1-5
  totalSteps?: number;
  stepNames?: string[];
}

const DEFAULT_STEP_NAMES = [
  'Категория',
  'Инструкция',
  'Видео',
  'Основное',
  'Детали'
];

export default function ProgressIndicator({
  currentStep,
  totalSteps = 5,
  stepNames = DEFAULT_STEP_NAMES
}: ProgressIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep} из {totalSteps}
        </Text>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          const isPending = step > currentStep;

          return (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isActive && styles.stepCircleActive,
                  isPending && styles.stepCirclePending
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={ultra.background} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive
                    ]}
                  >
                    {step}
                  </Text>
                )}
              </View>
              {step < totalSteps && (
                <View
                  style={[
                    styles.stepLine,
                    isCompleted && styles.stepLineCompleted
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Current Step Name */}
      <View style={styles.stepNameContainer}>
        <Text style={styles.stepNameLabel}>Текущий шаг:</Text>
        <Text style={styles.stepName}>
          {stepNames[currentStep - 1] || `Шаг ${currentStep}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ultra.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  progressBarContainer: {
    marginBottom: 20,
  },

  progressBarBackground: {
    height: 8,
    backgroundColor: ultra.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: ultra.accent,
    borderRadius: 4,
  },

  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: ultra.textSecondary,
    textAlign: 'right',
  },

  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },

  stepCirclePending: {
    backgroundColor: ultra.surface,
    borderColor: ultra.border,
  },

  stepCircleActive: {
    backgroundColor: ultra.accent,
    borderColor: ultra.accent,
  },

  stepCircleCompleted: {
    backgroundColor: ultra.accentSecondary,
    borderColor: ultra.accentSecondary,
  },

  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: ultra.textMuted,
  },

  stepNumberActive: {
    color: ultra.background,
  },

  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: ultra.border,
    marginHorizontal: 4,
  },

  stepLineCompleted: {
    backgroundColor: ultra.accentSecondary,
  },

  stepNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  stepNameLabel: {
    fontSize: 13,
    color: ultra.textMuted,
    fontWeight: '600',
  },

  stepName: {
    fontSize: 15,
    fontWeight: '800',
    color: ultra.accent,
    letterSpacing: 0.5,
  },
});
