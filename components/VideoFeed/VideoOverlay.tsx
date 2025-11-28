import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface VideoOverlayProps {
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  title?: string;
  price?: number;
  location?: string;
  city?: string;
}

/**
 * Format number for display (e.g., 1200 -> "1.2K", 1500000 -> "1.5M")
 */
function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Format price for display
 */
function formatPrice(price: number | undefined): string {
  if (!price || price === 0) return '—';
  return price.toLocaleString('ru-RU');
}

export const VideoOverlay = React.memo<VideoOverlayProps>(({ 
  onLike, 
  onComment, 
  onShare, 
  likes = 0, 
  comments = 0,
  isLiked = false,
  title,
  price,
  location,
  city,
}) => {
  const formattedLikes = useMemo(() => formatCount(likes), [likes]);
  const formattedComments = useMemo(() => formatCount(comments), [comments]);
  const formattedPrice = useMemo(() => formatPrice(price), [price]);
  
  const displayLocation = useMemo(() => {
    return city || location || 'Кыргызстан';
  }, [city, location]);

  const displayTitle = useMemo(() => {
    return title || 'Объявление';
  }, [title]);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Right side actions */}
      <View style={styles.rightActions} pointerEvents="box-none">
        <Pressable 
          style={styles.actionButton} 
          onPress={onLike}
          accessibilityLabel={isLiked ? 'Убрать лайк' : 'Лайкнуть'}
          accessibilityRole="button"
        >
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={Platform.select({ ios: 24, android: 26, default: 24 })} 
            color={isLiked ? ultra.accent : '#fff'} 
          />
          <Text style={styles.actionText}>{formattedLikes}</Text>
        </Pressable>
        
        <Pressable 
          style={styles.actionButton} 
          onPress={onComment}
          accessibilityLabel="Комментарии"
          accessibilityRole="button"
        >
          <Ionicons 
            name="chatbubble-outline" 
            size={Platform.select({ ios: 24, android: 26, default: 24 })} 
            color="#fff" 
          />
          <Text style={styles.actionText}>{formattedComments}</Text>
        </Pressable>
        
        <Pressable 
          style={styles.actionButton} 
          onPress={onShare}
          accessibilityLabel="Поделиться"
          accessibilityRole="button"
        >
          <Ionicons 
            name="share-outline" 
            size={Platform.select({ ios: 24, android: 26, default: 24 })} 
            color="#fff" 
          />
        </Pressable>
      </View>
      
      {/* Bottom info */}
      <View style={styles.bottomInfo} pointerEvents="box-none">
        <Text style={styles.carTitle} numberOfLines={1} ellipsizeMode="tail">
          {displayTitle}
        </Text>
        <Text style={styles.carPrice}>
          {formattedPrice} {price ? 'сом' : ''}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons 
            name="location" 
            size={Platform.select({ ios: 14, android: 13, default: 14 })} 
            color={ultra.textSecondary} 
          />
          <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
            {displayLocation}
          </Text>
        </View>
      </View>
    </View>
  );
});

VideoOverlay.displayName = 'VideoOverlay';

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
    marginBottom: Platform.select({ ios: 20, android: 22, default: 20 }),
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  bottomInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    maxWidth: '85%',
  },
  carTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  carPrice: {
    color: ultra.accent,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: ultra.textSecondary,
    fontSize: 14,
    flex: 1,
  },
});
