import { Dimensions } from 'react-native';

/**
 * Статические константы размеров экрана
 * 
 * ВАЖНО: Эти значения вычисляются один раз при загрузке модуля.
 * Для динамических размеров (при изменении ориентации) используйте:
 * - `useScreenDimensions()` хук в компонентах
 * - `getScreenDimensions()` функцию для синхронного получения текущих размеров
 * 
 * @see utils/useScreenDimensions.ts
 */
const initialDims = Dimensions.get('window');

export const SCREEN_WIDTH = initialDims.width;
export const SCREEN_HEIGHT = initialDims.height;
export const SCREEN_SCALE = initialDims.scale;
export const SCREEN_FONT_SCALE = initialDims.fontScale;

// Дополнительные константы для удобства
export const WINDOW_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: SCREEN_SCALE,
  fontScale: SCREEN_FONT_SCALE,
};

/**
 * Проверка ориентации на основе начальных размеров
 * Для динамической проверки используйте useScreenDimensions().isPortrait/isLandscape
 */
export const IS_PORTRAIT = SCREEN_HEIGHT >= SCREEN_WIDTH;
export const IS_LANDSCAPE = SCREEN_WIDTH > SCREEN_HEIGHT;

// Реэкспорт для удобства
export { useScreenDimensions, getScreenDimensions } from './useScreenDimensions';

