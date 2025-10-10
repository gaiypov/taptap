import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { VideoControls } from '../../components/VideoFeed/VideoControls';
import { VideoOverlay } from '../../components/VideoFeed/VideoOverlay';
import { VideoPlayer } from '../../components/VideoFeed/VideoPlayer';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>360° Auto Feed</Text>
        
        {/* Video Feed will be implemented here */}
        <View style={styles.videoContainer}>
          <VideoPlayer />
          <VideoOverlay />
          <VideoControls />
        </View>
        
        <Text style={styles.subtitle}>Discover amazing cars in 360°</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  videoContainer: {
    height: 300,
    backgroundColor: '#333',
    margin: 20,
    borderRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
  },
});