// test-ai-service.js
// Простой тест AI сервиса без Expo

console.log('🧪 Testing AI Service...');
console.log('========================');

// Симулируем конфигурацию AI
const AI_CONFIG = {
  MODE: 'development',
  USE_MOCK: false,
  MAX_IMAGES_PER_ANALYSIS: 3,
  IMAGE_QUALITY: 0.7,
  ENABLE_CACHING: true,
};

// Симулируем проверку API ключей
function checkAPIKeys() {
  return {
    hasOpenAI: true,
    hasClaude: true,
    hasGoogle: true,
    hasRoboflow: true,
  };
}

// Симулируем выбор AI
function selectAvailableAI() {
  return 'claude';
}

// Симулируем логирование расходов
function logAPICost(provider, imageCount) {
  const costs = {
    claude: imageCount * 0.023,
    openai: imageCount * 0.03,
    google: imageCount > 1000 ? imageCount * 0.0015 : 0,
  };
  
  const cost = costs[provider] || 0;
  console.log(`💰 AI Cost: $${cost.toFixed(4)} (${provider}, ${imageCount} images)`);
}

// Тестируем AI сервис
console.log('\n📊 AI Configuration:');
console.log('Mode:', AI_CONFIG.MODE);
console.log('Use Mock:', AI_CONFIG.USE_MOCK);
console.log('Max Images:', AI_CONFIG.MAX_IMAGES_PER_ANALYSIS);
console.log('Image Quality:', AI_CONFIG.IMAGE_QUALITY);
console.log('Enable Caching:', AI_CONFIG.ENABLE_CACHING);

console.log('\n🔑 API Keys Status:');
const keys = checkAPIKeys();
console.log('OpenAI:', keys.hasOpenAI ? '✅' : '❌');
console.log('Claude:', keys.hasClaude ? '✅' : '❌');
console.log('Google:', keys.hasGoogle ? '✅' : '❌');
console.log('Roboflow:', keys.hasRoboflow ? '✅' : '❌');

console.log('\n🤖 Selected AI Provider:');
const selectedAI = selectAvailableAI();
console.log('Selected:', selectedAI);

console.log('\n💰 Cost Logging Test:');
logAPICost('claude', 1);
logAPICost('claude', 3);
logAPICost('openai', 1);
logAPICost('openai', 3);
logAPICost('google', 1);
logAPICost('google', 1000);

console.log('\n✅ AI Service test complete!');
console.log('\n📊 Cost Summary:');
console.log('- Claude: $0.023 per image (cheapest)');
console.log('- OpenAI: $0.030 per image');
console.log('- Google: $0.0015 per image (only for >1000 requests)');
console.log('- Mock: $0.000 per image (free)');

console.log('\n🎯 Next Steps:');
console.log('1. Fix Expo port issue');
console.log('2. Test AITestComponent in browser');
console.log('3. Verify API keys work in real environment');
console.log('4. Test car analysis functionality');
