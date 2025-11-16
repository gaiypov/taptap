export type ListingStatus = 'pending_review' | 'active' | 'rejected' | 'archived';
export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type ModerationAction = 'auto_flag' | 'approve' | 'reject';
export type BusinessMemberRole = 'admin' | 'seller';
export declare const LISTING_STATUS: {
    readonly PENDING_REVIEW: ListingStatus;
    readonly ACTIVE: ListingStatus;
    readonly REJECTED: ListingStatus;
    readonly ARCHIVED: ListingStatus;
};
export declare const VIDEO_STATUS: {
    readonly UPLOADING: VideoStatus;
    readonly PROCESSING: VideoStatus;
    readonly READY: VideoStatus;
    readonly FAILED: VideoStatus;
};
export declare const PAYMENT_STATUS: {
    readonly PENDING: PaymentStatus;
    readonly PAID: PaymentStatus;
    readonly FAILED: PaymentStatus;
};
export declare const LISTING_STATUS_LABELS: {
    readonly pending_review: "На модерации";
    readonly active: "Активен";
    readonly rejected: "Отклонен";
    readonly archived: "Архивирован";
};
export declare const VIDEO_STATUS_LABELS: {
    readonly uploading: "Загрузка";
    readonly processing: "Обработка";
    readonly ready: "Готово";
    readonly failed: "Ошибка";
};
//# sourceMappingURL=statuses.d.ts.map