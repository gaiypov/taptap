// app/providers/ReduxProviders.tsx — ИНИЦИАЛИЗАЦИЯ СЕРВИСОВ УРОВНЯ 2025

import { useOfflineInit } from '@/hooks/useOfflineInit';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { initVideoUploadService } from '@/services/videoUploader';

import React, { useEffect } from 'react';

export function ReduxProviders({ children }: { children: React.ReactNode }) {
  // Оффлайн-кэш (SQLite + AsyncStorage)
  useOfflineInit();

  // Мониторинг сети + авто-синхронизация
  useNetworkStatus();

  // Сервис фоновой загрузки видео (работает даже в background)
  useEffect(() => {
    const cleanup = initVideoUploadService();
    return cleanup; // Очистка при размонтировании (на всякий случай)
  }, []);

  return <>{children}</>;
}

