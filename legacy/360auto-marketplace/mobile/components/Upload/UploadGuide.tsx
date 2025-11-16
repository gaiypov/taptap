import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function UploadGuide() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>360° Video Upload Guide</Text>
      
      <View style={styles.step}>
        <View style={styles.stepIcon}>
          <Ionicons name="camera" size={24} color="#007AFF" />
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Record 360° Video</Text>
          <Text style={styles.stepDescription}>
            Use a 360° camera or smartphone with 360° capabilities
          </Text>
        </View>
      </View>
      
      <View style={styles.step}>
        <View style={styles.stepIcon}>
          <Ionicons name="cloud-upload" size={24} color="#007AFF" />
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Upload Video</Text>
          <Text style={styles.stepDescription}>
            Select your 360° video file and upload to our platform
          </Text>
        </View>
      </View>
      
      <View style={styles.step}>
        <View style={styles.stepIcon}>
          <Ionicons name="eye" size={24} color="#007AFF" />
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Preview & Share</Text>
          <Text style={styles.stepDescription}>
            Preview your video and share with the community
          </Text>
        </View>
      </View>
      
      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>💡 Tips for better 360° videos:</Text>
        <Text style={styles.tip}>• Keep the camera stable</Text>
        <Text style={styles.tip}>• Ensure good lighting</Text>
        <Text style={styles.tip}>• Keep videos under 2 minutes</Text>
        <Text style={styles.tip}>• Use high resolution when possible</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  tips: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  tip: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
});
