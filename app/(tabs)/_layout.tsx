// app/(tabs)/_layout.tsx
// TikTok-style нижняя навигация — Premium Animations
// Revolut Ultra стиль (Fallback to View for stability)

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
// BlurView removed temporarily for Android stability
// import { BlurView } from 'expo-blur';
import { Tabs, useRouter, useSegments, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAppDispatch } from '@/lib/store/hooks';
import { setCurrentIndex } from '@/lib/store/slices/feedSlice';
import { getVideoEngine } from '@/lib/video/videoEngine';
import { SIZES } from '@/lib/constants/sizes';
import { ultra } from '@/lib/theme/ultra';
import { Icons } from '@/components/icons/CustomIcons';
import { SPRING_CONFIGS } from '@/components/animations/PremiumAnimations';

// ==============================================
// TAB ICON COMPONENT
// ==============================================

interface TabIconProps {
  icon: React.FC<{ size: number; color: string; filled?: boolean }>;
  label: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = React.memo(({ icon: Icon, label, focused }) => {
  // Renamed variables to force cache invalidation
  const iconScale = useSharedValue(1);
  const iconTranslateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      // Минималистичная анимация
      iconScale.value = withSpring(1.05, SPRING_CONFIGS.snappy);
      iconTranslateY.value = withSpring(-2, SPRING_CONFIGS.gentle);
    } else {
      iconScale.value = withSpring(1, SPRING_CONFIGS.snappy);
      iconTranslateY.value = withSpring(0, SPRING_CONFIGS.snappy);
    }
  }, [focused]); // Verified: No 'rotation' dependency here

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { translateY: iconTranslateY.value },
    ],
  }));

  const color = focused ? ultra.textPrimary : ultra.textMuted;

  return (
    <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
      <Icon size={SIZES.tabBar.iconSize - 2} color={color} filled={focused} />
      <Text style={[
        styles.tabLabel,
        { color },
        focused && styles.tabLabelActive,
      ]}>
        {label}
      </Text>
    </Animated.View>
  );
});

// ==============================================
// CREATE BUTTON COMPONENT (CENTER)
// ==============================================

interface CreateButtonProps {
  focused: boolean;
}

const CreateButton: React.FC<CreateButtonProps> = React.memo(({ focused }) => {
  const router = useRouter();
  const buttonScale = useSharedValue(1);

  const handlePress = useCallback(() => {
    // Premium haptic
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Минималистичная анимация
    buttonScale.value = withSequence(
      withSpring(0.9, SPRING_CONFIGS.snappy),
      withSpring(1, SPRING_CONFIGS.snappy)
    );
    
    router.push('/(tabs)/upload');
  }, [router, buttonScale]); // Verified: No 'rotation' dependency here

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.createButtonWrapper}>
      <Pressable onPress={handlePress}>
        <Animated.View style={animatedStyle}>
          {/* Replaced BlurView with View for stability */}
          <View style={[styles.createButton, { backgroundColor: 'rgba(30, 30, 30, 0.9)' }]}>
            <View style={styles.createButtonInner}>
              <Icons.Create 
                size={SIZES.tabBar.createIconSize} 
                color={ultra.textPrimary} 
              />
            </View>
          </View>
        </Animated.View>
      </Pressable>
      <Text style={styles.createLabel}>Подать</Text>
    </View>
  );
});

// ==============================================
// TAB LAYOUT
// ==============================================

export default function TabLayout() {
  const dispatch = useAppDispatch();
  const segments = useSegments();
  const pathname = usePathname();

  // Pause videos when leaving feed
  useEffect(() => {
    const isOnFeed = pathname === '/' || pathname === '/index' || (Array.isArray(segments) && segments.length > 0 && (segments as string[]).includes('index'));
    const engine = getVideoEngine();
    
    if (!isOnFeed) {
      try {
        engine.pauseAll();
        dispatch(setCurrentIndex(-1));
      } catch (e) {
        console.warn('[Tabs] pauseAll error', e);
      }
    }
  }, [pathname, segments, dispatch]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          // Replaced BlurView with simple View for Android stability
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
            <View style={styles.tabBarBorder} />
          </View>
        ),
      }}
    >
      {/* 1. Главная */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={Icons.Home} 
              label="Главная" 
              focused={focused} 
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.selectionAsync();
            }
          },
        }}
      />

      {/* 2. Поиск */}
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={Icons.Search} 
              label="Поиск" 
              focused={focused} 
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.selectionAsync();
            }
          },
        }}
      />

      {/* 3. Подать (CENTER) */}
      <Tabs.Screen
        name="upload"
        options={{
          tabBarIcon: ({ focused }) => (
            <CreateButton focused={focused} />
          ),
        }}
      />

      {/* 4. Избранное */}
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={Icons.Bookmark}
              label="Избранное"
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.selectionAsync();
            }
          },
        }}
      />

      {/* 5. Моё */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={Icons.Profile} 
              label="Моё" 
              focused={focused} 
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.selectionAsync();
            }
          },
        }}
      />
    </Tabs>
  );
}

// ==============================================
// STYLES
// ==============================================

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SIZES.tabBar.height,
    paddingBottom: SIZES.tabBar.paddingBottom,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
  },
  tabBarBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Тонкая граница
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    position: 'relative',
  },
  tabLabel: {
    fontSize: SIZES.tabBar.labelSize - 1, // Тонкие иконки
    fontWeight: '400', // Легче
    marginTop: 4,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '500', // Немного жирнее для активных
  },
  createButtonWrapper: {
    alignItems: 'center',
    marginTop: -20, // Elevate above tab bar
  },
  createButton: {
    width: SIZES.tabBar.createButtonSize,
    height: SIZES.tabBar.createButtonSize,
    borderRadius: SIZES.tabBar.createButtonSize / 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  createButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  createLabel: {
    fontSize: SIZES.tabBar.labelSize,
    fontWeight: '500',
    color: ultra.textMuted,
    marginTop: 4,
  },
});
