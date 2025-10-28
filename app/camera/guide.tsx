// app/camera/guide.tsx
import RecordingGuide from '@/components/Upload/RecordingGuide';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function GuideScreen() {
  const router = useRouter();
  const { category = 'car' } = useLocalSearchParams<{ category?: 'car' | 'horse' }>();

  const handleStart = () => {
    router.push(`/camera/record?category=${category}` as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <RecordingGuide
        category={category}
        onStart={handleStart}
        onBack={handleBack}
      />
    </View>
  );
}

