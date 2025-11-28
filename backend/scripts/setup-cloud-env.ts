// backend/scripts/setup-cloud-env.ts
// Интерактивный скрипт для добавления ключей Yandex Cloud и VK Cloud

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n🔧 Настройка переменных окружения для Yandex Cloud и VK Cloud\n');
  console.log('='.repeat(70));

  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  // Читаем существующий .env или создаем новый
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    console.log('✅ Файл .env найден\n');
  } else {
    console.log('⚠️  Файл .env не найден, будет создан новый\n');
  }

  const vars: Record<string, string> = {};

  // Yandex Cloud
  console.log('🟡 YANDEX CLOUD VIDEO\n');
  
  vars.YANDEX_OAUTH_TOKEN = await question('YANDEX_OAUTH_TOKEN: ');
  vars.YANDEX_FOLDER_ID = await question('YANDEX_FOLDER_ID: ');
  vars.YANDEX_VIDEO_CHANNEL_ID = await question('YANDEX_VIDEO_CHANNEL_ID: ');
  
  const cdnDomain = await question('YANDEX_CDN_DOMAIN (опционально, Enter для пропуска): ');
  if (cdnDomain.trim()) {
    vars.YANDEX_CDN_DOMAIN = cdnDomain.trim();
  }

  // VK Cloud
  console.log('\n🔵 VK CLOUD STORAGE (Backups)\n');
  
  const vkEndpoint = await question('VK_CLOUD_ENDPOINT (Enter для https://hb.ru-msk.vkcs.cloud): ');
  vars.VK_CLOUD_ENDPOINT = vkEndpoint.trim() || 'https://hb.ru-msk.vkcs.cloud';
  
  const vkRegion = await question('VK_CLOUD_REGION (Enter для ru-msk): ');
  vars.VK_CLOUD_REGION = vkRegion.trim() || 'ru-msk';
  
  vars.VK_CLOUD_ACCESS_KEY = await question('VK_CLOUD_ACCESS_KEY: ');
  vars.VK_CLOUD_SECRET_KEY = await question('VK_CLOUD_SECRET_KEY: ');
  
  const vkBucket = await question('VK_CLOUD_BUCKET_NAME (Enter для 360automvp-backups): ');
  vars.VK_CLOUD_BUCKET_NAME = vkBucket.trim() || '360automvp-backups';

  // Удаляем старые значения если есть
  const lines = envContent.split('\n');
  const newLines: string[] = [];
  const skipVars = new Set(Object.keys(vars));

  for (const line of lines) {
    let skip = false;
    for (const varName of skipVars) {
      if (line.startsWith(`${varName}=`)) {
        skip = true;
        break;
      }
    }
    if (!skip) {
      newLines.push(line);
    }
  }

  // Добавляем новые переменные
  if (!envContent.includes('# YANDEX CLOUD VIDEO')) {
    newLines.push('');
    newLines.push('# ============================================');
    newLines.push('# YANDEX CLOUD VIDEO');
    newLines.push('# ============================================');
  }

  newLines.push(`YANDEX_OAUTH_TOKEN=${vars.YANDEX_OAUTH_TOKEN}`);
  newLines.push(`YANDEX_FOLDER_ID=${vars.YANDEX_FOLDER_ID}`);
  newLines.push(`YANDEX_VIDEO_CHANNEL_ID=${vars.YANDEX_VIDEO_CHANNEL_ID}`);
  if (vars.YANDEX_CDN_DOMAIN) {
    newLines.push(`YANDEX_CDN_DOMAIN=${vars.YANDEX_CDN_DOMAIN}`);
  }

  if (!envContent.includes('# VK CLOUD STORAGE')) {
    newLines.push('');
    newLines.push('# ============================================');
    newLines.push('# VK CLOUD STORAGE (Backups)');
    newLines.push('# ============================================');
  }

  newLines.push(`VK_CLOUD_ENDPOINT=${vars.VK_CLOUD_ENDPOINT}`);
  newLines.push(`VK_CLOUD_REGION=${vars.VK_CLOUD_REGION}`);
  newLines.push(`VK_CLOUD_ACCESS_KEY=${vars.VK_CLOUD_ACCESS_KEY}`);
  newLines.push(`VK_CLOUD_SECRET_KEY=${vars.VK_CLOUD_SECRET_KEY}`);
  newLines.push(`VK_CLOUD_BUCKET_NAME=${vars.VK_CLOUD_BUCKET_NAME}`);

  // Сохраняем
  const newContent = newLines.join('\n');
  fs.writeFileSync(envPath, newContent, 'utf-8');

  console.log('\n✅ Переменные добавлены в .env файл!\n');
  console.log('📋 Проверка настройки...\n');

  rl.close();

  // Запускаем проверку
  require('child_process').exec('npm run check-cloud-env', (error: any, stdout: string) => {
    if (error) {
      console.error('Ошибка проверки:', error);
      return;
    }
    console.log(stdout);
  });
}

main().catch((error) => {
  console.error('Ошибка:', error);
  rl.close();
  process.exit(1);
});

