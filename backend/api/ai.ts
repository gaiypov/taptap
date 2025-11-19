// backend/api/ai.ts
// AI СЕРВИСЫ — API ключи ТОЛЬКО здесь!
import express, { Request, Response } from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// API ключи из переменных окружения (ТОЛЬКО на бэкенде!)
const AI_CONFIG = {
  openai: process.env.OPENAI_API_KEY || '',
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  google: process.env.GOOGLE_VISION_API_KEY || '',
  roboflow: process.env.ROBOFLOW_API_KEY || '',
};

// Проверка наличия ключей
function checkAPIKey(provider: 'openai' | 'anthropic' | 'google' | 'roboflow'): boolean {
  const key = AI_CONFIG[provider];
  return !!key && key.length > 0;
}

/**
 * POST /api/ai/claude
 * Анализ через Claude AI
 */
router.post('/claude', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!checkAPIKey('anthropic')) {
      return res.status(500).json({
        success: false,
        error: 'Claude AI service not configured',
      });
    }

    const { frames, options } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Frames array is required',
      });
    }

    // Нормализуем изображения
    const normalizedFrames = frames.map((frame: string) => {
      if (frame.startsWith('data:')) {
        const base64 = frame.split(',')[1];
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64,
          },
        };
      }
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: frame,
        },
      };
    });

    const prompt = options?.prompt || 'Проанализируй изображения автомобиля и определи марку, модель, год, состояние, повреждения и примерную стоимость.';

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: options?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: [
              ...normalizedFrames,
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_CONFIG.anthropic,
          'anthropic-version': '2023-06-01',
        },
        timeout: 30000,
      }
    );

    const aiResponse = response.data.content[0].text;
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let result;
    try {
      result = JSON.parse(cleanedResponse);
    } catch {
      result = { text: aiResponse };
    }

    res.json({
      success: true,
      result,
    });

  } catch (error: any) {
    console.error('[AI API] Claude error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.error?.message || error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze with Claude',
    });
  }
});

/**
 * POST /api/ai/openai
 * Анализ через OpenAI
 */
router.post('/openai', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!checkAPIKey('openai')) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI service not configured',
      });
    }

    const { frames, analysisType, options } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Frames array is required',
      });
    }

    // Нормализуем изображения
    const imageUrls = frames.map((frame: string) => {
      if (frame.startsWith('data:')) {
        return frame;
      }
      return `data:image/jpeg;base64,${frame}`;
    });

    const prompt = options?.prompt || 'Проанализируй изображения автомобиля и определи марку, модель, год, состояние, повреждения и примерную стоимость.';

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: options?.model || 'gpt-4o',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              ...imageUrls.map((url: string) => ({
                type: 'image_url',
                image_url: {
                  url,
                  detail: 'high',
                },
              })),
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.openai}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0].message.content;
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch {
      result = { text: content };
    }

    res.json({
      success: true,
      result,
    });

  } catch (error: any) {
    console.error('[AI API] OpenAI error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.error?.message || error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze with OpenAI',
    });
  }
});

/**
 * POST /api/ai/google-vision
 * Анализ через Google Vision API
 * Поддерживает новый формат с features массивом
 */
router.post('/google-vision', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!checkAPIKey('google')) {
      return res.status(500).json({
        success: false,
        error: 'Google Vision service not configured',
      });
    }

    const { imageBase64, features: requestedFeatures, analysisType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'imageBase64 is required',
      });
    }

    // Извлекаем base64 из data URL если нужно
    const base64Content = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    // Определяем features: новый формат (массив) или старый (analysisType)
    let features: any[] = [];
    
    if (requestedFeatures && Array.isArray(requestedFeatures)) {
      // Новый формат: ['labels', 'ocr', 'damages', 'full']
      const featureMap: { [key: string]: string } = {
        'labels': 'LABEL_DETECTION',
        'objects': 'OBJECT_LOCALIZATION',
        'ocr': 'TEXT_DETECTION',
        'damages': 'OBJECT_LOCALIZATION', // Для damages используем object detection
        'full': 'LABEL_DETECTION',
      };
      
      requestedFeatures.forEach((feature: string) => {
        const visionFeature = featureMap[feature.toLowerCase()];
        if (visionFeature) {
          if (feature === 'full') {
            features.push(
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'TEXT_DETECTION', maxResults: 50 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
              { type: 'WEB_DETECTION', maxResults: 10 }
            );
          } else if (feature === 'ocr') {
            features.push(
              { type: 'TEXT_DETECTION', maxResults: 50 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
            );
          } else if (feature === 'damages') {
            features.push(
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
              { type: 'LABEL_DETECTION', maxResults: 20 }
            );
          } else {
            features.push({ type: visionFeature, maxResults: 20 });
          }
        }
      });
    } else if (analysisType) {
      // Старый формат (обратная совместимость)
      switch (analysisType) {
        case 'full':
          features.push(
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'TEXT_DETECTION', maxResults: 50 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
            { type: 'WEB_DETECTION', maxResults: 10 }
          );
          break;
        case 'ocr':
          features.push(
            { type: 'TEXT_DETECTION', maxResults: 50 },
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
          );
          break;
        case 'object_detection':
          features.push(
            { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
            { type: 'LABEL_DETECTION', maxResults: 20 }
          );
          break;
        case 'text_detection':
          features.push({ type: 'TEXT_DETECTION', maxResults: 50 });
          break;
        default:
          features.push({ type: 'LABEL_DETECTION', maxResults: 20 });
      }
    } else {
      // По умолчанию
      features.push({ type: 'LABEL_DETECTION', maxResults: 20 });
    }

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${AI_CONFIG.google}`,
      {
        requests: [
          {
            image: { content: base64Content },
            features,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const annotations = response.data.responses[0];
    
    // Определяем тип анализа из запроса
    const detectedType = requestedFeatures?.[0] || analysisType || 'full';
    
    // Парсим результат в зависимости от типа анализа
    let result: any = {};
    
    if (detectedType === 'ocr' || requestedFeatures?.includes('ocr')) {
      const textAnnotations = annotations.textAnnotations || [];
      const fullText = textAnnotations[0]?.description || '';
      const mileageMatch = fullText.match(/(\d{1,6})\s*(км|km|тыс|тысяч)/i);
      const mileage = mileageMatch ? parseInt(mileageMatch[1]) * 1000 : 0;
      const yearMatch = fullText.match(/(19|20)\d{2}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : 2020;
      
      result = {
        mileage,
        year,
        text: fullText,
        fullText,
        extractedText: textAnnotations.slice(1).map((text: any) => text.description),
      };
    } else if (detectedType === 'damages' || requestedFeatures?.includes('damages')) {
      const labels = annotations.labelAnnotations || [];
      const objects = annotations.localizedObjectAnnotations || [];
      
      // Ищем повреждения в labels
      const damageKeywords = ['scratch', 'dent', 'damage', 'crack', 'rust', 'царапина', 'вмятина', 'трещина'];
      const damages = labels
        .filter((label: any) => 
          damageKeywords.some(keyword => 
            label.description?.toLowerCase().includes(keyword.toLowerCase())
          )
        )
        .map((label: any) => ({
          type: label.description,
          severity: label.score > 0.8 ? 'major' : label.score > 0.6 ? 'minor' : 'minor',
          confidence: label.score,
        }));
      
      // Вычисляем quality score на основе количества повреждений
      const qualityScore = Math.max(0, 100 - (damages.length * 10));
      
      result = {
        labels: labels.map((label: any) => label.description),
        objects: objects.map((obj: any) => ({
          name: obj.name,
          score: obj.score,
        })),
        damages,
        qualityScore,
      };
    } else if (detectedType === 'objects' || requestedFeatures?.includes('objects')) {
      const labels = annotations.labelAnnotations || [];
      const objects = annotations.localizedObjectAnnotations || [];
      
      result = {
        labels: labels.map((label: any) => label.description),
        objects: objects.map((obj: any) => ({
          name: obj.name,
          score: obj.score,
        })),
      };
    } else if (detectedType === 'labels' || requestedFeatures?.includes('labels')) {
      const labels = annotations.labelAnnotations || [];
      
      result = {
        labels: labels.map((label: any) => label.description),
      };
    } else {
      // Полный анализ (full)
      result = {
        labels: (annotations.labelAnnotations || []).map((label: any) => label.description),
        objects: (annotations.localizedObjectAnnotations || []).map((obj: any) => ({
          name: obj.name,
          score: obj.score,
        })),
        text: annotations.textAnnotations?.[0]?.description || '',
      };
    }

    res.json({
      success: true,
      result,
    });

  } catch (error: any) {
    console.error('[AI API] Google Vision error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.error?.message || error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze with Google Vision',
    });
  }
});

/**
 * POST /api/ai/roboflow
 * Анализ через Roboflow YOLO
 */
router.post('/roboflow', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!checkAPIKey('roboflow')) {
      return res.status(500).json({
        success: false,
        error: 'Roboflow service not configured',
      });
    }

    const { imageBase64, modelId, version } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'imageBase64 is required',
      });
    }

    // Извлекаем base64 из data URL если нужно
    const base64Content = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const url = `https://detect.roboflow.com/${modelId || 'car-damage-detection'}/${version || 1}`;
    
    const response = await axios.post(
      url,
      new URLSearchParams({
        api_key: AI_CONFIG.roboflow,
        image: base64Content,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      }
    );

    const detections = (response.data.predictions || []).map((pred: any) => ({
      class: pred.class,
      confidence: pred.confidence,
      x: pred.x,
      y: pred.y,
      width: pred.width,
      height: pred.height,
    }));

    res.json({
      success: true,
      result: {
        detections,
        image: {
          width: response.data.image?.width || 1920,
          height: response.data.image?.height || 1080,
        },
        predictions: detections.length,
      },
    });

  } catch (error: any) {
    console.error('[AI API] Roboflow error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.error?.message || error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze with Roboflow',
    });
  }
});

export default router;

