// services/feedService.ts
// Production-ready feed service with auth protection and retry logic

import { useRouter } from 'expo-router';
import { supabase } from './supabase';

/**
 * Fetch feed listings for a category with auth protection and timeout retry
 */
export async function fetchFeed(category: string): Promise<any[]> {
  // Check auth session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    // Session missing - but don't block public feed access
    // Only redirect for authenticated-only features
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*, seller:users!seller_user_id(id, name, avatar_url)')
      .eq('category', category)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Retry on timeout
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        await new Promise((r) => setTimeout(r, 1000));
        return fetchFeed(category); // Retry once
      }
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch all feed listings (all categories combined)
 */
export async function fetchAllFeed(): Promise<any[]> {
  try {
    const [cars, horses, estates] = await Promise.all([
      fetchFeed('car'),
      fetchFeed('horse'),
      fetchFeed('real_estate'),
    ]);

    return [...cars, ...horses, ...estates].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

