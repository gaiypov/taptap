// app/components/Upload/CategoryModal.tsx — БЕЗОПАСНАЯ ВЕРСИЯ 2025

import { ultra } from '@/lib/theme/ultra';

import { UPLOAD_TEXTS, CategoryType } from '@/config/uploadTexts';

import { Ionicons } from '@expo/vector-icons';

import React from 'react';

import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface CategoryModalProps {
  visible: boolean;
  onSelect: (category: CategoryType) => void;
  onClose: () => void;
}

const CATEGORIES: CategoryType[] = ['auto', 'horse', 'real_estate'];

export function CategoryModal({ visible, onSelect, onClose }: CategoryModalProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut} 
          style={styles.container}
          onStartShouldSetResponder={() => true}
        >
          {CATEGORIES.map((cat) => {
            const config = UPLOAD_TEXTS[cat];
            return (
              <TouchableOpacity
                key={cat}
                style={styles.item}
                onPress={() => {
                  onSelect(cat);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.icon}>{config.icon}</Text>
                <Text style={styles.title}>{config.title}</Text>
                <Ionicons name="chevron-forward" size={24} color={ultra.textMuted} />
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: ultra.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: ultra.border,
  },
  icon: {
    fontSize: 32,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: ultra.textPrimary,
    flex: 1,
  },
});
