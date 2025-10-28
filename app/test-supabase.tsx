// app/test-supabase.tsx
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../services/supabase';

export default function TestSupabase() {
  const [status, setStatus] = useState<string>('Testing...');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const tests = [];
    
    try {
      // Тест 1: Получение машин
      setStatus('Testing database connection...');
      const { data: cars, error } = await db.getCars({ limit: 5 });
      
      tests.push({
        name: 'Database Connection',
        success: !error,
        message: error ? error.message : `Found ${cars?.length || 0} cars`,
      });
      
      // Тест 2: Создание тестового пользователя
      setStatus('Testing user creation...');
      const { data: user, error: userError } = await db.createUser({
        phone: `+996${Math.floor(Math.random() * 1000000000)}`,
        name: 'Test User',
      });
      
      tests.push({
        name: 'User Creation',
        success: !userError,
        message: userError ? userError.message : `User ID: ${user?.id}`,
      });
      
      setResults(tests);
      setStatus('Tests completed!');
    } catch (error: any) {
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      <Text style={styles.status}>{status}</Text>
      
      {results.map((test, index) => (
        <View
          key={index}
          style={[
            styles.testResult,
            { backgroundColor: test.success ? '#10b981' : '#ef4444' },
          ]}
        >
          <Text style={styles.testName}>
            {test.success ? '✅' : '❌'} {test.name}
          </Text>
          <Text style={styles.testMessage}>{test.message}</Text>
        </View>
      ))}
      
      <TouchableOpacity style={styles.button} onPress={testConnection}>
        <Text style={styles.buttonText}>Run Tests Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 20,
  },
  testResult: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  testMessage: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
