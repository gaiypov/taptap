// components/AITestComponent.tsx
import { analyzeCarVideo, checkAPIKeys, quickIdentifyCar, selectAvailableAI } from '@/services/ai';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AITestComponent() {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [selectedAI, setSelectedAI] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    checkAPIConfiguration();
  }, []);

  const checkAPIConfiguration = () => {
    try {
      // Проверяем доступные ключи
      const keys = checkAPIKeys();
      console.log('🔑 Available API keys:', keys);
      
      // Выбираем AI провайдер
      const ai = selectAvailableAI();
      console.log('🤖 Selected AI:', ai);
      
      setApiStatus(keys);
      setSelectedAI(ai);
      
    } catch (error) {
      console.error('❌ Configuration check error:', error);
      Alert.alert('Ошибка конфигурации', 'Не удалось проверить API ключи');
    }
  };

  const testCarAnalysis = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting car analysis test...');
      
      const result = await analyzeCarVideo('test-video-uri', (stage, progress) => {
        console.log(`📈 ${stage}: ${progress}%`);
      });
      
      console.log('✅ Analysis result:', result);
      setTestResult(result);
      
      Alert.alert('Успех!', 'Анализ автомобиля выполнен успешно');
      
    } catch (error) {
      console.error('❌ Analysis test error:', error);
      Alert.alert('Ошибка анализа', 'Не удалось проанализировать автомобиль');
    } finally {
      setIsLoading(false);
    }
  };

  const testQuickIdentify = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Starting quick identify test...');
      
      const result = await quickIdentifyCar('test-image-uri');
      
      console.log('✅ Quick identify result:', result);
      setTestResult(result);
      
      Alert.alert('Успех!', 'Быстрая идентификация выполнена успешно');
      
    } catch (error) {
      console.error('❌ Quick identify test error:', error);
      Alert.alert('Ошибка идентификации', 'Не удалось идентифицировать автомобиль');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (hasKey: boolean) => hasKey ? '#4CAF50' : '#F44336';
  const getStatusText = (hasKey: boolean) => hasKey ? '✅ Доступен' : '❌ Недоступен';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 AI Service Test</Text>
      
      {/* Статус API ключей */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔑 API Keys Status</Text>
        {apiStatus && (
          <>
            <View style={styles.keyRow}>
              <Text style={styles.keyLabel}>OpenAI:</Text>
              <Text style={[styles.keyStatus, { color: getStatusColor(apiStatus.hasOpenAI) }]}>
                {getStatusText(apiStatus.hasOpenAI)}
              </Text>
            </View>
            <View style={styles.keyRow}>
              <Text style={styles.keyLabel}>Claude:</Text>
              <Text style={[styles.keyStatus, { color: getStatusColor(apiStatus.hasClaude) }]}>
                {getStatusText(apiStatus.hasClaude)}
              </Text>
            </View>
            <View style={styles.keyRow}>
              <Text style={styles.keyLabel}>Google:</Text>
              <Text style={[styles.keyStatus, { color: getStatusColor(apiStatus.hasGoogle) }]}>
                {getStatusText(apiStatus.hasGoogle)}
              </Text>
            </View>
            <View style={styles.keyRow}>
              <Text style={styles.keyLabel}>Roboflow:</Text>
              <Text style={[styles.keyStatus, { color: getStatusColor(apiStatus.hasRoboflow) }]}>
                {getStatusText(apiStatus.hasRoboflow)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Выбранный AI */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 Selected AI Provider</Text>
        <Text style={styles.selectedAI}>Selected: {selectedAI}</Text>
      </View>

      {/* Тестовые кнопки */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test Functions</Text>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testCarAnalysis}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Testing...' : '🚗 Test Car Analysis'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testQuickIdentify}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Testing...' : '🔍 Test Quick Identify'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={checkAPIConfiguration}
        >
          <Text style={styles.buttonText}>🔄 Refresh Status</Text>
        </TouchableOpacity>
      </View>

      {/* Результат теста */}
      {testResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Test Result</Text>
          <Text style={styles.resultText}>
            {JSON.stringify(testResult, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  keyLabel: {
    fontSize: 16,
    color: '#666',
  },
  keyStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedAI: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
});
