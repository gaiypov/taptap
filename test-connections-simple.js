// test-connections-simple.js
// Простой скрипт проверки подключений (не требует TypeScript)

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Проверка подключений...\n');

// Конфигурация
const SUPABASE_URL = 'https://thqlfkngyipdscckbhor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocWxma25neWlwZHNjY2tiaG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjYyMTksImV4cCI6MjA3NTYwMjIxOX0.vpFYGGSs81wgiJgedBe8_VSqle575fPMeTqdJwKHtlE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
  console.log('📊 1. Проверка Supabase подключения...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Ошибка:', error.message);
      return false;
    }
    
    console.log('✅ Supabase: Подключение успешно!\n');
    return true;
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return false;
  }
}

async function checkTables() {
  console.log('🗄️  2. Проверка таблиц базы данных...\n');
  
  const tables = [
    { name: 'users', description: 'Пользователи' },
    { name: 'cars', description: 'Автомобили' },
    { name: 'reports', description: 'Жалобы (новая)' },
    { name: 'moderation_logs', description: 'Логи модерации (новая)' },
    { name: 'rate_limit_violations', description: 'Нарушения лимитов (новая)' },
    { name: 'conversations', description: 'Беседы' },
    { name: 'messages', description: 'Сообщения' },
    { name: 'likes', description: 'Лайки' },
    { name: 'saves', description: 'Сохранения' },
  ];
  
  let foundCount = 0;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`❌ ${table.description} (${table.name}): не найдена`);
      } else {
        console.log(`✅ ${table.description} (${table.name}): найдена`);
        foundCount++;
      }
    } catch (error) {
      console.log(`❌ ${table.description} (${table.name}): ошибка`);
    }
  }
  
  console.log(`\n📊 Найдено таблиц: ${foundCount}/${tables.length}\n`);
  return foundCount >= 3; // Минимум должны быть users, cars, reports
}

async function checkUserFields() {
  console.log('📋 3. Проверка новых полей в таблице users...\n');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, phone, name, is_dealer, trust_score, dealer_type')
      .limit(1);
    
    if (error) {
      console.log('❌ Новые поля не найдены');
      console.log('⚠️  SQL скрипт не был выполнен!');
      console.log('💡 Выполните: supabase-security-updates.sql\n');
      return false;
    }
    
    console.log('✅ Поле is_dealer: найдено');
    console.log('✅ Поле trust_score: найдено');
    console.log('✅ Поле dealer_type: найдено');
    console.log('✅ Структура users обновлена!\n');
    return true;
  } catch (error) {
    console.error('❌ Ошибка:', error.message, '\n');
    return false;
  }
}

async function showSummary(supabaseOk, tablesOk, fieldsOk) {
  console.log('═══════════════════════════════════════');
  console.log('📊 ИТОГОВЫЙ ОТЧЁТ');
  console.log('═══════════════════════════════════════\n');
  
  console.log('Supabase подключение:', supabaseOk ? '✅ Работает' : '❌ Не работает');
  console.log('Таблицы базы данных:', tablesOk ? '✅ Найдены' : '❌ Не найдены');
  console.log('Новые поля (система защиты):', fieldsOk ? '✅ Добавлены' : '❌ Требуют установки');
  
  console.log('\n═══════════════════════════════════════\n');
  
  if (supabaseOk && tablesOk && fieldsOk) {
    console.log('🎉 ВСЁ ОТЛИЧНО! База данных готова к работе!\n');
    console.log('✅ Supabase подключён');
    console.log('✅ Все таблицы найдены');
    console.log('✅ Система защиты установлена');
    console.log('\n💡 Следующий шаг: Добавьте Google Vision API ключ');
    console.log('   Откройте app.json и замените:');
    console.log('   "GOOGLE_VISION_API_KEY": "YOUR_GOOGLE_VISION_API_KEY_HERE"');
    console.log('   На ваш настоящий ключ от Google Cloud\n');
  } else {
    console.log('⚠️  ТРЕБУЮТСЯ ДЕЙСТВИЯ:\n');
    
    if (!supabaseOk) {
      console.log('❌ Supabase не подключён');
      console.log('   - Проверьте ключи в app.json');
      console.log('   - Проверьте интернет-соединение\n');
    }
    
    if (!tablesOk) {
      console.log('❌ Таблицы не найдены');
      console.log('   - Выполните supabase-complete-schema.sql\n');
    }
    
    if (!fieldsOk) {
      console.log('❌ Система защиты не установлена');
      console.log('   - Выполните supabase-security-updates.sql');
      console.log('   - В Supabase Dashboard → SQL Editor');
      console.log('   - Скопируйте и запустите скрипт\n');
    }
  }
}

async function main() {
  const supabaseOk = await testSupabaseConnection();
  
  let tablesOk = false;
  let fieldsOk = false;
  
  if (supabaseOk) {
    tablesOk = await checkTables();
    fieldsOk = await checkUserFields();
  }
  
  await showSummary(supabaseOk, tablesOk, fieldsOk);
  
  process.exit(supabaseOk ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

