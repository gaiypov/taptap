// utils/profileNavigator.ts
// Единый навигационный модуль для профиля
// Поведение как в TikTok, Instagram, Revolut

import { router } from 'expo-router';
import { requireAuth } from '@/utils/permissionManager';

export type ProfileAction =
  | 'messages'
  | 'favorites'
  | 'myListings'
  | 'boost'
  | 'payments'
  | 'createListing'
  | 'settings'
  | 'edit';

/**
 * Навигация из профиля с проверкой авторизации
 * Каждая кнопка → отдельный экран
 * Поведение как в TikTok, Instagram, Revolut
 */
export function navigateFromProfile(action: ProfileAction): void {
  // Маппинг действий профиля на AuthAction
  const authActionMap: Record<ProfileAction, string> = {
    messages: 'message',
    favorites: 'favorite',
    myListings: 'edit', // Просмотр своих объявлений требует авторизации
    boost: 'boost',
    payments: 'create', // История оплат требует авторизации
    createListing: 'create',
    settings: 'edit',
    edit: 'edit',
  };

  // Проверяем авторизацию
  const authAction = authActionMap[action];
  const allowed = requireAuth(authAction as any);
  if (!allowed) {
    // LoginRequiredSheet откроется автоматически через requireAuth
    return;
  }

  // Навигация на соответствующий экран
  switch (action) {
    case 'messages':
      router.push('/(protected)/messages');
      break;
    case 'favorites':
      router.push('/(protected)/favorites');
      break;
    case 'myListings':
      router.push('/(protected)/my-listings');
      break;
    case 'boost':
      router.push('/(protected)/boost/history');
      break;
    case 'payments':
      router.push('/(protected)/balance');
      break;
    case 'createListing':
      router.push('/(tabs)/upload');
      break;
    case 'settings':
      router.push('/profile/edit');
      break;
    case 'edit':
      router.push('/profile/edit');
      break;
    default:
      console.warn('[ProfileNavigator] Unknown action:', action);
  }
}

