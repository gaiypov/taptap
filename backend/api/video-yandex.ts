// backend/api/video-yandex.ts
// Yandex Cloud Video API endpoints

import express, { Request, Response } from 'express';
import { getYandexVideoService } from '../services/yandex/yandexCloudVideo';
import { yandexCDN } from '../services/yandex/yandexCDN';
import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../src/middleware/rateLimit';
import { asyncHandler } from '../src/middleware/errorHandler';

const router = express.Router();

/**
 * POST /api/video-yandex/create
 * Create video and get upload URL
 */
router.post(
  '/create',
  authenticateToken,
  uploadLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { title, fileSize, fileName, isPublic = true, description } = req.body;

    if (!title || !fileSize || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, fileSize, fileName',
      });
    }

    const yandexVideo = getYandexVideoService();
    const result = await yandexVideo.createVideo({
      title,
      fileSize: parseInt(fileSize, 10),
      fileName,
      isPublic,
      description,
    });

    res.json({
      success: true,
      data: {
        videoId: result.videoId,
        uploadUrl: result.uploadUrl,
        status: result.status,
      },
    });
  })
);

/**
 * GET /api/video-yandex/status/:videoId
 * Get video processing status
 */
router.get(
  '/status/:videoId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const yandexVideo = getYandexVideoService();
    const status = await yandexVideo.getVideoStatus(videoId);

    // Use CDN URLs if configured
    const hlsUrl = yandexCDN.isConfigured()
      ? yandexCDN.getVideoURL(videoId)
      : status.hlsUrl;

    res.json({
      success: true,
      data: {
        videoId: status.id,
        status: status.status,
        duration: status.duration,
        hlsUrl,
        thumbnailUrl: status.thumbnailUrl || yandexCDN.getThumbnailURL(videoId),
        mp4Url: status.mp4Url || yandexCDN.getMP4URL(videoId),
      },
    });
  })
);

/**
 * POST /api/video-yandex/ai-features/:videoId
 * Enable AI features (subtitles, translation, summary)
 */
router.post(
  '/ai-features/:videoId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    const { enableSubtitles, enableTranslation, enableSummary, languages } = req.body;

    const yandexVideo = getYandexVideoService();

    const results: Record<string, boolean> = {};

    if (enableSubtitles) {
      try {
        await yandexVideo.enableSubtitles(videoId, languages?.source || 'ru');
        results.subtitles = true;
      } catch (error) {
        results.subtitles = false;
      }
    }

    if (enableTranslation) {
      try {
        await yandexVideo.enableTranslation(
          videoId,
          languages?.source || 'ru',
          languages?.target || ['kk', 'uz', 'ky'] // Kazakh, Uzbek, Kyrgyz
        );
        results.translation = true;
      } catch (error) {
        results.translation = false;
      }
    }

    if (enableSummary) {
      try {
        await yandexVideo.enableSummarization(videoId);
        results.summary = true;
      } catch (error) {
        results.summary = false;
      }
    }

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * DELETE /api/video-yandex/:videoId
 * Delete video
 */
router.delete(
  '/:videoId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const yandexVideo = getYandexVideoService();
    await yandexVideo.deleteVideo(videoId);

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  })
);

/**
 * GET /api/video-yandex/list
 * List videos (admin only)
 */
router.get(
  '/list',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 100;

    const yandexVideo = getYandexVideoService();
    const videos = await yandexVideo.listVideos(limit);

    res.json({
      success: true,
      data: {
        videos,
        count: videos.length,
      },
    });
  })
);

export default router;

