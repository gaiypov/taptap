// components/Listing/PriceHelper.tsx
// UI компонент для отображения рекомендуемой цены

import { ultra } from '@/lib/theme/ultra';
import { suggestPrice, PriceData, PriceRange, formatPrice } from '@/algorithms/priceSuggestion';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';

export interface PriceHelperProps {
  data: PriceData;
  onSelectPrice?: (price: number) => void;
  currentPrice?: number;
}

export default function PriceHelper({ data, onSelectPrice, currentPrice }: PriceHelperProps) {
  const [loading, setLoading] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadPriceSuggestion();
  }, [data.category, data.brand, data.model, data.year]);

  const loadPriceSuggestion = async () => {
    setLoading(true);
    try {
      const result = await suggestPrice(data);
      setPriceRange(result);

      // Анимация появления
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('[PriceHelper] Failed to get price suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrice = (price: number) => {
    if (onSelectPrice) {
      onSelectPrice(price);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={ultra.accent} />
        <Text style={styles.loadingText}>Анализируем рынок...</Text>
      </View>
    );
  }

  if (!priceRange) {
    return null;
  }

  const confidenceColor = {
    low: ultra.warning,
    medium: ultra.info,
    high: ultra.success,
  }[priceRange.confidence];

  const confidenceText = {
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая',
  }[priceRange.confidence];

  const trendIcon = {
    rising: '📈',
    stable: '➡️',
    falling: '📉',
  }[priceRange.marketTrend || 'stable'];

  const trendText = {
    rising: 'Цены растут',
    stable: 'Цены стабильны',
    falling: 'Цены падают',
  }[priceRange.marketTrend || 'stable'];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Рекомендуемая цена</Text>
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.expandButton}>{expanded ? 'Скрыть' : 'Подробнее'}</Text>
        </TouchableOpacity>
      </View>

      {/* Suggested Price */}
      <View style={styles.suggestedPriceContainer}>
        <Text style={styles.suggestedLabel}>Рекомендуемая цена:</Text>
        <Text style={styles.suggestedPrice}>{formatPrice(priceRange.suggested)}</Text>
      </View>

      {/* Price Range */}
      <View style={styles.rangeContainer}>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>Минимум</Text>
          <Text style={styles.rangeValue}>{formatPrice(priceRange.min)}</Text>
        </View>
        <View style={styles.rangeDivider} />
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>Максимум</Text>
          <Text style={styles.rangeValue}>{formatPrice(priceRange.max)}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSelectPrice(priceRange.suggested)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Использовать</Text>
        </TouchableOpacity>
      </View>

      {/* Expanded Info */}
      {expanded && (
        <View style={styles.expandedContainer}>
          {/* Confidence */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Уверенность:</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {confidenceText}
              </Text>
            </View>
          </View>

          {/* Market Trend */}
          {priceRange.marketTrend && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Тренд рынка:</Text>
              <Text style={styles.infoValue}>
                {trendIcon} {trendText}
              </Text>
            </View>
          )}

          {/* Based On */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>На основе:</Text>
            <Text style={styles.infoValue}>
              {priceRange.basedOn} похожих объявлений
            </Text>
          </View>

          {/* Explanation */}
          {priceRange.explanation && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationText}>{priceRange.explanation}</Text>
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Советы:</Text>
            <Text style={styles.tipText}>
              • Цена в верхнем диапазоне подходит для отличного состояния
            </Text>
            <Text style={styles.tipText}>
              • Средняя цена обычно привлекает больше покупателей
            </Text>
            <Text style={styles.tipText}>
              • Можно немного завысить для торга
            </Text>
          </View>
        </View>
      )}

      {/* Warning for low confidence */}
      {priceRange.confidence === 'low' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Недостаточно данных для точной оценки. Рекомендуем изучить похожие объявления.
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ultra.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: ultra.border,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: ultra.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ultra.textPrimary,
  },
  expandButton: {
    fontSize: 14,
    color: ultra.accent,
    fontWeight: '600',
  },
  suggestedPriceContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: ultra.accent + '10',
    borderRadius: 12,
    marginBottom: 16,
  },
  suggestedLabel: {
    fontSize: 13,
    color: ultra.textSecondary,
    marginBottom: 4,
  },
  suggestedPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: ultra.accent,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  rangeDivider: {
    width: 1,
    height: 40,
    backgroundColor: ultra.border,
    marginHorizontal: 16,
  },
  rangeLabel: {
    fontSize: 12,
    color: ultra.textSecondary,
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: ultra.textPrimary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: ultra.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expandedContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ultra.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: ultra.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textPrimary,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  explanationContainer: {
    backgroundColor: ultra.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  explanationText: {
    fontSize: 13,
    color: ultra.textSecondary,
    lineHeight: 18,
  },
  tipsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: ultra.info + '10',
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textPrimary,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: ultra.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  warningContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: ultra.warning + '10',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: ultra.warning,
    lineHeight: 16,
  },
});
