import { useEffect } from 'react';
import { useOfflineInit } from '@/hooks/useOfflineInit';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { initVideoUploadService } from '@/services/videoUploader';

/**
 * Компонент-обертка для инициализации Redux-зависимых хуков
 * Должен находиться внутри <Provider>
 */
export function ReduxProviders({ children }: { children: React.ReactNode }) {
  // Инициализация оффлайн хранилища
  useOfflineInit();
  
  // Мониторинг сети
  useNetworkStatus();

  // Инициализация сервиса загрузки видео
  useEffect(() => {
    const cleanup = initVideoUploadService();
    return cleanup;
  }, []);

  return <>{children}</>;
}

