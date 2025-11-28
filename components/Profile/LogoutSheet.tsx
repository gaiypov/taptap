/**
 * LogoutSheet - Bottom sheet для выхода из аккаунта
 * Revolut Ultra Neutral стиль (без красного)
 */

import { RevolutUltra } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

interface LogoutSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutSheet({ visible, onClose, onConfirm }: LogoutSheetProps) {
  const handleConfirm = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="log-out-outline" size={48} color={RevolutUltra.textPrimary} />
            </View>
            
            <Text style={styles.title}>Выход из аккаунта</Text>
            <Text style={styles.message}>Вы точно хотите выйти?</Text>
            
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Выйти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: RevolutUltra.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '50%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: RevolutUltra.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RevolutUltra.card2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: RevolutUltra.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: RevolutUltra.card2,
    borderWidth: 1,
    borderColor: RevolutUltra.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: RevolutUltra.textPrimary,
  },
  confirmButton: {
    backgroundColor: RevolutUltra.neutral.light,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: RevolutUltra.textPrimary,
  },
});
