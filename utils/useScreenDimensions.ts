import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export interface ScreenDimensions {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  scale: number;
  fontScale: number;
}

/**
 * Hook для получения размеров экрана с поддержкой изменения ориентации
 * 
 * @returns {ScreenDimensions} - Объект с размерами и информацией об ориентации
 * 
 * @example
 * ```tsx
 * const { width, height, isPortrait, isLandscape } = useScreenDimensions();
 * 
 * return (
 *   <View style={{ width, height }}>
 *     {isPortrait ? <PortraitView /> : <LandscapeView />}
 *   </View>
 * );
 * ```
 */
export function useScreenDimensions(): ScreenDimensions {
  const [dims, setDims] = useState<ScaledSize>(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDims(window);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    width: dims.width,
    height: dims.height,
    isPortrait: dims.height >= dims.width,
    isLandscape: dims.width > dims.height,
    scale: dims.scale,
    fontScale: dims.fontScale,
  };
}

/**
 * Утилита для получения текущих размеров экрана (синхронно)
 * Используется в StyleSheet.create() и других местах где нужны статические значения
 * 
 * @returns {ScreenDimensions} - Текущие размеры экрана
 */
export function getScreenDimensions(): ScreenDimensions {
  const dims = Dimensions.get('window');
  return {
    width: dims.width,
    height: dims.height,
    isPortrait: dims.height >= dims.width,
    isLandscape: dims.width > dims.height,
    scale: dims.scale,
    fontScale: dims.fontScale,
  };
}

