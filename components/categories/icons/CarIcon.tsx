import React from 'react';
import { Path, Svg } from 'react-native-svg';

export function CarIcon({ size = 26, color = '#FFF', opacity = 1 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" opacity={opacity}>
      <Path
        d="M12 38 L16 28 C18 24 22 22 26 22 L38 22 C42 22 46 24 48 28 L52 38"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 42 A6 6 0 1 0 18 41"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M46 42 A6 6 0 1 0 46 41"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

