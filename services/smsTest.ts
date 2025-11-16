// Тест SMS сервиса
// Этот файл можно использовать для отладки SMS

import Constants from 'expo-constants';
import { SMSService } from './smsReal';

// Тестовая функция для проверки SMS
export async function testSMSService() {
  console.log('🧪 Testing SMS Service...');
  
  // Получаем конфигурацию
  const config = {
    login: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_LOGIN || 'superapp',
    password: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_PASSWORD || 
              process.env.EXPO_PUBLIC_SMS_PASSWORD || '',
    sender: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_SENDER || 'bat-bat.kg',
    apiUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_API_URL || 'https://smspro.nikita.kg/api/message'
  };
  
  console.log('📋 SMS Config:', {
    login: config.login,
    password: config.password ? '***' : 'NOT SET',
    sender: config.sender,
    apiUrl: config.apiUrl
  });
  
  // Создаем SMS сервис
  const smsService = new SMSService(config);
  
  // Тестируем отправку SMS
  const testPhone = '+996555123456';
  const testMessage = 'Тестовое сообщение от 360Auto';
  
  console.log('📱 Sending test SMS to:', testPhone);
  
  try {
    const result = await smsService.sendSMS(testPhone, testMessage);
    
    console.log('📤 SMS Result:', result);
    
    if (result.success) {
      console.log('✅ SMS sent successfully!');
      return { success: true, messageId: result.messageId };
    } else {
      console.log('❌ SMS failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.log('💥 SMS Error:', error);
    return { success: false, error: error.message };
  }
}

// Тест отправки кода верификации
export async function testVerificationCode() {
  console.log('🔑 Testing Verification Code...');
  
  const config = {
    login: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_LOGIN || 'superapp',
    password: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_PASSWORD || 
              process.env.EXPO_PUBLIC_SMS_PASSWORD || '',
    sender: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_SENDER || 'bat-bat.kg',
    apiUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_SMS_API_URL || 'https://smspro.nikita.kg/api/message'
  };
  
  const smsService = new SMSService(config);
  const testPhone = '+996555123456';
  
  console.log('📱 Sending verification code to:', testPhone);
  
  try {
    const result = await smsService.sendVerificationCode(testPhone);
    
    console.log('🔑 Verification Code Result:', result);
    
    if (result.success) {
      console.log('✅ Verification code sent successfully!');
      console.log('🔢 Test code:', result.testCode);
      return { success: true, testCode: result.testCode };
    } else {
      console.log('❌ Verification code failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.log('💥 Verification Code Error:', error);
    return { success: false, error: error.message };
  }
}

// Экспорт для использования в компонентах
export { SMSService };
