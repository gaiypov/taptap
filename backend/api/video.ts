// backend/api/video.ts
// API.VIDEO 2025 - Безопасный delegated upload
import axios from 'axios';
import express, { Request, Response } from 'express';

const router = express.Router();

const API_VIDEO_BASE = 'https://ws.api.video';
const API_VIDEO_KEY = process.env.APIVIDEO_API_KEY || process.env.API_VIDEO_KEY;

// Проверка при загрузке модуля
if (!API_VIDEO_KEY) {
  console.error('❌ APIVIDEO_API_KEY не задан в .env файле!');
  console.error('   Добавьте в backend/.env:');
  console.error('   APIVIDEO_API_KEY=your_api_key_here');
  console.error('   Или используйте переменную API_VIDEO_KEY');
} else {
  const keyLength = API_VIDEO_KEY.length;
  const keyPreview = keyLength > 20 
    ? `${API_VIDEO_KEY.substring(0, 10)}...${API_VIDEO_KEY.substring(keyLength - 4)}`
    : `${API_VIDEO_KEY.substring(0, 10)}...`;
  console.log('✅ [Video API] API ключ загружен:', keyPreview, `(длина: ${keyLength})`);
  console.log('✅ [Video API] Базовый URL:', API_VIDEO_BASE);
}

/**
 * POST /api/video/create
 * Создать видео на api.video и вернуть upload token
 * Клиент загружает напрямую на api.video (delegated upload)
 */
router.post('/create', async (_req: Request, res: Response) => {
  try {
    if (!API_VIDEO_KEY) {
      console.error('[Video API] ❌ API ключ не настроен!');
      return res.status(500).json({
        success: false,
        error: 'API Video service not configured',
      });
    }

    console.log('[Video API] ==========================================');
    console.log('[Video API] 🔐 Создание delegated upload token');

    // Для delegated upload создаём ТОЛЬКО токен
    // Видео будет создано автоматически при загрузке
    const tokenResponse = await axios.post(
      `${API_VIDEO_BASE}/upload-tokens`,
      { ttl: 3600 }, // 1 час
      {
        headers: {
          'Authorization': `Bearer ${API_VIDEO_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const uploadToken = tokenResponse.data.token;

    if (!uploadToken) {
      throw new Error('Failed to create upload token');
    }

    console.log('[Video API] ✅ Upload token создан:', uploadToken.substring(0, 10) + '...');
    console.log('[Video API] ==========================================');

    // videoId придёт из ответа при загрузке на клиенте
    res.json({
      success: true,
      uploadToken,
    });
  } catch (error: any) {
    console.error('[Video API] ==========================================');
    console.error('[Video API] ❌ ОШИБКА при создании видео');
    console.error('[Video API] ─────────────────────────────────────────');
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      const responseData = error.response?.data;
      
      console.error('[Video API] 📊 Статус ошибки:', status);
      console.error('[Video API] 💬 Сообщение:', message);
      console.error('[Video API] 📦 Полный ответ об ошибке:', JSON.stringify(responseData, null, 2));
      console.error('[Video API] 🔍 Заголовки ответа:', JSON.stringify(error.response?.headers, null, 2));
      console.error('[Video API] 🌐 URL запроса:', error.config?.url);
      console.error('[Video API] 📝 Тело запроса:', error.config?.data);
      
      console.error('[Video API] ==========================================');
      
      return res.status(status).json({
        success: false,
        error: message || 'Failed to create video',
        details: responseData,
      });
    }

    console.error('[Video API] 💥 Неожиданная ошибка:', error);
    console.error('[Video API] 📚 Stack trace:', error.stack);
    console.error('[Video API] ==========================================');

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create video',
    });
  }
});

export default router;

