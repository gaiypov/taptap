import React from 'react';
import { Path, Svg } from 'react-native-svg';

export function HomeIcon({ size = 26, color = '#FFF', opacity = 1 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" opacity={opacity}>
      <Path
        d="M12 30 L32 14 L52 30"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 30 L20 50 L44 50 L44 30"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

