// ============================================
// Status Types
// ============================================

export type ListingStatus = 'pending_review' | 'active' | 'rejected' | 'archived';

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export type ModerationAction = 'auto_flag' | 'approve' | 'reject';

export type BusinessMemberRole = 'admin' | 'seller';

// Status constants
export const LISTING_STATUS = {
  PENDING_REVIEW: 'pending_review' as ListingStatus,
  ACTIVE: 'active' as ListingStatus,
  REJECTED: 'rejected' as ListingStatus,
  ARCHIVED: 'archived' as ListingStatus,
} as const;

export const VIDEO_STATUS = {
  UPLOADING: 'uploading' as VideoStatus,
  PROCESSING: 'processing' as VideoStatus,
  READY: 'ready' as VideoStatus,
  FAILED: 'failed' as VideoStatus,
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending' as PaymentStatus,
  PAID: 'paid' as PaymentStatus,
  FAILED: 'failed' as PaymentStatus,
} as const;

// Status labels
export const LISTING_STATUS_LABELS = {
  pending_review: 'На модерации',
  active: 'Активен',
  rejected: 'Отклонен',
  archived: 'Архивирован',
} as const;

export const VIDEO_STATUS_LABELS = {
  uploading: 'Загрузка',
  processing: 'Обработка',
  ready: 'Готово',
  failed: 'Ошибка',
} as const;

