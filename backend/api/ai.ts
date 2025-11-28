// backend/api/ai.ts
// AI СЕРВИСЫ — API ключи ТОЛЬКО здесь!
import express, { Request, Response } from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// ==============================================
// РАСШИРЕННАЯ КОНФИГУРАЦИЯ AI ПРОВАЙДЕРОВ
// ==============================================

// API ключи из переменных окружения (ТОЛЬКО на бэкенде!)
const AI_CONFIG = {
  openai: process.env.OPENAI_API_KEY || '',
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  google: process.env.GOOGLE_VISION_API_KEY || '',
  roboflow: process.env.ROBOFLOW_API_KEY || '',
  // НОВЫЕ ПРОВАЙДЕРЫ
  yandexGpt: process.env.YANDEX_GPT_API_KEY || '',
  yandexCloud: {
    folderId: process.env.YANDEX_CLOUD_FOLDER_ID || '',
    iamToken: process.env.YANDEX_IAM_TOKEN || '',  // или OAuth token
    oauthToken: process.env.YANDEX_OAUTH_TOKEN || '',
  },
};

// Стоимость операций (USD) для выбора оптимального провайдера
const COST_RATES = {
  claude: {
    textGeneration: 0.015,      // за запрос ~1000 токенов
    imageAnalysis: 0.02,        // за изображение
  },
  openai: {
    textGeneration: 0.01,
    imageAnalysis: 0.01,
  },
  yandexGpt: {
    textGeneration: 0.002,      // В 7 раз дешевле Claude!
    lite: 0.002,
    pro: 0.005,
  },
  googleVision: {
    safeSearch: 0.0015,
    ocr: 0.0015,
    labels: 0.0015,
  },
  yandexVision: {
    ocr: 0.0014,                // Чуть дешевле Google
    licensePlate: 0.0014,
  },
};

// Выбор провайдера по задаче
type ProviderStrategy = 'cheapest' | 'best_quality' | 'balanced';

interface ProviderChoice {
  textGeneration: 'claude' | 'openai' | 'yandex_gpt';
  imageAnalysis: 'claude' | 'openai' | 'google_vision';
  ocr: 'google_vision' | 'yandex_vision';
  safeSearch: 'google_vision';
}

function getOptimalProviders(strategy: ProviderStrategy): ProviderChoice {
  switch (strategy) {
    case 'cheapest':
      return {
        textGeneration: 'yandex_gpt',      // Самый дешёвый для текста
        imageAnalysis: 'openai',            // Дешевле Claude
        ocr: 'yandex_vision',               // Лучше для русского + дешевле
        safeSearch: 'google_vision',
      };
    case 'best_quality':
      return {
        textGeneration: 'claude',           // Лучшее качество
        imageAnalysis: 'claude',            // Лучший анализ
        ocr: 'google_vision',               // Стабильнее
        safeSearch: 'google_vision',
      };
    case 'balanced':
    default:
      return {
        textGeneration: 'yandex_gpt',       // Дешёво + хорошо для русского
        imageAnalysis: 'openai',            // Хорошее соотношение цена/качество
        ocr: 'yandex_vision',               // Лучше для русского
        safeSearch: 'google_vision',
      };
  }
}

// Проверка наличия ключей
function checkAPIKey(provider: 'openai' | 'anthropic' | 'google' | 'roboflow'): boolean {
  const key = AI_CONFIG[provider];
  return !!key && key.length > 0;
}

// Получение IAM токена (кэшируем на 1 час)
let cachedIAMToken: { token: string; expiresAt: number } | null = null;

async function getYandexIAMToken(): Promise<string | null> {
  // Проверяем кэш
  if (cachedIAMToken && cachedIAMToken.expiresAt > Date.now()) {
    return cachedIAMToken.token;
  }

  // Если есть готовый IAM токен в env
  if (AI_CONFIG.yandexCloud.iamToken) {
    return AI_CONFIG.yandexCloud.iamToken;
  }

  // Если есть OAuth токен — получаем IAM
  if (AI_CONFIG.yandexCloud.oauthToken) {
    try {
      const response = await axios.post(
        'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        {
          yandexPassportOauthToken: AI_CONFIG.yandexCloud.oauthToken,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const token = response.data.iamToken;
      // Кэшируем на 55 минут (токен живёт 1 час)
      cachedIAMToken = {
        token,
        expiresAt: Date.now() + 55 * 60 * 1000,
      };

      return token;
    } catch (error) {
      console.error('[AI] Failed to get Yandex IAM token:', error);
      return null;
    }
  }

  return null;
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

// ==============================================
// YANDEX GPT — Генерация текста
// ==============================================

/**
 * POST /api/ai/yandex-gpt
 * Генерация текста через YandexGPT
 */
router.post('/yandex-gpt', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, options } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
    }

    // Получаем IAM токен (нужно обновлять каждый час)
    const iamToken = await getYandexIAMToken();

    if (!iamToken) {
      return res.status(500).json({
        success: false,
        error: 'Yandex GPT service not configured',
      });
    }

    const model = options?.model || 'yandexgpt-lite';  // yandexgpt-lite | yandexgpt
    const modelUri = `gpt://${AI_CONFIG.yandexCloud.folderId}/${model}/latest`;

    const response = await axios.post(
      'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
      {
        modelUri,
        completionOptions: {
          stream: false,
          temperature: options?.temperature || 0.3,
          maxTokens: options?.maxTokens || 2000,
        },
        messages: [
          {
            role: 'user',
            text: prompt,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${iamToken}`,
          'x-folder-id': AI_CONFIG.yandexCloud.folderId,
        },
        timeout: 30000,
      }
    );

    const result = response.data.result?.alternatives?.[0]?.message?.text || '';
    
    // Пробуем распарсить как JSON
    let parsedResult;
    try {
      const cleanedResult = result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResult = JSON.parse(cleanedResult);
    } catch {
      parsedResult = { text: result };
    }

    res.json({
      success: true,
      result: parsedResult,
      usage: response.data.result?.usage,
    });

  } catch (error: any) {
    console.error('[AI API] YandexGPT error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.error?.message || error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate with YandexGPT',
    });
  }
});

// ==============================================
// YANDEX VISION OCR — Распознавание текста
// ==============================================

/**
 * POST /api/ai/yandex-vision
 * OCR через Yandex Vision
 */
router.post('/yandex-vision', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageBase64, model } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'imageBase64 is required',
      });
    }

    const iamToken = await getYandexIAMToken();
    if (!iamToken) {
      return res.status(500).json({
        success: false,
        error: 'Yandex Vision service not configured',
      });
    }

    // Извлекаем base64
    const base64Content = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    // Модели: page (по умолчанию), license-plates, handwritten
    const ocrModel = model || 'page';

    const response = await axios.post(
      'https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText',
      {
        mimeType: 'image/jpeg',
        languageCodes: ['ru', 'en'],  // Русский и английский
        model: ocrModel,
        content: base64Content,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${iamToken}`,
          'x-folder-id': AI_CONFIG.yandexCloud.folderId,
          'x-data-logging-enabled': 'true',
        },
        timeout: 15000,
      }
    );

    const result = response.data.result;
    
    // Извлекаем текст
    let fullText = '';
    const blocks: any[] = [];
    
    if (result?.textAnnotation?.blocks) {
      result.textAnnotation.blocks.forEach((block: any) => {
        block.lines?.forEach((line: any) => {
          const lineText = line.words?.map((w: any) => w.text).join(' ') || '';
          fullText += lineText + '\n';
          blocks.push({
            text: lineText,
            confidence: line.words?.[0]?.confidence || 0,
          });
        });
      });
    }

    // Ищем пробег в тексте
    const mileageMatch = fullText.match(/(\d{1,3}[\s,.]?\d{3}|\d{1,6})\s*(км|km|тыс|тысяч)?/i);
    const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/[\s,.]/g, '')) : null;

    // Ищем год
    const yearMatch = fullText.match(/(19|20)\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;

    // Ищем номер авто (если модель license-plates)
    let licensePlate = null;
    if (ocrModel === 'license-plates' && result?.textAnnotation?.entities) {
      const plateEntity = result.textAnnotation.entities.find(
        (e: any) => e.name === 'license_plate'
      );
      licensePlate = plateEntity?.text || null;
    }

    res.json({
      success: true,
      result: {
        fullText: fullText.trim(),
        blocks,
        mileage,
        year,
        licensePlate,
      },
    });

  } catch (error: any) {
    console.error('[AI API] Yandex Vision error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.error?.message || error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze with Yandex Vision',
    });
  }
});

// ==============================================
// УНИВЕРСАЛЬНЫЙ ENDPOINT АНАЛИЗА
// ==============================================

/**
 * POST /api/ai/analyze
 * Универсальный анализ видео/изображений для любой категории
 */
router.post('/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      frames,
      category,
      strategy = 'balanced',
      options,
    } = req.body;

    // Валидация
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'frames array is required',
      });
    }

    if (!category || !['car', 'horse', 'real_estate'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'category must be car, horse, or real_estate',
      });
    }

    const userId = req.user?.id || 'anonymous';
    const startTime = Date.now();

    console.log(`[AI] Starting ${category} analysis for user ${userId}, strategy: ${strategy}`);

    // Импортируем сервис
    const { analyzeVideoUniversal } = await import('../services/aiService.js');

    // Запускаем анализ
    const result = await analyzeVideoUniversal({
      frames,
      category,
      userId,
      isFirstListing: options?.isFirstListing || false,
      isPremium: options?.isPremium || false,
      estimatedPrice: options?.estimatedPrice,
      metadata: {
        strategy,
        ...options?.metadata,
      },
      onProgress: (step, progress) => {
        console.log(`[AI] ${step}: ${progress}%`);
      },
    });

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      result: {
        ...result,
        processingTimeMs: processingTime,
      },
    });

  } catch (error: any) {
    console.error('[AI API] Analyze error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed',
    });
  }
});

// ==============================================
// МОДЕРАЦИЯ КОНТЕНТА
// ==============================================

/**
 * POST /api/ai/moderate
 * Проверка контента на соответствие правилам
 */
router.post('/moderate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { frames } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'frames array is required',
      });
    }

    // Используем Google Vision SafeSearch
    const results = await Promise.all(
      frames.slice(0, 3).map(async (frame: string) => {
        const base64Content = frame.includes(',') ? frame.split(',')[1] : frame;

        const response = await axios.post(
          `https://vision.googleapis.com/v1/images:annotate?key=${AI_CONFIG.google}`,
          {
            requests: [{
              image: { content: base64Content },
              features: [{ type: 'SAFE_SEARCH_DETECTION' }],
            }],
          },
          { timeout: 10000 }
        );

        return response.data.responses[0]?.safeSearchAnnotation;
      })
    );

    // Анализируем результаты
    const flags: any[] = [];
    let approved = true;

    for (const safeSearch of results) {
      if (!safeSearch) continue;

      if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.adult)) {
        approved = false;
        flags.push({ type: 'adult', severity: 'high', description: 'Контент для взрослых' });
      }
      if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.violence)) {
        approved = false;
        flags.push({ type: 'violence', severity: 'high', description: 'Жестокий контент' });
      }
      if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.racy)) {
        flags.push({ type: 'racy', severity: 'medium', description: 'Сомнительный контент' });
      }
    }

    res.json({
      success: true,
      result: {
        approved,
        requiresReview: flags.some(f => f.severity === 'medium'),
        flags,
      },
    });

  } catch (error: any) {
    console.error('[AI API] Moderation error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Moderation failed',
    });
  }
});

// ==============================================
// ГЕНЕРАЦИЯ ОПИСАНИЯ
// ==============================================

/**
 * POST /api/ai/generate-content
 * Генерация заголовка и описания через YandexGPT (дешевле) или Claude (качественнее)
 */
router.post('/generate-content', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      category, 
      analysisData, 
      provider = 'yandex',  // yandex | claude
      language = 'ru' 
    } = req.body;

    if (!category || !analysisData) {
      return res.status(400).json({
        success: false,
        error: 'category and analysisData are required',
      });
    }

    // Формируем промпт
    const prompt = buildContentPrompt(category, analysisData, language);

    let result;

    if (provider === 'yandex') {
      // YandexGPT — дешевле в 7 раз
      const iamToken = await getYandexIAMToken();
      
      if (!iamToken) {
        // Fallback на Claude
        console.log('[AI] YandexGPT not available, falling back to Claude');
        result = await generateWithClaude(prompt);
      } else {
        result = await generateWithYandexGPT(prompt, iamToken);
      }
    } else {
      // Claude — лучшее качество
      result = await generateWithClaude(prompt);
    }

    res.json({
      success: true,
      result,
      provider: provider === 'yandex' && !cachedIAMToken ? 'claude' : provider,
    });

  } catch (error: any) {
    console.error('[AI API] Generate content error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Content generation failed',
    });
  }
});

// Вспомогательные функции для генерации
function buildContentPrompt(category: string, data: any, language: string): string {
  const langText = language === 'ru' ? 'русском' : 'кыргызском';
  
  let contextInfo = '';
  
  if (category === 'car') {
    contextInfo = `
Автомобиль:
- Марка: ${data.brand || 'Не определено'}
- Модель: ${data.model || 'Не определено'}
- Год: ${data.year || 'Не определён'}
- Пробег: ${data.mileage || 'Не указан'} км
- Состояние: ${data.condition || 'Не определено'}
- Цена: ${data.estimatedPrice?.min || 0} - ${data.estimatedPrice?.max || 0} сом`;

  } else if (category === 'horse') {
    contextInfo = `
Лошадь:
- Порода: ${data.breedRu || 'Не определена'}
- Масть: ${data.colorRu || 'Не определена'}
- Возраст: ${data.estimatedAge || 'Не определён'}
- Состояние: ${data.condition || 'Не определено'}`;

  } else if (category === 'real_estate') {
    contextInfo = `
Недвижимость:
- Тип: ${data.propertyTypeRu || 'Не определён'}
- Комнат: ${data.estimatedRooms || 'Не определено'}
- Состояние: ${data.conditionRu || 'Не определено'}
- Особенности: ${data.features?.join(', ') || 'Нет'}`;
  }

  return `Ты копирайтер для маркетплейса 360° в Кыргызстане.

ДАННЫЕ:
${contextInfo}

ЗАДАЧА:
Напиши привлекательное объявление на ${langText} языке.

ВЕРНИ ТОЛЬКО JSON:
{
  "title": "заголовок до 60 символов",
  "description": "описание 2-3 абзаца",
  "tags": ["тег1", "тег2", "тег3", "тег4", "тег5"]
}

Без markdown, только чистый JSON.`;
}

async function generateWithYandexGPT(prompt: string, iamToken: string): Promise<any> {
  const response = await axios.post(
    'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
    {
      modelUri: `gpt://${AI_CONFIG.yandexCloud.folderId}/yandexgpt-lite/latest`,
      completionOptions: {
        stream: false,
        temperature: 0.3,
        maxTokens: 1000,
      },
      messages: [{ role: 'user', text: prompt }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${iamToken}`,
        'x-folder-id': AI_CONFIG.yandexCloud.folderId,
      },
      timeout: 30000,
    }
  );

  const text = response.data.result?.alternatives?.[0]?.message?.text || '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch {
    return { title: '', description: text, tags: [] };
  }
}

async function generateWithClaude(prompt: string): Promise<any> {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
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

  const text = response.data.content[0].text;
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch {
    return { title: '', description: text, tags: [] };
  }
}

// ==============================================
// HEALTH CHECK / STATUS
// ==============================================

/**
 * GET /api/ai/status
 * Проверка статуса AI сервисов
 */
router.get('/status', async (req: Request, res: Response) => {
  const status = {
    openai: !!AI_CONFIG.openai,
    claude: !!AI_CONFIG.anthropic,
    googleVision: !!AI_CONFIG.google,
    roboflow: !!AI_CONFIG.roboflow,
    yandexGpt: !!AI_CONFIG.yandexCloud.folderId && !!(AI_CONFIG.yandexCloud.iamToken || AI_CONFIG.yandexCloud.oauthToken),
    yandexVision: !!AI_CONFIG.yandexCloud.folderId,
  };

  const available = Object.values(status).filter(Boolean).length;
  const total = Object.keys(status).length;

  res.json({
    success: true,
    status,
    summary: `${available}/${total} providers configured`,
    costRates: COST_RATES,
  });
});

export default router;

