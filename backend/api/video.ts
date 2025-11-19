// backend/api/video.ts
// API.VIDEO 2025 - Безопасный delegated upload
import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const API_VIDEO_BASE = 'https://ws.api.video';
const API_VIDEO_KEY = process.env.APIVIDEO_API_KEY || process.env.API_VIDEO_KEY;

// Проверка при загрузке модуля
if (!API_VIDEO_KEY) {
  console.error('❌ APIVIDEO_API_KEY не задан в .env файле!');
  console.error('   Добавьте в backend/.env:');
  console.error('   APIVIDEO_API_KEY=your_api_key_here');
  console.error('   Или используйте переменную API_VIDEO_KEY');
}

/**
 * POST /api/video/create
 * Создать видео на api.video и вернуть upload token
 * Клиент загружает напрямую на api.video (delegated upload)
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    if (!API_VIDEO_KEY) {
      return res.status(500).json({
        success: false,
        error: 'API Video service not configured',
      });
    }

    const { title, description, tags } = req.body;

    const response = await axios.post(
      `${API_VIDEO_BASE}/videos`,
      {
        title: title || '360Auto Video',
        description: description || '',
        public: true,
        tags: tags || ['360auto', 'kyrgyzstan'],
      },
      {
        headers: {
          'Authorization': `Bearer ${API_VIDEO_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 секунд
      }
    );

    const { videoId, uploadToken } = response.data;

    if (!videoId || !uploadToken) {
      throw new Error('Invalid response from api.video');
    }

    res.json({
      success: true,
      videoId,
      uploadToken,
    });
  } catch (error: any) {
    console.error('[Video API] Error creating video:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      
      return res.status(status).json({
        success: false,
        error: message || 'Failed to create video',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create video',
    });
  }
});

export default router;

