import { Platform } from 'react-native';

/**
 * Converts React Native shadow props to CSS boxShadow for web
 */
export function createShadowStyle(
  shadowColor: string = '#000',
  shadowOffset: { width: number; height: number } = { width: 0, height: 0 },
  shadowOpacity: number = 0,
  shadowRadius: number = 0
) {
  const { width, height } = shadowOffset;
  const shadowString = `${width}px ${height}px ${shadowRadius}px ${shadowColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, '0')}`;
  
  return Platform.select({
    web: {
      boxShadow: shadowString,
    },
    default: {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      elevation: shadowRadius * 2, // Android elevation
    },
  });
}

