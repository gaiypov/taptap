// backend/api/analyze.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateVideoFrames } from '../middleware/validation.js';
import {
  analyzeCarVideo,
  getAnalysisStatus,
  quickIdentifyCar,
  validateVideoQuality,
} from '../services/aiService.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const getRequestId = (req: express.Request): string | undefined =>
  (req as AuthenticatedRequest & { requestId?: string }).requestId;

const router = express.Router();

/**
 * POST /api/analyze-car
 * Анализирует автомобиль по кадрам видео
 */
router.post('/analyze-car', authenticateToken, validateVideoFrames, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { videoFrames, metadata } = req.body;
    const userId = req.user?.id;
    const requestId = getRequestId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован',
        code: 'NOT_AUTHENTICATED',
        requestId,
      });
    }

    console.log(`🚀 [${requestId}] Starting car analysis for user ${userId}`);
    console.log(`📊 [${requestId}] Processing ${videoFrames.length} frames`);

    // Вызов AI анализа на backend
    const result = await analyzeCarVideo(videoFrames, {
      userId,
      metadata,
      onProgress: (step: string, progress: number) => {
        // Отправляем прогресс через WebSocket (опционально)
        console.log(`📈 [${requestId}] ${step}: ${progress}%`);
      }
    });

    console.log(`✅ [${requestId}] Analysis completed for user ${userId}`);

    res.json({
      success: true,
      data: result,
      message: 'Анализ автомобиля завершен успешно',
      requestId,
    });

  } catch (error: any) {
    const requestId = getRequestId(req);
    console.error(`❌ [${requestId}] Car analysis error:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при анализе автомобиля',
      code: 'ANALYSIS_FAILED',
      requestId,
    });
  }
});

/**
 * POST /api/quick-identify
 * Быстрая идентификация автомобиля по одному изображению
 */
router.post('/quick-identify', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { imageBase64 } = req.body;
    const userId = req.user?.id;
    const requestId = getRequestId(req);

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Изображение не предоставлено',
        code: 'MISSING_IMAGE',
        requestId,
      });
    }

    console.log(`🔍 [${requestId}] Quick identify for user ${userId}`);

    const result = await quickIdentifyCar(imageBase64);

    res.json({
      success: true,
      data: result,
      message: 'Идентификация завершена',
      requestId,
    });

  } catch (error: any) {
    const requestId = getRequestId(req);
    console.error(`❌ [${requestId}] Quick identify error:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при идентификации',
      code: 'IDENTIFICATION_FAILED',
      requestId,
    });
  }
});

/**
 * POST /api/validate-video
 * Проверяет качество видео перед анализом
 */
router.post('/validate-video', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { videoMetadata } = req.body;
    const requestId = getRequestId(req);

    const validation = await validateVideoQuality(videoMetadata);

    res.json({
      success: true,
      data: validation,
      message: 'Проверка качества завершена',
      requestId,
    });

  } catch (error: any) {
    const requestId = getRequestId(req);
    console.error(`❌ [${requestId}] Video validation error:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при проверке видео',
      code: 'VALIDATION_FAILED',
      requestId,
    });
  }
});

/**
 * GET /api/analysis-status/:analysisId
 * Получает статус анализа по ID
 */
router.get('/analysis-status/:analysisId', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { analysisId } = req.params;
    const userId = req.user?.id;
    const requestId = getRequestId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован',
        code: 'NOT_AUTHENTICATED',
        requestId,
      });
    }

    const status = await getAnalysisStatus(analysisId, userId);

    res.json({
      success: true,
      data: status,
      requestId,
    });

  } catch (error: any) {
    const requestId = getRequestId(req);
    console.error(`❌ [${requestId}] Get analysis status error:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении статуса',
      code: 'STATUS_FAILED',
      requestId,
    });
  }
});

export default router;
