// app/components/AdditionalPhotos.tsx — ГАЛЕРЕЯ УРОВНЯ DUBAI + БИШКЕК 2025

import { ultra } from '@/lib/theme/ultra';

import { Ionicons } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import React, { useState } from 'react';

import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Animated, { FadeIn } from 'react-native-reanimated';

import ImageView from 'react-native-image-viewing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdditionalPhotosProps {
  photos: string[];
}

export default function AdditionalPhotos({ photos }: AdditionalPhotosProps) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const openGallery = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIndex(i);
    setVisible(true);
  };

  const images = photos.map(uri => ({ uri }));

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <Text style={styles.title}>Дополнительные фото</Text>
      <View style={styles.grid}>
        {photos.map((photo, i) => (
          <TouchableOpacity
            key={i}
            style={styles.thumbWrapper}
            onPress={() => openGallery(i)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: photo }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{i + 1}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Полноценная галерея с pinch-to-zoom */}
      <ImageView
        images={images}
        imageIndex={index}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        backgroundColor="rgba(0,0,0,0.95)"
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        HeaderComponent={({ imageIndex }) => (
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {imageIndex + 1} / {photos.length}
              </Text>
            </View>
          </View>
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: ultra.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: ultra.textPrimary,
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thumbWrapper: {
    width: (SCREEN_WIDTH - 40 - 24) / 3,
    height: (SCREEN_WIDTH - 40 - 24) / 3,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ultra.border,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  viewerHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  counterText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
