export type AuthTrigger = 'like' | 'comment' | 'message' | 'create';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trigger?: AuthTrigger;
}

