// components/common/SkeletonLoader.tsx
// Skeleton loader с анимацией для loading states

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@/utils/constants';

interface SkeletonLoaderProps {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  style?: any;
  count?: number;
}

export function SkeletonLoader({
  height = 200,
  width = '100%',
  borderRadius = 12,
  style,
  count = 1,
}: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = () => (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          width,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );

  if (count === 1) {
    return <SkeletonItem />;
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
}

// Skeleton для видео карточки (full screen)
export function VideoCardSkeleton() {
  return (
    <View style={styles.videoCardSkeleton}>
      <SkeletonLoader
        height={SCREEN_HEIGHT}
        width={SCREEN_WIDTH}
        borderRadius={0}
        style={styles.videoSkeleton}
      />
      {/* Bottom info area */}
      <View style={styles.bottomInfo}>
        <SkeletonLoader height={24} width="70%" borderRadius={8} style={styles.textSkeleton} />
        <SkeletonLoader height={32} width="50%" borderRadius={8} style={styles.textSkeleton} />
        <SkeletonLoader height={16} width="40%" borderRadius={8} style={styles.textSkeleton} />
      </View>
      {/* Right actions */}
      <View style={styles.rightActions}>
        <SkeletonLoader height={56} width={56} borderRadius={28} style={styles.actionSkeleton} />
        <SkeletonLoader height={56} width={56} borderRadius={28} style={styles.actionSkeleton} />
        <SkeletonLoader height={56} width={56} borderRadius={28} style={styles.actionSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#1C1C1E',
  },
  container: {
    gap: 12,
  },
  videoCardSkeleton: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  videoSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
    gap: 8,
  },
  textSkeleton: {
    marginBottom: 4,
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 140,
    gap: 24,
  },
  actionSkeleton: {
    marginBottom: 8,
  },
});

