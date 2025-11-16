// utils/testSupabase.ts
// Production-ready health-check для Supabase

import { supabase } from '@/services/supabase';

/**
 * Проверяет доступность Supabase соединения
 * @returns Promise<boolean> - true если Supabase доступен
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('listings').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Supabase reachable');
    return true;
  } catch {
    return false;
  }
}
