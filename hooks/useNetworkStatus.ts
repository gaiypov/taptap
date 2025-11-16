import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { setOnlineStatus } from '@/lib/store/slices/offlineSlice';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;

    const updateNetworkStatus = (state: any) => {
      if (!mounted) return;
      
      const connected = state.isConnected ?? false;
      const internetReachable = state.isInternetReachable ?? false;
      const online = connected && internetReachable;
      
      setIsOnline(online);
      setIsConnected(connected);
      dispatch(setOnlineStatus(online));
    };

    // Получаем начальное состояние
    NetInfo.fetch().then(updateNetworkStatus);

    // Слушаем изменения сети
    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);

    // Проверяем периодически (на случай если listener не сработал)
    const interval = setInterval(() => {
      NetInfo.fetch().then(updateNetworkStatus);
    }, 10000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [dispatch]);

  return { isOnline, isConnected };
}
