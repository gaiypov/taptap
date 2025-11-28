/**
 * ProfileTabs - Вкладки профиля
 *
 * МАКСИМАЛЬНО ПРОСТО для обычных людей:
 * - Объявления (мои объявления)
 * - Настройки (редактирование профиля, выход)
 *
 * Всё остальное - в Quick Actions кнопках выше
 */

import { RevolutUltra } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export type TabType = 'listings' | 'settings';

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  listingsCount?: number;
}

export default function ProfileTabs({
  activeTab,
  onTabChange,
  listingsCount = 0,
}: ProfileTabsProps) {
  const handleTabPress = (tab: TabType) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTabChange(tab);
  };

  const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap; badge?: number }[] = [
    { id: 'listings', label: 'Мои объявления', icon: 'car-outline', badge: listingsCount },
    { id: 'settings', label: 'Настройки', icon: 'settings-outline' },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const animatedStyle = useAnimatedStyle(() => {
            return {
              opacity: withTiming(isActive ? 1 : 0.6, { duration: 200 }),
              transform: [{ translateY: withTiming(isActive ? 0 : 2, { duration: 200 }) }],
            };
          });

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.tabContent, animatedStyle]}>
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? RevolutUltra.textPrimary : RevolutUltra.textSecondary}
                />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                  </View>
                )}
              </Animated.View>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: RevolutUltra.border,
    marginTop: Platform.select({ ios: 16, android: 14, default: 16 }),
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: Platform.select({ ios: 16, android: 12, default: 16 }),
    gap: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.select({ ios: 10, android: 9, default: 10 }),
    paddingHorizontal: 12,
    position: 'relative',
  },
  activeTab: {},
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: Platform.select({ ios: 13, android: 12, default: 13 }),
    fontWeight: '600',
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  activeTabText: {
    color: RevolutUltra.textPrimary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  badge: {
    backgroundColor: RevolutUltra.neutral.light,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: RevolutUltra.neutral.accent || RevolutUltra.textPrimary,
    borderRadius: 1,
  },
});
