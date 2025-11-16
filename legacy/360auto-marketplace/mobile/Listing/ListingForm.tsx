'use client';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ListingFormProps {
  category: 'car' | 'horse';
  videoUri: string;
  onBack: () => void;
}

const categoryConfig = {
  car: {
    icon: '🚗',
    name: 'Автомобиль',
    fields: [
      { key: 'brand', label: 'Марка', placeholder: 'Toyota, BMW, Mercedes...' },
      { key: 'model', label: 'Модель', placeholder: 'Camry, X5, E-Class...' },
      { key: 'year', label: 'Год', placeholder: '2020', keyboardType: 'numeric' },
      { key: 'mileage', label: 'Пробег (км)', placeholder: '50000', keyboardType: 'numeric' },
      { key: 'price', label: 'Цена (₽)', placeholder: '1500000', keyboardType: 'numeric' },
      { key: 'description', label: 'Описание', placeholder: 'Расскажите о вашем авто...', multiline: true },
    ],
    gradientColors: ['#3B82F6', '#2563EB'],
  },
  horse: {
    icon: '🐴',
    name: 'Лошадь',
    fields: [
      { key: 'breed', label: 'Порода', placeholder: 'Арабская, Орловская...' },
      { key: 'age', label: 'Возраст (лет)', placeholder: '5', keyboardType: 'numeric' },
      { key: 'gender', label: 'Пол', placeholder: 'Жеребец, Кобыла, Мерин' },
      { key: 'height', label: 'Рост (см)', placeholder: '165', keyboardType: 'numeric' },
      { key: 'price', label: 'Цена (₽)', placeholder: '500000', keyboardType: 'numeric' },
      { key: 'description', label: 'Описание', placeholder: 'Расскажите о вашей лошади...', multiline: true },
    ],
    gradientColors: ['#D97706', '#B45309'],
  },
};

export default function ListingForm({ category, videoUri, onBack }: ListingFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const config = categoryConfig[category];

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = config.fields.filter(field => field.key !== 'description');
    const missingFields = requiredFields.filter(field => !formData[field.key]);
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Заполните все поля',
        `Необходимо заполнить: ${missingFields.map(f => f.label).join(', ')}`
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically upload the video and create the listing
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Объявление создано!',
        'Ваше объявление успешно опубликовано и будет показано в ленте.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home or show success screen
              console.log('Listing created successfully');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Ошибка', 'Не удалось создать объявление. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const requiredFields = config.fields.filter(field => field.key !== 'description');
    return requiredFields.every(field => formData[field.key]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#999" />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerEmoji}>{config.icon}</Text>
          <Text style={styles.headerText}>Создать объявление</Text>
        </View>
      </View>

      {/* Form */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Video preview */}
        <View style={styles.videoPreview}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam" size={48} color="#666" />
            <Text style={styles.videoText}>Видео записано</Text>
            <Text style={styles.videoDuration}>60 сек</Text>
          </View>
        </View>

        {/* Form fields */}
        <View style={styles.formContainer}>
          {config.fields.map((field) => (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  field.multiline && styles.fieldInputMultiline
                ]}
                placeholder={field.placeholder}
                placeholderTextColor="#666"
                value={formData[field.key] || ''}
                onChangeText={(value) => handleInputChange(field.key, value)}
                keyboardType={field.keyboardType as any || 'default'}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 4 : 1}
              />
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Советы для лучшего объявления:</Text>
          <Text style={styles.tipText}>• Укажите точную цену</Text>
          <Text style={styles.tipText}>• Добавьте подробное описание</Text>
          <Text style={styles.tipText}>• Будьте честны в характеристиках</Text>
          <Text style={styles.tipText}>• Отвечайте на сообщения быстро</Text>
        </View>
      </ScrollView>

      {/* Submit button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isFormValid() ? config.gradientColors as any : ['#666', '#555']}
            style={[
              styles.submitButton,
              (!isFormValid() || isSubmitting) && styles.submitButtonDisabled
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Создаем объявление...</Text>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Опубликовать объявление</Text>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  videoPreview: {
    marginVertical: 20,
    alignItems: 'center',
  },
  videoPlaceholder: {
    width: 200,
    height: 120,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  videoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  videoDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  formContainer: {
    gap: 20,
    marginBottom: 24,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  fieldInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  fieldInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  tipsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 40,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
