import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface FavoriteButtonProps {
  listingId: string;
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const sizeMap = {
  small: 24,
  medium: 32,
  large: 48,
};

export default function FavoriteButton({ 
  listingId, 
  isFavorite, 
  onToggle, 
  size = 'medium',
  color = '#FF3B30' 
}: FavoriteButtonProps) {
  const scale = useSharedValue(1);
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Animate button
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });

    setLocalIsFavorite(!localIsFavorite);
    onToggle();
  };

  const iconSize = sizeMap[size];

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.button, styles[size]]}
        activeOpacity={0.7}
      >
        <Ionicons
          name={localIsFavorite ? 'heart' : 'heart-outline'}
          size={iconSize}
          color={localIsFavorite ? color : '#fff'}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  small: {
    width: 40,
    height: 40,
  },
  medium: {
    width: 52,
    height: 52,
  },
  large: {
    width: 64,
    height: 64,
  },
});

