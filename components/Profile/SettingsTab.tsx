/**
 * SettingsTab - App settings and preferences
 * Part of unified profile system
 */

import { RevolutUltra } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface SettingsTabProps {
  isNotificationsEnabled?: boolean;
  onToggleNotifications?: (enabled: boolean) => void;
}

interface SettingItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  type: 'link' | 'switch' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
}

export default function SettingsTab({
  isNotificationsEnabled = true,
  onToggleNotifications,
}: SettingsTabProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(isNotificationsEnabled);

  const handleNotificationsToggle = useCallback((value: boolean) => {
    setNotifications(value);
    onToggleNotifications?.(value);
  }, [onToggleNotifications]);

  const handleSupport = useCallback(() => {
    Linking.openURL('https://t.me/360auto_support');
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    router.push('/legal/privacy' as any);
  }, [router]);

  const handleTerms = useCallback(() => {
    router.push('/legal/terms' as any);
  }, [router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Удалить аккаунт?',
      'Это действие нельзя отменить. Все ваши данные будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Подтверждение',
              'Для удаления аккаунта напишите в поддержку',
              [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Написать', onPress: handleSupport },
              ]
            );
          },
        },
      ]
    );
  }, [handleSupport]);

  const settings: SettingItem[][] = [
    // Notifications section
    [
      {
        id: 'notifications',
        icon: 'notifications-outline',
        title: 'Push-уведомления',
        subtitle: 'Сообщения, лайки, новые объявления',
        type: 'switch',
        value: notifications,
        onToggle: handleNotificationsToggle,
      },
    ],
    // Account section
    [
      {
        id: 'edit-profile',
        icon: 'person-outline',
        title: 'Редактировать профиль',
        type: 'link',
        onPress: () => router.push('/profile/edit' as any),
      },
    ],
    // Support section
    [
      {
        id: 'support',
        icon: 'help-circle-outline',
        title: 'Поддержка',
        subtitle: 'Telegram @360auto_support',
        type: 'link',
        onPress: handleSupport,
      },
      {
        id: 'privacy',
        icon: 'shield-checkmark-outline',
        title: 'Политика конфиденциальности',
        type: 'link',
        onPress: handlePrivacyPolicy,
      },
      {
        id: 'terms',
        icon: 'document-text-outline',
        title: 'Условия использования',
        type: 'link',
        onPress: handleTerms,
      },
    ],
    // Danger zone
    [
      {
        id: 'delete-account',
        icon: 'trash-outline',
        title: 'Удалить аккаунт',
        type: 'action',
        onPress: handleDeleteAccount,
        danger: true,
      },
    ],
  ];

  return (
    <View style={styles.container}>
      {settings.map((section, sectionIndex) => (
        <Animated.View
          key={sectionIndex}
          entering={FadeInDown.delay(sectionIndex * 100)}
          style={styles.section}
        >
          {section.map((item, itemIndex) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingItem,
                itemIndex === 0 && styles.settingItemFirst,
                itemIndex === section.length - 1 && styles.settingItemLast,
              ]}
              onPress={item.type !== 'switch' ? item.onPress : undefined}
              activeOpacity={item.type === 'switch' ? 1 : 0.7}
              disabled={item.type === 'switch'}
            >
              <View style={[styles.iconContainer, item.danger && styles.iconContainerDanger]}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? '#FF5252' : RevolutUltra.textPrimary}
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.title, item.danger && styles.titleDanger]}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                )}
              </View>

              {item.type === 'switch' && (
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{
                    false: RevolutUltra.card2,
                    true: RevolutUltra.neutral.light,
                  }}
                  thumbColor={item.value ? RevolutUltra.textPrimary : '#CCCCCC'}
                  ios_backgroundColor={RevolutUltra.card2}
                />
              )}

              {item.type === 'link' && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={RevolutUltra.textSecondary}
                />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      ))}

      {/* App version */}
      <Text style={styles.version}>360Auto v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: RevolutUltra.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: RevolutUltra.border,
  },
  settingItemFirst: {},
  settingItemLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDanger: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: RevolutUltra.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  titleDanger: {
    color: '#FF5252',
  },
  subtitle: {
    fontSize: 13,
    color: RevolutUltra.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  version: {
    fontSize: 12,
    color: RevolutUltra.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
