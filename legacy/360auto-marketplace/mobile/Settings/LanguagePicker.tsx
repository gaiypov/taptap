import { KYRGYZSTAN_LOCALES, LOCALE_FLAGS } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface LanguagePickerProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguagePicker({ visible, onClose }: LanguagePickerProps) {
  const { locale, changeLanguage } = useTranslation();

  const handleSelectLanguage = (newLocale: 'ru' | 'ky') => {
    changeLanguage(newLocale);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.modal}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <Text style={styles.title}>Язык интерфейса</Text>
          <Text style={styles.titleKy}>Интерфейс тили</Text>

          {/* Languages */}
          <View style={styles.languagesContainer}>
            {(Object.keys(KYRGYZSTAN_LOCALES) as Array<'ru' | 'ky'>).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => handleSelectLanguage(lang)}
                style={({ pressed }) => [
                  styles.languageButton,
                  locale === lang && styles.languageButtonActive,
                  pressed && styles.languageButtonPressed,
                ]}
              >
                <Text style={styles.flag}>{LOCALE_FLAGS[lang]}</Text>
                <Text
                  style={[
                    styles.languageName,
                    locale === lang && styles.languageNameActive,
                  ]}
                >
                  {KYRGYZSTAN_LOCALES[lang]}
                </Text>
                {locale === lang && (
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                )}
              </Pressable>
            ))}
          </View>

          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleKy: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  languagesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  languageButtonActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  languageButtonPressed: {
    opacity: 0.7,
  },
  flag: {
    fontSize: 32,
  },
  languageName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  languageNameActive: {
    color: '#34C759',
  },
  closeButton: {
    height: 50,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

