import { useTranslation } from '@/lib/i18n/useTranslation';
import { auth } from '@/services/auth';
import { AuthTrigger } from '@/types/auth';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import CodeInput from './CodeInput';
import LegalLinks from './LegalLinks';
import PhoneInput from './PhoneInput';

interface SMSAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trigger?: AuthTrigger;
}

export default function SMSAuthModal({
  visible,
  onClose,
  onSuccess,
  trigger = 'like',
}: SMSAuthModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [codeLength, setCodeLength] = useState(6);
  const [infoMessage, setInfoMessage] = useState('');

  // Reset timer when step changes
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleSendCode = async () => {
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    const result = await auth.sendVerificationCode(phone);

    const messages: string[] = [];
    if (result.warning) {
      messages.push(result.warning);
    }
    if (result.testCode) {
      messages.push(`Тестовый код: ${result.testCode}`);
    }

    if (result.success) {
      setCodeLength(result.codeLength ?? codeLength);
      setStep('code');
      setResendTimer(60);
      setCode('');
      setInfoMessage(messages.join('\n'));
    } else {
      setError(result.error || t('auth.errors.networkError'));
      setInfoMessage(messages.join('\n'));
    }

    setIsLoading(false);
  };

  const handleVerifyCode = async () => {
    setError('');
    setIsLoading(true);

    if (code.length !== codeLength) {
      setError(t('auth.errors.invalidCode'));
      setIsLoading(false);
      return;
    }

    const result = await auth.verifyCode(phone, code);

    if (result.success) {
      if (result.codeLength) {
        setCodeLength(result.codeLength);
      }
      onSuccess();
      onClose();
      // Reset state
      setStep('phone');
      setPhone('');
      setCode('');
    } else {
      setError(result.error || t('auth.errors.invalidCode'));
    }

    setIsLoading(false);
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setCode('');
    setError('');
    setInfoMessage('');
    setCodeLength(6);
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setCode('');
    setError('');
    setInfoMessage('');
    setCodeLength(6);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <BlurView intensity={90} tint="dark" style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modal}>
                {/* Handle */}
                <View style={styles.handle} />

                {/* Header */}
                <Text style={styles.title}>{t('auth.login.title')}</Text>
                <Text style={styles.subtitle}>
                  {t(`auth.triggers.${trigger}`)}
                </Text>

                {/* Content */}
                {step === 'phone' ? (
                  <>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      placeholder={t('auth.login.phonePlaceholder')}
                      error={error}
                    />

                    <Pressable
                      onPress={handleSendCode}
                      disabled={isLoading || phone.length < 10}
                      style={({ pressed }) => [
                        styles.button,
                        (isLoading || phone.length < 10) && styles.buttonDisabled,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>
                          {t('auth.login.buttonGetCode')}
                        </Text>
                      )}
                    </Pressable>

                    {infoMessage ? (
                      <Text style={styles.infoText}>{infoMessage}</Text>
                    ) : null}

                    <LegalLinks />
                  </>
                ) : (
                  <>
                    <View style={styles.codeHeader}>
                      <Text style={styles.codeSentText}>
                        {t('auth.login.codeSent')}
                      </Text>
                      <View style={styles.phoneRow}>
                        <Text style={styles.phoneText}>{phone}</Text>
                        <Pressable onPress={handleBackToPhone}>
                          <Text style={styles.editButton}>✏️</Text>
                        </Pressable>
                      </View>
                    </View>

                    <CodeInput
                      value={code}
                      onChange={setCode}
                      length={codeLength}
                      error={error}
                    />

                    <Pressable
                      onPress={handleVerifyCode}
                      disabled={isLoading || code.length !== codeLength}
                      style={({ pressed }) => [
                        styles.button,
                        (isLoading || code.length !== codeLength) && styles.buttonDisabled,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>
                          {t('auth.login.buttonVerify')}
                        </Text>
                      )}
                    </Pressable>

                    {infoMessage ? (
                      <Text style={styles.infoText}>{infoMessage}</Text>
                    ) : null}

                    {/* Resend */}
                    <View style={styles.resendContainer}>
                      {resendTimer > 0 ? (
                        <Text style={styles.resendTimer}>
                          {t('auth.login.resendTimer', {
                            seconds: resendTimer.toString(),
                          })}
                        </Text>
                      ) : (
                        <Pressable onPress={handleSendCode}>
                          <Text style={styles.resendButton}>
                            {t('auth.login.resendCode')}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </>
                )}

                {/* Cancel */}
                <Pressable onPress={handleClose} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </BlurView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    height: 56,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    color: '#FFD60A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  codeHeader: {
    marginBottom: 24,
  },
  codeSentText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    fontSize: 18,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendTimer: {
    fontSize: 14,
    color: '#8E8E93',
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
