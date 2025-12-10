import { Alert } from 'react-native';
import { router } from 'expo-router';
import { store } from '@/lib/store';

export type AuthAction =
  | 'like'
  | 'favorite'
  | 'comment'
  | 'message'
  | 'call'
  | 'save'
  | 'create'
  | 'edit'
  | 'view_contacts';

const ACTION_MESSAGES: Record<AuthAction, string> = {
  like: 'ставить лайки',
  favorite: 'сохранять в избранное',
  comment: 'оставлять комментарии',
  message: 'писать продавцам',
  call: 'смотреть контакты продавца',
  save: 'сохранять объявления',
  create: 'создавать объявления',
  edit: 'редактировать объявления',
  view_contacts: 'смотреть контакты продавца',
};

/**
 * Unified auth guard for all actions.
 * Returns true if user is authenticated; false otherwise.
 */
export function requireAuth(action: AuthAction): boolean {
  const state = store.getState();
  const isAuthenticated = state.auth?.isAuthenticated;

  if (isAuthenticated) {
    console.log('[AUTH GUARD]', action, '→ allowed');
    return true;
  }

  const msg = ACTION_MESSAGES[action] || 'выполнять это действие';

  Alert.alert(
    'Требуется регистрация',
    `Войдите, чтобы ${msg}.`,
    [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Войти',
        onPress: () => {
          console.log('[AUTH GUARD] Redirect → /(auth)/register');
          router.push('/(auth)/register');
        },
      },
    ],
    { cancelable: true }
  );

  console.log('[AUTH GUARD] Blocked action:', action);
  return false;
}

