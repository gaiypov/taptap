// backend/scripts/test-sms.ts
// Скрипт для тестирования отправки SMS

import { config } from 'dotenv';
import { sendVerificationCodeSms } from '../services/smsService.js';

config();

async function testSMS() {
  console.log('🧪 Тестирование отправки SMS...\n');

  // Тестовый номер (замените на свой)
  const testPhone = process.argv[2] || '996555123456';
  const testCode = '1234';

  console.log(`📱 Тестовый номер: ${testPhone}`);
  console.log(`🔑 Тестовый код: ${testCode}`);
  console.log(`🌍 Режим: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    const result = await sendVerificationCodeSms(testPhone, testCode);

    console.log('\n📊 Результат:');
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Message ID: ${result.messageId || 'нет'}`);
    console.log(`   Test Code: ${result.testCode || 'нет'}`);
    console.log(`   Warning: ${result.warning || 'нет'}`);
    console.log(`   Error: ${result.error || 'нет'}`);

    if (result.success) {
      console.log('\n✅ SMS отправлено успешно!');
      if (result.testCode) {
        console.log(`   В development режиме используется testCode: ${result.testCode}`);
      }
    } else {
      console.log('\n❌ Ошибка отправки SMS:');
      console.log(`   ${result.error}`);
    }
  } catch (error: any) {
    console.error('\n❌ Критическая ошибка:', error.message);
    console.error(error.stack);
  }
}

testSMS();

