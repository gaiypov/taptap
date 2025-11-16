// services/ai/google.ts
import { AI_CONFIG } from './config';

/**
 * Простая обертка для промпта: analyzeImageWithGoogle(imageUri)
 * Согласно CursorAI-Prompt.md
 */
export async function analyzeImageWithGoogle(
  imageUri: string
): Promise<string[]> {
  try {
    // Конвертируем imageUri в base64 если нужно
    const imageBase64 = imageUri.startsWith('data:') 
      ? imageUri 
      : `data:image/jpeg;base64,${imageUri}`;
    
    const result = await analyzeWithGoogleVision(imageBase64, 'object_detection');
    
    // Возвращаем labels как массив строк согласно промпту
    return result.labels?.map((label: any) => label.name || label.description) || [];
  } catch {
    // Fallback на тестовый режим
    const { useTestMode } = await import('./testMode');
    const fallback = await useTestMode('google');
    return fallback?.labels || [];
  }
}

/**
 * Анализ автомобиля с помощью Google Cloud Vision API
 */
export async function analyzeWithGoogleVision(
  imageBase64: string,
  analysisType: 'full' | 'ocr' | 'object_detection' | 'text_detection'
): Promise<any> {
  try {
    // Google Vision analysis started
    
    // Проверяем наличие API ключа
    if (!AI_CONFIG.GOOGLE_API_KEY) {
      throw new Error('Google API key not found');
    }
    
    // Подготавливаем запрос в зависимости от типа анализа
    const request = createGoogleVisionRequest(imageBase64, analysisType);
    
    // Вызываем Google Vision API
    const response = await callGoogleVisionAPI(request);
    
    // Парсим ответ
    const result = parseGoogleVisionResponse(response, analysisType);
    
    console.log('✅ Google Vision analysis complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Google Vision analysis error:', error);
    throw error;
  }
}

/**
 * Создание запроса для Google Vision API
 */
function createGoogleVisionRequest(imageBase64: string, analysisType: string): any {
  const baseRequest: {
    requests: Array<{
      image: { content: string };
      features: Array<{ type: string; maxResults?: number }>;
    }>;
  } = {
    requests: [
      {
        image: {
          content: imageBase64.replace('data:image/jpeg;base64,', ''),
        },
        features: [],
      },
    ],
  };
  
  // Добавляем функции в зависимости от типа анализа
  switch (analysisType) {
    case 'full':
      baseRequest.requests[0].features = [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'TEXT_DETECTION', maxResults: 50 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
        { type: 'WEB_DETECTION', maxResults: 10 },
      ];
      break;
      
    case 'ocr':
      baseRequest.requests[0].features = [
        { type: 'TEXT_DETECTION', maxResults: 50 },
        { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
      ];
      break;
      
    case 'object_detection':
      baseRequest.requests[0].features = [
        { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
        { type: 'LABEL_DETECTION', maxResults: 20 },
      ];
      break;
      
    case 'text_detection':
      baseRequest.requests[0].features = [
        { type: 'TEXT_DETECTION', maxResults: 50 },
      ];
      break;
  }
  
  return baseRequest;
}

/**
 * Вызов Google Vision API
 */
async function callGoogleVisionAPI(request: any): Promise<any> {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${AI_CONFIG.GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Парсинг ответа Google Vision API
 */
function parseGoogleVisionResponse(response: any, analysisType: string): any {
  try {
    const annotations = response.responses[0];
    
    if (analysisType === 'ocr') {
      return parseOCRResponse(annotations);
    }
    
    if (analysisType === 'object_detection') {
      return parseObjectDetectionResponse(annotations);
    }
    
    if (analysisType === 'text_detection') {
      return parseTextDetectionResponse(annotations);
    }
    
    // Полный анализ
    return parseFullAnalysisResponse(annotations);
    
  } catch (error) {
    console.error('Error parsing Google Vision response:', error);
    
    // Fallback данные
    return {
      brand: 'Unknown',
      model: 'Unknown',
      year: 2020,
      color: 'Unknown',
      mileage: 0,
      location: 'Бишкек',
      videoUrl: 'mock://video',
      thumbnailUrl: 'https://picsum.photos/800/600',
      aiAnalysis: {
        condition: 'good',
        conditionScore: 80,
        damages: [],
        estimatedPrice: { min: 2000000, max: 2500000 },
        features: [],
      },
    };
  }
}

/**
 * Парсинг OCR ответа
 */
function parseOCRResponse(annotations: any): any {
  const textAnnotations = annotations.textAnnotations || [];
  const fullText = textAnnotations[0]?.description || '';
  
  // Извлекаем информацию о пробеге
  const mileageMatch = fullText.match(/(\d{1,6})\s*(км|km|тыс|тысяч)/i);
  const mileage = mileageMatch ? parseInt(mileageMatch[1]) * 1000 : 0;
  
  // Извлекаем год
  const yearMatch = fullText.match(/(19|20)\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0]) : 2020;
  
  return {
    mileage,
    year,
    fullText,
    extractedText: textAnnotations.slice(1).map((text: any) => text.description),
  };
}

/**
 * Парсинг обнаружения объектов
 */
function parseObjectDetectionResponse(annotations: any): any {
  const localizedObjects = annotations.localizedObjectAnnotations || [];
  const labels = annotations.labelAnnotations || [];
  
  // Ищем автомобиль
  const carLabels = labels.filter((label: any) => 
    label.description.toLowerCase().includes('car') ||
    label.description.toLowerCase().includes('vehicle') ||
    label.description.toLowerCase().includes('automobile')
  );
  
  // Ищем повреждения
  const damageLabels = labels.filter((label: any) => 
    label.description.toLowerCase().includes('scratch') ||
    label.description.toLowerCase().includes('dent') ||
    label.description.toLowerCase().includes('damage') ||
    label.description.toLowerCase().includes('rust')
  );
  
  return {
    carDetected: carLabels.length > 0,
    carConfidence: carLabels[0]?.score || 0,
    damages: damageLabels.map((label: any) => ({
      type: label.description.toLowerCase(),
      confidence: label.score,
      location: 'unknown',
    })),
    objects: localizedObjects,
  };
}

/**
 * Парсинг обнаружения текста
 */
function parseTextDetectionResponse(annotations: any): any {
  const textAnnotations = annotations.textAnnotations || [];
  
  return {
    texts: textAnnotations.map((text: any) => ({
      text: text.description,
      confidence: text.score,
      boundingBox: text.boundingPoly,
    })),
  };
}

/**
 * Парсинг полного анализа
 */
function parseFullAnalysisResponse(annotations: any): any {
  const labels = annotations.labelAnnotations || [];
  const textAnnotations = annotations.textAnnotations || [];
  const webEntities = annotations.webDetection?.webEntities || [];
  
  // Определяем марку и модель по лейблам
  const carBrands = ['Toyota', 'BMW', 'Mercedes', 'Audi', 'Lexus', 'Honda', 'Ford', 'Chevrolet'];
  const detectedBrand = labels.find((label: any) => 
    carBrands.some(brand => label.description.toLowerCase().includes(brand.toLowerCase()))
  );
  
  // Определяем цвет
  const colorLabels = labels.filter((label: any) => 
    ['white', 'black', 'red', 'blue', 'green', 'yellow', 'silver', 'gray'].includes(label.description.toLowerCase())
  );
  
  // Извлекаем пробег из текста
  const fullText = textAnnotations[0]?.description || '';
  const mileageMatch = fullText.match(/(\d{1,6})\s*(км|km|тыс|тысяч)/i);
  const mileage = mileageMatch ? parseInt(mileageMatch[1]) * 1000 : 0;
  
  // Извлекаем год
  const yearMatch = fullText.match(/(19|20)\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0]) : 2020;
  
  return {
    brand: detectedBrand?.description || 'Unknown',
    model: 'Unknown', // Google Vision не может точно определить модель
    year,
    color: colorLabels[0]?.description || 'Unknown',
    mileage,
    location: 'Бишкек',
    videoUrl: 'mock://video',
    thumbnailUrl: 'https://picsum.photos/800/600',
    aiAnalysis: {
      condition: 'good',
      conditionScore: 80,
      damages: [],
      estimatedPrice: { min: 2000000, max: 2500000 },
      features: labels.slice(0, 5).map((label: any) => label.description),
    },
  };
}

/**
 * Извлечение пробега с помощью OCR
 */
export async function extractMileageWithGoogle(imageBase64: string): Promise<{
  mileage: number;
  confidence: number;
  extractedText: string;
}> {
  try {
    const result = await analyzeWithGoogleVision(imageBase64, 'ocr');
    
    return {
      mileage: result.mileage || 0,
      confidence: 0.8,
      extractedText: result.fullText || '',
    };
    
  } catch (error) {
    console.error('Google mileage extraction error:', error);
    
    return {
      mileage: 0,
      confidence: 0,
      extractedText: '',
    };
  }
}

/**
 * Обнаружение повреждений с Google Vision
 */
export async function detectDamagesWithGoogle(imageBase64: string): Promise<{
  damages: any[];
  overallCondition: string;
  conditionScore: number;
}> {
  try {
    const result = await analyzeWithGoogleVision(imageBase64, 'object_detection');
    
    return {
      damages: result.damages || [],
      overallCondition: 'good',
      conditionScore: 80,
    };
    
  } catch (error) {
    console.error('Google damage detection error:', error);
    
    return {
      damages: [],
      overallCondition: 'good',
      conditionScore: 80,
    };
  }
}
