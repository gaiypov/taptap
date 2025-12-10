/**
 * ProfileActionGrid - Quick Actions
 *
 * Логика: покупателей больше чем продавцов!
 *
 * ВЕРХ (Row 1): Действия ПОКУПАТЕЛЯ - Сообщения, Избранное
 * НИЗ (Row 2): Рабочее пространство ПРОДАВЦА - Создать, Баланс
 *
 * Продавец = частично покупатель (смотрит ролики, добавляет в избранное)
 */

import { RevolutUltra } from '@/lib/theme/colors';
import { navigateFromProfile } from '@/utils/profileNavigator';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface ActionButton {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  profileAction: 'messages' | 'favorites' | 'myListings' | 'boost' | 'payments' | 'createListing' | 'settings';
  color?: string;
  bgColor?: string;
  badge?: number;
}

interface ProfileActionGridProps {
  isAuthenticated?: boolean;
  showSellerRow?: boolean;
  unreadCount?: number;
  favoritesCount?: number;
}

export default function ProfileActionGrid({
  isAuthenticated = true,
  showSellerRow = true,
  unreadCount = 0,
  favoritesCount = 0,
}: ProfileActionGridProps) {
  const handleAction = (action: ActionButton['profileAction']) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigateFromProfile(action);
  };

  // ROW 1: Действия ПОКУПАТЕЛЯ (верх) - Сообщения, Избранное
  const buyerActions: ActionButton[] = isAuthenticated
    ? [
        {
          id: 'messages',
          icon: 'chatbubble',
          label: 'Сообщения',
          profileAction: 'messages',
          badge: unreadCount,
        },
        {
          id: 'favorites',
          icon: 'heart',
          label: 'Избранное',
          profileAction: 'favorites',
          badge: favoritesCount,
        },
      ]
    : [];

  // ROW 2: Рабочее пространство ПРОДАВЦА (низ) - Создать, Баланс
  const sellerActions: ActionButton[] = showSellerRow && isAuthenticated
    ? [
        {
          id: 'create',
          icon: 'add-circle',
          label: 'Создать',
          profileAction: 'createListing',
          color: RevolutUltra.textPrimary,
          bgColor: RevolutUltra.neutral.light,
        },
        {
          id: 'balance',
          icon: 'wallet',
          label: 'Баланс',
          profileAction: 'payments',
          color: '#000',
          bgColor: '#FFD60A',
        },
      ]
    : [];

  if (buyerActions.length === 0 && sellerActions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* ROW 1: Покупатель - Сообщения, Избранное */}
      {buyerActions.length > 0 && (
        <View style={styles.row}>
          {buyerActions.map((action, index) => (
            <Animated.View key={action.id} entering={FadeInUp.delay(index * 50)} style={styles.gridItem}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  action.bgColor ? { backgroundColor: action.bgColor } : null,
                ]}
                onPress={() => handleAction(action.profileAction)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={action.icon}
                    size={24}
                    color={action.color || RevolutUltra.textPrimary}
                  />
                  {action.badge !== undefined && action.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {action.badge > 99 ? '99+' : action.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.actionLabel,
                  action.color ? { color: action.color } : null,
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}

      {/* ROW 2: Продавец - Создать, Boost */}
      {sellerActions.length > 0 && (
        <View style={styles.row}>
          {sellerActions.map((action, index) => (
            <Animated.View key={action.id} entering={FadeInUp.delay((buyerActions.length + index) * 50)} style={styles.gridItem}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  action.bgColor ? { backgroundColor: action.bgColor } : null,
                ]}
                onPress={() => handleAction(action.profileAction)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={action.icon}
                  size={24}
                  color={action.color || RevolutUltra.textPrimary}
                />
                <Text style={[
                  styles.actionLabel,
                  action.color ? { color: action.color } : null,
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Platform.select({ ios: 20, android: 16, default: 20 }),
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  row: {
    flexDirection: 'row',
    gap: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  gridItem: {
    flex: 1,
    width: 104,
    height: 104,
  },
  actionButton: {
    width: '100%',
    height: '100%',
    backgroundColor: RevolutUltra.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.select({ ios: 16, android: 14, default: 16 }),
    gap: Platform.select({ ios: 8, android: 6, default: 8 }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  actionLabel: {
    fontSize: Platform.select({ ios: 12, android: 11, default: 12 }),
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
    opacity: 0.8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-semibold',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
});
