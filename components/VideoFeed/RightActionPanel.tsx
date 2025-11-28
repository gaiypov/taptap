// components/VideoFeed/RightActionPanel.tsx
// TikTok-style правая панель действий — Premium Animations
// Revolut Ultra стиль с Moti + Reanimated 3

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { SIZES } from '@/lib/constants/sizes';
import { ultra } from '@/lib/theme/ultra';
import { Icons } from '@/components/icons/CustomIcons';
import type { RightActionPanelProps } from './videoFeed.types';
import { SPRING_CONFIGS } from '@/components/animations/PremiumAnimations';

// ==============================================
// PREMIUM SPRING CONFIGS
// ==============================================

const SPRING_CONFIG = SPRING_CONFIGS.snappy;
const BOUNCE_CONFIG = SPRING_CONFIGS.bouncy;

// ==============================================
// ACTION BUTTON COMPONENT
// ==============================================

interface ActionButtonProps {
  icon: React.ReactNode;
  count?: number;
  isActive?: boolean;
  activeColor?: string;
  onPress: () => void;
  hapticType?: 'light' | 'medium' | 'heavy';
}

const ActionButton: React.FC<ActionButtonProps> = React.memo(({
  icon,
  count,
  isActive = false,
  activeColor = ultra.accent,
  onPress,
  hapticType = 'light',
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // ⚡ Premium press-in: scale + glow
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, SPRING_CONFIG);
    glowOpacity.value = withTiming(0.4, { duration: 100 });
  }, []);

  // ⚡ Premium press-out: bounce back
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
    glowOpacity.value = withTiming(0, { duration: 200 });
  }, []);

  // ⚡ Premium press: signature bounce + haptic
  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.25, BOUNCE_CONFIG),  // Big bounce
      withSpring(0.95, SPRING_CONFIG),  // Slight undershoot
      withSpring(1, SPRING_CONFIG)      // Settle
    );
    
    // Haptic for both platforms
    const style = hapticType === 'heavy' 
      ? Haptics.ImpactFeedbackStyle.Heavy
      : hapticType === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style);
    
    onPress();
  }, [hapticType, onPress]);

  // ⚡ Premium animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: isActive ? 0.5 : glowOpacity.value,
  }));

  // Format count (1000 -> 1K)
  const formattedCount = useMemo(() => {
    if (count === undefined || count === null) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }, [count]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.buttonContainer}
    >
      {/* VisionOS Glass Effect - круглые стеклянные кнопки */}
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <BlurView
          intensity={30}
          tint="dark"
          style={StyleSheet.absoluteFill}
        >
          <View style={[
            styles.glassButton,
            isActive && styles.glassButtonActive,
            isActive && { borderColor: activeColor },
          ]}>
            {icon}
          </View>
        </BlurView>
      </Animated.View>
      
      {/* Count with premium styling */}
      {formattedCount !== null && (
        <Text style={[
          styles.countText,
          isActive && { color: activeColor, fontWeight: '700' },
        ]}>
          {formattedCount}
        </Text>
      )}
    </Pressable>
  );
});

// ==============================================
// MAIN COMPONENT
// ==============================================

export const RightActionPanel: React.FC<RightActionPanelProps> = React.memo(({
    listingId,
    isActive,
    isLiked,
    isFavorited,
    isSaved,
    isMuted,
    likeCount,
    commentCount,
    actions,
  }) => {
  // Icon colors
  const likeColor = isLiked ? '#FF2D55' : ultra.textPrimary; // Red for liked
  const saveColor = isFavorited || isSaved ? '#FFD700' : ultra.textPrimary; // Gold for saved

  return (
    <View style={styles.container}>
      {/* 1. Share */}
      <ActionButton
        icon={<Icons.Share size={SIZES.actionPanel.iconSize} color={ultra.textPrimary} />}
        onPress={() => actions.onShare(listingId)}
        hapticType="light"
      />

      {/* 2. Message */}
      <ActionButton
        icon={<Icons.Message size={SIZES.actionPanel.iconSize} color={ultra.textPrimary} />}
        onPress={() => actions.onOpenChat(listingId)}
        hapticType="light"
      />

      {/* 3. Like */}
      <ActionButton
        icon={<Icons.Heart size={SIZES.actionPanel.iconSize} color={likeColor} filled={isLiked} />}
        count={likeCount}
        isActive={isLiked}
        activeColor="#FF2D55"
        onPress={() => actions.onLike(listingId)}
        hapticType="medium"
      />

      {/* 4. Comment */}
      <ActionButton
        icon={<Icons.Comment size={SIZES.actionPanel.iconSize} color={ultra.textPrimary} />}
        count={commentCount}
        onPress={() => actions.onComment(listingId)}
        hapticType="light"
      />

      {/* 5. Save/Bookmark */}
      <ActionButton
        icon={<Icons.Bookmark size={SIZES.actionPanel.iconSize} color={saveColor} filled={isFavorited || isSaved} />}
        isActive={isFavorited || isSaved}
        activeColor="#FFD700"
        onPress={() => actions.onSave(listingId)}
        hapticType="medium"
      />

      {/* 6. Mute */}
      <ActionButton
        icon={<Icons.Volume size={SIZES.actionPanel.iconSize} color={ultra.textPrimary} muted={isMuted} />}
        onPress={() => actions.onToggleMute(listingId)}
        hapticType="light"
      />
    </View>
  );
}, (prevProps, nextProps) => {
    // Memoization: only re-render if props change
    return (
      prevProps.listingId === nextProps.listingId &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.isLiked === nextProps.isLiked &&
      prevProps.isFavorited === nextProps.isFavorited &&
      prevProps.isSaved === nextProps.isSaved &&
      prevProps.isMuted === nextProps.isMuted &&
      prevProps.likeCount === nextProps.likeCount &&
      prevProps.commentCount === nextProps.commentCount
    );
});

RightActionPanel.displayName = 'RightActionPanel';

// ==============================================
// STYLES
// ==============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: SIZES.actionPanel.rightOffset,
    bottom: SIZES.actionPanel.bottomOffset,
    alignItems: 'center',
    gap: SIZES.actionPanel.gap,
  },
  buttonContainer: {
    alignItems: 'center',
    width: SIZES.actionPanel.containerSize,
    position: 'relative',
  },
  iconContainer: {
    width: SIZES.actionPanel.containerSize,
    height: SIZES.actionPanel.containerSize,
    borderRadius: SIZES.actionPanel.containerSize / 2,
    overflow: 'hidden',
  },
  // VisionOS Glass Style - одинаковые круглые стеклянные кнопки
  glassButton: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.actionPanel.containerSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Полупрозрачный белый
    borderWidth: 0.5,
    borderColor: 'rgba(229, 228, 226, 0.2)', // Тонкая платиновая граница
  },
  glassButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
  countText: {
    fontSize: SIZES.actionPanel.countFontSize,
    fontWeight: '600',
    color: ultra.textPrimary,
    marginTop: SIZES.actionPanel.countMarginTop,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default RightActionPanel;
