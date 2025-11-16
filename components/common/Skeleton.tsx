import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Thumbnail */}
      <Skeleton width="100%" height={200} borderRadius={12} />
      
      {/* Content */}
      <View style={styles.cardContent}>
        {/* Title */}
        <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
        
        {/* Price */}
        <Skeleton width="40%" height={20} style={{ marginBottom: 12 }} />
        
        {/* Details */}
        <View style={styles.detailsRow}>
          <Skeleton width={80} height={16} />
          <Skeleton width={80} height={16} />
          <Skeleton width={80} height={16} />
        </View>
        
        {/* Location */}
        <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

interface SkeletonVideoProps {
  count?: number;
}

export const SkeletonVideo: React.FC<SkeletonVideoProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.videoContainer}>
          {/* Video player skeleton */}
          <Skeleton width="100%" height="100%" />
          
          {/* Overlay content */}
          <View style={styles.videoOverlay}>
            {/* Right side actions */}
            <View style={styles.actionsContainer}>
              <View style={styles.actionItem}>
                <Skeleton width={48} height={48} borderRadius={24} />
                <Skeleton width={32} height={14} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.actionItem}>
                <Skeleton width={48} height={48} borderRadius={24} />
                <Skeleton width={32} height={14} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.actionItem}>
                <Skeleton width={48} height={48} borderRadius={24} />
                <Skeleton width={32} height={14} style={{ marginTop: 4 }} />
              </View>
            </View>
            
            {/* Bottom info */}
            <View style={styles.bottomInfo}>
              {/* User */}
              <View style={styles.userInfo}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ marginLeft: 12 }}>
                  <Skeleton width={120} height={18} />
                  <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
                </View>
              </View>
              
              {/* Description */}
              <Skeleton width="90%" height={16} style={{ marginTop: 12 }} />
              <Skeleton width="70%" height={16} style={{ marginTop: 6 }} />
              
              {/* Tags */}
              <View style={styles.tagsRow}>
                <Skeleton width={60} height={24} borderRadius={12} />
                <Skeleton width={80} height={24} borderRadius={12} />
                <Skeleton width={70} height={24} borderRadius={12} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </>
  );
};

interface SkeletonListProps {
  itemCount?: number;
  itemStyle?: ViewStyle;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ 
  itemCount = 5,
  itemStyle,
}) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={[styles.listItem, itemStyle]}>
          <Skeleton width={60} height={60} borderRadius={8} />
          <View style={styles.listItemContent}>
            <Skeleton width="70%" height={18} />
            <Skeleton width="50%" height={14} style={{ marginTop: 6 }} />
            <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
};

interface SkeletonProfileProps {
  style?: ViewStyle;
}

export const SkeletonProfile: React.FC<SkeletonProfileProps> = ({ style }) => {
  return (
    <View style={[styles.profile, style]}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <Skeleton width="100%" height={200} />
        
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Skeleton width={100} height={100} borderRadius={50} />
        </View>
      </View>
      
      {/* Info */}
      <View style={styles.profileInfo}>
        <Skeleton width={150} height={24} style={{ marginBottom: 8 }} />
        <Skeleton width={100} height={16} style={{ marginBottom: 16 }} />
        
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Skeleton width={40} height={24} />
            <Skeleton width={60} height={14} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.statItem}>
            <Skeleton width={40} height={24} />
            <Skeleton width={60} height={14} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.statItem}>
            <Skeleton width={40} height={24} />
            <Skeleton width={60} height={14} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>
      
      {/* Button */}
      <Skeleton width="90%" height={48} borderRadius={12} style={{ marginTop: 20 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#1a1a1a',
  },
  card: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
  },
  actionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 20,
  },
  actionItem: {
    alignItems: 'center',
  },
  bottomInfo: {
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  list: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  profile: {
    flex: 1,
  },
  profileHeader: {
    position: 'relative',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
    left: 20,
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 50,
  },
  profileInfo: {
    padding: 20,
    marginTop: 50,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
});

