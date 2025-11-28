// components/CostLoggerTest.tsx
import { AI_CONFIG, checkAPIKeys, logAPICost, selectAvailableAI } from '@/services/ai/config';
import { TEST_CONFIG, canMakeRequest, incrementRequestCount, resetRequestCount } from '@/services/ai/testMode';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CostLoggerTest() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testCostLogging = () => {
    addLog('🧪 Testing AI Cost Logging...');
    
    // Тест Claude
    addLog('Testing Claude costs:');
    logAPICost('claude', 1);
    logAPICost('claude', 3);
    
    // Тест OpenAI
    addLog('Testing OpenAI costs:');
    logAPICost('openai', 1);
    logAPICost('openai', 3);
    
    // Тест Google
    addLog('Testing Google costs:');
    logAPICost('google', 1);
    logAPICost('google', 1000);
    
    // Тест Mock
    addLog('Testing Mock costs:');
    logAPICost('mock', 1);
  };

  const testRequestLimits = () => {
    addLog('📊 Testing Request Limits...');
    
    for (let i = 1; i <= 5; i++) {
      incrementRequestCount();
      addLog(`Request ${i}: Can make request = ${canMakeRequest()}`);
    }
  };

  const checkConfiguration = () => {
    addLog('🔧 AI Configuration:');
    addLog(`Mode: ${AI_CONFIG.MODE}`);
    addLog(`Use Mock: ${AI_CONFIG.USE_MOCK}`);
    addLog(`Primary Provider: ${AI_CONFIG.PRIMARY_PROVIDER}`);
    addLog(`Max Frames: ${AI_CONFIG.MAX_FRAMES_PER_ANALYSIS}`);
    addLog(`Image Quality: ${AI_CONFIG.IMAGE_QUALITY}`);
    
    addLog('🧪 Test Mode Configuration:');
    addLog(`Use Single Image: ${TEST_CONFIG.useSingleImage}`);
  };

  const handleCheckAPIKeys = async () => {
    addLog('🔑 API Keys Status:');
    const keys = await checkAPIKeys();
    addLog(`OpenAI: ${keys.hasOpenAI ? '✅' : '❌'}`);
    addLog(`Claude: ${keys.hasClaude ? '✅' : '❌'}`);
    addLog(`Google: ${keys.hasGoogle ? '✅' : '❌'}`);
    addLog(`Roboflow: ${keys.hasRoboflow ? '✅' : '❌'}`);
    
    const selectedAI = selectAvailableAI();
    addLog(`Selected AI: ${selectedAI}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const resetCounters = () => {
    resetRequestCount();
    addLog('🔄 Request counters reset');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 AI Cost Logger Test</Text>
      
      {/* Кнопки тестирования */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testCostLogging}>
          <Text style={styles.buttonText}>🧪 Test Cost Logging</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testRequestLimits}>
          <Text style={styles.buttonText}>📊 Test Request Limits</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={checkConfiguration}>
          <Text style={styles.buttonText}>🔧 Check Configuration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleCheckAPIKeys}>
          <Text style={styles.buttonText}>🔑 Check API Keys</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={resetCounters}>
          <Text style={styles.buttonText}>🔄 Reset Counters</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
          <Text style={styles.buttonText}>🗑️ Clear Logs</Text>
        </TouchableOpacity>
      </View>
      
      {/* Логи */}
      <ScrollView style={styles.logsContainer}>
        <Text style={styles.logsTitle}>📋 Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.emptyLogs}>No logs yet. Press a test button above.</Text>
        )}
      </ScrollView>
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
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  emptyLogs: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
