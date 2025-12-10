/**
 * Shared action helpers for all listing types (Cars, Horses, Real Estate)
 * Centralized logic to avoid duplication
 */

import { auth } from '@/services/auth';
import { db } from '@/services/supabase';
import { appLogger } from '@/utils/logger';
import { isOwner } from '@/utils/permissionManager';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Toggle like status for a listing
 */
export async function toggleLike(
  userId: string,
  listingId: string,
  currentLiked: boolean,
  currentLikesCount: number
): Promise<{ isLiked: boolean; likesCount: number }> {
  try {
    if (currentLiked) {
      await db.unlikeListing(userId, listingId);
      return {
        isLiked: false,
        likesCount: Math.max(currentLikesCount - 1, 0),
      };
    } else {
      await db.likeListing(userId, listingId);
      return {
        isLiked: true,
        likesCount: currentLikesCount + 1,
      };
    }
  } catch (error) {
    appLogger.error('[toggleLike] Error', { error, userId, listingId });
    throw error;
  }
}

/**
 * Toggle save/favorite status for a listing
 */
export async function toggleSave(
  userId: string,
  listingId: string,
  currentSaved: boolean,
  currentSavesCount: number
): Promise<{ isSaved: boolean; savesCount: number }> {
  try {
    if (currentSaved) {
      await db.unsaveListing(userId, listingId);
      return {
        isSaved: false,
        savesCount: Math.max(currentSavesCount - 1, 0),
      };
    } else {
      await db.saveListing(userId, listingId);
      return {
        isSaved: true,
        savesCount: currentSavesCount + 1,
      };
    }
  } catch (error) {
    appLogger.error('[toggleSave] Error', { error, userId, listingId });
    throw error;
  }
}

/**
 * Open chat with seller - returns conversationId
 */
export async function openChat(
  userId: string,
  sellerId: string,
  listingId: string
): Promise<string | null> {
  try {
    // Import chatService dynamically to avoid circular dependencies
    const { chatService } = await import('@/services/chat');
    const thread = await chatService.getOrCreateThread(userId, sellerId, listingId);
    return thread?.id || null;
  } catch (error) {
    appLogger.error('[openChat] Error', { error, userId, sellerId, listingId });
    throw error;
  }
}

/**
 * Navigate to chat with proper params
 */
export function navigateToChat(router: any, conversationId: string): void {
  router.push({
    pathname: '/chat/[conversationId]',
    params: { conversationId },
  });
}

/**
 * Open phone call
 */
export function openCall(phone: string): void {
  if (!phone) {
    appLogger.warn('[openCall] No phone provided');
    return;
  }

  const { Linking } = require('react-native');
  Linking.openURL(`tel:${phone}`);
}

/**
 * Apply haptic feedback (iOS only)
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (Platform.OS === 'ios') {
    const styleMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    Haptics.impactAsync(styleMap[type]);
  }
}

/**
 * Validate if user is owner of listing
 */
export function validateOwner(user: any, listing: any): boolean {
  if (!user || !listing) return false;
  return isOwner(user, listing);
}

/**
 * Get current user safely
 */
export async function getCurrentUserSafe(): Promise<any> {
  try {
    return await auth.getCurrentUser();
  } catch (error) {
    appLogger.error('[getCurrentUserSafe] Error', { error });
    return null;
  }
}

