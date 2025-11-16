// services/ai/claude.ts
import { AI_CONFIG } from './config';

/**
 * Анализ автомобиля с помощью Claude API
 */
export async function analyzeWithClaude(
  frames: string[],
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<any> {
  try {
    console.log('🤖 Claude analysis started...', { framesCount: frames.length });
    
    // Проверяем наличие API ключа
    if (!AI_CONFIG.CLAUDE_API_KEY) {
      throw new Error('Claude API key not found');
    }
    
    // Подготавливаем промпт для анализа автомобиля
    const prompt = createCarAnalysisPrompt(frames);
    
    // Вызываем Claude API
    const response = await callClaudeAPI(prompt, frames, {
      model: options.model || 'claude-3-sonnet-20240229',
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.1,
    });
    
    // Парсим ответ
    const result = parseClaudeResponse(response);
    
    console.log('✅ Claude analysis complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Claude analysis error:', error);
    throw error;
  }
}

/**
 * Создание промпта для анализа автомобиля
 */
function createCarAnalysisPrompt(frames: string[]): string {
  return `
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
`;
}

/**
 * Вызов Claude API
 */
async function callClaudeAPI(prompt: string, frames: string[], options: any): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_CONFIG.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
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
            ...frames.map((frame: string) => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: frame.replace('data:image/jpeg;base64,', ''),
              },
            })),
          ],
        },
      ],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Парсинг ответа Claude
 */
function parseClaudeResponse(response: any): any {
  try {
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Валидация и нормализация результата
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
    console.error('Error parsing Claude response:', error);
    
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
 * Быстрая идентификация автомобиля с Claude
 */
export async function quickIdentifyWithClaude(imageBase64: string): Promise<{
  brand: string;
  model: string;
  year: number;
  color: string;
  confidence: number;
}> {
  try {
    const prompt = `
Определи марку, модель, год и цвет автомобиля на изображении.
Ответь в JSON формате:
{
  "brand": "марка",
  "model": "модель", 
  "year": год,
  "color": "цвет",
  "confidence": уверенность (0-1)
}
`;
    
    const response = await callClaudeAPI(prompt, [imageBase64], {
      model: 'claude-3-haiku-20240307', // Более быстрая модель для быстрой идентификации
      maxTokens: 500,
      temperature: 0.1,
    });
    
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        brand: parsed.brand || 'Unknown',
        model: parsed.model || 'Unknown',
        year: parsed.year || 2020,
        color: parsed.color || 'Unknown',
        confidence: parsed.confidence || 0.8,
      };
    }
    
    throw new Error('No valid JSON in response');
    
  } catch (error) {
    console.error('Claude quick identify error:', error);
    
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
