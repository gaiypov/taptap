// Тестовый скрипт для проверки api.video
const axios = require('axios');
require('dotenv').config();

const API_VIDEO_BASE = 'https://ws.api.video';
const API_VIDEO_KEY = process.env.APIVIDEO_API_KEY || process.env.API_VIDEO_KEY;

async function testApiVideo() {
  console.log('🔑 API ключ:', API_VIDEO_KEY ? `${API_VIDEO_KEY.substring(0, 10)}...${API_VIDEO_KEY.substring(API_VIDEO_KEY.length - 4)}` : '❌ отсутствует');
  console.log('🌐 URL:', `${API_VIDEO_BASE}/videos`);
  console.log('');

  try {
    const response = await axios.post(
      `${API_VIDEO_BASE}/videos`,
      {
        title: 'Test Video 360Auto',
        description: 'Test description',
        public: true,
        tags: ['test', '360auto'],
      },
      {
        headers: {
          'Authorization': `Bearer ${API_VIDEO_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    console.log('✅ Успешный ответ!');
    console.log('📊 Статус:', response.status);
    console.log('');
    console.log('📦 Полный ответ:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('🔍 Структура ответа:');
    console.log('  - videoId:', response.data.videoId || '❌ отсутствует');
    console.log('  - source:', response.data.source ? '✅ присутствует' : '❌ отсутствует');
    if (response.data.source) {
      console.log('  - source.token:', response.data.source.token || '❌ отсутствует');
      console.log('  - source.uploadUrl:', response.data.source.uploadUrl || '❌ отсутствует');
      console.log('  - Все ключи в source:', Object.keys(response.data.source));
    }
    console.log('  - Все ключи в response.data:', Object.keys(response.data));
  } catch (error) {
    console.error('❌ Ошибка:');
    if (error.response) {
      console.error('  Статус:', error.response.status);
      console.error('  Данные:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('  Сообщение:', error.message);
    }
  }
}

testApiVideo();

