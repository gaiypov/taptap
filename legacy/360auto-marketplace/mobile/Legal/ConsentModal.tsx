import { consents } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface ConsentModalProps {
  visible: boolean;
  userId: string;
  onAccept: () => void;
  onDecline?: () => void;
}

export default function ConsentModal({ visible, userId, onAccept, onDecline }: ConsentModalProps) {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const allAccepted = termsAccepted && privacyAccepted && consentAccepted;

  const handleAccept = async () => {
    if (!allAccepted) return;

    setLoading(true);
    try {
      // userId уже проверен в _layout.tsx перед показом модального окна
      console.log('Saving consent for user:', userId);

      const { error } = await consents.upsertUserConsents({
        user_id: userId,
        terms_accepted: true,
        privacy_accepted: true,
        consent_accepted: true,
        marketing_accepted: false,
        notifications_accepted: true,
        terms_version: '1.0',
        privacy_version: '1.0',
        consent_version: '1.0',
        ip_address: 'mobile',
        user_agent: 'React Native App',
      });

      if (error) {
        console.error('Consent save error:', error);
        throw error;
      }

      console.log('✅ Consent saved successfully!');
      onAccept();
    } catch (error: any) {
      console.error('Error saving consent:', error);
      alert(`Ошибка при сохранении согласия: ${error.message || 'Попробуйте снова'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      alert('Для использования приложения необходимо принять все соглашения');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Добро пожаловать в 360Auto!</Text>
          <Text style={styles.headerSubtitle}>от ОСОО &ldquo;Супер Апп&rdquo;</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            Для продолжения работы с приложением необходимо ознакомиться и принять:
          </Text>

          {/* Пользовательское соглашение */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxTitle}>Пользовательское соглашение</Text>
              <Text style={styles.checkboxSubtitle}>
                Условия использования приложения и размещения объявлений
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.readButton}
            onPress={() => router.push('/legal/terms')}
          >
            <Text style={styles.readButtonText}>Читать полностью</Text>
            <Ionicons name="arrow-forward" size={16} color="#007AFF" />
          </TouchableOpacity>

          {/* Политика конфиденциальности */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setPrivacyAccepted(!privacyAccepted)}
          >
            <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>
              {privacyAccepted && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxTitle}>Политика конфиденциальности</Text>
              <Text style={styles.checkboxSubtitle}>
                Как мы собираем, храним и защищаем ваши данные
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.readButton}
            onPress={() => router.push('/legal/privacy')}
          >
            <Text style={styles.readButtonText}>Читать полностью</Text>
            <Ionicons name="arrow-forward" size={16} color="#007AFF" />
          </TouchableOpacity>

          {/* Согласие на обработку данных */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setConsentAccepted(!consentAccepted)}
          >
            <View style={[styles.checkbox, consentAccepted && styles.checkboxChecked]}>
              {consentAccepted && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxTitle}>Согласие на обработку данных</Text>
              <Text style={styles.checkboxSubtitle}>
                Согласие на обработку персональных данных и уведомления
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.readButton}
            onPress={() => router.push('/legal/consent')}
          >
            <Text style={styles.readButtonText}>Читать полностью</Text>
            <Ionicons name="arrow-forward" size={16} color="#007AFF" />
          </TouchableOpacity>

          {/* Информация о компании */}
          <View style={styles.companyInfo}>
            <Text style={styles.companyTitle}>Контакты:</Text>
            <Text style={styles.companyText}>📧 ulan495@me.com</Text>
            <Text style={styles.companyText}>📞 +996 779 728 888</Text>
            <Text style={styles.companyText}>🏢 ОСОО &ldquo;Супер Апп&rdquo;</Text>
            <Text style={styles.companyText}>📍 г. Бишкек, 5 мкрн, д. 63, кв. 28</Text>
          </View>
        </ScrollView>

        {/* Footer с кнопками */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.acceptButton, !allAccepted && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={!allAccepted || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.acceptButtonText}>Принять и продолжить</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.declineButtonText}>Отклонить</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    color: '#333',
    marginTop: 24,
    marginBottom: 24,
    lineHeight: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  checkboxSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 40,
    marginBottom: 24,
  },
  readButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  companyInfo: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  companyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonDisabled: {
    backgroundColor: '#CCC',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 15,
    color: '#999',
  },
});
