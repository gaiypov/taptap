"use strict";
// ============================================
// Status Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIDEO_STATUS_LABELS = exports.LISTING_STATUS_LABELS = exports.PAYMENT_STATUS = exports.VIDEO_STATUS = exports.LISTING_STATUS = void 0;
// Status constants
exports.LISTING_STATUS = {
    PENDING_REVIEW: 'pending_review',
    ACTIVE: 'active',
    REJECTED: 'rejected',
    ARCHIVED: 'archived',
};
exports.VIDEO_STATUS = {
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    READY: 'ready',
    FAILED: 'failed',
};
exports.PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
};
// Status labels
exports.LISTING_STATUS_LABELS = {
    pending_review: 'На модерации',
    active: 'Активен',
    rejected: 'Отклонен',
    archived: 'Архивирован',
};
exports.VIDEO_STATUS_LABELS = {
    uploading: 'Загрузка',
    processing: 'Обработка',
    ready: 'Готово',
    failed: 'Ошибка',
};
//# sourceMappingURL=statuses.js.map