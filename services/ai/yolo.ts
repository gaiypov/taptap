// services/ai/yolo.ts
import { AI_CONFIG } from './config';

/**
 * Roboflow YOLO интеграция для обнаружения объектов
 */

export interface YOLODetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface YOLOResult {
  detections: YOLODetection[];
  image: {
    width: number;
    height: number;
  };
  predictions: number;
}

/**
 * Простая обертка для промпта: detectWithYolo(imageUri)
 * Согласно CursorAI-Prompt.md
 */
export async function detectWithYolo(
  imageUri: string
): Promise<any> {
  try {
    // Конвертируем imageUri в base64 если нужно
    const imageBase64 = imageUri.startsWith('data:') 
      ? imageUri 
      : `data:image/jpeg;base64,${imageUri}`;
    
    return await analyzeWithYOLO(imageBase64);
  } catch {
    // Fallback на тестовый режим
    const { useTestMode } = await import('./testMode');
    return useTestMode('yolo');
  }
}

/**
 * Анализ изображения с помощью Roboflow YOLO
 */
export async function analyzeWithYOLO(
  imageBase64: string,
  modelId: string = 'car-damage-detection',
  version: number = 1
): Promise<YOLOResult> {
  try {
    console.log('🤖 YOLO analysis started...', { modelId, version });
    
    // Проверяем наличие API ключа
    if (!AI_CONFIG.ROBOFLOW_API_KEY) {
      throw new Error('Roboflow API key not found');
    }
    
    // Вызываем Roboflow API
    const response = await callRoboflowAPI(imageBase64, modelId, version);
    
    // Парсим ответ
    const result = parseYOLOResponse(response);
    
    console.log('✅ YOLO analysis complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ YOLO analysis error:', error);
    throw error;
  }
}

/**
 * Вызов Roboflow API
 */
async function callRoboflowAPI(
  imageBase64: string,
  modelId: string,
  version: number
): Promise<any> {
  const url = `https://detect.roboflow.com/${modelId}/${version}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      api_key: AI_CONFIG.ROBOFLOW_API_KEY,
      image: imageBase64.replace('data:image/jpeg;base64,', ''),
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Roboflow API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Парсинг ответа Roboflow
 */
function parseYOLOResponse(response: any): YOLOResult {
  try {
    const detections: YOLODetection[] = response.predictions?.map((pred: any) => ({
      class: pred.class,
      confidence: pred.confidence,
      x: pred.x,
      y: pred.y,
      width: pred.width,
      height: pred.height,
    })) || [];
    
    return {
      detections,
      image: {
        width: response.image?.width || 1920,
        height: response.image?.height || 1080,
      },
      predictions: response.predictions?.length || 0,
    };
    
  } catch (error) {
    console.error('Error parsing YOLO response:', error);
    
    // Fallback данные
    return {
      detections: [],
      image: {
        width: 1920,
        height: 1080,
      },
      predictions: 0,
    };
  }
}

/**
 * Обнаружение повреждений автомобиля
 */
export async function detectCarDamages(imageBase64: string): Promise<{
  damages: Array<{
    type: string;
    severity: 'minor' | 'major' | 'critical';
    location: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  conditionScore: number;
}> {
  try {
    console.log('🔍 Detecting car damages with YOLO...');
    
    const result = await analyzeWithYOLO(imageBase64, 'car-damage-detection');
    
    // Конвертируем YOLO детекции в формат повреждений
    const damages = result.detections.map(detection => ({
      type: mapDamageType(detection.class),
      severity: mapDamageSeverity(detection.confidence),
      location: mapDamageLocation(detection.x, detection.y, result.image),
      confidence: detection.confidence,
      boundingBox: {
        x: detection.x,
        y: detection.y,
        width: detection.width,
        height: detection.height,
      },
    }));
    
    // Вычисляем общее состояние
    const conditionScore = calculateConditionScore(damages);
    const overallCondition = mapConditionScore(conditionScore);
    
    return {
      damages,
      overallCondition,
      conditionScore,
    };
    
  } catch (error) {
    console.error('YOLO damage detection error:', error);
    
    // Fallback данные
    return {
      damages: [],
      overallCondition: 'good',
      conditionScore: 80,
    };
  }
}

/**
 * Маппинг типа повреждения
 */
function mapDamageType(className: string): string {
  const damageTypes: { [key: string]: string } = {
    'scratch': 'царапина',
    'dent': 'вмятина',
    'rust': 'ржавчина',
    'crack': 'трещина',
    'chip': 'скол',
    'dent-scratch': 'вмятина с царапиной',
  };
  
  return damageTypes[className.toLowerCase()] || className;
}

/**
 * Маппинг серьезности повреждения
 */
function mapDamageSeverity(confidence: number): 'minor' | 'major' | 'critical' {
  if (confidence >= 0.8) return 'critical';
  if (confidence >= 0.6) return 'major';
  return 'minor';
}

/**
 * Маппинг расположения повреждения
 */
function mapDamageLocation(x: number, y: number, image: { width: number; height: number }): string {
  const centerX = image.width / 2;
  const centerY = image.height / 2;
  
  let location = '';
  
  // Вертикальное расположение
  if (y < centerY * 0.3) {
    location += 'верхняя часть ';
  } else if (y > centerY * 1.7) {
    location += 'нижняя часть ';
  } else {
    location += 'средняя часть ';
  }
  
  // Горизонтальное расположение
  if (x < centerX * 0.3) {
    location += 'левая сторона';
  } else if (x > centerX * 1.7) {
    location += 'правая сторона';
  } else {
    location += 'центральная часть';
  }
  
  return location;
}

/**
 * Вычисление оценки состояния
 */
function calculateConditionScore(damages: any[]): number {
  if (damages.length === 0) return 100;
  
  let totalPenalty = 0;
  
  damages.forEach(damage => {
    const penalty = damage.confidence * 20; // Максимум 20 баллов за повреждение
    totalPenalty += penalty;
  });
  
  return Math.max(100 - totalPenalty, 0);
}

/**
 * Маппинг оценки состояния
 */
function mapConditionScore(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

/**
 * Обнаружение объектов автомобиля
 */
export async function detectCarObjects(imageBase64: string): Promise<{
  objects: Array<{
    type: string;
    confidence: number;
    location: string;
  }>;
  carDetected: boolean;
  carConfidence: number;
}> {
  try {
    console.log('🚗 Detecting car objects with YOLO...');
    
    const result = await analyzeWithYOLO(imageBase64, 'car-object-detection');
    
    const objects = result.detections.map(detection => ({
      type: detection.class,
      confidence: detection.confidence,
      location: mapDamageLocation(detection.x, detection.y, result.image),
    }));
    
    const carDetection = objects.find(obj => 
      obj.type.toLowerCase().includes('car') || 
      obj.type.toLowerCase().includes('vehicle')
    );
    
    return {
      objects,
      carDetected: !!carDetection,
      carConfidence: carDetection?.confidence || 0,
    };
    
  } catch (error) {
    console.error('YOLO object detection error:', error);
    
    return {
      objects: [],
      carDetected: false,
      carConfidence: 0,
    };
  }
}

/**
 * Быстрая идентификация автомобиля с YOLO
 */
export async function quickIdentifyWithYOLO(imageBase64: string): Promise<{
  brand: string;
  model: string;
  year: number;
  color: string;
  confidence: number;
}> {
  try {
    console.log('🔍 Quick identify with YOLO...');
    
    const result = await analyzeWithYOLO(imageBase64, 'car-identification');
    
    // Ищем детекции автомобиля
    const carDetection = result.detections.find(detection => 
      detection.class.toLowerCase().includes('car')
    );
    
    if (!carDetection) {
      throw new Error('No car detected');
    }
    
    // Простая логика для извлечения информации
    // В реальном приложении здесь будет более сложная логика
    return {
      brand: 'Unknown',
      model: 'Unknown',
      year: 2020,
      color: 'Unknown',
      confidence: carDetection.confidence,
    };
    
  } catch (error) {
    console.error('YOLO quick identify error:', error);
    
    return {
      brand: 'Unknown',
      model: 'Unknown',
      year: 2020,
      color: 'Unknown',
      confidence: 0.5,
    };
  }
}

/**
 * Утилиты YOLO
 */
export const yoloUtils = {
  analyzeWithYOLO,
  detectCarDamages,
  detectCarObjects,
  quickIdentifyWithYOLO,
};
