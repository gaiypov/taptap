// backend/scripts/check-env.ts
// Скрипт для проверки переменных окружения
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Загружаем .env файл
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });

interface EnvCheck {
  name: string;
  required: boolean;
  value: string | undefined;
  status: 'ok' | 'missing' | 'empty';
}

const checks: EnvCheck[] = [
  {
    name: 'APIVIDEO_API_KEY',
    required: true,
    value: process.env.APIVIDEO_API_KEY || process.env.API_VIDEO_KEY,
    status: 'ok',
  },
  {
    name: 'GOOGLE_VISION_API_KEY',
    required: true,
    value: process.env.GOOGLE_VISION_API_KEY,
    status: 'ok',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    value: process.env.JWT_SECRET,
    status: 'ok',
  },
  {
    name: 'SUPABASE_URL',
    required: true,
    value: process.env.SUPABASE_URL,
    status: 'ok',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    status: 'ok',
  },
];

// Проверяем статус
checks.forEach((check) => {
  if (!check.value) {
    check.status = 'missing';
  } else if (check.value.includes('your-') || check.value.includes('change-this')) {
    check.status = 'empty';
  }
});

// Выводим результаты
console.log('\n🔍 Проверка переменных окружения бэкенда\n');
console.log('📁 Файл .env:', envPath);
console.log('📄 Файл существует:', fs.existsSync(envPath) ? '✅ Да' : '❌ Нет\n');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  Файл .env не найден!');
  console.log('   Создайте файл backend/.env на основе backend/env-config.txt\n');
}

console.log('📋 Результаты проверки:\n');

let hasErrors = false;

checks.forEach((check) => {
  const icon = check.status === 'ok' ? '✅' : check.required ? '❌' : '⚠️';
  const statusText = 
    check.status === 'ok' ? 'OK' :
    check.status === 'missing' ? 'ОТСУТСТВУЕТ' :
    'НЕ НАСТРОЕН';

  console.log(`${icon} ${check.name.padEnd(30)} ${statusText}`);

  if (check.status !== 'ok' && check.required) {
    hasErrors = true;
    if (check.name === 'APIVIDEO_API_KEY') {
      console.log('   💡 Добавьте в backend/.env:');
      console.log('   APIVIDEO_API_KEY=your_api_key_here');
      console.log('   Получите ключ на https://dashboard.api.video/\n');
    }
    if (check.name === 'GOOGLE_VISION_API_KEY') {
      console.log('   💡 Добавьте в backend/.env:');
      console.log('   GOOGLE_VISION_API_KEY=your_api_key_here');
      console.log('   Получите ключ на https://console.cloud.google.com/');
      console.log('   Включите Cloud Vision API в проекте\n');
    }
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('\n❌ Обнаружены проблемы с конфигурацией!');
  console.log('   Исправьте ошибки перед запуском сервера.\n');
  process.exit(1);
} else {
  console.log('\n✅ Все обязательные переменные окружения настроены!\n');
  process.exit(0);
}

