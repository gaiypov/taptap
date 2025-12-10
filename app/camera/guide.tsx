// app/camera/guide.tsx
import RecordingGuide from '@/components/Upload/RecordingGuide';
import { ultra } from '@/lib/theme/ultra';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function GuideScreen() {
  const router = useRouter();
  const { category = 'auto' } = useLocalSearchParams<{ category?: 'auto' | 'horse' | 'real_estate' | 'car' }>();
  
  // Нормализуем категорию: 'car' -> 'auto' для RecordingGuide
  const normalizedCategory = category === 'car' ? 'auto' : category;
  const categoryType = normalizedCategory as 'auto' | 'horse' | 'real_estate';
  
  // Для camera/record используем оригинальную категорию
  const recordCategory = category === 'auto' ? 'car' : category;

  const handleStart = () => {
    router.push({
      pathname: '/camera/record',
      params: { category: recordCategory },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <RecordingGuide
        category={categoryType}
        onStart={handleStart}
        onBack={handleBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ultra.background,
  },
});

