import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VideoOverlayProps {
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  likes?: number;
  comments?: number;
}

export function VideoOverlay({ 
  onLike, 
  onComment, 
  onShare, 
  likes = 0, 
  comments = 0 
}: VideoOverlayProps) {
  return (
    <View style={styles.overlay}>
      {/* Right side actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Ionicons name="heart" size={24} color="#fff" />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble" size={24} color="#fff" />
          <Text style={styles.actionText}>{comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.carTitle}>BMW M3 Competition</Text>
        <Text style={styles.carPrice}>$75,000</Text>
        <Text style={styles.location}>📍 Los Angeles, CA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  rightActions: {
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  bottomInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  carTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  carPrice: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  location: {
    color: '#ccc',
    fontSize: 14,
  },
});
