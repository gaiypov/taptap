// backend/scripts/check-sms.ts
// Скрипт для проверки конфигурации SMS

import { config } from 'dotenv';
import path from 'path';
import { getSmsStatus } from '../services/smsService.js';

// Загружаем .env из корня backend
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });

async function checkSMS() {
  console.log('🔍 Проверка конфигурации SMS...\n');

  const status = await getSmsStatus();

  console.log('📊 Статус SMS провайдера:');
  console.log(`   Настроен: ${status.configured ? '✅ Да' : '❌ Нет'}`);
  console.log(`   Провайдер: ${status.provider}`);
  console.log(`   Отправитель: ${status.sender || 'не настроен'}`);
  console.log(`   Баланс: ${status.balance !== null ? status.balance : 'неизвестно'}`);
  console.log(`   Тестовые коды: ${status.exposesTestCodes ? 'включены' : 'выключены'}\n`);

  if (!status.configured) {
    console.error('❌ SMS провайдер НЕ настроен!');
    console.error('\nДобавьте в backend/.env:');
    console.error('NIKITA_SMS_LOGIN=your_login');
    console.error('NIKITA_SMS_PASSWORD=your_password');
    console.error('NIKITA_SMS_SENDER=your_sender');
    console.error('NIKITA_SMS_API_URL=https://smspro.nikita.kg/api/message\n');
    process.exit(1);
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`🌍 Режим: ${nodeEnv}`);

  if (nodeEnv === 'development') {
    console.warn('⚠️  В development режиме SMS не отправляется реально!');
    console.warn('   Для реальной отправки установите NODE_ENV=production\n');
  } else {
    console.log('✅ Production режим - SMS будет отправляться реально\n');
  }

  console.log('✅ Конфигурация SMS в порядке!');
}

checkSMS().catch((error) => {
  console.error('❌ Ошибка при проверке SMS:', error);
  process.exit(1);
});

