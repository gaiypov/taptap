import { store } from '@/lib/store';

export type AuthAction = 
  | 'like'
  | 'save'
  | 'favorite'
  | 'comment'
  | 'message'
  | 'call'
  | 'create'
  | 'edit'
  | 'view_contacts'
  | 'boost';

const ACTION_MESSAGES: Record<AuthAction, string> = {
  like: 'Войдите, чтобы поставить лайк',
  save: 'Войдите, чтобы сохранить объявление',
  favorite: 'Войдите, чтобы сохранить в избранное',
  comment: 'Войдите, чтобы оставить комментарий',
  message: 'Войдите, чтобы написать продавцу',
  call: 'Войдите, чтобы увидеть контакты',
  create: 'Войдите, чтобы создать объявление',
  edit: 'Войдите, чтобы редактировать объявление',
  view_contacts: 'Войдите, чтобы увидеть контакты',
  boost: 'Войдите, чтобы продвинуть объявление',
};

/**
 * Unified permission manager for all auth actions
 * Returns true if user is authenticated; false otherwise.
 * For guests, triggers LoginRequiredSheet via authSheetStore
 */
export function requireAuth(action: AuthAction): boolean {
  const state = store.getState();
  const isAuthenticated = state.auth?.isAuthenticated;

  if (isAuthenticated) {
    console.log('[PERMISSION]', action, '→ allowed');
    return true;
  }

  // Open login sheet for guests
  // Use dynamic import to avoid circular dependencies
  import('@/lib/store/slices/authSheetSlice').then(({ open }) => {
    const { store } = require('@/lib/store');
    store.dispatch(open(action));
  });

  console.log('[PERMISSION] Blocked action:', action);
  return false;
}

/**
 * Check if user can like
 */
export function canLike(state: any): boolean {
  return state?.auth?.isAuthenticated === true;
}

/**
 * Check if user can save
 */
export function canSave(state: any): boolean {
  return state?.auth?.isAuthenticated === true;
}

/**
 * Check if user can message
 */
export function canMessage(state: any): boolean {
  return state?.auth?.isAuthenticated === true;
}

/**
 * Check if user can call
 */
export function canCall(state: any): boolean {
  return state?.auth?.isAuthenticated === true;
}

/**
 * Check if user can create listing
 */
export function canCreateListing(state: any): boolean {
  return state?.auth?.isAuthenticated === true;
}

/**
 * Check if user is owner of item
 */
export function isOwner(user: any, item: any): boolean {
  if (!user || !item) return false;
  
  // Check seller_id or seller?.id
  const sellerId = item.seller_id || item.seller?.id || item.seller_user_id;
  return user.id === sellerId;
}

/**
 * Get action message for display
 */
export function getActionMessage(action: AuthAction): string {
  return ACTION_MESSAGES[action] || 'Войдите, чтобы выполнить это действие';
}

