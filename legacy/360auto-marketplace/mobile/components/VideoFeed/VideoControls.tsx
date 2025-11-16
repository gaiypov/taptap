import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VideoControlsProps {
  onPlayPause?: () => void;
  onSeek?: (position: number) => void;
  isPlaying?: boolean;
  duration?: number;
  currentTime?: number;
}

export function VideoControls({ 
  onPlayPause, 
  onSeek, 
  isPlaying = false, 
  duration = 0, 
  currentTime = 0 
}: VideoControlsProps) {
  const [showControls, setShowControls] = useState(false);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.playButton}
        onPress={onPlayPause}
        onPressIn={() => setShowControls(true)}
        onPressOut={() => setShowControls(false)}
      >
        <Ionicons 
          name={isPlaying ? 'pause' : 'play'} 
          size={40} 
          color="#fff" 
        />
      </TouchableOpacity>
      
      {showControls && (
        <View style={styles.controlsOverlay}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    width: '30%', // This would be dynamic based on currentTime/duration
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
});