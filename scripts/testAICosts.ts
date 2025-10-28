// scripts/testAICosts.ts
import { AI_CONFIG, checkAPIKeys, logAPICost, selectAvailableAI } from '../services/ai/config';
import { TEST_CONFIG, canMakeRequest, incrementRequestCount } from '../services/ai/testMode';

/**
 * Тестовый скрипт для проверки логов расходов AI
 */

console.log('🧪 AI Cost Testing Script');
console.log('========================');

// Проверяем конфигурацию
console.log('\n📊 AI Configuration:');
console.log('Mode:', AI_CONFIG.MODE);
console.log('Use Mock:', AI_CONFIG.USE_MOCK);
console.log('Max Images:', AI_CONFIG.MAX_IMAGES_PER_ANALYSIS);
console.log('Image Quality:', AI_CONFIG.IMAGE_QUALITY);
console.log('Enable Caching:', AI_CONFIG.ENABLE_CACHING);

// Проверяем API ключи
console.log('\n🔑 API Keys Status:');
const keys = checkAPIKeys();
console.log('OpenAI:', keys.hasOpenAI ? '✅' : '❌');
console.log('Claude:', keys.hasClaude ? '✅' : '❌');
console.log('Google:', keys.hasGoogle ? '✅' : '❌');
console.log('Roboflow:', keys.hasRoboflow ? '✅' : '❌');

// Выбираем AI провайдер
console.log('\n🤖 Selected AI Provider:');
const selectedAI = selectAvailableAI();
console.log('Selected:', selectedAI);

// Проверяем тестовый режим
console.log('\n🧪 Test Mode Configuration:');
console.log('Use Single Image:', TEST_CONFIG.USE_SINGLE_IMAGE);
console.log('Cache Results:', TEST_CONFIG.CACHE_RESULTS);
console.log('Max Requests Per Day:', TEST_CONFIG.MAX_REQUESTS_PER_DAY);
console.log('Enable Claude:', TEST_CONFIG.ENABLE_CLAUDE);
console.log('Enable OpenAI:', TEST_CONFIG.ENABLE_OPENAI);
console.log('Enable Google:', TEST_CONFIG.ENABLE_GOOGLE);
console.log('Enable YOLO:', TEST_CONFIG.ENABLE_YOLO);

// Проверяем лимиты запросов
console.log('\n📊 Request Limits:');
console.log('Can Make Request:', canMakeRequest() ? '✅' : '❌');

// Тестируем логирование расходов
console.log('\n💰 Cost Logging Test:');
console.log('Testing cost logging for different providers...');

// Тест Claude
logAPICost('claude', 1);
logAPICost('claude', 3);

// Тест OpenAI
logAPICost('openai', 1);
logAPICost('openai', 3);

// Тест Google
logAPICost('google', 1);
logAPICost('google', 1000);

// Тест Mock
logAPICost('mock', 1);

// Симулируем несколько запросов
console.log('\n🔄 Simulating Requests:');
for (let i = 1; i <= 5; i++) {
  incrementRequestCount();
}

// Проверяем финальный статус
console.log('\n📈 Final Status:');
console.log('Can Make Request:', canMakeRequest() ? '✅' : '❌');

console.log('\n✅ Cost testing complete!');
console.log('Check the logs above for cost calculations.');
