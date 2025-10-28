// components/AIAnalysis/AIAnalysisExample.tsx
import { analyzeCarVideo, quickIdentifyCar, validateVideoQuality } from '@/services/ai';
import { Car } from '@/types';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AIStatusCard from './AIStatusCard';

interface AIAnalysisExampleProps {
  videoUri?: string;
  imageUri?: string;
}

export default function AIAnalysisExample({ videoUri, imageUri }: AIAnalysisExampleProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<Partial<Car> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAIReady, setIsAIReady] = useState(false);

  const handleVideoAnalysis = async () => {
    if (!videoUri) {
      Alert.alert('Ошибка', 'Не выбран файл видео');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Сначала проверяем качество видео
      const validation = await validateVideoQuality(videoUri);
      if (!validation.isValid) {
        Alert.alert(
          'Проблемы с видео',
          `Проблемы: ${validation.issues.join(', ')}\n\nРекомендации: ${validation.suggestions.join(', ')}`
        );
      }

      // Запускаем анализ
      const carData = await analyzeCarVideo(videoUri, (step, progressValue) => {
        setCurrentStep(step);
        setProgress(progressValue);
      });

      setResult(carData);
      Alert.alert('Успех', 'Анализ автомобиля завершен!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      Alert.alert('Ошибка анализа', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickIdentify = async () => {
    if (!imageUri) {
      Alert.alert('Ошибка', 'Не выбрано изображение');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const carInfo = await quickIdentifyCar(imageUri);
      Alert.alert(
        'Результат идентификации',
        `Марка: ${carInfo.brand}\nМодель: ${carInfo.model}\nГод: ${carInfo.year}\nЦвет: ${carInfo.color}\nУверенность: ${(carInfo.confidence * 100).toFixed(1)}%`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      Alert.alert('Ошибка идентификации', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderProgress = () => {
    if (!isAnalyzing) return null;

    return (
      <View style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 10, margin: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Анализ в процессе...
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 10, color: '#666' }}>
          {currentStep}
        </Text>
        <View style={{ 
          height: 8, 
          backgroundColor: '#e0e0e0', 
          borderRadius: 4, 
          overflow: 'hidden',
          marginBottom: 10 
        }}>
          <View style={{ 
            height: '100%', 
            backgroundColor: '#4CAF50', 
            width: `${progress}%`,
            borderRadius: 4 
          }} />
        </View>
        <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
          {progress.toFixed(0)}%
        </Text>
        <ActivityIndicator size="small" color="#4CAF50" style={{ marginTop: 10 }} />
      </View>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <View style={{ padding: 20, backgroundColor: '#e8f5e8', borderRadius: 10, margin: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2e7d32' }}>
          Результат анализа
        </Text>
        
        <Text style={{ fontSize: 16, marginBottom: 5 }}>
          <Text style={{ fontWeight: 'bold' }}>Автомобиль:</Text> {result.brand} {result.model}
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>
          <Text style={{ fontWeight: 'bold' }}>Год:</Text> {result.year}
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>
          <Text style={{ fontWeight: 'bold' }}>Пробег:</Text> {result.mileage?.toLocaleString()} км
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>
          <Text style={{ fontWeight: 'bold' }}>Локация:</Text> {result.location}
        </Text>

        {result.aiAnalysis && (
          <>
            <Text style={{ fontSize: 16, marginBottom: 5, marginTop: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>Состояние:</Text> {result.aiAnalysis.condition} ({result.aiAnalysis.conditionScore}/100)
            </Text>
            
            <Text style={{ fontSize: 16, marginBottom: 5 }}>
              <Text style={{ fontWeight: 'bold' }}>Цена:</Text> {result.aiAnalysis?.estimatedPrice?.min?.toLocaleString() || '0'} - {result.aiAnalysis?.estimatedPrice?.max?.toLocaleString() || '0'} сом
            </Text>

            {result.aiAnalysis?.damages && result.aiAnalysis.damages.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
                  Обнаруженные повреждения:
                </Text>
                {result.aiAnalysis.damages.map((damage, index) => (
                  <Text key={index} style={{ fontSize: 14, marginLeft: 10, marginBottom: 2 }}>
                    • {damage.type} ({damage.severity}) - {damage.location} ({damage.confidence.toFixed(2)})
                  </Text>
                ))}
              </View>
            )}

            {result.aiAnalysis?.features && result.aiAnalysis.features.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
                  Обнаруженные особенности:
                </Text>
                {result.aiAnalysis.features.map((feature, index) => (
                  <Text key={index} style={{ fontSize: 14, marginLeft: 10, marginBottom: 2 }}>
                    • {feature}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <View style={{ padding: 20, backgroundColor: '#ffebee', borderRadius: 10, margin: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#c62828' }}>
          Ошибка анализа
        </Text>
        <Text style={{ fontSize: 14, color: '#c62828' }}>
          {error}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        AI Анализ Автомобиля
      </Text>

      <AIStatusCard onStatusChange={setIsAIReady} />

      <TouchableOpacity
        style={{
          backgroundColor: '#2196F3',
          padding: 15,
          borderRadius: 10,
          marginBottom: 10,
          opacity: isAnalyzing ? 0.6 : 1,
        }}
        onPress={handleVideoAnalysis}
        disabled={isAnalyzing || !videoUri || !isAIReady}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
          {isAnalyzing ? 'Анализ...' : 'Анализ видео автомобиля'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#4CAF50',
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
          opacity: isAnalyzing ? 0.6 : 1,
        }}
        onPress={handleQuickIdentify}
        disabled={isAnalyzing || !imageUri || !isAIReady}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
          Быстрая идентификация по фото
        </Text>
      </TouchableOpacity>

      {renderProgress()}
      {renderResult()}
      {renderError()}

      <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
          Инструкции:
        </Text>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>
          1. Выберите видео или фото автомобиля
        </Text>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>
          2. Нажмите кнопку для запуска анализа
        </Text>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>
          3. Дождитесь завершения анализа
        </Text>
        <Text style={{ fontSize: 12 }}>
          4. Просмотрите результаты
        </Text>
      </View>
    </ScrollView>
  );
}
