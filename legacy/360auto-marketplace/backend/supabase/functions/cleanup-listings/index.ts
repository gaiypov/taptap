// Supabase Edge Function для автоматического удаления объявлений
// Запускается каждый час через cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Интерфейсы
interface Listing {
  id: string;
  video_id: string;
  status: string;
  seller_id: string;
}

interface CleanupResult {
  success: boolean;
  timestamp: string;
  soldArchived: number;
  expired: number;
  videosDeleted: number;
  errors: string[];
}

// Конфигурация
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APIVIDEO_API_KEY = Deno.env.get('APIVIDEO_API_KEY') ?? '';

// Создаем Supabase клиент с service role ключом
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Удаляет видео из api.video
 */
async function deleteVideoFromApiVideo(videoId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://ws.api.video/videos/${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${APIVIDEO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 204 || response.status === 404) {
      // 204 = успешно удалено, 404 = уже не существует
      return true;
    }

    console.error(`Failed to delete video ${videoId}: ${response.status}`);
    return false;
  } catch (error) {
    console.error(`Error deleting video ${videoId}:`, error);
    return false;
  }
}

/**
 * Обрабатывает проданные объявления (статус = sold, delete_at <= now)
 */
async function archiveSoldListings(): Promise<{ archived: number; videosDeleted: number; errors: string[] }> {
  const now = new Date().toISOString();
  const errors: string[] = [];
  let videosDeleted = 0;

  try {
    // Получаем объявления, которые нужно архивировать
    const { data: soldListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, video_id, seller_id')
      .eq('status', 'sold')
      .lte('delete_at', now);

    if (fetchError) {
      errors.push(`Error fetching sold listings: ${fetchError.message}`);
      return { archived: 0, videosDeleted: 0, errors };
    }

    if (!soldListings || soldListings.length === 0) {
      return { archived: 0, videosDeleted: 0, errors };
    }

    console.log(`Found ${soldListings.length} sold listings to archive`);

    // Обрабатываем каждое объявление
    for (const listing of soldListings) {
      try {
        // Удаляем видео из api.video
        const videoDeleted = await deleteVideoFromApiVideo(listing.video_id);
        if (videoDeleted) {
          videosDeleted++;
        } else {
          errors.push(`Failed to delete video ${listing.video_id} for listing ${listing.id}`);
        }

        // Обновляем статус в БД на 'archived'
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            status: 'archived',
            updated_at: now,
          })
          .eq('id', listing.id);

        if (updateError) {
          errors.push(`Error updating listing ${listing.id}: ${updateError.message}`);
        }

        // Небольшая задержка между запросами к api.video
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`Error processing listing ${listing.id}: ${error.message}`);
      }
    }

    return { archived: soldListings.length, videosDeleted, errors };
  } catch (error) {
    errors.push(`Unexpected error in archiveSoldListings: ${error.message}`);
    return { archived: 0, videosDeleted: 0, errors };
  }
}

/**
 * Обрабатывает истекшие объявления (статус = active, expires_at <= now)
 */
async function expireOldListings(): Promise<{ expired: number; errors: string[] }> {
  const now = new Date().toISOString();
  const errors: string[] = [];

  try {
    // Получаем активные объявления, у которых истек срок
    const { data: expiredListings, error: fetchError } = await supabase
      .from('listings')
      .select('id')
      .eq('status', 'active')
      .lte('expires_at', now);

    if (fetchError) {
      errors.push(`Error fetching expired listings: ${fetchError.message}`);
      return { expired: 0, errors };
    }

    if (!expiredListings || expiredListings.length === 0) {
      return { expired: 0, errors };
    }

    console.log(`Found ${expiredListings.length} listings to expire`);

    // Обновляем статус всех истекших объявлений
    const listingIds = expiredListings.map(l => l.id);
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        status: 'expired',
        updated_at: now,
      })
      .in('id', listingIds);

    if (updateError) {
      errors.push(`Error expiring listings: ${updateError.message}`);
      return { expired: 0, errors };
    }

    return { expired: expiredListings.length, errors };
  } catch (error) {
    errors.push(`Unexpected error in expireOldListings: ${error.message}`);
    return { expired: 0, errors };
  }
}

/**
 * Основной обработчик Edge Function
 */
serve(async (req: Request) => {
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Starting cleanup job...`);

  try {
    // 1. Архивируем проданные объявления (через 14 дней после продажи)
    const soldResult = await archiveSoldListings();

    // 2. Истекаем старые активные объявления (через 90 дней)
    const expiredResult = await expireOldListings();

    // Собираем все ошибки
    const allErrors = [...soldResult.errors, ...expiredResult.errors];

    const result: CleanupResult = {
      success: allErrors.length === 0,
      timestamp,
      soldArchived: soldResult.archived,
      expired: expiredResult.expired,
      videosDeleted: soldResult.videosDeleted,
      errors: allErrors,
    };

    const duration = Date.now() - startTime;
    console.log(`[${timestamp}] Cleanup completed in ${duration}ms:`, result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Cleanup job failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        timestamp,
        error: error.message,
        soldArchived: 0,
        expired: 0,
        videosDeleted: 0,
        errors: [error.message],
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});

