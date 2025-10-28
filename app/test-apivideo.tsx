import apiVideo from '@/services/apiVideo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TestApiVideoScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = () => {
    const apiStatus = apiVideo.getStatus();
    setStatus(apiStatus);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тест api.video</Text>
        <TouchableOpacity onPress={loadStatus}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>📊 Статус api.video</Text>
          {status && (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Настроен:</Text>
                <View style={[styles.badge, status.configured ? styles.badgeSuccess : styles.badgeWarning]}>
                  <Text style={styles.badgeText}>
                    {status.configured ? '✅ Да' : '⚠️ Нет'}
                  </Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>API Key:</Text>
                <Text style={styles.statusValue}>
                  {status.hasApiKey ? '✓ Есть' : '✗ Не заполнен'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Клиент:</Text>
                <Text style={styles.statusValue}>
                  {status.clientInitialized ? '✓ Инициализирован' : '✗ Не инициализирован'}
                </Text>
              </View>
            </>
          )}

          {!status?.configured && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ api.video не настроен! Добавьте API ключ в app.json
              </Text>
            </View>
          )}
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎥 Возможности api.video</Text>
          
          <View style={styles.feature}>
            <Ionicons name="flash" size={20} color="#34C759" />
            <Text style={styles.featureText}>Адаптивный HLS стриминг</Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="resize" size={20} color="#34C759" />
            <Text style={styles.featureText}>Автоматический транскодинг (360p, 720p, 1080p)</Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="cloud-upload" size={20} color="#34C759" />
            <Text style={styles.featureText}>CDN доставка по всему миру</Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="image" size={20} color="#34C759" />
            <Text style={styles.featureText}>Автоматическая генерация превью</Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="speedometer" size={20} color="#34C759" />
            <Text style={styles.featureText}>Быстрая загрузка и воспроизведение</Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="contract" size={20} color="#34C759" />
            <Text style={styles.featureText}>Сжатие видео (экономия места)</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>📝 Как Настроить</Text>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>1.</Text> Зарегистрируйтесь на{' '}
            <Text style={styles.link}>https://api.video</Text>
          </Text>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>2.</Text> Получите API ключ в dashboard
          </Text>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>3.</Text> Откройте файл{' '}
            <Text style={styles.code}>app.json</Text>
          </Text>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>4.</Text> Найдите секцию{' '}
            <Text style={styles.code}>extra</Text>
          </Text>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>5.</Text> Заполните:
          </Text>
          
          <View style={styles.codeBlock}>
            <Text style={styles.codeBlockText}>
              &ldquo;EXPO_PUBLIC_API_VIDEO_KEY&rdquo;: &ldquo;ваш_ключ&rdquo;
            </Text>
          </View>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>6.</Text> Перезапустите:{' '}
            <Text style={styles.code}>npx expo start --clear</Text>
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.cardTitle}>✨ Преимущества</Text>
          
          <Text style={styles.benefitItem}>
            💰 <Text style={styles.benefitTitle}>Экономия:</Text> Free tier - 5GB/месяц
          </Text>
          
          <Text style={styles.benefitItem}>
            ⚡ <Text style={styles.benefitTitle}>Скорость:</Text> Видео начинает играть мгновенно
          </Text>
          
          <Text style={styles.benefitItem}>
            📱 <Text style={styles.benefitTitle}>Адаптивность:</Text> Подбор качества под скорость интернета
          </Text>
          
          <Text style={styles.benefitItem}>
            🌍 <Text style={styles.benefitTitle}>CDN:</Text> Доставка из ближайшего сервера
          </Text>
          
          <Text style={styles.benefitItem}>
            📈 <Text style={styles.benefitTitle}>Масштабируемость:</Text> Миллионы просмотров
          </Text>
        </View>

        {/* Current State */}
        {!status?.configured && (
          <View style={styles.currentStateCard}>
            <Text style={styles.cardTitle}>📌 Текущее Состояние</Text>
            <Text style={styles.currentStateText}>
              Сейчас видео загружаются в <Text style={styles.bold}>Supabase Storage</Text>.
              {'\n\n'}
              После настройки api.video все новые видео будут автоматически загружаться через api.video с адаптивным стримингом.
              {'\n\n'}
              Старые видео продолжат работать через Supabase.
            </Text>
          </View>
        )}

        {status?.configured && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={48} color="#34C759" />
            <Text style={styles.successTitle}>Всё Настроено!</Text>
            <Text style={styles.successText}>
              api.video готов к использованию. Все новые видео будут загружаться с адаптивным стримингом.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusValue: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  badgeWarning: {
    backgroundColor: '#FFF3E0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#F57C00',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionStep: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  stepNumber: {
    fontWeight: '700',
    color: '#007AFF',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    color: '#D32F2F',
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  codeBlock: {
    backgroundColor: '#263238',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    marginLeft: 24,
  },
  codeBlockText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#4CAF50',
  },
  benefitsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  benefitTitle: {
    fontWeight: '600',
  },
  currentStateCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  currentStateText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#000',
  },
  successCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

