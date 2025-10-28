// Test SMS API with real keys
console.log('🧪 Testing SMS API with real keys...');

// Check environment variables
const smsLogin = process.env.EXPO_PUBLIC_SMS_LOGIN;
const smsPassword = process.env.EXPO_PUBLIC_SMS_PASSWORD;
const smsSender = process.env.EXPO_PUBLIC_SMS_SENDER;

console.log('📋 SMS Configuration:');
console.log(`   Login: ${smsLogin ? smsLogin.substring(0, 3) + '***' : 'не настроен'}`);
console.log(`   Password: ${smsPassword ? '***' + smsPassword.slice(-4) : 'не настроен'}`);
console.log(`   Sender: ${smsSender || 'не настроен'}`);

if (smsLogin && smsPassword) {
  console.log('✅ SMS API настроен!');
  console.log('🚀 Готов к отправке реальных SMS');
} else {
  console.log('❌ SMS API не настроен');
  console.log('💡 Добавьте EXPO_PUBLIC_SMS_LOGIN и EXPO_PUBLIC_SMS_PASSWORD в .env');
}

console.log('\n📱 Для тестирования:');
console.log('1. Откройте приложение');
console.log('2. Перейдите в профиль');
console.log('3. Введите номер телефона (например: 0555123456)');
console.log('4. Нажмите "Отправить код"');
console.log('5. Проверьте SMS на телефоне');
console.log('6. Введите полученный код');
