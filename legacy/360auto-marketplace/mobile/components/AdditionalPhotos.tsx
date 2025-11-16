// app/components/AdditionalPhotos.tsx
// Дополнительные фото для listings

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AdditionalPhotosProps {
  photos: string[];
}

export function AdditionalPhotos({ photos }: AdditionalPhotosProps) {
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const openFullscreen = (index: number) => {
    setPhotoIndex(index);
    setFullscreenPhoto(photos[index]);
  };

  const nextPhoto = () => {
    if (photoIndex < photos.length - 1) {
      setPhotoIndex(photoIndex + 1);
      setFullscreenPhoto(photos[photoIndex + 1]);
    }
  };

  const prevPhoto = () => {
    if (photoIndex > 0) {
      setPhotoIndex(photoIndex - 1);
      setFullscreenPhoto(photos[photoIndex - 1]);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Дополнительные фото</Text>
        <FlatList
          horizontal
          data={photos}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => openFullscreen(index)}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: item }}
                style={styles.photo}
                resizeMode="cover"
              />
              {/* Photo number badge */}
              <View style={styles.photoNumber}>
                <Text style={styles.photoNumberText}>{index + 1}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.scrollContent}
        />
      </View>

      {/* Fullscreen Modal */}
      <Modal
        visible={fullscreenPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPhoto(null)}
      >
        <View style={styles.fullscreenContainer}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullscreenPhoto(null)}
          >
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>

          {/* Photo counter */}
          <View style={styles.photoCounter}>
            <Text style={styles.photoCounterText}>
              {photoIndex + 1} / {photos.length}
            </Text>
          </View>

          {/* Photo with swipe controls */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: photoIndex * 100, y: 0 }}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / 100
              );
              setPhotoIndex(newIndex);
              setFullscreenPhoto(photos[newIndex]);
            }}
          >
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.fullscreenPhoto}
                resizeMode="contain"
              />
            ))}
          </ScrollView>

          {/* Navigation arrows */}
          {photoIndex > 0 && (
            <TouchableOpacity
              style={[styles.navArrow, styles.leftArrow]}
              onPress={prevPhoto}
            >
              <Ionicons name="chevron-back" size={40} color="#FFF" />
            </TouchableOpacity>
          )}

          {photoIndex < photos.length - 1 && (
            <TouchableOpacity
              style={[styles.navArrow, styles.rightArrow]}
              onPress={nextPhoto}
            >
              <Ionicons name="chevron-forward" size={40} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 20,
  },
  photoContainer: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
  },
  photoNumber: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  photoCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  photoCounterText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenPhoto: {
    width: 100,
    height: 100,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 8,
  },
  leftArrow: {
    left: 20,
  },
  rightArrow: {
    right: 20,
  },
});

