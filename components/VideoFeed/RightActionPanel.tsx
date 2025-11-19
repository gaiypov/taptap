import { ultra } from '@/lib/theme/ultra';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RightActionPanelProps } from './videoFeed.types';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDeviceProfile(fps?: number, stall?: number): 'high' | 'mid' | 'low' {
  if (typeof fps === 'number' && typeof stall === 'number') {
    if (fps > 50 && stall < 40) {
      return 'high';
    }
    if (fps < 35 || stall > 80) {
      return 'low';
    }
  }
  return 'mid';
}

const profileSettings = {
  high: { scale: 1.06, opacity: 1, translateY: 0, blur: 45, tension: 110, friction: 7, duration: 220 },
  mid: { scale: 1.03, opacity: 0.5, translateY: 40, blur: 30, tension: 130, friction: 6, duration: 180 },
  low: { scale: 1.0, opacity: 0.7, translateY: 70, blur: 10, tension: 150, friction: 5, duration: 120 },
};

// ============================================
// GLASS BUTTON COMPONENT
// ============================================

interface GlassButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isActiveState?: boolean;
  count?: number;
  customScale?: Animated.Value;
  countScale?: Animated.Value;
  isLowPerformance?: boolean;
  isHighProfile?: boolean;
}

const GlassButton: React.FC<GlassButtonProps> = React.memo(
  ({
    iconName,
    onPress,
    isActiveState = false,
    count,
    customScale,
    countScale,
    isLowPerformance: _isLowPerformance = false,
    isHighProfile = false,
  }) => {
    const pressScale = useRef(new Animated.Value(1)).current;
    const pressOpacity = useRef(new Animated.Value(1)).current;
    const hoverScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (isActiveState && isHighProfile) {
        Animated.spring(hoverScale, {
          toValue: 1.08,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(hoverScale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }, [isActiveState, isHighProfile, hoverScale]);

    const handlePressIn = () => {
      Animated.parallel([
        Animated.spring(pressScale, {
          toValue: 1.06,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(pressOpacity, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(pressScale, {
          toValue: 1,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(pressOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const scaleAnim = customScale || pressScale;
    const combinedScale = Animated.multiply(scaleAnim, hoverScale);

    // Revolut Ultra Platinum цвета
    const iconColor = isActiveState
      ? ultra.accent // #C0C0C0 серебро для активных
      : ultra.textPrimary; // #FFFFFF для неактивных

    const borderColor = isActiveState ? ultra.accent : ultra.border; // #2A2A2A

    const backgroundColor = ultra.card; // #171717 матовая карточка

    // Accessibility labels
    const getAccessibilityLabel = () => {
      if (iconName === 'heart' || iconName === 'heart-outline') {
        return `Лайкнуть. ${count || 0} лайков`;
      }
      if (iconName === 'chatbubble-outline') {
        return `Комментарии. ${count || 0} комментариев`;
      }
      if (iconName === 'bookmark' || iconName === 'bookmark-outline') {
        return `Сохранить. ${count || 0} сохранений`;
      }
      if (iconName === 'share-outline') {
        return 'Поделиться';
      }
      if (iconName === 'mail-outline') {
        return 'Написать сообщение';
      }
      if (iconName === 'volume-mute' || iconName === 'volume-high') {
        return isActiveState ? 'Включить звук' : 'Выключить звук';
      }
      return 'Действие';
    };

    const getAccessibilityHint = () => {
      if (iconName === 'heart' || iconName === 'heart-outline') {
        return 'Двойное нажатие для лайка';
      }
      if (iconName === 'chatbubble-outline') {
        return 'Открыть комментарии';
      }
      if (iconName === 'bookmark' || iconName === 'bookmark-outline') {
        return 'Добавить в избранное';
      }
      return undefined;
    };

    // Определяем размер кнопки и иконки (TikTok 2025: 44-48px)
    const isLike = iconName === 'heart' || iconName === 'heart-outline';
    const buttonSize = Platform.select({ ios: 44, android: 48, default: 44 }); // 44-48px
    const iconSize = isLike ? 26 : Platform.select({ ios: 24, android: 26, default: 24 }); // 24-26px

    const bubbleChildren: React.ReactNode[] = [
      <Animated.View key="icon" style={[styles.icon, { transform: [{ scale: combinedScale }] }]}>
        <Ionicons 
          name={iconName} 
          size={Platform.select({ ios: iconSize, android: iconSize, default: iconSize })} 
          color={iconColor} 
        />
      </Animated.View>,
    ];

    const renderCountLabel = (additionalStyle?: typeof styles.countLabel) => {
      if (iconName === 'heart' || iconName === 'heart-outline') {
        return <Text key="label" style={[styles.countLabel, additionalStyle]}>лайков</Text>;
      }
      if (iconName === 'chatbubble-outline') {
        return <Text key="label" style={[styles.countLabel, additionalStyle]}>комментов</Text>;
      }
      if (iconName === 'bookmark' || iconName === 'bookmark-outline') {
        return <Text key="label" style={[styles.countLabel, additionalStyle]}>сохранений</Text>;
      }
      return null;
    };

    const buttonChildren: React.ReactNode[] = [
      <Animated.View
        key="bubble"
        style={[
          styles.glassBubble,
          isLike && styles.likeButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor,
            borderColor,
            transform: [{ scale: combinedScale }],
            opacity: pressOpacity,
          },
        ]}
      >
        {bubbleChildren}
      </Animated.View>,
    ];

    if (count !== undefined && count > 0) {
      buttonChildren.push(
        <Animated.View key="count-positive" style={styles.countContainer}>
          {[
            <Animated.Text
              key="value"
              style={[
                styles.count,
                {
                  color: ultra.textPrimary,
                  transform: countScale ? [{ scale: countScale }] : [],
                },
              ]}
            >
              {count}
            </Animated.Text>,
            renderCountLabel(),
          ].filter(Boolean)}
        </Animated.View>
      );
    } else if (count !== undefined && count === 0) {
      buttonChildren.push(
        <Animated.View key="count-zero" style={styles.countContainer}>
          {[
            <Animated.Text
              key="value"
              style={[
                styles.count,
                styles.countZero,
                {
                  color: ultra.textMuted,
                  transform: countScale ? [{ scale: countScale }] : [],
                },
              ]}
            >
              {count}
            </Animated.Text>,
            renderCountLabel(styles.countLabelZero),
          ].filter(Boolean)}
        </Animated.View>
      );
    }

    return (
      <Pressable
        style={styles.actionButton}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={getAccessibilityHint()}
      >
        {buttonChildren}
      </Pressable>
    );
  }
);

GlassButton.displayName = 'GlassButton';

// ============================================
// MAIN COMPONENT
// ============================================

export const RightActionPanel: React.FC<RightActionPanelProps> = React.memo(
  ({
    listingId,
    isActive,
    isLiked,
    isFavorited,
    isSaved,
    isMuted,
    likeCount,
    commentCount,
    actions,
    fps,
    stall,
    scrollVelocity,
    gyroX = 0,
    gyroY = 0,
  }) => {

    // Safe variables with fallback values
    const safeFps = typeof fps === 'number' ? fps : 55;
    const safeStall = typeof stall === 'number' ? stall : 0;
    const safeVelocity = typeof scrollVelocity === 'number' ? scrollVelocity : 0;

    const isHighProfile = safeFps > 50 && safeStall < 40;
    const isLowPerformance = safeFps < 35 || safeStall > 120;
    const profile = getDeviceProfile(safeFps, safeStall);

    // Animation values
    const likeScale = useRef(new Animated.Value(1)).current;
    const countScale = useRef(new Animated.Value(1)).current;
    const focusScale = useRef(new Animated.Value(1)).current;
    const focusOpacity = useRef(new Animated.Value(1)).current;
    const hideTranslateY = useRef(new Animated.Value(0)).current;
    const autoHideTranslate = useRef(new Animated.Value(0)).current;
    const mountTranslateY = useRef(new Animated.Value(12)).current;
    const mountOpacity = useRef(new Animated.Value(0)).current;
    const microPulseRef = useRef(new Animated.Value(1)).current;
    const gyroXAnim = useRef(new Animated.Value(0)).current;
    const gyroYAnim = useRef(new Animated.Value(0)).current;

    // Mount animation
    useEffect(() => {
      Animated.parallel([
        Animated.spring(mountTranslateY, {
          toValue: 0,
          tension: 100,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(mountOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, [mountTranslateY, mountOpacity]);

    // Micro-pulse breathing effect
    useEffect(() => {
      if (isActive && !isLowPerformance) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(microPulseRef, {
              toValue: 1.015,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(microPulseRef, {
              toValue: 1,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        microPulseRef.setValue(1);
      }
    }, [isActive, isLowPerformance, microPulseRef]);

    // Like animation
    useEffect(() => {
      Animated.spring(likeScale, {
        toValue: 1.15,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }).start(() =>
        Animated.spring(likeScale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }).start()
      );
    }, [isLiked, likeScale]);

    // Count animation
    useEffect(() => {
      Animated.spring(countScale, {
        toValue: 1.08,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start(() => countScale.setValue(1));
    }, [likeCount, countScale]);

    // Focus animation
    useEffect(() => {
      const currentSettings = profileSettings[profile];

      if (isActive) {
        Animated.parallel([
          Animated.spring(focusScale, {
            toValue: currentSettings.scale,
            tension: currentSettings.tension,
            friction: currentSettings.friction,
            useNativeDriver: true,
          }),
          Animated.timing(focusOpacity, {
            toValue: currentSettings.opacity,
            duration: currentSettings.duration,
            useNativeDriver: true,
          }),
          Animated.spring(hideTranslateY, {
            toValue: 0,
            tension: currentSettings.tension,
            friction: currentSettings.friction,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.spring(focusScale, {
            toValue: 1,
            tension: currentSettings.tension,
            friction: currentSettings.friction,
            useNativeDriver: true,
          }),
          Animated.timing(focusOpacity, {
            toValue: 0.3,
            duration: currentSettings.duration,
            useNativeDriver: true,
          }),
          Animated.spring(hideTranslateY, {
            toValue: currentSettings.translateY,
            tension: currentSettings.tension,
            friction: currentSettings.friction,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [isActive, profile, focusScale, focusOpacity, hideTranslateY]);

    // Auto-hide on fast scroll
    useEffect(() => {
      const fastSwipe = Math.abs(safeVelocity) > 12;
      if (fastSwipe) {
        Animated.timing(autoHideTranslate, {
          toValue: -80,
          duration: 160,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(autoHideTranslate, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    }, [safeVelocity, autoHideTranslate]);

    // Gyro animations
    useEffect(() => {
      Animated.parallel([
        Animated.timing(gyroXAnim, {
          toValue: gyroX * (isActive ? 1.0 : 0.5),
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(gyroYAnim, {
          toValue: gyroY * (isActive ? 1.0 : 0.5),
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, [gyroX, gyroY, isActive, gyroXAnim, gyroYAnim]);

    const gyroShiftX = gyroYAnim.interpolate({
      inputRange: [-1, 1],
      outputRange: [-8, 8],
      extrapolate: 'clamp',
    });

    const gyroShiftY = gyroXAnim.interpolate({
      inputRange: [-1, 1],
      outputRange: [6, -6],
      extrapolate: 'clamp',
    });

    const gyroRotateZ = gyroYAnim.interpolate({
      inputRange: [-1, 1],
      outputRange: ['-5deg', '5deg'],
      extrapolate: 'clamp',
    });

    const buttons: React.ReactNode[] = [
      // Написать продавцу - ВЕРХНЯЯ КНОПКА
      <GlassButton
        key="chat"
        iconName="mail-outline"
        onPress={() => actions.onOpenChat(listingId)}
        isLowPerformance={isLowPerformance}
        isHighProfile={isHighProfile}
      />,
      // Поделиться
      <GlassButton
        key="share"
        iconName="share-outline"
        onPress={() => actions.onShare(listingId)}
        isLowPerformance={isLowPerformance}
        isHighProfile={isHighProfile}
      />,
      // Лайк
      <GlassButton
        key="like"
        iconName={isLiked ? 'heart' : 'heart-outline'}
        onPress={() => actions.onLike(listingId)}
        isActiveState={isLiked}
        count={likeCount}
        customScale={likeScale}
        countScale={countScale}
        isLowPerformance={isLowPerformance}
        isHighProfile={isHighProfile}
      />,
      // Комментарии
      <GlassButton
        key="comment"
        iconName="chatbubble-outline"
        onPress={() => actions.onComment(listingId)}
        count={commentCount}
        isLowPerformance={isLowPerformance}
        isHighProfile={isHighProfile}
      />,
      // Сохранить
      <GlassButton
        key="save"
        iconName={isFavorited || isSaved ? 'bookmark' : 'bookmark-outline'}
        onPress={() => actions.onSave(listingId)}
        isActiveState={isFavorited || isSaved}
        isLowPerformance={isLowPerformance}
        isHighProfile={isHighProfile}
      />,
      // Звук - НИЖНЯЯ КНОПКА
      <GlassButton
        key="mute"
        iconName={isMuted ? 'volume-mute' : 'volume-high'}
        onPress={() => actions.onToggleMute(listingId)}
        isActiveState={isMuted}
        isLowPerformance={isLowPerformance}
        isHighProfile={isHighProfile}
      />,
    ];

    // TikTok 2025 - без рамки, только кнопки
    const containerChildren: React.ReactNode[] = [
      <View key="actions" style={styles.actionsStack}>
        {buttons}
      </View>,
    ];

    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: mountOpacity,
            // Никаких теней (TikTok не использует)
            transform: [
              { translateY: mountTranslateY },
              { scale: microPulseRef },
              { scale: focusScale },
              { rotateZ: gyroRotateZ },
              { translateY: hideTranslateY },
              { translateY: autoHideTranslate },
              { translateX: gyroShiftX },
              { translateY: gyroShiftY },
            ],
          },
        ]}
      >
        {containerChildren}
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
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
  }
);

RightActionPanel.displayName = 'RightActionPanel';

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Platform.select({ ios: 16, android: 14, default: 16 }),
    bottom: Platform.select({ ios: 160, android: 150, default: 160 }),
    zIndex: 10, // TikTok 2025 стиль
    alignItems: 'center',
  },
  actionsStack: {
    alignItems: 'center',
    gap: Platform.select({ ios: 20, android: 22, default: 20 }), // Расстояние 20-22px
  },
  actionButton: {
    alignItems: 'center',
  },
  glassBubble: {
    width: Platform.select({ ios: 44, android: 48, default: 44 }), // 44-48px
    height: Platform.select({ ios: 44, android: 48, default: 44 }),
    borderRadius: Platform.select({ ios: 22, android: 24, default: 22 }),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: ultra.card, // #171717 матовая
    borderColor: ultra.border, // #2A2A2A тонкая белая обводка
    // Никаких теней и блюра (TikTok не использует)
  },
  likeButton: {
    width: Platform.select({ ios: 48, android: 48, default: 48 }), // Лайк 48px
    height: Platform.select({ ios: 48, android: 48, default: 48 }),
    borderRadius: Platform.select({ ios: 24, android: 24, default: 24 }),
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  countContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  count: {
    fontSize: Platform.select({ ios: 12, android: 11, default: 12 }),
    fontWeight: '700',
    textAlign: 'center',
    color: ultra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  countLabel: {
    fontSize: Platform.select({ ios: 9, android: 8, default: 9 }),
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 1,
    opacity: 0.7,
    color: ultra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter-Medium',
  },
  countZero: {
    opacity: 0.3,
  },
  countLabelZero: {
    opacity: 0.2,
  },
});

export default RightActionPanel;
