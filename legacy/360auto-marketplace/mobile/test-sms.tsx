import { smsService } from '@/services/sms';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TestSMSScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('+996555');
  const [message, setMessage] = useState('Тестовое сообщение от 360Auto');
  const [sending, setSending] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const [status, setStatus] = useState<any>(null);

  React.useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const smsStatus = await smsService.getStatus();
    setStatus(smsStatus);
  };

  const handleSendVerificationCode = async () => {
    if (phone.length < 10) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    try {
      setSending(true);
      const result = await smsService.sendVerificationCode(phone);
      if (result.success) {
        setLastCode(result.testCode || '');
        Alert.alert(
          'Успешно',
          status?.configured
            ? 'SMS отправлена! Проверьте телефон.'
            : result.testCode
              ? `Код для тестирования: ${result.testCode}`
              : 'SMS не настроен. Проверьте конфигурацию.'
        );
      } else {
        setLastCode(result.testCode || '');
        Alert.alert(
          'Ошибка',
          result.error || (result.warning ?? 'Не удалось отправить SMS')
        );
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setSending(false);
    }
  };

  const handleSendCustomMessage = async () => {
    if (phone.length < 10 || !message.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      setSending(true);
      Alert.alert('Недоступно', 'Отправка произвольных SMS недоступна из приложения. Используйте админ-инструменты.');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тест SMS</Text>
        <TouchableOpacity onPress={loadStatus}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SMS Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>📊 Статус SMS</Text>
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
              {status.codeLength ? (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Длина кода:</Text>
                  <Text style={styles.statusValue}>{status.codeLength}</Text>
                </View>
              ) : null}
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>API URL:</Text>
                <Text style={styles.statusValue}>{status.apiUrl ?? '—'}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Отправитель:</Text>
                <Text style={styles.statusValue}>{status.sender ?? '—'}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Логин:</Text>
                <Text style={styles.statusValue}>
                  {status.hasLogin ? '✓ Есть' : '✗ Не заполнен'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Пароль:</Text>
                <Text style={styles.statusValue}>
                  {status.hasPassword ? '✓ Есть' : '✗ Не заполнен'}
                </Text>
              </View>
            </>
          )}

          {!status?.configured && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ SMS не настроены! Добавьте логин и пароль от Nikita.kg в app.json
              </Text>
            </View>
          )}
        </View>

        {/* Test 1: Verification Code */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔑 Тест 1: Код Верификации</Text>
          <Text style={styles.cardDescription}>
            Отправить код подтверждения (по умолчанию 6 цифр)
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Номер телефона</Text>
            <TextInput
              style={styles.input}
              placeholder="+996555123456"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, sending && styles.buttonDisabled]}
            onPress={handleSendVerificationCode}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>📱 Отправить Код</Text>
            )}
          </TouchableOpacity>

          {lastCode && (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Последний код:</Text>
              <Text style={styles.codeValue}>{lastCode}</Text>
            </View>
          )}
        </View>

        {/* Test 2: Custom Message */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✉️ Тест 2: Своё Сообщение</Text>
          <Text style={styles.cardDescription}>
            Отправить любое SMS (только если настроен API)
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Сообщение</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Введите текст SMS..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, sending && styles.buttonDisabled]}
            onPress={handleSendCustomMessage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                💬 Отправить SMS
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>📝 Инструкция</Text>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>1.</Text> Откройте файл{' '}
            <Text style={styles.code}>app.json</Text>
          </Text>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>2.</Text> Найдите секцию{' '}
            <Text style={styles.code}>extra</Text>
          </Text>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>3.</Text> Заполните:
          </Text>
          
          <View style={styles.codeBlock}>
            <Text style={styles.codeBlockText}>
              &ldquo;EXPO_PUBLIC_SMS_LOGIN&rdquo;: &ldquo;ваш_логин&rdquo;,{'\n'}
              &ldquo;EXPO_PUBLIC_SMS_PASSWORD&rdquo;: &ldquo;ваш_пароль&rdquo;
            </Text>
          </View>
          
          <Text style={styles.instructionStep}>
            <Text style={styles.stepNumber}>4.</Text> Перезапустите:{' '}
            <Text style={styles.code}>npx expo start --clear</Text>
          </Text>
        </View>

        {/* Console Log Hint */}
        <View style={styles.hintCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.hintText}>
            Проверяйте консоль (терминал) для подробностей отправки SMS
          </Text>
        </View>
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
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
    flex: 1,
    textAlign: 'right',
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#007AFF',
  },
  codeBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 4,
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
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 32,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 12,
  },
});
