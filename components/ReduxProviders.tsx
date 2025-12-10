// app/providers/ReduxProviders.tsx — ИНИЦИАЛИЗАЦИЯ СЕРВИСОВ УРОВНЯ 2025

import { useOfflineInit } from '@/hooks/useOfflineInit';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// DISABLED: Background upload service causes spam when backend is not running
// import { initVideoUploadService } from '@/services/videoUploader';

import React from 'react';

export function ReduxProviders({ children }: { children: React.ReactNode }) {
  // Оффлайн-кэш (SQLite + AsyncStorage)
  useOfflineInit();

  // Мониторинг сети + авто-синхронизация
  useNetworkStatus();

  // DISABLED: Сервис фоновой загрузки видео - вызывает спам при отсутствии бэкенда
  // useEffect(() => {
  //   const cleanup = initVideoUploadService();
  //   return cleanup;
  // }, []);

  return <>{children}</>;
}

