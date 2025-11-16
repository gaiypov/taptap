/**
 * Скрипт для загрузки 9 тестовых видео (3 авто, 3 лошади, 3 недвижимость)
 * Запуск: npx tsx scripts/seed-test-videos.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Загружаем переменные окружения из разных источников
// Сначала пробуем .env в корне проекта
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Также пробуем .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: false });
}

// Загружаем из app.json если он существует
let appConfig: any = {};
try {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  if (fs.existsSync(appJsonPath)) {
    appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
  }
} catch (error) {
  // Игнорируем ошибки чтения app.json
}

// Получаем переменные из разных источников (приоритет: env > app.json extra)
const SUPABASE_URL = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL ||
  appConfig?.expo?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_SERVICE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_KEY ||
  appConfig?.expo?.extra?.SUPABASE_SERVICE_ROLE_KEY ||
  '';

// Показываем более детальную информацию об ошибке
if (!SUPABASE_URL) {
  console.error('\n❌ Ошибка: Не найден SUPABASE_URL\n');
  console.log('Текущие значения:');
  console.log(`  process.env.EXPO_PUBLIC_SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL || '(не установлен)'}`);
  console.log(`  process.env.SUPABASE_URL: ${process.env.SUPABASE_URL || '(не установлен)'}`);
  console.log(`  app.json expo.extra.EXPO_PUBLIC_SUPABASE_URL: ${appConfig?.expo?.extra?.EXPO_PUBLIC_SUPABASE_URL || '(не установлен)'}`);
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('\n❌ Ошибка: Не найден SUPABASE_SERVICE_ROLE_KEY\n');
  console.log('📍 Где взять SERVICE_ROLE_KEY:');
  console.log('  1. Откройте ваш проект в Supabase Dashboard');
  console.log('  2. Перейдите в Settings > API');
  console.log('  3. Найдите "service_role" key (НЕ anon key!)');
  console.log('  4. Скопируйте его\n');
  
  console.log('📝 Как добавить ключ:');
  console.log('  1. Создайте файл .env в корне проекта');
  console.log('  2. Добавьте строку:');
  console.log('     SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key-здесь\n');
  
  console.log('   Или временно добавьте в app.json (не рекомендуется для production):');
  console.log('     {');
  console.log('       "expo": {');
  console.log('         "extra": {');
  console.log('           "SUPABASE_SERVICE_ROLE_KEY": "ваш-ключ"');
  console.log('         }');
  console.log('       }');
  console.log('     }\n');
  
  console.log('Текущие значения:');
  console.log(`  process.env.SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '***установлен***' : '(не установлен)'}`);
  console.log(`  app.json expo.extra.SUPABASE_SERVICE_ROLE_KEY: ${appConfig?.expo?.extra?.SUPABASE_SERVICE_ROLE_KEY ? '***установлен***' : '(не установлен)'}\n`);
  
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Тестовые видео URL (используем публичные тестовые видео)
const TEST_VIDEOS = {
  cars: [
    {
      title: 'Toyota Camry 2020 - Отличное состояние',
      description: 'Toyota Camry 2020 года в отличном состоянии. Пробег 45,000 км. Один владелец. Все документы в порядке.',
      price: 2500000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/FF6B6B/FFFFFF?text=Toyota+Camry+2020',
      location: 'Бишкек',
      details: {
        brand: 'Toyota',
        model: 'Camry',
        year: 2020,
        mileage: 45000,
        color: 'Белый',
        transmission: 'Автомат',
        fuel_type: 'Бензин',
        engine_volume: 2.5,
        drive_type: 'Передний',
      },
    },
    {
      title: 'BMW X5 2019 - Премиум класс',
      description: 'BMW X5 2019 года. Премиум комплектация, полный привод, кожаный салон. Обслуживается у официального дилера.',
      price: 4500000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/4ECDC4/FFFFFF?text=BMW+X5+2019',
      location: 'Ош',
      details: {
        brand: 'BMW',
        model: 'X5',
        year: 2019,
        mileage: 65000,
        color: 'Черный',
        transmission: 'Автомат',
        fuel_type: 'Бензин',
        engine_volume: 3.0,
        drive_type: 'Полный',
      },
    },
    {
      title: 'Honda Civic 2021 - Экономичный',
      description: 'Honda Civic 2021 года. Маленький расход, надежный двигатель. Идеально для города. Пробег всего 25,000 км.',
      price: 1800000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/95E1D3/FFFFFF?text=Honda+Civic+2021',
      location: 'Бишкек',
      details: {
        brand: 'Honda',
        model: 'Civic',
        year: 2021,
        mileage: 25000,
        color: 'Серебристый',
        transmission: 'Вариатор',
        fuel_type: 'Бензин',
        engine_volume: 1.5,
        drive_type: 'Передний',
      },
    },
  ],
  horses: [
    {
      title: 'Арабский скакун - Чистокровный жеребец',
      description: 'Чистокровный арабский жеребец, 5 лет. Отличная родословная. Участвовал в соревнованиях. Спокойный и дружелюбный характер.',
      price: 350000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/F38181/FFFFFF?text=%D0%90%D1%80%D0%B0%D0%B1%D1%81%D0%BA%D0%B8%D0%B9+%D0%A1%D0%BA%D0%B0%D0%BA%D1%83%D0%BD',
      location: 'Талас',
      details: {
        breed: 'Арабская',
        age: 5,
        gender: 'stallion', // Используем английский формат
        height: 155,
        color: 'Гнедой',
        training_level: 'Высокий',
        health_status: 'Отличное',
      },
    },
    {
      title: 'Ахалтекинская кобыла - Золотая',
      description: 'Красивая ахалтекинская кобыла, 4 года. Редкая золотистая масть. Идеальна для верховой езды и разведения.',
      price: 420000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/AA96DA/FFFFFF?text=%D0%90%D1%85%D0%B0%D0%BB%D1%82%D0%B5%D0%BA%D0%B8%D0%BD%D1%81%D0%BA%D0%B0%D1%8F',
      location: 'Бишкек',
      details: {
        breed: 'Ахалтекинская',
        age: 4,
        gender: 'mare', // Используем английский формат
        height: 158,
        color: 'Золотистый',
        training_level: 'Средний',
        health_status: 'Отличное',
      },
    },
    {
      title: 'Орловский рысак - Выносливый',
      description: 'Орловский рысак, 6 лет. Крупная и выносливая порода. Отлично подходит для упряжи и работы. Спокойный нрав.',
      price: 280000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/FCBAD3/FFFFFF?text=%D0%9E%D1%80%D0%BB%D0%BE%D0%B2%D1%81%D0%BA%D0%B8%D0%B9+%D0%A0%D1%8B%D1%81%D0%B0%D0%BA',
      location: 'Нарын',
      details: {
        breed: 'Орловский рысак',
        age: 6,
        gender: 'stallion', // Используем английский формат
        height: 165,
        color: 'Серый',
        training_level: 'Высокий',
        health_status: 'Хорошее',
      },
    },
  ],
  real_estate: [
    {
      title: '3-комнатная квартира в центре Бишкека',
      description: 'Просторная 3-комнатная квартира в новом доме. Ремонт выполнен, вся техника. Отличное расположение рядом с центром.',
      price: 8500000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/FFD93D/FFFFFF?text=3-%D0%BA%D0%BE%D0%BC%D0%BD+%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0',
      location: 'Бишкек',
      details: {
        property_type: 'apartment', // Используем английский формат
        rooms: 3,
        area: 95,
        floor: 5,
        total_floors: 9,
        year_built: 2020,
        condition: 'Евроремонт',
        parking: true,
        balcony: true,
      },
    },
    {
      title: 'Частный дом с участком - Ош',
      description: 'Уютный частный дом на участке 6 соток. 4 комнаты, кухня, гостиная. Есть гараж и баня. Идеально для семьи.',
      price: 12000000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/6BCB77/FFFFFF?text=%D0%A7%D0%B0%D1%81%D1%82%D0%BD%D1%8B%D0%B9+%D0%94%D0%BE%D0%BC',
      location: 'Ош',
      details: {
        property_type: 'house', // Используем английский формат
        rooms: 4,
        area: 180,
        land_area: 600,
        year_built: 2018,
        condition: 'Хорошее',
        parking: true,
        garden: true,
        garage: true,
      },
    },
    {
      title: 'Студия в новостройке - Бишкек',
      description: 'Современная студия в новом жилом комплексе. Открытая планировка, большие окна. Готова к заселению.',
      price: 3200000,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      thumbnail_url: 'https://via.placeholder.com/1920x1080/4D96FF/FFFFFF?text=%D0%A1%D1%82%D1%83%D0%B4%D0%B8%D1%8F',
      location: 'Бишкек',
      details: {
        property_type: 'apartment', // Используем английский формат
        rooms: 1,
        area: 35,
        floor: 3,
        total_floors: 12,
        year_built: 2023,
        condition: 'Евроремонт',
        parking: false,
        balcony: true,
      },
    },
  ],
};

// Тестовый пользователь (должен существовать в базе)
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

async function createTestListing(
  category: 'car' | 'horse' | 'real_estate',
  data: any
) {
  const listingId = uuidv4();
  
  try {
    // Создаем основную запись listing
    // Обязательные поля: category, title, description, price, seller_user_id (из constraint)
    const listingData: any = {
      id: listingId,
      category: category,
      title: data.title,
      description: data.description,
      price: data.price,
      seller_user_id: TEST_USER_ID, // Обязательно из-за constraint listings_seller_or_business
    };

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert(listingData)
      .select()
      .single();
    
    if (listingError) {
      throw new Error(`Ошибка создания listing: ${listingError.message}`);
    }
    
    // Обновляем дополнительные поля если они существуют (опционально)
    const updates: any = {};
    
    // Пробуем добавить location_text
    if (data.location) {
      try {
        await supabase
          .from('listings')
          .update({ location_text: data.location })
          .eq('id', listingId);
      } catch (e) {
        // Игнорируем если колонка не существует
      }
    }
    
    // Пробуем добавить video_url
    if (data.video_url) {
      try {
        await supabase
          .from('listings')
          .update({ video_url: data.video_url })
          .eq('id', listingId);
      } catch (e) {
        // Игнорируем если колонка не существует
      }
    }
    
    // Пробуем добавить thumbnail_url
    if (data.thumbnail_url) {
      try {
        await supabase
          .from('listings')
          .update({ thumbnail_url: data.thumbnail_url })
          .eq('id', listingId);
      } catch (e) {
        // Игнорируем если колонка не существует
      }
    }
    
    // Устанавливаем status = 'active'
    try {
      await supabase
        .from('listings')
        .update({ status: 'active' })
        .eq('id', listingId);
    } catch (e) {
      // Игнорируем если колонка не существует
    }

    console.log(`✅ Создан listing: ${data.title}`);

    // Создаем детали в зависимости от категории
    if (category === 'car') {
      const { error: carError } = await supabase
        .from('car_details')
        .insert({
          listing_id: listingId,
          make: data.details.brand || data.details.make, // Используем make вместо brand
          model: data.details.model,
          year: data.details.year,
          mileage_km: data.details.mileage || data.details.mileage_km,
        });

      if (carError) {
        console.error(`⚠️  Ошибка создания car_details: ${carError.message}`);
      }
    } else if (category === 'horse') {
      // Преобразуем gender в английский формат
      const genderMap: Record<string, string> = {
        'Жеребец': 'stallion',
        'Кобыла': 'mare',
        'Гельдинг': 'gelding',
      };
      const gender = genderMap[data.details.gender] || data.details.gender || 'stallion';
      
      const { error: horseError } = await supabase
        .from('horse_details')
        .insert({
          listing_id: listingId,
          breed: data.details.breed,
          age_years: data.details.age || data.details.age_years,
          gender: gender,
          training_level: data.details.training_level,
          health_notes: data.details.health_status || data.details.health_notes,
        });

      if (horseError) {
        console.error(`⚠️  Ошибка создания horse_details: ${horseError.message}`);
      }
    } else if (category === 'real_estate') {
      // Преобразуем property_type в английский формат
      const propertyTypeMap: Record<string, string> = {
        'Квартира': 'apartment',
        'Дом': 'house',
        'Земля': 'land',
        'Коммерческая': 'commercial',
      };
      const propertyType = propertyTypeMap[data.details.property_type] || data.details.property_type || 'apartment';
      
      const { error: realEstateError } = await supabase
        .from('real_estate_details')
        .insert({
          listing_id: listingId,
          property_type: propertyType,
          rooms: data.details.rooms,
          area_m2: data.details.area || data.details.area_m2,
          address_text: data.location || data.details.address_text,
        });

      if (realEstateError) {
        console.error(`⚠️  Ошибка создания real_estate_details: ${realEstateError.message}`);
      }
    }

    return listing;
  } catch (error: any) {
    console.error(`❌ Ошибка при создании ${category}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Начало загрузки тестовых видео...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL.substring(0, 30)}...\n`);

  // Проверяем подключение к Supabase
  console.log('🔌 Проверка подключения к Supabase...');
  const { data: healthCheck, error: healthError } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (healthError) {
    console.error('❌ Ошибка подключения к Supabase:', healthError.message);
    console.log('\n💡 Проверьте:');
    console.log('  1. Правильность SUPABASE_URL');
    console.log('  2. Правильность SUPABASE_SERVICE_ROLE_KEY');
    console.log('  3. Доступность интернета');
    process.exit(1);
  }

  console.log('✅ Подключение к Supabase успешно\n');

  // Проверяем наличие тестового пользователя
  console.log('👤 Проверка тестового пользователя...');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', TEST_USER_ID)
    .single();

  if (userError || !user) {
    console.error(`❌ Тестовый пользователь ${TEST_USER_ID} не найден!`);
    console.log('\n💡 Создайте пользователя одним из способов:');
    console.log('\n1. Через SQL в Supabase SQL Editor:');
    console.log(`
INSERT INTO public.users (id, name, phone, avatar_url, is_verified, rating)
VALUES (
  '${TEST_USER_ID}',
  'Тестовый Пользователь',
  '+996555123456',
  'https://i.pravatar.cc/150?img=1',
  true,
  4.8
)
ON CONFLICT (id) DO NOTHING;
`);
    console.log('\n2. Или измените TEST_USER_ID в скрипте на ID существующего пользователя\n');
    process.exit(1);
  }

  console.log(`✅ Найден пользователь: ${user.name}\n`);

  const results = {
    cars: [] as any[],
    horses: [] as any[],
    real_estate: [] as any[],
    errors: [] as string[],
  };

  // Загружаем автомобили
  console.log('📹 Загрузка автомобилей...');
  for (const carData of TEST_VIDEOS.cars) {
    try {
      const listing = await createTestListing('car', carData);
      results.cars.push(listing);
      await new Promise(resolve => setTimeout(resolve, 500)); // Задержка между запросами
    } catch (error: any) {
      results.errors.push(`Автомобиль ${carData.title}: ${error.message}`);
    }
  }

  // Загружаем лошадей
  console.log('\n🐴 Загрузка лошадей...');
  for (const horseData of TEST_VIDEOS.horses) {
    try {
      const listing = await createTestListing('horse', horseData);
      results.horses.push(listing);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      results.errors.push(`Лошадь ${horseData.title}: ${error.message}`);
    }
  }

  // Загружаем недвижимость
  console.log('\n🏠 Загрузка недвижимости...');
  for (const realEstateData of TEST_VIDEOS.real_estate) {
    try {
      const listing = await createTestListing('real_estate', realEstateData);
      results.real_estate.push(listing);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      results.errors.push(`Недвижимость ${realEstateData.title}: ${error.message}`);
    }
  }

  // Итоги
  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ ЗАГРУЗКИ:');
  console.log('='.repeat(50));
  console.log(`✅ Автомобили: ${results.cars.length}/3`);
  console.log(`✅ Лошади: ${results.horses.length}/3`);
  console.log(`✅ Недвижимость: ${results.real_estate.length}/3`);
  console.log(`📝 Всего создано: ${results.cars.length + results.horses.length + results.real_estate.length}/9`);

  if (results.errors.length > 0) {
    console.log('\n❌ Ошибки:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log('\n🎉 Все видео успешно загружены!');
  }
}

main().catch(console.error);

