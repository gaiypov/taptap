// components/Auth/SMSAuthScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../../services/auth';

interface SMSAuthScreenProps {
  onAuthSuccess?: () => void;
}

export function SMSAuthScreen({ onAuthSuccess }: SMSAuthScreenProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [codeLength, setCodeLength] = useState(6);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const formatPhone = (phone: string) => {
    // Убираем все кроме цифр
    const digits = phone.replace(/\D/g, '');
    
    // Если начинается с 996, добавляем +
    if (digits.startsWith('996')) {
      return '+' + digits;
    }
    
    // Если начинается с 0, заменяем на +996
    if (digits.startsWith('0')) {
      return '+996' + digits.substring(1);
    }
    
    // Если начинается с 5, добавляем +996
    if (digits.startsWith('5')) {
      return '+996' + digits;
    }
    
    return '+' + digits;
  };

  const handleSendCode = async () => {
    const formattedPhone = formatPhone(phone);
    
    // Проверяем что номер корректно отформатирован
    if (!formattedPhone || formattedPhone.length < 13 || !formattedPhone.startsWith('+996')) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    // Проверяем согласие с условиями
    if (!agreedToTerms) {
      Alert.alert('Согласие с условиями', 'Необходимо согласиться с условиями использования и политикой конфиденциальности');
      return;
    }

    try {
      setLoading(true);
      const result = await auth.sendVerificationCode(formattedPhone);

      const messages: string[] = [];
      if (result.warning) {
        messages.push(result.warning);
      }
      if (result.testCode) {
        messages.push(`Тестовый код: ${result.testCode}`);
      }

      if (result.success) {
        if (result.codeLength) {
          setCodeLength(result.codeLength);
        }
        setStep('code');
        setCode('');
        setInfoMessage(messages.join('\n'));
        Alert.alert(
          'Код отправлен',
          messages.length > 0
            ? messages.join('\n')
            : 'Проверьте SMS на вашем телефоне и введите код'
        );
      } else {
        setInfoMessage(messages.join('\n'));
        Alert.alert('Ошибка', result.error || 'Не удалось отправить код');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== codeLength) {
      Alert.alert('Ошибка', `Введите ${codeLength}-значный код`);
      return;
    }

    try {
      setLoading(true);
      const formattedPhone = formatPhone(phone);
      const result = await auth.verifyCode(formattedPhone, code);

      if (result.success) {
        if (result.codeLength) {
          setCodeLength(result.codeLength);
        }
        Alert.alert('Успех', 'Авторизация прошла успешно!');
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      } else {
        Alert.alert('Ошибка', result.error || 'Неверный код');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>360°</Text>
          <Text style={styles.subtitle}>
            {step === 'phone' ? 'Введите номер телефона' : 'Введите код из SMS'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'phone' ? (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={24} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+996 555 123 456"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>

          {/* Согласие с условиями */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                Я согласен с{' '}
                <Text style={styles.termsLink}>условиями использования</Text>
                {' '}и{' '}
                <Text style={styles.termsLink}>политикой конфиденциальности</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Отправка...' : 'Отправить код'}
            </Text>
          </TouchableOpacity>

          {infoMessage ? (
            <Text style={styles.infoText}>{infoMessage}</Text>
          ) : null}
        </>
      ) : (
            <>
              <View style={styles.phoneInfo}>
                <Text style={styles.phoneText}>Код отправлен на</Text>
                <Text style={styles.phoneNumber}>{formatPhone(phone)}</Text>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={24} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={'*'.repeat(codeLength) || '123456'}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={codeLength}
                  textAlign="center"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, (loading || code.length !== codeLength) && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading || code.length !== codeLength}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Проверка...' : 'Подтвердить'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={loading}
              >
                <Text style={styles.resendText}>Отправить код повторно</Text>
              </TouchableOpacity>

              {infoMessage ? (
                <Text style={styles.infoText}>{infoMessage}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep('phone');
                  setCode('');
                  setInfoMessage('');
                }}
              >
                <Text style={styles.backText}>Изменить номер</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    color: '#FFD60A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  phoneInfo: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
  },
  phoneText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    color: '#666',
    fontSize: 14,
  },
  termsContainer: {
    marginVertical: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8E8E93',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  termsLink: {
    color: '#FF3B30',
    textDecorationLine: 'underline',
  },
});
