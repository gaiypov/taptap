// services/ai/openai.ts
import { AI_CONFIG } from './config';

/**
 * Анализ автомобиля с помощью OpenAI GPT-4 Vision
 */
export async function analyzeWithOpenAI(
  frames: string[],
  analysisType: 'full_analysis' | 'quick_identify' | 'damage_detection',
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<any> {
  try {
    console.log('🤖 OpenAI analysis started...', { 
      framesCount: frames.length, 
      analysisType 
    });
    
    // Проверяем наличие API ключа
    if (!AI_CONFIG.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found');
    }
    
    // Подготавливаем промпт в зависимости от типа анализа
    const prompt = createOpenAIPrompt(analysisType);
    
    // Вызываем OpenAI API
    const response = await callOpenAIAPI(prompt, frames, {
      model: options.model || 'gpt-4-vision-preview',
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.1,
    });
    
    // Парсим ответ
    const result = parseOpenAIResponse(response, analysisType);
    
    console.log('✅ OpenAI analysis complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ OpenAI analysis error:', error);
    throw error;
  }
}

/**
 * Создание промпта для OpenAI
 */
function createOpenAIPrompt(analysisType: string): string {
  const prompts = {
    full_analysis: `
Проанализируй изображения автомобиля и предоставь детальную информацию в JSON формате:

1. ОСНОВНАЯ ИНФОРМАЦИЯ:
   - brand: марка автомобиля
   - model: модель автомобиля
   - year: год выпуска (если видно)
   - color: цвет автомобиля
   - mileage: пробег (если видно на одометре)

2. СОСТОЯНИЕ АВТОМОБИЛЯ:
   - condition: общее состояние (excellent/good/fair/poor)
   - conditionScore: оценка от 0 до 100
   - damages: массив повреждений
     - type: тип повреждения (scratch/dent/rust/crack)
     - severity: серьезность (minor/major/critical)
     - location: расположение повреждения
     - confidence: уверенность в обнаружении (0-1)

3. ОСОБЕННОСТИ:
   - features: массив особенностей автомобиля

4. ЦЕНА:
   - estimatedPrice: диапазон цен
     - min: минимальная цена
     - max: максимальная цена

Ответь ТОЛЬКО в JSON формате без дополнительного текста.
`,
    
    quick_identify: `
Определи марку, модель, год и цвет автомобиля на изображении.
Ответь в JSON формате:
{
  "brand": "марка",
  "model": "модель", 
  "year": год,
  "color": "цвет",
  "confidence": уверенность (0-1)
}
`,
    
    damage_detection: `
Обнаружь повреждения на автомобиле и оцени их серьезность.
Ответь в JSON формате:
{
  "damages": [
    {
      "type": "тип повреждения",
      "severity": "серьезность",
      "location": "расположение",
      "confidence": уверенность (0-1)
    }
  ],
  "overallCondition": "общее состояние",
  "conditionScore": оценка (0-100)
}
`,
  };
  
  return prompts[analysisType as keyof typeof prompts] || prompts.full_analysis;
}

/**
 * Вызов OpenAI API
 */
async function callOpenAIAPI(
  prompt: string, 
  frames: string[], 
  options: any
): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            // Добавляем изображения
            ...frames.map(frame => ({
              type: 'image_url',
              image_url: {
                url: frame,
                detail: 'high',
              },
            })),
          ],
        },
      ],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Парсинг ответа OpenAI
 */
function parseOpenAIResponse(response: any, analysisType: string): any {
  try {
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Валидация и нормализация результата в зависимости от типа анализа
    if (analysisType === 'quick_identify') {
      return {
        brand: parsed.brand || 'Unknown',
        model: parsed.model || 'Unknown',
        year: parsed.year || 2020,
        color: parsed.color || 'Unknown',
        confidence: parsed.confidence || 0.8,
      };
    }
    
    if (analysisType === 'damage_detection') {
      return {
        damages: parsed.damages || [],
        overallCondition: parsed.overallCondition || 'good',
        conditionScore: parsed.conditionScore || 80,
      };
    }
    
    // Полный анализ
    return {
      brand: parsed.brand || 'Unknown',
      model: parsed.model || 'Unknown',
      year: parsed.year || 2020,
      color: parsed.color || 'Unknown',
      mileage: parsed.mileage || 0,
      location: 'Бишкек',
      videoUrl: 'mock://video',
      thumbnailUrl: 'https://picsum.photos/800/600',
      aiAnalysis: {
        condition: parsed.condition || 'good',
        conditionScore: parsed.conditionScore || 80,
        damages: parsed.damages || [],
        estimatedPrice: parsed.estimatedPrice || { min: 2000000, max: 2500000 },
        features: parsed.features || [],
      },
    };
    
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    
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
 * Быстрая идентификация автомобиля с OpenAI
 */
export async function quickIdentifyWithOpenAI(imageBase64: string): Promise<{
  brand: string;
  model: string;
  year: number;
  color: string;
  confidence: number;
}> {
  try {
    const result = await analyzeWithOpenAI([imageBase64], 'quick_identify', {
      model: 'gpt-4-vision-preview',
      maxTokens: 500,
      temperature: 0.1,
    });
    
    return result;
    
  } catch (error) {
    console.error('OpenAI quick identify error:', error);
    
    // Fallback данные
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
 * Обнаружение повреждений с OpenAI
 */
export async function detectDamagesWithOpenAI(imageBase64: string): Promise<{
  damages: any[];
  overallCondition: string;
  conditionScore: number;
}> {
  try {
    const result = await analyzeWithOpenAI([imageBase64], 'damage_detection', {
      model: 'gpt-4-vision-preview',
      maxTokens: 1000,
      temperature: 0.1,
    });
    
    return result;
    
  } catch (error) {
    console.error('OpenAI damage detection error:', error);
    
    // Fallback данные
    return {
      damages: [],
      overallCondition: 'good',
      conditionScore: 80,
    };
  }
}
