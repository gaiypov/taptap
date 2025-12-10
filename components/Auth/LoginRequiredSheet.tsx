import { getActionMessage } from '@/utils/permissionManager';
import type { AuthAction } from '@/utils/permissionManager';
import { useAuthSheetStore } from '@/store/authSheetStore';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsAuthSheetOpen, selectAuthSheetAction } from '@/lib/store/slices/authSheetSlice';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ultra } from '@/lib/theme/ultra';
import * as Haptics from 'expo-haptics';

export function LoginRequiredSheet() {
  const router = useRouter();
  const { close } = useAuthSheetStore();
  const isOpen = useAppSelector(selectIsAuthSheetOpen);
  const action = useAppSelector(selectAuthSheetAction);

  if (!isOpen || !action) return null;

  const message = getActionMessage(action);

  const handleCreateAccount = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    close();
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    close();
    router.push('/(auth)/register');
  };

  const handleContinueAsGuest = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    close();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <Pressable style={styles.overlay} onPress={close}>
        <BlurView intensity={20} style={styles.blur}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <Text style={styles.title}>Требуется регистрация</Text>
                <Text style={styles.message}>{message}</Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttons}>
                {/* Create Account - Primary */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCreateAccount}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[ultra.gradientStart, ultra.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Ionicons name="person-add-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>Создать аккаунт</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Login */}
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={20} color={ultra.textPrimary} />
                  <Text style={styles.secondaryButtonText}>Войти</Text>
                </TouchableOpacity>

                {/* Continue as Guest */}
                <TouchableOpacity
                  style={styles.ghostButton}
                  onPress={handleContinueAsGuest}
                  activeOpacity={0.8}
                >
                  <Text style={styles.ghostButtonText}>Смотреть без регистрации</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </BlurView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blur: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: ultra.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: ultra.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: ultra.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: ultra.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: ultra.surface,
    borderWidth: 1,
    borderColor: ultra.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ultra.textPrimary,
  },
  ghostButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: 15,
    color: ultra.textSecondary,
    fontWeight: '500',
  },
});

