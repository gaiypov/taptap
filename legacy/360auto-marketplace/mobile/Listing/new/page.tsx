'use client';

import ListingForm from '@/components/Listing/ListingForm';
import CameraCapture from '@/components/Upload/CameraCapture';
import RecordingGuide from '@/components/Upload/RecordingGuide';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Step = 'guide' | 'camera' | 'form';

export default function NewListingPage() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  
  const [step, setStep] = useState<Step>('guide');
  const [videoUri, setVideoUri] = useState<string | null>(null);

  // Если нет категории, редирект на главную
  if (!category || !['car', 'horse'].includes(category)) {
    router.push('/(tabs)');
    return null;
  }

  const categoryType = category as 'car' | 'horse';

  return (
    <View style={styles.container}>
      {step === 'guide' && (
        <RecordingGuide
          category={categoryType}
          onStart={() => setStep('camera')}
          onBack={() => router.back()}
        />
      )}

      {step === 'camera' && (
        <CameraCapture
          category={categoryType}
          onComplete={(uri) => {
            setVideoUri(uri);
            setStep('form');
          }}
          onBack={() => setStep('guide')}
        />
      )}

      {step === 'form' && videoUri && (
        <ListingForm
          category={categoryType}
          videoUri={videoUri}
          onBack={() => setStep('camera')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
