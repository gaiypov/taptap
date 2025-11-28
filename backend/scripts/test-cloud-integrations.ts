// backend/scripts/test-cloud-integrations.ts
// Тестирование интеграций Yandex Cloud и VK Cloud

import 'dotenv/config';
import { iamTokenManager } from '../services/yandex/iamToken';
import { getYandexVideoService } from '../services/yandex/yandexCloudVideo';
import { yandexCDN } from '../services/yandex/yandexCDN';

async function testIntegrations() {
  console.log('\n🧪 Тестирование Cloud Integrations\n');
  console.log('='.repeat(70));

  // Тест 1: IAM Token
  console.log('\n1️⃣ Тест IAM Token...');
  try {
    const token = await iamTokenManager.getToken();
    console.log('✅ IAM Token получен успешно!');
    console.log(`   Token: ${token.substring(0, 30)}...`);
    const info = iamTokenManager.getTokenInfo();
    if (info.expiresAt) {
      console.log(`   Expires at: ${info.expiresAt.toISOString()}`);
    }
  } catch (error: any) {
    console.error('❌ Ошибка получения IAM токена:', error.message);
    return false;
  }

  // Тест 2: Yandex Cloud Video Service
  console.log('\n2️⃣ Тест Yandex Cloud Video Service...');
  try {
    const videoService = getYandexVideoService();
    console.log('✅ Yandex Cloud Video Service инициализирован!');
  } catch (error: any) {
    console.error('❌ Ошибка инициализации сервиса:', error.message);
    return false;
  }

  // Тест 3: CDN Service
  console.log('\n3️⃣ Тест CDN Service...');
  try {
    const isConfigured = yandexCDN.isConfigured();
    if (isConfigured) {
      console.log('✅ CDN настроен!');
      console.log(`   Video URL example: ${yandexCDN.getVideoURL('test-video-id')}`);
    } else {
      console.log('⚠️  CDN не настроен (опционально)');
    }
  } catch (error: any) {
    console.error('❌ Ошибка CDN:', error.message);
  }

  // Тест 4: VK Cloud (если настроен)
  console.log('\n4️⃣ Тест VK Cloud Storage...');
  try {
    const { getVKCloudStorage } = require('../services/vkCloud/vkCloudStorage');
    const vkStorage = getVKCloudStorage();
    console.log('✅ VK Cloud Storage инициализирован!');
    
    // Попробуем список файлов (может быть пустым)
    try {
      const files = await vkStorage.listFiles('', 10);
      console.log(`   Files in bucket: ${files.length}`);
    } catch (error: any) {
      console.log('⚠️  Не удалось получить список файлов (возможно, bucket пустой)');
    }
  } catch (error: any) {
    if (error.message.includes('not fully configured')) {
      console.log('⚠️  VK Cloud не настроен (опционально для тестирования)');
    } else {
      console.error('❌ Ошибка VK Cloud:', error.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Все основные интеграции работают!\n');
  return true;
}

testIntegrations().catch((error) => {
  console.error('\n❌ Критическая ошибка:', error);
  process.exit(1);
});

