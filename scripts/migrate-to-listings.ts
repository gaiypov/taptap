#!/usr/bin/env ts-node
/**
 * Migration script: cars → listings
 * 
 * Этот скрипт мигрирует данные из таблицы cars в новую таблицу listings
 * с поддержкой категорий (car, horse)
 * 
 * Usage:
 *   ts-node scripts/migrate-to-listings.ts [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run   Показать что будет мигрировано, но не выполнять миграцию
 *   --verbose   Подробный вывод
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Параметры CLI
const isDryRun = process.argv.includes('--dry-run');
const isVerbose = process.argv.includes('--verbose');

interface Car {
  id: string;
  seller_id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color?: string;
  transmission?: string;
  fuel_type?: string;
  body_type?: string;
  location: string;
  description?: string;
  video_url: string;
  video_id?: string;
  thumbnail_url?: string;
  additional_images?: string[];
  ai_condition?: string;
  ai_score?: number;
  ai_damages?: any;
  ai_features?: string[];
  ai_estimated_price?: any;
  ai_analysis_text?: string;
  views: number;
  likes: number;
  saves?: number;
  shares?: number;
  messages_count?: number;
  status: string;
  is_promoted: boolean;
  boost_type?: string;
  boost_expires_at?: string;
  boost_activated_at?: string;
  views_before_boost?: number;
  created_at: string;
  updated_at: string;
  sold_at?: string;
}

async function checkTablesExist(): Promise<boolean> {
  try {
    // Проверяем наличие таблицы cars
    const { data: carsData, error: carsError } = await supabase
      .from('cars')
      .select('id')
      .limit(1);

    if (carsError) {
      console.error('❌ Table "cars" not found or inaccessible');
      return false;
    }

    // Проверяем наличие таблицы listings
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('id')
      .limit(1);

    if (listingsError) {
      console.error('❌ Table "listings" not found. Please run supabase-listings-schema.sql first');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return false;
  }
}

async function getCarsToMigrate(): Promise<Car[]> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching cars:', error);
    return [];
  }
}

async function checkIfAlreadyMigrated(videoId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id')
      .eq('video_id', videoId)
      .limit(1);

    if (error) throw error;

    return (data && data.length > 0);
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

function convertCarToListing(car: Car): any {
  // Конвертируем старый статус в новый
  let newStatus = car.status;
  if (['deleted', 'moderation', 'rejected'].includes(car.status)) {
    newStatus = 'archived';
  }

  // Формируем title
  const title = `${car.brand} ${car.model} ${car.year}`;

  // Конвертируем ai_score из 0-100 в 0.00-1.00
  let aiScore = car.ai_score;
  if (aiScore && aiScore > 1) {
    aiScore = aiScore / 100;
  }

  return {
    category: 'car',
    seller_id: car.seller_id,
    video_id: car.video_id || `legacy-${car.id}`,
    video_url: car.video_url,
    thumbnail_url: car.thumbnail_url,
    title,
    description: car.description,
    price: car.price,
    city: car.location,
    location: car.location,
    status: newStatus,
    created_at: car.created_at,
    updated_at: car.updated_at,
    sold_at: car.sold_at,
    likes: car.likes,
    views: car.views,
    shares: car.shares || 0,
    saves: car.saves || 0,
    messages_count: car.messages_count || 0,
    ai_score: aiScore,
    ai_condition: car.ai_condition,
    ai_estimated_price: car.ai_estimated_price,
    ai_analysis_text: car.ai_analysis_text,
    is_promoted: car.is_promoted,
    boost_type: car.boost_type,
    boost_expires_at: car.boost_expires_at,
    boost_activated_at: car.boost_activated_at,
    views_before_boost: car.views_before_boost || 0,
    details: {
      brand: car.brand,
      model: car.model,
      year: car.year,
      mileage: car.mileage,
      color: car.color,
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      body_type: car.body_type,
      condition: car.ai_condition,
      additional_images: car.additional_images,
      ai_damages: car.ai_damages,
      ai_features: car.ai_features,
    },
  };
}

async function migrateCar(car: Car): Promise<boolean> {
  try {
    const listing = convertCarToListing(car);

    // Проверяем, не мигрировано ли уже
    const alreadyMigrated = await checkIfAlreadyMigrated(listing.video_id);
    if (alreadyMigrated) {
      if (isVerbose) {
        console.log(`⏭️  Skipping ${listing.title} (already migrated)`);
      }
      return true;
    }

    if (isDryRun) {
      if (isVerbose) {
        console.log(`[DRY RUN] Would migrate: ${listing.title}`);
      }
      return true;
    }

    // Вставляем в listings
    const { error } = await supabase
      .from('listings')
      .insert(listing);

    if (error) {
      console.error(`❌ Error migrating ${listing.title}:`, error.message);
      return false;
    }

    if (isVerbose) {
      console.log(`✅ Migrated: ${listing.title}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error migrating car ${car.id}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration: cars → listings\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Шаг 1: Проверка таблиц
  console.log('📋 Step 1: Checking tables...');
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    console.error('\n❌ Migration aborted: Required tables not found');
    process.exit(1);
  }
  console.log('✅ Tables OK\n');

  // Шаг 2: Получение данных
  console.log('📋 Step 2: Fetching cars to migrate...');
  const cars = await getCarsToMigrate();
  console.log(`📊 Found ${cars.length} cars\n`);

  if (cars.length === 0) {
    console.log('✅ No cars to migrate');
    return;
  }

  // Шаг 3: Миграция
  console.log('📋 Step 3: Migrating cars...');
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const car of cars) {
    const alreadyMigrated = await checkIfAlreadyMigrated(car.video_id || `legacy-${car.id}`);
    if (alreadyMigrated) {
      skipCount++;
      continue;
    }

    const success = await migrateCar(car);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Прогресс бар
    if (!isVerbose) {
      const total = successCount + errorCount;
      const progress = Math.round((total / cars.length) * 100);
      process.stdout.write(`\rProgress: ${progress}% (${total}/${cars.length})`);
    }
  }

  // Итоги
  console.log('\n\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`⏭️  Skipped (already migrated): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📈 Total: ${cars.length}\n`);

  if (isDryRun) {
    console.log('ℹ️  This was a DRY RUN. Run without --dry-run to perform actual migration.\n');
  } else {
    console.log('✅ Migration completed!\n');
    
    // Проверяем результат
    const { data: listings, error } = await supabase
      .from('listings')
      .select('category, status')
      .eq('category', 'car');

    if (!error && listings) {
      console.log('📊 Listings statistics:');
      const statsByStatus = listings.reduce((acc: any, listing: any) => {
        acc[listing.status] = (acc[listing.status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statsByStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }
  }
}

// Запуск
main()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

