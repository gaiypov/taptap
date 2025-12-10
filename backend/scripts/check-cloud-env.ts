// backend/scripts/check-cloud-env.ts
// Script to check Yandex Cloud and VK Cloud environment variables

import 'dotenv/config';

interface EnvCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  status: '✅' | '⚠️' | '❌';
  description: string;
}

const checks: EnvCheck[] = [
  // Yandex Cloud Video
  {
    name: 'YANDEX_OAUTH_TOKEN',
    value: process.env.YANDEX_OAUTH_TOKEN,
    required: true,
    status: process.env.YANDEX_OAUTH_TOKEN ? '✅' : '❌',
    description: 'OAuth token from https://oauth.yandex.ru/',
  },
  {
    name: 'YANDEX_FOLDER_ID',
    value: process.env.YANDEX_FOLDER_ID,
    required: true,
    status: process.env.YANDEX_FOLDER_ID ? '✅' : '❌',
    description: 'Folder ID in Yandex Cloud (where videos will be stored)',
  },
  {
    name: 'YANDEX_VIDEO_CHANNEL_ID',
    value: process.env.YANDEX_VIDEO_CHANNEL_ID,
    required: true,
    status: process.env.YANDEX_VIDEO_CHANNEL_ID ? '✅' : '❌',
    description: 'Video Channel ID in Yandex Cloud Video service',
  },
  {
    name: 'YANDEX_CDN_DOMAIN',
    value: process.env.YANDEX_CDN_DOMAIN,
    required: false,
    status: process.env.YANDEX_CDN_DOMAIN ? '✅' : '⚠️',
    description: 'CDN Domain (optional, for custom CDN)',
  },
  // VK Cloud Storage
  {
    name: 'VK_CLOUD_ENDPOINT',
    value: process.env.VK_CLOUD_ENDPOINT,
    required: true,
    status: process.env.VK_CLOUD_ENDPOINT ? '✅' : '❌',
    description: 'VK Cloud Object Storage endpoint (e.g., https://hb.ru-msk.vkcs.cloud)',
  },
  {
    name: 'VK_CLOUD_REGION',
    value: process.env.VK_CLOUD_REGION,
    required: true,
    status: process.env.VK_CLOUD_REGION ? '✅' : '❌',
    description: 'VK Cloud region (e.g., ru-msk)',
  },
  {
    name: 'VK_CLOUD_ACCESS_KEY',
    value: process.env.VK_CLOUD_ACCESS_KEY,
    required: true,
    status: process.env.VK_CLOUD_ACCESS_KEY ? '✅' : '❌',
    description: 'VK Cloud Access Key ID',
  },
  {
    name: 'VK_CLOUD_SECRET_KEY',
    value: process.env.VK_CLOUD_SECRET_KEY,
    required: true,
    status: process.env.VK_CLOUD_SECRET_KEY ? '✅' : '❌',
    description: 'VK Cloud Secret Access Key',
  },
  {
    name: 'VK_CLOUD_BUCKET_NAME',
    value: process.env.VK_CLOUD_BUCKET_NAME,
    required: true,
    status: process.env.VK_CLOUD_BUCKET_NAME ? '✅' : '❌',
    description: 'VK Cloud bucket name for backups',
  },
];

console.log('\n🔍 Cloud Services Environment Variables Check\n');
console.log('='.repeat(70));

let allRequired = true;

for (const check of checks) {
  const value = check.value ? (check.value.length > 20 ? check.value.substring(0, 20) + '...' : check.value) : 'NOT SET';
  const required = check.required ? '(REQUIRED)' : '(OPTIONAL)';
  
  console.log(`${check.status} ${check.name.padEnd(30)} ${required}`);
  console.log(`   Value: ${value}`);
  console.log(`   ${check.description}`);
  console.log('');

  if (check.required && !check.value) {
    allRequired = false;
  }
}

console.log('='.repeat(70));

if (allRequired) {
  console.log('\n✅ All required environment variables are set!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some required environment variables are missing!\n');
  console.log('📝 See docs/CLOUD_INTEGRATIONS_GUIDE.md for setup instructions\n');
  process.exit(1);
}

