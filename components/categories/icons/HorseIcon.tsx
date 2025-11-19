import React from 'react';
import { Path, Svg } from 'react-native-svg';

export function HorseIcon({ size = 26, color = '#FFF', opacity = 1 }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      opacity={opacity}
    >
      <Path
        d="M42 20 C38 16 32 14 28 16 C24 18 22 22 22 26 C22 30 26 34 30 34 C34 34 36 32 38 30 C40 28 42 26 44 26"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M26 28 C24 32 24 38 28 42"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

