// utils/aiConfig.ts
/**
 * Утилиты для проверки и управления конфигурацией AI сервиса
 */

import { AI_CONFIG } from '@/services/ai';
import { checkAPIKeys, selectAvailableAI } from '@/services/ai/config';

// Проверка конфигурации AI сервиса
export function checkAIConfiguration(): {
  isValid: boolean;
  mode: string;
  missingKeys: string[];
  warnings: string[];
} {
  const missingKeys: string[] = [];
  const warnings: string[] = [];
  
  const mode = AI_CONFIG.USE_MOCK ? 'mock' : AI_CONFIG.MODE;
  // checkAPIKeys is sync now, returns object directly
  const keys = { hasOpenAI: false, hasClaude: false, hasGoogle: false, hasRoboflow: false };

  if (mode === 'production') {
    if (!keys.hasOpenAI) {
      missingKeys.push('EXPO_PUBLIC_OPENAI_API_KEY');
    }
    if (!keys.hasClaude) {
      missingKeys.push('EXPO_PUBLIC_CLAUDE_API_KEY');
    }
    if (!keys.hasGoogle) {
      missingKeys.push('EXPO_PUBLIC_GOOGLE_API_KEY');
    }
    if (!keys.hasRoboflow) {
      warnings.push('EXPO_PUBLIC_ROBOFLOW_API_KEY не настроен (опционально)');
    }
  } else if (mode === 'development') {
    warnings.push('AI сервис работает в режиме разработки');
  } else {
    warnings.push('AI сервис работает в mock режиме без реальных API вызовов');
  }

  return {
    isValid: missingKeys.length === 0,
    mode,
    missingKeys,
    warnings,
  };
}

// Получение статуса AI сервиса
export function getAIStatus(): {
  mode: string;
  isProduction: boolean;
  isMock: boolean;
  hasOpenAI: boolean;
  hasClaude: boolean;
  hasGoogleVision: boolean;
  hasRoboflow: boolean;
  readyForProduction: boolean;
} {
  const mode = AI_CONFIG.USE_MOCK ? 'mock' : AI_CONFIG.MODE;
  const isProduction = mode === 'production';
  const isMock = mode === 'mock';
  
  // Sync check - simplified for now
  const hasOpenAI = !!process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const hasClaude = !!process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  const hasGoogleVision = !!process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const hasRoboflow = !!process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY;
  
  const readyForProduction = isProduction && hasOpenAI && hasClaude && hasGoogleVision;
  
  return {
    mode,
    isProduction,
    isMock,
    hasOpenAI,
    hasClaude,
    hasGoogleVision,
    hasRoboflow,
    readyForProduction,
  };
}

// Логирование конфигурации (без API ключей)
export function logAIConfiguration(): void {
  const status = getAIStatus();
  
  console.log('🤖 AI Service Configuration:');
  console.log(`   Mode: ${status.mode}`);
  console.log(`   OpenAI: ${status.hasOpenAI ? '✅' : '❌'}`);
  console.log(`   Claude: ${status.hasClaude ? '✅' : '❌'}`);
  console.log(`   Google Vision: ${status.hasGoogleVision ? '✅' : '❌'}`);
  console.log(`   Roboflow: ${status.hasRoboflow ? '✅' : '❌'}`);
  console.log(`   Ready for production: ${status.readyForProduction ? '✅' : '❌'}`);
  
  if (!status.readyForProduction && status.isProduction) {
    console.warn('⚠️  AI сервис не готов для продакшена. Проверьте API ключи.');
  }
}

// Валидация переменных окружения
export function validateEnvironmentVariables(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Проверяем обязательные переменные
  const requiredVars = [
    'EXPO_PUBLIC_AI_MODE',
  ];
  
  const optionalVars = [
    'EXPO_PUBLIC_OPENAI_API_KEY',
    'EXPO_PUBLIC_CLAUDE_API_KEY',
    'EXPO_PUBLIC_GOOGLE_API_KEY',
    'EXPO_PUBLIC_ROBOFLOW_API_KEY',
  ];
  
  // Проверяем обязательные переменные
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Отсутствует обязательная переменная: ${varName}`);
    }
  });
  
  // Проверяем режим
  const aiMode = process.env.EXPO_PUBLIC_AI_MODE;
  if (aiMode && !['development', 'production'].includes(aiMode)) {
    errors.push(`Недопустимое значение EXPO_PUBLIC_AI_MODE: ${aiMode}. Допустимые значения: development, production`);
  }
  
  // Проверяем API ключи в продакшн режиме
  if (aiMode === 'production') {
    optionalVars.forEach(varName => {
      if (!process.env[varName]) {
        if (varName === 'EXPO_PUBLIC_ROBOFLOW_API_KEY') {
          warnings.push(`${varName} не настроен (опционально)`);
        } else {
          errors.push(`Отсутствует API ключ для продакшена: ${varName}`);
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Получение рекомендаций по настройке
export function getSetupRecommendations(): string[] {
  const recommendations: string[] = [];
  const status = getAIStatus();
  
  if (status.isMock) {
    recommendations.push('Для тестирования с реальными AI API переключитесь в production режим');
    recommendations.push('Установите EXPO_PUBLIC_AI_MODE=production и EXPO_PUBLIC_USE_MOCK=false в .env файле');
  }
  
  if (!status.hasOpenAI) {
    recommendations.push('Получите OpenAI API ключ на platform.openai.com');
    recommendations.push('Добавьте EXPO_PUBLIC_OPENAI_API_KEY в .env файл');
  }
  
  if (!status.hasClaude) {
    recommendations.push('Получите Claude (Anthropic) API ключ на console.anthropic.com');
    recommendations.push('Добавьте EXPO_PUBLIC_CLAUDE_API_KEY в .env файл');
  }
  
  if (!status.hasGoogleVision) {
    recommendations.push('Настройте Google Cloud Vision API в Google Cloud Console');
    recommendations.push('Добавьте EXPO_PUBLIC_GOOGLE_API_KEY в .env файл');
  }
  
  if (status.isProduction && !status.readyForProduction) {
    recommendations.push('Проверьте все API ключи перед развертыванием в продакшене');
    recommendations.push('Протестируйте AI анализ в staging окружении');
  }
  
  return recommendations;
}

// Инициализация AI сервиса с проверкой
export function initializeAIService(): boolean {
  console.log('🚀 Инициализация AI сервиса...');
  
  // Проверяем переменные окружения
  const envValidation = validateEnvironmentVariables();
  
  if (!envValidation.isValid) {
    console.error('❌ Ошибки в переменных окружения:');
    envValidation.errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
  
  if (envValidation.warnings.length > 0) {
    console.warn('⚠️  Предупреждения:');
    envValidation.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  // Проверяем конфигурацию AI
  const configCheck = checkAIConfiguration();
  
  if (!configCheck.isValid) {
    console.error('❌ AI сервис не настроен корректно:');
    configCheck.missingKeys.forEach(key => console.error(`   - Отсутствует: ${key}`));
    return false;
  }
  
  if (configCheck.warnings.length > 0) {
    console.warn('⚠️  Предупреждения конфигурации:');
    configCheck.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  // Логируем статус
  logAIConfiguration();
  
  // Показываем рекомендации
  const recommendations = getSetupRecommendations();
  if (recommendations.length > 0) {
    console.log('💡 Рекомендации:');
    recommendations.forEach(rec => console.log(`   - ${rec}`));
  }
  
  console.log('✅ AI сервис инициализирован');

  const selectedProvider = selectAvailableAI();
  console.log(`🤖 Активный AI провайдер: ${selectedProvider}`);
  return true;
}

// Экспорт всех утилит
export const aiConfigUtils = {
  checkAIConfiguration,
  getAIStatus,
  logAIConfiguration,
  validateEnvironmentVariables,
  getSetupRecommendations,
  initializeAIService,
};
