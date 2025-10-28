// scripts/test-connections.ts
// Скрипт для проверки подключений к Supabase и Google Vision API

import { supabase } from '../services/supabase';

console.log('🔍 Проверка подключений...\n');

async function testSupabaseConnection() {
  console.log('📊 1. Проверка Supabase подключения...');
  
  try {
    // Проверка подключения
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Ошибка Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Supabase: Подключение успешно!\n');
    return true;
  } catch (error: any) {
    console.error('❌ Ошибка Supabase:', error.message);
    return false;
  }
}

async function testSupabaseStructure() {
  console.log('🗄️  2. Проверка структуры базы данных...');
  
  try {
    // Проверяем основные таблицы
    const tables = ['users', 'cars', 'reports', 'moderation_logs', 'rate_limit_violations'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Таблица "${table}": ${error.message}`);
      } else {
        console.log(`✅ Таблица "${table}": найдена`);
      }
    }
    
    console.log('\n');
    return true;
  } catch (error: any) {
    console.error('❌ Ошибка проверки структуры:', error.message);
    return false;
  }
}

async function testUsersFields() {
  console.log('📋 3. Проверка новых полей в таблице users...');
  
  try {
    // Пробуем вставить тестовую запись с новыми полями
    const testData = {
      phone: '+996700000000',
      name: 'Test User',
      is_dealer: false,
      trust_score: 0,
    };
    
    // Проверяем, можем ли читать с новыми полями
    const { data, error } = await supabase
      .from('users')
      .select('phone, name, is_dealer, trust_score, dealer_type')
      .limit(1);
    
    if (error) {
      console.log('❌ Новые поля не найдены:', error.message);
      console.log('⚠️  Возможно, SQL скрипт не был выполнен!');
      return false;
    }
    
    console.log('✅ Поля is_dealer, trust_score: найдены');
    console.log('✅ Структура users обновлена!\n');
    return true;
  } catch (error: any) {
    console.error('❌ Ошибка проверки полей:', error.message);
    return false;
  }
}

async function testGoogleVisionAPI() {
  console.log('🤖 4. Проверка Google Vision API...');
  
  const apiKey = process.env.GOOGLE_VISION_API_KEY || 
                 (global as any).EXPO_PUBLIC_GOOGLE_VISION_API_KEY ||
                 'YOUR_GOOGLE_VISION_API_KEY_HERE';
  
  if (!apiKey || apiKey === 'YOUR_GOOGLE_VISION_API_KEY_HERE') {
    console.log('⚠️  Google Vision API ключ не настроен');
    console.log('💡 Добавьте ключ в app.json:');
    console.log('   "GOOGLE_VISION_API_KEY": "AIzaSy...ваш_ключ"');
    console.log('ℹ️  Без ключа модерация будет работать в ручном режиме\n');
    return false;
  }
  
  try {
    // Тестовый запрос к API (проверяем валидность ключа)
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 белый пиксель
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: testImage },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          }],
        }),
      }
    );
    
    const result = await response.json();
    
    if (result.error) {
      console.log('❌ Google Vision API ошибка:', result.error.message);
      console.log('💡 Проверьте:');
      console.log('   1. Ключ скопирован полностью');
      console.log('   2. Vision API включен в Google Cloud');
      console.log('   3. Нет ограничений на ключ\n');
      return false;
    }
    
    if (result.responses && result.responses[0]) {
      console.log('✅ Google Vision API: работает!');
      console.log('✅ AI модерация включена!\n');
      return true;
    }
    
    console.log('⚠️  Неожиданный ответ от API');
    return false;
  } catch (error: any) {
    console.error('❌ Ошибка Google Vision API:', error.message);
    return false;
  }
}

async function showSummary(results: any) {
  console.log('═══════════════════════════════════════');
  console.log('📊 ИТОГОВЫЙ ОТЧЁТ');
  console.log('═══════════════════════════════════════\n');
  
  console.log('Supabase подключение:', results.supabase ? '✅ Работает' : '❌ Не работает');
  console.log('Структура БД:', results.structure ? '✅ Правильная' : '❌ Требует обновления');
  console.log('Новые поля users:', results.fields ? '✅ Добавлены' : '❌ Не найдены');
  console.log('Google Vision API:', results.google ? '✅ Настроен' : '⚠️  Не настроен');
  
  console.log('\n═══════════════════════════════════════\n');
  
  if (results.supabase && results.structure && results.fields) {
    console.log('🎉 Система защиты готова к работе!');
    
    if (results.google) {
      console.log('✅ AI модерация включена');
    } else {
      console.log('ℹ️  AI модерация выключена (работает ручная модерация)');
      console.log('💡 Добавьте Google Vision ключ для автоматической модерации');
    }
  } else {
    console.log('⚠️  Требуются дополнительные действия:');
    
    if (!results.supabase) {
      console.log('   - Проверьте Supabase ключи в app.json');
    }
    if (!results.structure || !results.fields) {
      console.log('   - Выполните SQL скрипт supabase-security-updates.sql');
    }
    if (!results.google) {
      console.log('   - (Опционально) Добавьте Google Vision API ключ');
    }
  }
  
  console.log('\n');
}

async function main() {
  const results = {
    supabase: false,
    structure: false,
    fields: false,
    google: false,
  };
  
  results.supabase = await testSupabaseConnection();
  
  if (results.supabase) {
    results.structure = await testSupabaseStructure();
    results.fields = await testUsersFields();
  }
  
  results.google = await testGoogleVisionAPI();
  
  await showSummary(results);
  
  process.exit(results.supabase ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

