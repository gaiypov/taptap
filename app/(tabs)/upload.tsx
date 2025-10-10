import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CameraView } from '../../components/Upload/CameraView';
import { UploadGuide } from '../../components/Upload/UploadGuide';

export default function UploadScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload 360° Video</Text>
      
      <CameraView />
      <UploadGuide />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
});
