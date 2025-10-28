// components/AIAnalysis/AIStatusCard.tsx
import { getAIStatus, getSetupRecommendations, initializeAIService } from '@/utils/aiConfig';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AIStatusCardProps {
  onStatusChange?: (isReady: boolean) => void;
}

export default function AIStatusCard({ onStatusChange }: AIStatusCardProps) {
  const [status, setStatus] = useState(getAIStatus());
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  const updateStatus = useCallback(async () => {
    setChecking(true);
    try {
      const newStatus = await Promise.resolve(getAIStatus());
      const newRecommendations = await Promise.resolve(getSetupRecommendations());
      
      setStatus(newStatus);
      setRecommendations(newRecommendations);
      onStatusChange?.(newStatus.readyForProduction);
    } catch (error) {
      console.error('Failed to update AI status:', error);
      Alert.alert('Ошибка', 'Не удалось получить статус AI сервиса.');
    } finally {
      setChecking(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

  const handleInitialize = async () => {
    setChecking(true);
    try {
      const success = await Promise.resolve(initializeAIService());
      if (success) {
        await updateStatus();
        Alert.alert('Успех', 'AI сервис инициализирован');
      } else {
        Alert.alert('Ошибка', 'Не удалось инициализировать AI сервис. Проверьте конфигурацию.');
      }
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      Alert.alert('Ошибка', 'Возникла непредвиденная ошибка при инициализации AI сервиса.');
    } finally {
      setChecking(false);
    }
  };

  const handleShowRecommendations = () => {
    if (recommendations.length > 0) {
      Alert.alert(
        'Рекомендации по настройке',
        recommendations.join('\n\n'),
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = () => {
    if (status.readyForProduction) return '#4CAF50';
    if (status.isProduction) return '#FF9800';
    return '#2196F3';
  };

  const getStatusText = () => {
    if (status.readyForProduction) return 'Готов к продакшену';
    if (status.isProduction) return 'Продакшн (неполная настройка)';
    return 'Режим разработки';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 Статус AI Сервиса</Text>
      
      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Конфигурация:</Text>
        
        <View style={styles.providerRow}>
          <Text style={styles.providerLabel}>OpenAI GPT-4:</Text>
          <Text style={[styles.providerStatus, { color: status.hasOpenAI ? '#4CAF50' : '#F44336' }]}>
            {status.hasOpenAI ? '✅' : '❌'}
          </Text>
        </View>

        <View style={styles.providerRow}>
          <Text style={styles.providerLabel}>Claude (Anthropic):</Text>
          <Text style={[styles.providerStatus, { color: status.hasClaude ? '#4CAF50' : '#F44336' }]}>
            {status.hasClaude ? '✅' : '❌'}
          </Text>
        </View>

        <View style={styles.providerRow}>
          <Text style={styles.providerLabel}>Google Vision:</Text>
          <Text style={[styles.providerStatus, { color: status.hasGoogleVision ? '#4CAF50' : '#F44336' }]}>
            {status.hasGoogleVision ? '✅' : '❌'}
          </Text>
        </View>

        <View style={styles.providerRow}>
          <Text style={styles.providerLabel}>Roboflow:</Text>
          <Text style={[styles.providerStatus, { color: status.hasRoboflow ? '#4CAF50' : '#FF9800' }]}>
            {status.hasRoboflow ? '✅' : '⚠️'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, checking && styles.buttonDisabled]}
          onPress={handleInitialize}
          disabled={checking}
        >
          <Text style={styles.buttonText}>
            {checking ? 'Проверка...' : 'Проверить конфигурацию'}
          </Text>
        </TouchableOpacity>

        {recommendations.length > 0 && (
          <TouchableOpacity style={styles.recommendationsButton} onPress={handleShowRecommendations}>
            <Text style={styles.recommendationsButtonText}>
              Показать рекомендации ({recommendations.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Режим: {status.mode}
        </Text>
        <Text style={styles.infoText}>
          Готовность: {status.readyForProduction ? '100%' : 'Частичная'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    margin: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerLabel: {
    fontSize: 14,
    color: '#666',
  },
  providerStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recommendationsButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  recommendationsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});
