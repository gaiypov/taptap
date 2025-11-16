// __tests__/services/ai.test.ts
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AI_CONFIG, analyzeCarVideo, quickIdentifyCar, validateVideoQuality } from '@/services/ai';
import { checkAPIKeys } from '@/services/ai/config';

// Увеличиваем timeout для всех тестов (глобальный timeout установлен в jest.config.js на 10s)
// Для длинных AI тестов используем индивидуальные timeouts в it() вызовах (15s)

// Мокируем expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('mock-base64-data')),
  EncodingType: {
    Base64: 'base64',
  },
}));

// Мокируем fetch для API вызовов
const fetchMock = jest.fn();
global.fetch = fetchMock as any;

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    // Устанавливаем режим mock по умолчанию
    AI_CONFIG.MODE = 'development';
    AI_CONFIG.USE_MOCK = true;
  });

  describe('analyzeCarVideo', () => {
    it('should analyze video in mock mode', async () => {
      jest.setTimeout(15000);
      const mockVideoUri = 'file://test-video.mp4';
      const mockProgressCallback = jest.fn<(step: string, progress: number) => void>();

      const result = await analyzeCarVideo(mockVideoUri, mockProgressCallback);

      expect(result).toBeDefined();
      expect(result.brand).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.year).toBeDefined();
      expect(result.mileage).toBeDefined();
      expect(result.aiAnalysis).toBeDefined();
      expect(result.aiAnalysis?.condition).toBeDefined();
      expect(result.aiAnalysis?.damages).toBeInstanceOf(Array);
      expect(result.aiAnalysis?.estimatedPrice).toBeDefined();
      expect(result.aiAnalysis?.features).toBeInstanceOf(Array);

      // Проверяем что callback вызывался
      expect(mockProgressCallback).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockVideoUri = 'invalid-uri';
      
      await expect(analyzeCarVideo(mockVideoUri)).resolves.toBeDefined();
    });

    it('should call progress callback with correct steps', async () => {
      const mockVideoUri = 'file://test-video.mp4';
      const mockProgressCallback = jest.fn<(step: string, progress: number) => void>();

      await analyzeCarVideo(mockVideoUri, mockProgressCallback);

      // Проверяем что callback вызывался с правильными шагами
      const calls = mockProgressCallback.mock.calls as Array<[string, number]>;
      expect(calls.length).toBeGreaterThan(0);
      
      // Проверяем что прогресс идет от 0 до 100
      const progressValues = calls.map(([, progressValue]) => progressValue);
      expect(Math.min(...progressValues)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...progressValues)).toBeLessThanOrEqual(100);
    });
  });

  describe('quickIdentifyCar', () => {
    it('should identify car from image in mock mode', async () => {
      const mockImageUri = 'file://test-image.jpg';

      const result = await quickIdentifyCar(mockImageUri);

      expect(result).toBeDefined();
      expect(result.brand).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.year).toBeDefined();
      expect(result.color).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle invalid image URI', async () => {
      const invalidUri = '';

      await expect(quickIdentifyCar(invalidUri)).rejects.toThrow();
    });
  });

  describe('validateVideoQuality', () => {
    it('should validate video quality', async () => {
      const mockVideoUri = 'file://test-video.mp4';

      const result = await validateVideoQuality(mockVideoUri);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should return valid result for good video', async () => {
      const mockVideoUri = 'file://good-video.mp4';

      const result = await validateVideoQuality(mockVideoUri);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('AI_CONFIG', () => {
    it('should have correct structure', () => {
      expect(AI_CONFIG).toBeDefined();
      expect(AI_CONFIG.MODE).toBeDefined();
      expect(AI_CONFIG.PRIMARY_AI).toBeDefined();
      expect(typeof AI_CONFIG.MAX_IMAGES_PER_ANALYSIS).toBe('number');
      expect(typeof AI_CONFIG.IMAGE_QUALITY).toBe('number');
      const keys = checkAPIKeys();
      expect(keys).toHaveProperty('hasOpenAI');
      expect(keys).toHaveProperty('hasClaude');
      expect(keys).toHaveProperty('hasGoogle');
      expect(keys).toHaveProperty('hasRoboflow');
    });

    it('should allow mode switching', () => {
      AI_CONFIG.MODE = 'production';
      expect(AI_CONFIG.MODE).toBe('production');

      AI_CONFIG.MODE = 'development';
      expect(AI_CONFIG.MODE).toBe('development');
      
      AI_CONFIG.USE_MOCK = true;
      expect(AI_CONFIG.USE_MOCK).toBe(true);
    });
  });

  describe('Production mode integration', () => {
    beforeEach(() => {
      AI_CONFIG.MODE = 'production';
      AI_CONFIG.USE_MOCK = false;
      AI_CONFIG.OPENAI_API_KEY = 'sk-test-openai-key';
      AI_CONFIG.CLAUDE_API_KEY = '';
      AI_CONFIG.GOOGLE_API_KEY = '';
    });

    it('should make API calls in production mode', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                brand: 'Toyota',
                model: 'Camry',
                year: 2020,
                color: 'Белый',
                confidence: 0.95
              })
            }
          }]
        })
      };

      fetchMock.mockResolvedValueOnce(mockResponse);

      const mockImageUri = 'file://test-image.jpg';
      const result = await quickIdentifyCar(mockImageUri);

      expect(fetchMock).toHaveBeenCalled();
      expect(result.brand).toBe('Toyota');
    });

    it('should handle API errors in production mode', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 401
      };

      fetchMock.mockResolvedValueOnce(mockErrorResponse as any);

      const mockImageUri = 'file://test-image.jpg';

      await expect(quickIdentifyCar(mockImageUri)).rejects.toThrow();
    });
  });

  describe('Mock data consistency', () => {
    it('should return consistent mock data', async () => {
      const mockVideoUri = 'file://test-video.mp4';
      
      const result1 = await analyzeCarVideo(mockVideoUri);
      const result2 = await analyzeCarVideo(mockVideoUri);

      // В mock режиме данные должны быть разными (случайными)
      // но структура должна быть одинаковой
      expect(typeof result1.brand).toBe(typeof result2.brand);
      expect(typeof result1.model).toBe(typeof result2.model);
      expect(typeof result1.year).toBe(typeof result2.year);
      expect(typeof result1.mileage).toBe(typeof result2.mileage);
    });

    it('should return realistic mock data ranges', async () => {
      const mockVideoUri = 'file://test-video.mp4';
      const result = await analyzeCarVideo(mockVideoUri);

      expect(result.year).toBeGreaterThanOrEqual(2018);
      expect(result.year).toBeLessThanOrEqual(2024);
      expect(result.mileage).toBeGreaterThanOrEqual(20000);
      expect(result.mileage).toBeLessThanOrEqual(100000);
      expect(result.aiAnalysis?.conditionScore).toBeGreaterThanOrEqual(0);
      expect(result.aiAnalysis?.conditionScore).toBeLessThanOrEqual(100);
    });
  });
});
