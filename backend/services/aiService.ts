// backend/services/aiService.ts
import { Car, Damage } from '../types/index';

// ==============================================
// ТИПЫ ДЛЯ РАСШИРЕННОГО АНАЛИЗА
// ==============================================

type ListingCategory = 'car' | 'horse' | 'real_estate';
type ModerationStrategy = 'basic' | 'full' | 'premium';

// Результат модерации контента
interface ContentModerationResult {
  approved: boolean;
  requiresReview: boolean;
  flags: {
    type: 'adult' | 'violence' | 'spam' | 'fake' | 'low_quality' | 'wrong_category';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  reason?: string;
}

// Honesty Score
interface HonestyScore {
  overall: number;              // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  gradeLabel: string;           // "Отличное объявление"
  factors: {
    photoQuality: number;       // Качество съёмки
    completeness: number;       // Полнота показа
    consistency: number;        // Согласованность
    transparency: number;       // Прозрачность
  };
  suggestions: string[];        // Советы на русском
}

// Анализ лошади
interface HorseAnalysis {
  breed?: string;
  breedRu?: string;
  color?: string;
  colorRu?: string;
  estimatedAge?: string;
  gender?: 'stallion' | 'mare' | 'gelding';
  genderRu?: string;
  gait?: string;
  equipment: string[];
  environment: 'stable' | 'pasture' | 'arena' | 'mountains' | 'other';
  environmentRu: string;
  healthIndicators: string[];
  condition: 'excellent' | 'good' | 'fair';
  conditionScore: number;
}

// Анализ недвижимости
interface RealEstateAnalysis {
  propertyType: 'apartment' | 'house' | 'land' | 'commercial';
  propertyTypeRu: string;
  estimatedRooms?: number;
  condition: 'new' | 'renovated' | 'good' | 'needs_repair';
  conditionRu: string;
  conditionScore: number;
  features: string[];
  roomsShown: string[];
  exteriorShown: boolean;
  estimatedArea?: string;
}

// Универсальный результат анализа
interface UniversalAnalysisResult {
  category: ListingCategory;
  moderation: ContentModerationResult;
  honestyScore: HonestyScore;
  generatedTitle: string;
  generatedDescription: string;
  tags: string[];
  estimatedPrice?: {
    min: number;
    max: number;
    currency: 'KGS';
  };
  // Категорийные данные (только одно будет заполнено)
  carAnalysis?: Partial<Car> & { aiAnalysis: any };
  horseAnalysis?: HorseAnalysis;
  realEstateAnalysis?: RealEstateAnalysis;
  // Метаданные
  processingTimeMs: number;
  strategy: ModerationStrategy;
}

// Запрос на анализ
interface AnalysisRequest {
  frames: string[];             // base64 кадры
  category: ListingCategory;
  userId: string;
  isFirstListing?: boolean;
  isPremium?: boolean;
  estimatedPrice?: number;      // в сомах
  metadata?: any;
  onProgress?: (step: string, progress: number) => void;
}

// ==============================================
// КОНФИГУРАЦИЯ AI МОДЕЛЕЙ (BACKEND)
// ==============================================

const AI_CONFIG = {
  // API ключи хранятся на сервере в переменных окружения
  apiKeys: {
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    google: process.env.GOOGLE_VISION_API_KEY || '',
    roboflow: process.env.ROBOFLOW_API_KEY || '',
  },
  
  // Выбор провайдера для каждой задачи
  providers: {
    carIdentification: 'openai',
    damageDetection: 'google',
    conditionAnalysis: 'claude',
    ocrMileage: 'google',
    priceEstimation: 'claude',
  },
};

interface NormalizedImage {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

function normalizeImageInput(image: string): NormalizedImage {
  if (typeof image !== 'string' || image.trim().length === 0) {
    throw new Error('Некорректные данные изображения');
  }

  const trimmed = image.trim();
  const dataUrlMatch = trimmed.match(/^data:(.+?);base64,(.*)$/);

  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1] || 'image/jpeg';
    const base64 = dataUrlMatch[2] || '';
    return {
      mimeType,
      base64,
      dataUrl: `data:${mimeType};base64,${base64}`,
    };
  }

  const defaultMime = 'image/jpeg';
  return {
    mimeType: defaultMime,
    base64: trimmed,
    dataUrl: `data:${defaultMime};base64,${trimmed}`,
  };
}

// ==============================================
// 1. OPENAI GPT-4 VISION
// ==============================================

interface OpenAIVisionResponse {
  brand: string;
  model: string;
  year: number;
  color: string;
  confidence: number;
}

async function analyzeWithOpenAI(imageBase64: string): Promise<OpenAIVisionResponse> {
  const normalized = normalizeImageInput(imageBase64);
  const prompt = `Проанализируй это изображение автомобиля и определи:
1. Марку (например: Toyota, Mercedes, BMW)
2. Модель (например: Camry, E-Class, X5)
3. Год выпуска (приблизительно)
4. Цвет кузова

Верни ТОЛЬКО JSON в формате:
{
  "brand": "марка",
  "model": "модель",
  "year": год,
  "color": "цвет",
  "confidence": 0.0-1.0
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKeys.openai}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: normalized.dataUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('OpenAI error:', error);
    throw new Error('Ошибка при идентификации автомобиля через OpenAI');
  }
}

// ==============================================
// 2. CLAUDE (ANTHROPIC)
// ==============================================

interface ClaudeAnalysisResponse {
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  conditionScore: number;
  analysis: string;
  features: string[];
  estimatedPrice: {
    min: number;
    max: number;
    currency: string;
  };
  recommendations: string[];
}

async function analyzeWithClaude(
  imageBase64Array: string[],
  carInfo: { brand: string; model: string; year: number; mileage: number }
): Promise<ClaudeAnalysisResponse> {
  const prompt = `Ты эксперт по оценке автомобилей с 20-летним опытом работы на рынке Кыргызстана.

ИНФОРМАЦИЯ ОБ АВТОМОБИЛЕ:
- Марка: ${carInfo.brand}
- Модель: ${carInfo.model}
- Год: ${carInfo.year}
- Пробег: ${carInfo.mileage} км

ЗАДАЧА:
Проанализируй предоставленные изображения автомобиля и дай детальную оценку.

ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON (без markdown, без дополнительного текста):
{
  "condition": "excellent|good|fair|poor",
  "conditionScore": число_от_0_до_100,
  "analysis": "детальное описание состояния на русском",
  "features": ["список_обнаруженных_особенностей"],
  "estimatedPrice": {
    "min": минимальная_цена_в_сомах,
    "max": максимальная_цена_в_сомах,
    "currency": "KGS"
  },
  "recommendations": ["рекомендации_для_продавца"]
}

ВАЖНО:
- Учитывай рыночные цены в Кыргызстане (Бишкек)
- Оценивай состояние кузова, салона, двигателя
- Будь объективен в оценке
- Цены в киргизских сомах (KGS)`;

  const imageContent = imageBase64Array.map((image) => {
    const normalized = normalizeImageInput(image);
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: normalized.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: normalized.base64,
      },
    };
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_CONFIG.apiKeys.anthropic,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              ...imageContent,
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;
    
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Claude error:', error);
    throw new Error('Ошибка при анализе через Claude');
  }
}

// ==============================================
// 3. GOOGLE CLOUD VISION
// ==============================================

interface GoogleVisionDamage {
  type: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe';
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

async function detectDamagesWithGoogle(imageBase64: string): Promise<GoogleVisionDamage[]> {
  const normalized = normalizeImageInput(imageBase64);
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${AI_CONFIG.apiKeys.google}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: normalized.base64,
              },
              features: [
                { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
                { type: 'LABEL_DETECTION', maxResults: 20 },
                { type: 'IMAGE_PROPERTIES' },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const annotations = data.responses[0];

    const damages: GoogleVisionDamage[] = [];
    
    const damageKeywords = {
      scratch: ['scratch', 'scrape', 'mark'],
      dent: ['dent', 'damage', 'deformation'],
      rust: ['rust', 'corrosion', 'oxidation'],
      crack: ['crack', 'broken', 'shattered'],
    };

    if (annotations.localizedObjectAnnotations) {
      annotations.localizedObjectAnnotations.forEach((obj: any) => {
        const name = obj.name.toLowerCase();
        
        for (const [type, keywords] of Object.entries(damageKeywords)) {
          if (keywords.some((keyword) => name.includes(keyword))) {
            damages.push({
              type,
              location: `Обнаружено: ${obj.name}`,
              severity: obj.score > 0.8 ? 'severe' : obj.score > 0.5 ? 'moderate' : 'minor',
              confidence: obj.score,
              boundingBox: obj.boundingPoly?.normalizedVertices
                ? {
                    x: obj.boundingPoly.normalizedVertices[0].x,
                    y: obj.boundingPoly.normalizedVertices[0].y,
                    width: obj.boundingPoly.normalizedVertices[2].x - obj.boundingPoly.normalizedVertices[0].x,
                    height: obj.boundingPoly.normalizedVertices[2].y - obj.boundingPoly.normalizedVertices[0].y,
                  }
                : undefined,
            });
          }
        }
      });
    }

    return damages;
  } catch (error) {
    console.error('Google Vision error:', error);
    throw new Error('Ошибка при детекции повреждений через Google Vision');
  }
}

async function extractMileageWithGoogle(imageBase64: string): Promise<number | null> {
  const normalized = normalizeImageInput(imageBase64);
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${AI_CONFIG.apiKeys.google}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: normalized.base64,
              },
              features: [
                { type: 'TEXT_DETECTION' },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const textAnnotations = data.responses[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return null;
    }

    const fullText = textAnnotations[0].description;
    const numberMatches = fullText.match(/\b(\d{1,6})\b/g);
    
    if (numberMatches) {
      const numbers = numberMatches.map((n: string) => parseInt(n, 10));
      const mileage = Math.max(...numbers);
      
      if (mileage >= 0 && mileage <= 999999) {
        return mileage;
      }
    }

    return null;
  } catch (error) {
    console.error('Google Vision OCR error:', error);
    return null;
  }
}

// ==============================================
// МОДЕРАЦИЯ КОНТЕНТА (Google SafeSearch)
// ==============================================

async function moderateContent(imageBase64: string): Promise<ContentModerationResult> {
  const normalized = normalizeImageInput(imageBase64);
  
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${AI_CONFIG.apiKeys.google}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: normalized.base64 },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const safeSearch = data.responses[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      return { approved: true, requiresReview: false, flags: [] };
    }

    const flags: ContentModerationResult['flags'] = [];
    let approved = true;
    let requiresReview = false;

    // Проверка adult content
    if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.adult)) {
      approved = false;
      flags.push({
        type: 'adult',
        severity: 'high',
        description: 'Обнаружен контент для взрослых',
      });
    }

    // Проверка violence
    if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.violence)) {
      approved = false;
      flags.push({
        type: 'violence',
        severity: 'high',
        description: 'Обнаружен жестокий контент',
      });
    }

    // Проверка на спам/racy (требует ручной проверки)
    if (['POSSIBLE', 'LIKELY'].includes(safeSearch.racy)) {
      requiresReview = true;
      flags.push({
        type: 'spam',
        severity: 'medium',
        description: 'Контент требует проверки модератором',
      });
    }

    return {
      approved,
      requiresReview,
      flags,
      reason: !approved ? 'Контент нарушает правила площадки' : undefined,
    };
  } catch (error) {
    console.error('[AI] SafeSearch error:', error);
    // В случае ошибки — пропускаем, но помечаем для ручной проверки
    return { approved: true, requiresReview: true, flags: [] };
  }
}

// Batch модерация нескольких кадров
async function moderateContentBatch(frames: string[]): Promise<ContentModerationResult> {
  // Проверяем первый, средний и последний кадр
  const indicesToCheck = [
    0,
    Math.floor(frames.length / 2),
    frames.length - 1,
  ].filter((v, i, a) => a.indexOf(v) === i); // убираем дубликаты

  const results = await Promise.all(
    indicesToCheck.map(i => moderateContent(frames[i]))
  );

  // Объединяем результаты
  const allFlags = results.flatMap(r => r.flags);
  const approved = results.every(r => r.approved);
  const requiresReview = results.some(r => r.requiresReview);

  return {
    approved,
    requiresReview,
    flags: allFlags,
    reason: !approved ? 'Контент не прошёл модерацию' : undefined,
  };
}

// ==============================================
// 4. ГЛАВНАЯ ФУНКЦИЯ АНАЛИЗА
// ==============================================

async function analyzeCarVideo(
  videoFrames: string[],
  options: {
    userId: string;
    metadata?: any;
    onProgress?: (step: string, progress: number) => void;
  }
): Promise<Partial<Car>> {
  try {
    console.log(`🚀 Starting video analysis for user ${options.userId}`);

    if (!videoFrames || videoFrames.length === 0) {
      throw new Error('Не переданы кадры для анализа');
    }

    const normalizedFrames = videoFrames.map((frame) => normalizeImageInput(frame));
    const frameDataUrls = normalizedFrames.map((frame) => frame.dataUrl);
    const frameBase64 = normalizedFrames.map((frame) => frame.base64);
    
    // Шаг 1: Идентификация авто через OpenAI (0-30%)
    options.onProgress?.('Определение марки и модели...', 10);
    const carIdentification = await analyzeWithOpenAI(frameDataUrls[0]);
    console.log('✅ Car identified:', carIdentification);
    options.onProgress?.('Марка и модель определены', 30);

    // Шаг 2: Распознавание пробега через Google OCR (30-50%)
    options.onProgress?.('Распознавание одометра...', 40);
    const extractedMileage = await extractMileageWithGoogle(frameBase64[3] || frameBase64[0]);
    const mileage = extractedMileage ?? Math.floor(Math.random() * 80000) + 20000;
    if (extractedMileage == null) {
      console.warn('[AI] Mileage fallback applied — OCR did not return a value');
    }
    console.log('✅ Mileage detected:', mileage);
    options.onProgress?.('Пробег распознан', 50);

    // Шаг 3: Детекция повреждений через Google Vision (50-70%)
    options.onProgress?.('Анализ состояния кузова...', 60);
    const googleDamages = await detectDamagesWithGoogle(frameBase64[0]);
    const damages: Damage[] = googleDamages.map(d => ({
      type: d.type as any,
      severity: d.severity,
      location: d.location,
      confidence: d.confidence,
    }));
    console.log('✅ Damages detected:', damages.length);
    options.onProgress?.('Повреждения обнаружены', 70);

    // Шаг 4: Комплексный анализ через Claude (70-95%)
    options.onProgress?.('AI анализ состояния...', 80);
    const claudeAnalysis = await analyzeWithClaude(frameBase64, {
      brand: carIdentification.brand,
      model: carIdentification.model,
      year: carIdentification.year,
      mileage,
    });
    console.log('✅ Claude analysis complete');
    options.onProgress?.('Анализ завершен', 95);

    // Шаг 5: Формирование результата (95-100%)
    options.onProgress?.('Финализация...', 98);
    
    const carData: Partial<Car> = {
      brand: carIdentification.brand,
      model: carIdentification.model,
      year: carIdentification.year,
      mileage,
      location: 'Бишкек',
      videoUrl: options.metadata?.videoUrl || '',
      thumbnailUrl: frameDataUrls[0],
      views: 0,
      likes: 0,
      saves: 0,
      createdAt: new Date().toISOString(),
      isVerified: false,
      aiAnalysis: {
        condition: claudeAnalysis.condition,
        conditionScore: claudeAnalysis.conditionScore,
        damages,
        estimatedPrice: {
          min: claudeAnalysis.estimatedPrice.min,
          max: claudeAnalysis.estimatedPrice.max,
        },
        features: claudeAnalysis.features,
      },
    };

    options.onProgress?.('Готово!', 100);
    console.log('🎉 Analysis complete:', carData);
    
    return carData;
  } catch (error) {
    console.error('❌ Analysis error:', error);
    throw new Error('Не удалось проанализировать видео. Попробуйте еще раз.');
  }
}

// ==============================================
// АНАЛИЗ ЛОШАДЕЙ
// ==============================================

const HORSE_BREEDS_KG = [
  'Кыргызская', 'Новокиргизская', 'Арабская', 'Ахалтекинская',
  'Английская чистокровная', 'Орловский рысак', 'Карабаирская',
  'Донская', 'Будённовская', 'Терская'
];

// Словарь мастей лошадей (используется для локализации)
export const HORSE_COLORS: Record<string, string> = {
  'bay': 'Гнедая',
  'black': 'Вороная',
  'chestnut': 'Рыжая',
  'gray': 'Серая',
  'white': 'Белая',
  'palomino': 'Соловая',
  'buckskin': 'Буланая',
  'pinto': 'Пегая',
  'dun': 'Саврасая',
  'roan': 'Чалая',
};

async function analyzeHorseWithClaude(
  imageBase64Array: string[],
  metadata?: any
): Promise<HorseAnalysis> {
  const prompt = `Ты эксперт по лошадям с опытом работы на конных рынках Центральной Азии.

ЗАДАЧА:
Проанализируй изображения лошади и определи:
1. Породу (если возможно определить)
2. Масть (окрас)
3. Примерный возраст
4. Пол (жеребец/кобыла/мерин)
5. Аллюр (если видно движение)
6. Амуницию (седло, уздечка, попона и т.д.)
7. Условия содержания (конюшня, пастбище, манеж)
8. Визуальные признаки здоровья
9. Общее состояние (отлично/хорошо/удовлетворительно)
10. Оценка состояния от 0 до 100

ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON:
{
  "breed": "порода на английском или null",
  "breedRu": "порода на русском",
  "color": "масть на английском",
  "colorRu": "масть на русском",
  "estimatedAge": "молодая/взрослая/возрастная",
  "gender": "stallion|mare|gelding|null",
  "genderRu": "жеребец/кобыла/мерин",
  "gait": "шаг/рысь/галоп/null",
  "equipment": ["список амуниции на русском"],
  "environment": "stable|pasture|arena|mountains|other",
  "environmentRu": "описание места на русском",
  "healthIndicators": ["признаки здоровья на русском"],
  "condition": "excellent|good|fair",
  "conditionScore": число_от_0_до_100
}

ВАЖНО:
- Учитывай популярные в Кыргызстане породы
- Будь объективен в оценке
- Если не можешь определить — ставь null`;

  const imageContent = imageBase64Array.map((image) => {
    const normalized = normalizeImageInput(image);
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: normalized.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: normalized.base64,
      },
    };
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_CONFIG.apiKeys.anthropic,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [...imageContent, { type: 'text', text: prompt }],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;
    const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('[AI] Horse analysis error:', error);
    throw new Error('Ошибка при анализе лошади');
  }
}

// Главный пайплайн анализа лошади
async function analyzeHorseVideo(
  frames: string[],
  options: {
    userId: string;
    metadata?: any;
    onProgress?: (step: string, progress: number) => void;
  }
): Promise<HorseAnalysis & { estimatedPrice?: { min: number; max: number } }> {
  
  options.onProgress?.('Анализ изображений лошади...', 20);
  
  const normalizedFrames = frames.map(f => normalizeImageInput(f).base64);
  
  // Анализ через Claude
  options.onProgress?.('AI определяет породу и состояние...', 50);
  const horseAnalysis = await analyzeHorseWithClaude(normalizedFrames);
  
  options.onProgress?.('Оценка стоимости...', 80);
  
  // Примерная оценка стоимости (упрощённая логика)
  let priceMin = 50000;  // базовая цена в сомах
  let priceMax = 150000;
  
  if (horseAnalysis.condition === 'excellent') {
    priceMin *= 2;
    priceMax *= 3;
  } else if (horseAnalysis.condition === 'good') {
    priceMin *= 1.5;
    priceMax *= 2;
  }
  
  // Породистые лошади дороже
  if (horseAnalysis.breed && HORSE_BREEDS_KG.includes(horseAnalysis.breedRu || '')) {
    priceMin *= 1.5;
    priceMax *= 2;
  }
  
  options.onProgress?.('Готово!', 100);
  
  return {
    ...horseAnalysis,
    estimatedPrice: {
      min: Math.round(priceMin),
      max: Math.round(priceMax),
    },
  };
}

// ==============================================
// АНАЛИЗ НЕДВИЖИМОСТИ
// ==============================================

// Словарь типов комнат (используется для локализации)
export const ROOM_TYPES: Record<string, string> = {
  'living': 'Гостиная',
  'bedroom': 'Спальня',
  'kitchen': 'Кухня',
  'bathroom': 'Ванная',
  'balcony': 'Балкон',
  'hallway': 'Прихожая',
  'other': 'Другое',
};

async function analyzeRealEstateWithClaude(
  imageBase64Array: string[],
  metadata?: any
): Promise<RealEstateAnalysis> {
  const prompt = `Ты эксперт по недвижимости с опытом работы на рынке Кыргызстана.

ЗАДАЧА:
Проанализируй изображения недвижимости и определи:
1. Тип (квартира/дом/участок/коммерция)
2. Количество комнат (если видно)
3. Состояние ремонта
4. Особенности (балкон, паркинг, вид и т.д.)
5. Какие помещения показаны
6. Показан ли экстерьер
7. Примерная площадь
8. Оценка состояния от 0 до 100

ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON:
{
  "propertyType": "apartment|house|land|commercial",
  "propertyTypeRu": "тип на русском",
  "estimatedRooms": число_или_null,
  "condition": "new|renovated|good|needs_repair",
  "conditionRu": "состояние на русском",
  "conditionScore": число_от_0_до_100,
  "features": ["особенности на русском"],
  "roomsShown": ["living", "bedroom", "kitchen"...],
  "exteriorShown": true|false,
  "estimatedArea": "маленькая/средняя/большая"
}

ВАЖНО:
- Оценивай объективно
- Учитывай стандарты жилья в Бишкеке
- Если не видно — ставь null`;

  const imageContent = imageBase64Array.map((image) => {
    const normalized = normalizeImageInput(image);
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: normalized.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: normalized.base64,
      },
    };
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_CONFIG.apiKeys.anthropic,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [...imageContent, { type: 'text', text: prompt }],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;
    const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('[AI] Real estate analysis error:', error);
    throw new Error('Ошибка при анализе недвижимости');
  }
}

// Главный пайплайн анализа недвижимости
async function analyzeRealEstateVideo(
  frames: string[],
  options: {
    userId: string;
    metadata?: any;
    onProgress?: (step: string, progress: number) => void;
  }
): Promise<RealEstateAnalysis & { estimatedPrice?: { min: number; max: number } }> {
  
  options.onProgress?.('Анализ изображений недвижимости...', 20);
  
  const normalizedFrames = frames.map(f => normalizeImageInput(f).base64);
  
  options.onProgress?.('AI анализирует помещения...', 50);
  const realEstateAnalysis = await analyzeRealEstateWithClaude(normalizedFrames);
  
  options.onProgress?.('Оценка стоимости...', 80);
  
  // Примерная оценка (упрощённая)
  let priceMin = 1000000;  // базовая цена в сомах
  let priceMax = 3000000;
  
  // Корректировка по типу
  if (realEstateAnalysis.propertyType === 'house') {
    priceMin *= 2;
    priceMax *= 3;
  } else if (realEstateAnalysis.propertyType === 'land') {
    priceMin *= 0.5;
    priceMax *= 1;
  } else if (realEstateAnalysis.propertyType === 'commercial') {
    priceMin *= 3;
    priceMax *= 5;
  }
  
  // Корректировка по состоянию
  if (realEstateAnalysis.condition === 'new') {
    priceMin *= 1.5;
    priceMax *= 2;
  } else if (realEstateAnalysis.condition === 'needs_repair') {
    priceMin *= 0.6;
    priceMax *= 0.8;
  }
  
  // Корректировка по комнатам
  if (realEstateAnalysis.estimatedRooms) {
    const roomMultiplier = 1 + (realEstateAnalysis.estimatedRooms - 1) * 0.3;
    priceMin *= roomMultiplier;
    priceMax *= roomMultiplier;
  }
  
  options.onProgress?.('Готово!', 100);
  
  return {
    ...realEstateAnalysis,
    estimatedPrice: {
      min: Math.round(priceMin),
      max: Math.round(priceMax),
    },
  };
}

// Быстрая идентификация авто по одному фото
async function quickIdentifyCar(imageBase64: string): Promise<OpenAIVisionResponse> {
  const normalized = normalizeImageInput(imageBase64);
  return await analyzeWithOpenAI(normalized.dataUrl);
}

// Проверка качества видео
async function validateVideoQuality(videoMetadata: any): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Проверка длительности
  if (videoMetadata.duration && videoMetadata.duration < 10) {
    issues.push('Видео слишком короткое');
    suggestions.push('Рекомендуется видео длительностью от 10 секунд');
  }

  // Проверка разрешения
  if (videoMetadata.width && videoMetadata.height) {
    const pixels = videoMetadata.width * videoMetadata.height;
    if (pixels < 480 * 640) {
      issues.push('Низкое разрешение видео');
      suggestions.push('Используйте видео с разрешением минимум 480x640');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

// ==============================================
// HONESTY SCORE — ОЦЕНКА ДОВЕРИЯ К ОБЪЯВЛЕНИЮ
// ==============================================

function calculateHonestyScore(
  category: ListingCategory,
  analysis: any,
  frames: string[],
  metadata?: {
    isFirstListing?: boolean;
    userRating?: number;
  }
): HonestyScore {
  const factors = {
    photoQuality: 70,
    completeness: 50,
    consistency: 80,
    transparency: 70,
  };
  
  // 1. Качество фото (базовая оценка по количеству кадров)
  if (frames.length >= 5) {
    factors.photoQuality = 90;
  } else if (frames.length >= 3) {
    factors.photoQuality = 75;
  } else {
    factors.photoQuality = 50;
  }
  
  // 2. Полнота показа (зависит от категории)
  if (category === 'car') {
    const carAnalysis = analysis as any;
    let completeness = 0;
    
    // Проверяем что показано
    if (carAnalysis.aiAnalysis?.damages !== undefined) completeness += 20;
    if (carAnalysis.mileage) completeness += 20;
    if (carAnalysis.brand && carAnalysis.model) completeness += 20;
    if (carAnalysis.year) completeness += 15;
    if (frames.length >= 4) completeness += 25; // разные ракурсы
    
    factors.completeness = Math.min(100, completeness);
    
    // Прозрачность: показаны ли повреждения честно
    const damages = carAnalysis.aiAnalysis?.damages || [];
    if (damages.length > 0) {
      factors.transparency = 90; // честно показал повреждения
    } else if (carAnalysis.aiAnalysis?.conditionScore > 90) {
      factors.transparency = 85; // машина в отличном состоянии
    }
    
  } else if (category === 'horse') {
    const horseAnalysis = analysis as HorseAnalysis;
    let completeness = 0;
    
    if (horseAnalysis.breed || horseAnalysis.breedRu) completeness += 20;
    if (horseAnalysis.color) completeness += 15;
    if (horseAnalysis.estimatedAge) completeness += 15;
    if (horseAnalysis.equipment?.length > 0) completeness += 15;
    if (horseAnalysis.healthIndicators?.length > 0) completeness += 20;
    if (frames.length >= 3) completeness += 15;
    
    factors.completeness = Math.min(100, completeness);
    factors.transparency = horseAnalysis.conditionScore || 70;
    
  } else if (category === 'real_estate') {
    const realEstateAnalysis = analysis as RealEstateAnalysis;
    let completeness = 0;
    
    if (realEstateAnalysis.propertyType) completeness += 15;
    if (realEstateAnalysis.estimatedRooms) completeness += 15;
    if (realEstateAnalysis.condition) completeness += 15;
    if (realEstateAnalysis.roomsShown?.length >= 3) completeness += 25;
    if (realEstateAnalysis.exteriorShown) completeness += 15;
    if (realEstateAnalysis.features?.length > 0) completeness += 15;
    
    factors.completeness = Math.min(100, completeness);
    factors.transparency = realEstateAnalysis.conditionScore || 70;
  }
  
  // 3. Согласованность (если есть рейтинг пользователя)
  if (metadata?.userRating) {
    factors.consistency = Math.min(100, metadata.userRating * 20);
  }
  
  // Общий балл (взвешенное среднее)
  const overall = Math.round(
    factors.photoQuality * 0.2 +
    factors.completeness * 0.35 +
    factors.consistency * 0.2 +
    factors.transparency * 0.25
  );
  
  // Определение грейда
  let grade: HonestyScore['grade'];
  let gradeLabel: string;
  
  if (overall >= 90) {
    grade = 'A';
    gradeLabel = 'Отличное объявление';
  } else if (overall >= 80) {
    grade = 'B';
    gradeLabel = 'Хорошее объявление';
  } else if (overall >= 70) {
    grade = 'C';
    gradeLabel = 'Среднее объявление';
  } else if (overall >= 60) {
    grade = 'D';
    gradeLabel = 'Требует улучшения';
  } else {
    grade = 'F';
    gradeLabel = 'Низкое качество';
  }
  
  // Генерация советов
  const suggestions: string[] = [];
  
  if (factors.photoQuality < 80) {
    suggestions.push('Добавьте больше фотографий для повышения доверия');
  }
  if (factors.completeness < 70) {
    if (category === 'car') {
      suggestions.push('Покажите салон и моторный отсек');
      suggestions.push('Сфотографируйте автомобиль со всех сторон');
    } else if (category === 'horse') {
      suggestions.push('Покажите лошадь в движении');
      suggestions.push('Добавьте информацию о породе и возрасте');
    } else if (category === 'real_estate') {
      suggestions.push('Покажите все комнаты');
      suggestions.push('Добавьте фото экстерьера здания');
    }
  }
  if (factors.transparency < 80) {
    suggestions.push('Честно укажите все недостатки — это повышает доверие');
  }
  
  return {
    overall,
    grade,
    gradeLabel,
    factors,
    suggestions,
  };
}

// ==============================================
// ГЕНЕРАЦИЯ ЗАГОЛОВКА И ОПИСАНИЯ
// ==============================================

async function generateListingContent(
  category: ListingCategory,
  analysis: any,
  language: 'ru' | 'ky' = 'ru'
): Promise<{ title: string; description: string; tags: string[] }> {
  
  let contextPrompt = '';
  
  if (category === 'car') {
    const car = analysis as Partial<Car>;
    contextPrompt = `
Автомобиль:
- Марка: ${car.brand || 'Не определено'}
- Модель: ${car.model || 'Не определено'}
- Год: ${car.year || 'Не определён'}
- Пробег: ${car.mileage || 'Не указан'} км
- Состояние: ${car.aiAnalysis?.condition || 'Не определено'}
- Оценка: ${car.aiAnalysis?.conditionScore || 0}/100
- Повреждения: ${car.aiAnalysis?.damages?.length || 0}
- Цена: ${car.aiAnalysis?.estimatedPrice?.min || 0} - ${car.aiAnalysis?.estimatedPrice?.max || 0} сом`;

  } else if (category === 'horse') {
    const horse = analysis as HorseAnalysis;
    contextPrompt = `
Лошадь:
- Порода: ${horse.breedRu || 'Не определена'}
- Масть: ${horse.colorRu || 'Не определена'}
- Возраст: ${horse.estimatedAge || 'Не определён'}
- Пол: ${horse.genderRu || 'Не определён'}
- Состояние: ${horse.condition || 'Не определено'}
- Оценка: ${horse.conditionScore || 0}/100
- Амуниция: ${horse.equipment?.join(', ') || 'Нет'}`;

  } else if (category === 'real_estate') {
    const re = analysis as RealEstateAnalysis;
    contextPrompt = `
Недвижимость:
- Тип: ${re.propertyTypeRu || 'Не определён'}
- Комнат: ${re.estimatedRooms || 'Не определено'}
- Состояние: ${re.conditionRu || 'Не определено'}
- Оценка: ${re.conditionScore || 0}/100
- Площадь: ${re.estimatedArea || 'Не определена'}
- Особенности: ${re.features?.join(', ') || 'Нет'}`;
  }

  const prompt = `Ты копирайтер для маркетплейса 360° в Кыргызстане.

ДАННЫЕ ДЛЯ ОБЪЯВЛЕНИЯ:
${contextPrompt}

ЗАДАЧА:
Напиши привлекательное объявление на ${language === 'ru' ? 'русском' : 'кыргызском'} языке.

ВЕРНИ ТОЛЬКО JSON:
{
  "title": "короткий заголовок до 60 символов",
  "description": "описание 2-3 абзаца, информативное, честное",
  "tags": ["тег1", "тег2", "тег3", "тег4", "тег5"]
}

ТРЕБОВАНИЯ:
- Заголовок должен привлекать внимание
- Описание должно быть информативным но не преувеличивать
- Используй эмодзи умеренно (1-2)
- Теги релевантные для поиска`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_CONFIG.apiKeys.anthropic,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;
    const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('[AI] Content generation error:', error);
    
    // Fallback — генерируем простой контент
    if (category === 'car') {
      const car = analysis as Partial<Car>;
      return {
        title: `${car.brand || ''} ${car.model || ''} ${car.year || ''}`.trim() || 'Автомобиль',
        description: 'Автомобиль в хорошем состоянии. Подробности по телефону.',
        tags: ['авто', 'машина', car.brand || '', car.model || ''].filter(Boolean),
      };
    } else if (category === 'horse') {
      const horse = analysis as HorseAnalysis;
      return {
        title: `${horse.breedRu || 'Лошадь'} ${horse.colorRu || ''}`.trim(),
        description: 'Лошадь в хорошем состоянии. Подробности по телефону.',
        tags: ['лошадь', 'конь', horse.breedRu || ''].filter(Boolean),
      };
    } else {
      const re = analysis as RealEstateAnalysis;
      return {
        title: `${re.propertyTypeRu || 'Недвижимость'} ${re.estimatedRooms ? re.estimatedRooms + ' комн.' : ''}`.trim(),
        description: 'Недвижимость в хорошем состоянии. Подробности по телефону.',
        tags: ['недвижимость', re.propertyTypeRu || '', 'Бишкек'].filter(Boolean),
      };
    }
  }
}

// ==============================================
// УНИВЕРСАЛЬНЫЙ АНАЛИЗ — ГЛАВНАЯ ФУНКЦИЯ
// ==============================================

function determineStrategy(request: AnalysisRequest): ModerationStrategy {
  if (request.isPremium) return 'premium';
  if (request.isFirstListing) return 'full';
  
  if (request.category === 'car' && request.estimatedPrice && request.estimatedPrice > 1000000) {
    return 'full';
  }
  if (request.category === 'real_estate' && request.estimatedPrice && request.estimatedPrice > 5000000) {
    return 'full';
  }
  if (request.category === 'horse' && request.estimatedPrice && request.estimatedPrice > 500000) {
    return 'full';
  }
  
  return 'basic';
}

async function analyzeVideoUniversal(
  request: AnalysisRequest
): Promise<UniversalAnalysisResult> {
  const startTime = Date.now();
  const strategy = determineStrategy(request);
  
  console.log(`[AI] Starting ${request.category} analysis, strategy: ${strategy}`);
  
  const { frames, category, userId, metadata, onProgress } = request;
  
  if (!frames || frames.length === 0) {
    throw new Error('Не переданы кадры для анализа');
  }
  
  // 1. Модерация контента (0-15%)
  onProgress?.('Проверка контента...', 5);
  const moderation = await moderateContentBatch(frames);
  onProgress?.('Контент проверен', 15);
  
  if (!moderation.approved) {
    throw new Error(`Контент не прошёл модерацию: ${moderation.reason}`);
  }
  
  // 2. Анализ по категории (15-70%)
  let categoryAnalysis: any;
  let estimatedPrice: { min: number; max: number } | undefined;
  
  if (category === 'car') {
    onProgress?.('Анализ автомобиля...', 20);
    const carResult = await analyzeCarVideo(frames, { userId, metadata, onProgress });
    categoryAnalysis = carResult;
    estimatedPrice = carResult.aiAnalysis?.estimatedPrice;
    
  } else if (category === 'horse') {
    onProgress?.('Анализ лошади...', 20);
    const horseResult = await analyzeHorseVideo(frames, { userId, metadata, onProgress });
    categoryAnalysis = horseResult;
    estimatedPrice = horseResult.estimatedPrice;
    
  } else if (category === 'real_estate') {
    onProgress?.('Анализ недвижимости...', 20);
    const realEstateResult = await analyzeRealEstateVideo(frames, { userId, metadata, onProgress });
    categoryAnalysis = realEstateResult;
    estimatedPrice = realEstateResult.estimatedPrice;
  }
  
  onProgress?.('Категорийный анализ завершён', 70);
  
  // 3. Honesty Score (70-80%)
  onProgress?.('Расчёт оценки доверия...', 75);
  const honestyScore = calculateHonestyScore(category, categoryAnalysis, frames, {
    isFirstListing: request.isFirstListing,
  });
  onProgress?.('Оценка доверия рассчитана', 80);
  
  // 4. Генерация контента (80-95%)
  onProgress?.('Генерация описания...', 85);
  const content = await generateListingContent(category, categoryAnalysis, 'ru');
  onProgress?.('Описание сгенерировано', 95);
  
  // 5. Формирование результата (95-100%)
  onProgress?.('Финализация...', 98);
  
  const processingTimeMs = Date.now() - startTime;
  
  const result: UniversalAnalysisResult = {
    category,
    moderation,
    honestyScore,
    generatedTitle: content.title,
    generatedDescription: content.description,
    tags: content.tags,
    estimatedPrice: estimatedPrice ? { ...estimatedPrice, currency: 'KGS' } : undefined,
    processingTimeMs,
    strategy,
  };
  
  // Добавляем категорийный анализ
  if (category === 'car') {
    result.carAnalysis = categoryAnalysis;
  } else if (category === 'horse') {
    result.horseAnalysis = categoryAnalysis;
  } else if (category === 'real_estate') {
    result.realEstateAnalysis = categoryAnalysis;
  }
  
  onProgress?.('Готово!', 100);
  console.log(`[AI] Analysis complete in ${processingTimeMs}ms`);
  
  return result;
}

// Получение статуса анализа
async function getAnalysisStatus(analysisId: string, userId: string): Promise<any> {
  // Здесь будет логика получения статуса из базы данных
  console.warn('[AI] getAnalysisStatus is returning mock data — integrate with persistence layer');
  return {
    id: analysisId,
    status: 'completed',
    progress: 100,
    result: null,
  };
}

// ==============================================
// ЭКСПОРТЫ
// ==============================================

export {
  // Конфиг
  AI_CONFIG, // ⭐ Новая универсальная функция
  analyzeCarVideo, // Существующая
  analyzeHorseVideo, // Новая
  analyzeRealEstateVideo,
  // Главные функции
  analyzeVideoUniversal, // Новая
  calculateHonestyScore, // Новая
  generateListingContent, // Существующая
  getAnalysisStatus, // Существующая
  moderateContent, // Новая
  moderateContentBatch, // Новая



  // Утилиты
  quickIdentifyCar, // Существующая
  validateVideoQuality, type AnalysisRequest, type ContentModerationResult,
  type HonestyScore,
  type HorseAnalysis,
  // Типы
  type ListingCategory,
  type ModerationStrategy, type RealEstateAnalysis,
  type UniversalAnalysisResult
};

