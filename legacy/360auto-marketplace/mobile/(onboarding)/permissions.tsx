import { useTranslation } from '@/lib/i18n/useTranslation';
import {
    requestLocationPermission,
    requestNotificationPermission,
} from '@/lib/permissions/request-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function PermissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const handleRequestLocation = async () => {
    const granted = await requestLocationPermission();
    setLocationGranted(granted);
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsGranted(granted);
  };

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('onboarding.permissions.title')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.permissions.subtitle')}
          </Text>
        </View>

        {/* Permissions */}
        <View style={styles.permissionsContainer}>
          {/* Location */}
          <View style={styles.permissionCard}>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionEmoji}>📍</Text>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>
                  {t('onboarding.permissions.location.title')}
                </Text>
                <Text style={styles.permissionDescription}>
                  {t('onboarding.permissions.location.description')}
                </Text>
                <Pressable
                  onPress={handleRequestLocation}
                  disabled={locationGranted}
                  style={({ pressed }) => [
                    styles.permissionButton,
                    locationGranted && styles.permissionButtonGranted,
                    pressed && styles.permissionButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.permissionButtonText,
                      locationGranted && styles.permissionButtonTextGranted,
                    ]}
                  >
                    {locationGranted
                      ? `✓ ${t('common.granted')}`
                      : t('onboarding.permissions.location.button')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.permissionCard}>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionEmoji}>🔔</Text>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>
                  {t('onboarding.permissions.notifications.title')}
                </Text>
                <Text style={styles.permissionDescription}>
                  {t('onboarding.permissions.notifications.description')}
                </Text>
                <Pressable
                  onPress={handleRequestNotifications}
                  disabled={notificationsGranted}
                  style={({ pressed }) => [
                    styles.permissionButton,
                    notificationsGranted && styles.permissionButtonGranted,
                    pressed && styles.permissionButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.permissionButtonText,
                      notificationsGranted && styles.permissionButtonTextGranted,
                    ]}
                  >
                    {notificationsGranted
                      ? `✓ ${t('common.granted')}`
                      : t('onboarding.permissions.notifications.button')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
        >
          <Text style={styles.continueButtonText}>
            {t('onboarding.permissions.continue')}
          </Text>
        </Pressable>

        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>
            {t('onboarding.permissions.skip')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  permissionsContainer: {
    gap: 16,
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  permissionContent: {
    flexDirection: 'row',
    gap: 16,
  },
  permissionEmoji: {
    fontSize: 40,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  permissionButton: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonGranted: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  permissionButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permissionButtonTextGranted: {
    color: '#34C759',
  },
  bottomButtons: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
    gap: 12,
  },
  continueButton: {
    height: 56,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});

