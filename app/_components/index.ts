// app/components/index.ts — БАРРЕЛЬ ДЛЯ ВСЕХ КОМПОНЕНТОВ (ЛУЧШИЙ В ЦА)

// Основные UI компоненты
export { default as AdditionalPhotos } from './AdditionalPhotos';
export { default as CategoryOverlay } from './CategoryOverlay';
export { default as FiltersButton } from './FiltersButton';
export { default as ListMapToggle } from './ListMapToggle';

// Карты
export { default as MapView } from './MapView';

// Дополнительные (будущие)
// export { default as BoostButton } from './BoostButton';
// export { default as BusinessBadge } from './BusinessBadge';
// export { default as VideoPlayer } from './VideoPlayer';
// export { default as CommentsSection } from './CommentsSection';
// export { default as SaveButton } from './SaveButton';

// Общие утилиты
// export { default as EmptyState } from './ui/EmptyState';
// export { default as LoadingOverlay } from './ui/LoadingOverlay';
// export { default as ErrorBoundary } from './ui/ErrorBoundary';

// Default export для Expo Router (чтобы не было ошибок импорта)
export default function Components() {
  return null;
}
